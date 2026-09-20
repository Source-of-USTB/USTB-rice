import type { Database } from '~/types/database'
import type { ActionResult, Profile, RankBoard, WorkEntry } from '~/types/contest'

const UNKNOWN_AUTHOR: Profile = {
  id: 'unknown',
  name: '未知用户',
  role: 'player'
}

/** 把 Supabase 的报错原样透出来: schema.sql 里的触发器抛的就是中文提示 */
function failed(error: { message: string } | null, fallback: string): ActionResult {
  return { ok: false, message: error?.message || fallback }
}

/**
 * 作品的读取与增删改.
 *
 * 所有规则 (阶段、张数、票数、评委身份) 在数据库里都再挡了一遍,
 * 这里的前置判断只是为了少发一次注定失败的请求, 不是安全边界.
 */
export function useWorks() {
  const supabase = useSupabaseClient<Database>()
  const account = useSupabaseUser()
  const { snapshot, loading, refresh } = useContestData()

  const settings = computed(() => snapshot.value.settings)
  const isUpload = computed(() => settings.value.phase === 'upload')
  const isVoting = computed(() => settings.value.phase === 'voting')

  const entries = computed<WorkEntry[]>(() => {
    const { works, profiles, photos, scores, myVotes } = snapshot.value

    const scoreOf = new Map(scores.map(score => [score.workId, score]))
    const myUserVotes = new Set(myVotes.filter(vote => vote.kind === 'user').map(vote => vote.workId))
    const myJudgeScores = new Map(myVotes.filter(vote => vote.kind === 'judge').map(vote => [vote.workId, vote.score]))

    /** 人气分按当前最高票归一化, 保证最高票作品拿到满分 */
    const topUserVotes = Math.max(1, ...works.map(work => scoreOf.get(work.id)?.userVotes ?? 0))

    return works.map((work) => {
      const score = scoreOf.get(work.id)
      const userVotes = score?.userVotes ?? 0
      const judgeScore = score?.judgeScore ?? null

      const popularPoints = (userVotes / topUserVotes) * 100
      const judgePoints = ((judgeScore ?? 0) / settings.value.judgeMaxScore) * 100

      return {
        work,
        author: profiles.find(profile => profile.id === work.authorId) ?? UNKNOWN_AUTHOR,
        photos: photos.filter(photo => photo.workId === work.id),
        userVotes,
        judgeScore,
        judgeCount: score?.judgeCount ?? 0,
        totalScore: popularPoints * settings.value.popularWeight + judgePoints * settings.value.judgeWeight,
        votedByMe: myUserVotes.has(work.id),
        myJudgeScore: myJudgeScores.get(work.id) ?? null
      }
    })
  })

  const entryByAuthor = (authorId: string) =>
    entries.value.find(entry => entry.work.authorId === authorId) ?? null

  const entryByWork = (workId: string) =>
    entries.value.find(entry => entry.work.id === workId) ?? null

  const myEntry = computed(() => {
    const id = account.value?.id
    return id ? entryByAuthor(id) : null
  })

  const usedVotes = computed(() =>
    snapshot.value.myVotes.filter(vote => vote.kind === 'user').length)

  const remainingVotes = computed(() =>
    Math.max(0, settings.value.userVoteLimit - usedVotes.value))

  /** 排行榜: 综合分 / 人气 / 评委分 */
  function rankedEntries(board: RankBoard): WorkEntry[] {
    const list = [...entries.value]

    if (board === 'popular') {
      return list.sort((a, b) => b.userVotes - a.userVotes || b.totalScore - a.totalScore)
    }
    if (board === 'judge') {
      return list.sort((a, b) => (b.judgeScore ?? 0) - (a.judgeScore ?? 0) || b.userVotes - a.userVotes)
    }
    return list.sort((a, b) => b.totalScore - a.totalScore || b.userVotes - a.userVotes)
  }

  /* ------------------------------ 我的作品 ------------------------------ */

  /** 第一次保存文本或上传照片时懒建作品行 */
  async function ensureMyWork(): Promise<{ id: string } | { error: ActionResult }> {
    const uid = account.value?.id
    if (!uid) {
      return { error: { ok: false, message: '请先登录' } }
    }

    const mine = snapshot.value.works.find(work => work.authorId === uid)
    if (mine) {
      return { id: mine.id }
    }

    const { data, error } = await supabase
      .from('works')
      .insert({ author_id: uid })
      .select('id')
      .single()

    if (error) {
      return { error: failed(error, '创建作品失败') }
    }

    return { id: (data as { id: string }).id }
  }

  /** 新增或修改自己的作品说明 (每人只有一份) */
  async function saveMyText(payload: { title: string, description: string, tags: string[] }): Promise<ActionResult> {
    const uid = account.value?.id
    if (!uid) {
      return { ok: false, message: '请先登录' }
    }
    if (!isUpload.value) {
      return { ok: false, message: '投票阶段作品已锁定, 无法修改' }
    }
    if (payload.title.trim() === '') {
      return { ok: false, message: '请填写作品标题' }
    }

    const work = await ensureMyWork()
    if ('error' in work) {
      return work.error
    }

    const { error } = await supabase
      .from('works')
      .update({
        title: payload.title.trim(),
        description: payload.description.trim(),
        tags: payload.tags.map(tag => tag.trim()).filter(Boolean).slice(0, 6)
      })
      .eq('id', work.id)

    if (error) {
      return failed(error, '保存失败')
    }

    await refresh()
    return { ok: true, message: '说明已保存' }
  }

  /** 删除自己的作品说明, 照片保留; 如果连照片也没有了就把整行删掉 */
  async function deleteMyText(): Promise<ActionResult> {
    const work = myEntry.value?.work
    if (!work) {
      return { ok: false, message: '还没有写说明' }
    }
    if (!isUpload.value) {
      return { ok: false, message: '投票阶段作品已锁定, 无法删除' }
    }

    const hasPhoto = snapshot.value.photos.some(photo => photo.workId === work.id)

    const { error } = hasPhoto
      ? await supabase.from('works').update({ title: '', description: '', tags: [] }).eq('id', work.id)
      : await supabase.from('works').delete().eq('id', work.id)

    if (error) {
      return failed(error, '删除失败')
    }

    await refresh()
    return { ok: true, message: '说明已删除' }
  }

  /* ------------------------------ 我的照片 ------------------------------ */

  /** 上传照片: 先传 Storage, 再写 work_photos */
  async function addMyPhotos(files: File[]): Promise<ActionResult> {
    const uid = account.value?.id
    if (!uid) {
      return { ok: false, message: '请先登录' }
    }
    if (!isUpload.value) {
      return { ok: false, message: '投票阶段作品已锁定, 无法上传' }
    }

    const images = files.filter(file => file.type.startsWith('image/'))
    if (images.length === 0) {
      return { ok: false, message: '请选择图片文件' }
    }

    const work = await ensureMyWork()
    if ('error' in work) {
      return work.error
    }

    const existing = snapshot.value.photos.filter(photo => photo.workId === work.id)
    const room = settings.value.maxPhotos - existing.length
    if (room <= 0) {
      return { ok: false, message: `最多只能上传 ${settings.value.maxPhotos} 张照片` }
    }

    const accepted = images.slice(0, room)
    const bucket = supabase.storage.from(PHOTO_BUCKET)

    for (const [index, file] of accepted.entries()) {
      const extension = file.name.split('.').pop()?.toLowerCase() || 'png'
      const path = `${uid}/${crypto.randomUUID()}.${extension}`

      const upload = await bucket.upload(path, file, { contentType: file.type })
      if (upload.error) {
        await refresh()
        return failed(upload.error, '图片上传失败')
      }

      const { error } = await supabase.from('work_photos').insert({
        work_id: work.id,
        storage_path: path,
        sort_order: existing.length + index
      })

      if (error) {
        // 写表失败就把刚传上去的文件删掉, 别留孤儿文件
        await bucket.remove([path])
        await refresh()
        return failed(error, '保存图片记录失败')
      }
    }

    await refresh()
    return accepted.length < images.length
      ? { ok: true, message: `已上传 ${accepted.length} 张, 超出数量上限的部分被忽略` }
      : { ok: true, message: `已上传 ${accepted.length} 张照片` }
  }

  /** 删除自己的某张照片 */
  async function removeMyPhoto(photoId: string): Promise<ActionResult> {
    if (!isUpload.value) {
      return { ok: false, message: '投票阶段作品已锁定, 无法删除' }
    }

    const target = snapshot.value.photos.find(photo => photo.id === photoId)
    if (!target) {
      return { ok: false, message: '照片不存在' }
    }

    const { error } = await supabase.from('work_photos').delete().eq('id', photoId)
    if (error) {
      return failed(error, '删除失败')
    }

    await supabase.storage.from(PHOTO_BUCKET).remove([target.storagePath])
    await refresh()
    return { ok: true, message: '照片已删除' }
  }

  /** 把某张照片设为封面 (排到第一张) */
  async function setMyCover(photoId: string): Promise<ActionResult> {
    const work = myEntry.value?.work
    if (!work || !isUpload.value) {
      return { ok: false, message: '当前无法调整封面' }
    }

    const ordered = snapshot.value.photos.filter(photo => photo.workId === work.id)
    const target = ordered.find(photo => photo.id === photoId)
    if (!target) {
      return { ok: false, message: '照片不存在' }
    }

    const reordered = [target, ...ordered.filter(photo => photo.id !== photoId)]

    for (const [index, photo] of reordered.entries()) {
      if (photo.sortOrder === index) {
        continue
      }
      const { error } = await supabase.from('work_photos').update({ sort_order: index }).eq('id', photo.id)
      if (error) {
        await refresh()
        return failed(error, '调整封面失败')
      }
    }

    await refresh()
    return { ok: true, message: '已设为封面' }
  }

  /* ------------------------------- 投票 ------------------------------- */

  /** 用户互投: 再点一次取消 */
  async function toggleUserVote(workId: string): Promise<ActionResult> {
    const uid = account.value?.id
    if (!uid) {
      return { ok: false, message: '请先登录后再投票' }
    }
    if (!isVoting.value) {
      return { ok: false, message: '现在不能投票, 投票尚未开始或已经结束' }
    }

    const entry = entryByWork(workId)
    if (!entry) {
      return { ok: false, message: '作品不存在' }
    }

    if (entry.votedByMe) {
      const { error } = await supabase
        .from('votes')
        .delete()
        .eq('work_id', workId)
        .eq('voter_id', uid)
        .eq('kind', 'user')

      if (error) {
        return failed(error, '取消投票失败')
      }

      await refresh()
      return { ok: true, message: '已取消投票' }
    }

    const { error } = await supabase
      .from('votes')
      .insert({ work_id: workId, voter_id: uid, kind: 'user', score: 1 })

    if (error) {
      return failed(error, '投票失败')
    }

    await refresh()
    return { ok: true, message: `投票成功, 还剩 ${remainingVotes.value} 票` }
  }

  /**
   * 评委打分: 同一个评委对同一份作品只保留最新一次.
   *
   * 票只有投和撤两种操作, 数据库里没有 update 策略, 所以改分是先撤掉旧的再投一次.
   * 两步之间不是一个事务: 撤成功而投失败时这份作品会暂时没有分, 重新打一次即可.
   */
  async function setJudgeScore(workId: string, score: number): Promise<ActionResult> {
    const uid = account.value?.id
    if (!uid) {
      return { ok: false, message: '请先登录' }
    }
    if (!isVoting.value) {
      return { ok: false, message: '现在不能打分, 投票尚未开始或已经结束' }
    }

    const clamped = Math.min(settings.value.judgeMaxScore, Math.max(1, Math.round(score)))

    const removed = await supabase
      .from('votes')
      .delete()
      .eq('work_id', workId)
      .eq('voter_id', uid)
      .eq('kind', 'judge')

    if (removed.error) {
      return failed(removed.error, '打分失败')
    }

    const { error } = await supabase
      .from('votes')
      .insert({ work_id: workId, voter_id: uid, kind: 'judge', score: clamped })

    if (error) {
      await refresh()
      return failed(error, '打分失败')
    }

    await refresh()
    return { ok: true, message: `已打分 ${clamped} 分` }
  }

  return {
    entries,
    loading,
    loadError: computed(() => snapshot.value.loadError),
    entryByAuthor,
    entryByWork,
    myEntry,
    usedVotes,
    remainingVotes,
    rankedEntries,
    saveMyText,
    deleteMyText,
    addMyPhotos,
    removeMyPhoto,
    setMyCover,
    toggleUserVote,
    setJudgeScore
  }
}

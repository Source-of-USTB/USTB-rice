import type { Profile, RankBoard, WorkEntry, WorkPhoto } from '~/types/contest'

/** 操作结果, 页面据此弹 toast */
interface ActionResult {
  ok: boolean
  message: string
}

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

const UNKNOWN_AUTHOR: Profile = {
  id: 'unknown',
  name: '未知用户',
  bio: '',
  role: 'player'
}

/**
 * 作品的读取与增删改.
 *
 * 读: entries / entryByAuthor / entryByWork / rankedEntries
 * 写: 作品说明 (一份文本) + 作品截图 (多张) + 用户投票 + 评委打分
 */
export function useWorks() {
  const { profiles, works, photos, votes, currentUserId } = useContestStore()
  const { isVoting } = useContest()

  /** 把 work / author / photos / votes 聚合成页面直接能用的结构 */
  const entries = computed<WorkEntry[]>(() => {
    const userVoteCount = new Map<string, number>()
    const judgeSum = new Map<string, number>()
    const judgeCount = new Map<string, number>()
    const myVoted = new Set<string>()
    const myJudgeScore = new Map<string, number>()

    for (const vote of votes.value) {
      if (vote.kind === 'user') {
        userVoteCount.set(vote.workId, (userVoteCount.get(vote.workId) ?? 0) + 1)
        if (vote.voterId === currentUserId.value) {
          myVoted.add(vote.workId)
        }
      } else {
        judgeSum.set(vote.workId, (judgeSum.get(vote.workId) ?? 0) + vote.score)
        judgeCount.set(vote.workId, (judgeCount.get(vote.workId) ?? 0) + 1)
        if (vote.voterId === currentUserId.value) {
          myJudgeScore.set(vote.workId, vote.score)
        }
      }
    }

    /** 人气分按当前最高票归一化, 保证满票作品拿到 100 分 */
    const topUserVotes = Math.max(1, ...works.value.map(work => userVoteCount.get(work.id) ?? 0))

    return works.value.map((work) => {
      const userVotes = userVoteCount.get(work.id) ?? 0
      const count = judgeCount.get(work.id) ?? 0
      const judgeScore = count === 0 ? null : (judgeSum.get(work.id) ?? 0) / count

      const popularPoints = (userVotes / topUserVotes) * 100
      const judgePoints = ((judgeScore ?? 0) / CONTEST_CONFIG.judgeMaxScore) * 100

      return {
        work,
        author: profiles.value.find(profile => profile.id === work.authorId) ?? UNKNOWN_AUTHOR,
        photos: photos.value
          .filter(photo => photo.workId === work.id)
          .sort((a, b) => a.sortOrder - b.sortOrder),
        userVotes,
        judgeScore,
        judgeCount: count,
        totalScore: popularPoints * CONTEST_CONFIG.popularWeight + judgePoints * CONTEST_CONFIG.judgeWeight,
        votedByMe: myVoted.has(work.id),
        myJudgeScore: myJudgeScore.get(work.id) ?? null
      }
    })
  })

  const entryByAuthor = (authorId: string) =>
    entries.value.find(entry => entry.work.authorId === authorId) ?? null

  const entryByWork = (workId: string) =>
    entries.value.find(entry => entry.work.id === workId) ?? null

  /** 当前登录用户自己的作品, 没建过就是 null */
  const myEntry = computed(() =>
    currentUserId.value === null ? null : entryByAuthor(currentUserId.value))

  /** 我已经用掉的票数 / 还剩几票 */
  const usedVotes = computed(() => votes.value
    .filter(vote => vote.kind === 'user' && vote.voterId === currentUserId.value).length)

  const remainingVotes = computed(() => Math.max(0, CONTEST_CONFIG.userVoteLimit - usedVotes.value))

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
  function ensureMyWork() {
    const userId = currentUserId.value
    if (userId === null) {
      return null
    }

    const existing = works.value.find(work => work.authorId === userId)
    if (existing) {
      return existing
    }

    const now = new Date().toISOString()
    const created = {
      id: createId('w'),
      authorId: userId,
      title: '',
      description: '',
      tags: [],
      createdAt: now,
      updatedAt: now
    }
    works.value = [...works.value, created]
    return created
  }

  /** 文本清空且一张照片都没有时, 把空作品行删掉 */
  function pruneEmptyWork(workId: string) {
    const work = works.value.find(item => item.id === workId)
    if (!work) {
      return
    }

    const hasText = work.title.trim() !== '' || work.description.trim() !== ''
    const hasPhoto = photos.value.some(photo => photo.workId === workId)

    if (!hasText && !hasPhoto) {
      works.value = works.value.filter(item => item.id !== workId)
    }
  }

  /** 新增或修改自己的作品说明 (每人只有一份) */
  function saveMyText(payload: { title: string, description: string, tags: string[] }): ActionResult {
    if (currentUserId.value === null) {
      return { ok: false, message: '请先登录' }
    }
    if (isVoting.value) {
      return { ok: false, message: '投票阶段作品已锁定, 无法修改' }
    }
    if (payload.title.trim() === '') {
      return { ok: false, message: '请填写作品标题' }
    }
    if (payload.description.length > CONTEST_CONFIG.maxDescriptionLength) {
      return { ok: false, message: `说明不能超过 ${CONTEST_CONFIG.maxDescriptionLength} 字` }
    }

    const work = ensureMyWork()
    if (!work) {
      return { ok: false, message: '请先登录' }
    }

    works.value = works.value.map(item => item.id === work.id
      ? {
          ...item,
          title: payload.title.trim(),
          description: payload.description.trim(),
          tags: payload.tags.map(tag => tag.trim()).filter(Boolean).slice(0, 6),
          updatedAt: new Date().toISOString()
        }
      : item)

    return { ok: true, message: '说明已保存' }
  }

  /** 删除自己的作品说明, 照片保留 */
  function deleteMyText(): ActionResult {
    const work = myEntry.value?.work
    if (!work) {
      return { ok: false, message: '还没有写说明' }
    }
    if (isVoting.value) {
      return { ok: false, message: '投票阶段作品已锁定, 无法删除' }
    }

    works.value = works.value.map(item => item.id === work.id
      ? { ...item, title: '', description: '', tags: [], updatedAt: new Date().toISOString() }
      : item)

    pruneEmptyWork(work.id)
    return { ok: true, message: '说明已删除' }
  }

  /* ------------------------------ 我的照片 ------------------------------ */

  /** 上传照片, 可以一次选多张 */
  function addMyPhotos(files: File[]): ActionResult {
    if (currentUserId.value === null) {
      return { ok: false, message: '请先登录' }
    }
    if (isVoting.value) {
      return { ok: false, message: '投票阶段作品已锁定, 无法上传' }
    }

    const images = files.filter(file => file.type.startsWith('image/'))
    if (images.length === 0) {
      return { ok: false, message: '请选择图片文件' }
    }

    const work = ensureMyWork()
    if (!work) {
      return { ok: false, message: '请先登录' }
    }

    const current = photos.value.filter(photo => photo.workId === work.id)
    const room = CONTEST_CONFIG.maxPhotos - current.length
    if (room <= 0) {
      return { ok: false, message: `最多只能上传 ${CONTEST_CONFIG.maxPhotos} 张照片` }
    }

    const accepted = images.slice(0, room)
    const now = new Date().toISOString()

    // 接入 Supabase 后这里改成上传到 Storage, 再把返回的公开 URL 写进 work_photos
    const added: WorkPhoto[] = accepted.map((file, index) => ({
      id: createId('p'),
      workId: work.id,
      url: URL.createObjectURL(file),
      sortOrder: current.length + index,
      createdAt: now
    }))

    photos.value = [...photos.value, ...added]

    return accepted.length < images.length
      ? { ok: true, message: `已上传 ${accepted.length} 张, 超出数量上限的部分被忽略` }
      : { ok: true, message: `已上传 ${accepted.length} 张照片` }
  }

  /** 删除自己的某张照片 */
  function removeMyPhoto(photoId: string): ActionResult {
    const work = myEntry.value?.work
    if (!work) {
      return { ok: false, message: '没有可删除的照片' }
    }
    if (isVoting.value) {
      return { ok: false, message: '投票阶段作品已锁定, 无法删除' }
    }

    const target = photos.value.find(photo => photo.id === photoId && photo.workId === work.id)
    if (!target) {
      return { ok: false, message: '照片不存在' }
    }

    if (target.url.startsWith('blob:')) {
      URL.revokeObjectURL(target.url)
    }

    photos.value = photos.value
      .filter(photo => photo.id !== photoId)
      .map(photo => photo.workId === work.id && photo.sortOrder > target.sortOrder
        ? { ...photo, sortOrder: photo.sortOrder - 1 }
        : photo)

    pruneEmptyWork(work.id)
    return { ok: true, message: '照片已删除' }
  }

  /** 把某张照片设为封面 (排到第一张) */
  function setMyCover(photoId: string): ActionResult {
    const work = myEntry.value?.work
    if (!work || isVoting.value) {
      return { ok: false, message: '当前无法调整封面' }
    }

    const ordered = photos.value
      .filter(photo => photo.workId === work.id)
      .sort((a, b) => a.sortOrder - b.sortOrder)

    const target = ordered.find(photo => photo.id === photoId)
    if (!target) {
      return { ok: false, message: '照片不存在' }
    }

    const reordered = [target, ...ordered.filter(photo => photo.id !== photoId)]
      .map((photo, index) => ({ ...photo, sortOrder: index }))

    photos.value = [
      ...photos.value.filter(photo => photo.workId !== work.id),
      ...reordered
    ]

    return { ok: true, message: '已设为封面' }
  }

  /* ------------------------------- 投票 ------------------------------- */

  /** 用户互投: 再点一次取消 */
  function toggleUserVote(workId: string): ActionResult {
    const userId = currentUserId.value
    if (userId === null) {
      return { ok: false, message: '请先登录后再投票' }
    }
    if (!isVoting.value) {
      return { ok: false, message: '投票尚未开始' }
    }

    const entry = entryByWork(workId)
    if (!entry) {
      return { ok: false, message: '作品不存在' }
    }
    if (entry.work.authorId === userId) {
      return { ok: false, message: '不能给自己的作品投票' }
    }

    if (entry.votedByMe) {
      votes.value = votes.value.filter(vote =>
        !(vote.kind === 'user' && vote.workId === workId && vote.voterId === userId))
      return { ok: true, message: '已取消投票' }
    }

    if (remainingVotes.value <= 0) {
      return { ok: false, message: `每人最多投 ${CONTEST_CONFIG.userVoteLimit} 份作品, 可以先取消一票` }
    }

    votes.value = [...votes.value, {
      id: createId('v'),
      workId,
      voterId: userId,
      kind: 'user',
      score: 1,
      createdAt: new Date().toISOString()
    }]

    return { ok: true, message: `投票成功, 还剩 ${remainingVotes.value} 票` }
  }

  /** 评委打分: 同一个评委对同一份作品只保留最新一次 */
  function setJudgeScore(workId: string, score: number): ActionResult {
    const userId = currentUserId.value
    const { isJudge } = useAuth()

    if (userId === null || !isJudge.value) {
      return { ok: false, message: '只有评委可以打分' }
    }
    if (!isVoting.value) {
      return { ok: false, message: '投票尚未开始' }
    }

    const entry = entryByWork(workId)
    if (!entry) {
      return { ok: false, message: '作品不存在' }
    }

    const clamped = Math.min(CONTEST_CONFIG.judgeMaxScore, Math.max(1, Math.round(score)))
    const rest = votes.value.filter(vote =>
      !(vote.kind === 'judge' && vote.workId === workId && vote.voterId === userId))

    votes.value = [...rest, {
      id: createId('v'),
      workId,
      voterId: userId,
      kind: 'judge',
      score: clamped,
      createdAt: new Date().toISOString()
    }]

    return { ok: true, message: `已打分 ${clamped} 分` }
  }

  return {
    entries,
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

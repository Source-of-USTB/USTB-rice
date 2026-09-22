import type { Database } from '~/types/database.types'
import type { ContestPhase, ContestSettings, Profile, VoteKind, Work, WorkPhoto } from '~/types/contest'

/* ----------------------- 数据库返回的原始行 (snake_case) ----------------------- */

interface SettingsRow {
  phase_override: ContestPhase | null
  upload_deadline: string
  voting_deadline: string
  max_photos: number
  max_description: number
  user_vote_limit: number
  judge_max_score: number
  popular_weight: string | number
  judge_weight: string | number
}

interface ProfileRow {
  id: string
  name: string
  role: Profile['role']
}

interface WorkRow {
  id: string
  author_id: string
  title: string
  description: string
  tags: string[] | null
  created_at: string
  updated_at: string
}

interface PhotoRow {
  id: string
  work_id: string
  sort_order: number
}

interface ScoreRow {
  work_id: string
  user_votes: number | null
  judge_score: string | number | null
  judge_count: number | null
}

interface VoteRow {
  work_id: string
  kind: VoteKind
  score: number
}

/* ------------------------------ 页面用的快照 ------------------------------ */

export interface WorkScore {
  workId: string
  userVotes: number
  judgeScore: number | null
  judgeCount: number
}

export interface MyVote {
  workId: string
  kind: VoteKind
  score: number
}

export interface ContestSnapshot {
  settings: ContestSettings
  profiles: Profile[]
  works: Work[]
  photos: WorkPhoto[]
  scores: WorkScore[]
  myVotes: MyVote[]
  /** 取数失败时的提示, 比如表还没建 */
  loadError: string | null
}

function emptySnapshot(loadError: string | null = null): ContestSnapshot {
  return {
    settings: DEFAULT_SETTINGS,
    profiles: [],
    works: [],
    photos: [],
    scores: [],
    myVotes: [],
    loadError
  }
}

/**
 * 全站共享的一次性取数.
 *
 * 数据量不大 (一个社团几十份作品), 所以直接一把全取回来, 在前端聚合,
 * 写操作完成后调 refresh() 重新拉. 这样比维护一堆增量状态简单, 也不容易出错.
 */
export function useContestData() {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()

  const { data, status, refresh } = useAsyncData<ContestSnapshot>('contest', async () => {
    const [phaseRes, settingsRes, profilesRes, worksRes, photosRes, scoresRes, votesRes] = await Promise.all([
      // 阶段是推导出来的, 表里没有这一列, 单独调一次函数
      supabase.rpc('current_phase'),
      supabase.from('contest_settings').select('*').maybeSingle(),
      supabase.from('profiles').select('id, name, role'),
      supabase.from('works').select('id, author_id, title, description, tags, created_at, updated_at'),
      supabase.from('work_photos').select('id, work_id, sort_order').order('sort_order'),
      supabase.from('work_scores').select('work_id, user_votes, judge_score, judge_count'),
      user.value
        ? supabase.from('votes').select('work_id, kind, score')
        : Promise.resolve({ data: [], error: null })
    ])

    const failed = [phaseRes, settingsRes, profilesRes, worksRes, photosRes, scoresRes, votesRes]
      .find(result => result.error)

    if (failed?.error) {
      return emptySnapshot(failed.error.message)
    }

    const settingsRow = settingsRes.data as SettingsRow | null
    const settings: ContestSettings = settingsRow
      ? {
          phase: (phaseRes.data as ContestPhase | null) ?? DEFAULT_SETTINGS.phase,
          phaseOverride: settingsRow.phase_override,
          uploadDeadline: settingsRow.upload_deadline,
          votingDeadline: settingsRow.voting_deadline,
          maxPhotos: settingsRow.max_photos,
          maxDescription: settingsRow.max_description,
          userVoteLimit: settingsRow.user_vote_limit,
          judgeMaxScore: settingsRow.judge_max_score,
          popularWeight: Number(settingsRow.popular_weight),
          judgeWeight: Number(settingsRow.judge_weight)
        }
      : DEFAULT_SETTINGS

    const bucket = supabase.storage.from(PHOTO_BUCKET)

    return {
      settings,
      profiles: ((profilesRes.data ?? []) as ProfileRow[]).map(row => ({
        id: row.id,
        name: row.name,
        role: row.role
      })),
      works: ((worksRes.data ?? []) as WorkRow[]).map(row => ({
        id: row.id,
        authorId: row.author_id,
        title: row.title,
        description: row.description,
        tags: row.tags ?? [],
        createdAt: row.created_at,
        updatedAt: row.updated_at
      })),
      photos: ((photosRes.data ?? []) as PhotoRow[]).map(row => ({
        id: row.id,
        workId: row.work_id,
        url: bucket.getPublicUrl(photoPath(row.work_id, row.id)).data.publicUrl,
        sortOrder: row.sort_order
      })),
      scores: ((scoresRes.data ?? []) as ScoreRow[]).map(row => ({
        workId: row.work_id,
        userVotes: row.user_votes ?? 0,
        judgeScore: row.judge_score === null ? null : Number(row.judge_score),
        judgeCount: row.judge_count ?? 0
      })),
      myVotes: ((votesRes.data ?? []) as VoteRow[]).map(row => ({
        workId: row.work_id,
        kind: row.kind,
        score: row.score
      })),
      loadError: null
    }
  }, {
    default: () => emptySnapshot(),
    /*
     * 只在浏览器里取数.
     *
     * 页面上的东西全是浏览器直接向 Supabase 要的, 服务端再跑一遍只是把同样的请求
     * 换个地方发, 首屏并不会因此变快. 而部署在 Cloudflare Workers 上时,
     * 单次调用能发出的出站请求是有上限的 (免费版 50), 这一轮 7 个请求乘上
     * 多个组件各自触发的轮数, 很容易把额度打满, 整个请求直接失败.
     */
    server: false,
    // 登录状态变化会影响"我投过哪些票", 需要重新取
    watch: [user]
  })

  const snapshot = computed(() => data.value ?? emptySnapshot())
  // server: false 时服务端渲染出来的是 idle, 这时候还没开始取, 也该显示加载态,
  // 否则 SSR 出去的 HTML 会先闪一下"还没有人提交作品"
  const loading = computed(() => status.value === 'idle' || status.value === 'pending')

  return { snapshot, loading, refresh }
}

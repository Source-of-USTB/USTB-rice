import type { ContestPhase, Profile, Vote, Work, WorkPhoto } from '~/types/contest'

/**
 * 全站共享的状态入口.
 *
 * 目前是内存里的假数据, 刷新页面会重置. 接入 Supabase 时的替换方式:
 *   profiles/works/photos/votes -> useAsyncData + supabase.from('...').select()
 *   phase                       -> contest_settings 表里的当前阶段
 *   currentUserId               -> useSupabaseUser()
 * 页面和组件只依赖下面这些 ref, 所以替换实现时不用改 UI.
 */
export function useContestStore() {
  const profiles = useState<Profile[]>('contest:profiles', createSeedProfiles)
  const works = useState<Work[]>('contest:works', createSeedWorks)
  const photos = useState<WorkPhoto[]>('contest:photos', createSeedPhotos)
  const votes = useState<Vote[]>('contest:votes', createSeedVotes)

  /** 默认停在上传阶段, 页脚的开发开关可以切到投票阶段 */
  const phase = useState<ContestPhase>('contest:phase', () => 'upload')

  /** 默认以参赛者 u-01 的身份登录, 方便直接查看 /me */
  const currentUserId = useState<string | null>('contest:current-user', () => 'u-01')

  return { profiles, works, photos, votes, phase, currentUserId }
}

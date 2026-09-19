import type { ContestSettings } from '~/types/contest'

/**
 * contest_settings 还没读回来时用的兜底值.
 * 真实规则以数据库里的那一行为准 (见 supabase/schema.sql),
 * 管理员改数据库即可生效, 不需要重新部署.
 */
export const DEFAULT_SETTINGS: ContestSettings = {
  phase: 'upload',
  votingOpen: false,
  phaseOverride: null,
  uploadDeadline: '',
  votingDeadline: '',
  maxPhotos: 9,
  maxDescription: 800,
  userVoteLimit: 3,
  judgeMaxScore: 10,
  popularWeight: 0.4,
  judgeWeight: 0.6
}

/** 截图存放的 Storage 桶 */
export const PHOTO_BUCKET = 'work-photos'

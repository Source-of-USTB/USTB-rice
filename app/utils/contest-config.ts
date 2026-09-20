import type { ContestSettings } from '~/types/contest'

/**
 * contest_settings 还没读回来时用的兜底值.
 * 真实规则以数据库里的那一行为准 (见 supabase/schema.sql),
 * 管理员改数据库即可生效, 不需要重新部署.
 */
export const DEFAULT_SETTINGS: ContestSettings = {
  phase: 'upload',
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

/**
 * 截图在 Storage 里的键.
 *
 * 两个 uuid 拼起来, 不掺任何用户输入, 所以构造不出畸形路径.
 * schema.sql 里 storage.objects 的插入策略和删除触发器拼的是同一个形状, 改这里要一起改.
 * 键里没有扩展名: 浏览器认的是响应头的 Content-Type, 上传时已经写进对象元数据了.
 */
export function photoPath(workId: string, photoId: string) {
  return `${workId}/${photoId}`
}

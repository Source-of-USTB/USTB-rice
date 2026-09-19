/**
 * 数据模型.
 *
 * 数据库里的列名是 snake_case, 这里的类型是页面用的 camelCase 形式,
 * 两者之间的转换集中在 app/composables/useContestData.ts 里.
 * 建表语句见 supabase/schema.sql.
 */

/** 比赛阶段: 上传阶段 -> 投票阶段 */
export type ContestPhase = 'upload' | 'voting'

/** 参赛者 / 评委 / 管理员 */
export type UserRole = 'player' | 'judge' | 'admin'

/** 用户互投 / 评委打分 */
export type VoteKind = 'user' | 'judge'

/** contest_state 视图读回来的比赛状态与规则 */
export interface ContestSettings {
  /** 按截止时间推导出来的当前阶段 (phaseOverride 非空时以它为准) */
  phase: ContestPhase
  /** 现在能不能投票: 过了投票截止时间会自动变 false */
  votingOpen: boolean
  /** 管理员强制指定的阶段, null 表示交给时间自动判断 */
  phaseOverride: ContestPhase | null
  /** ISO 时间戳, 精确到分钟 */
  uploadDeadline: string
  votingDeadline: string
  maxPhotos: number
  maxDescription: number
  userVoteLimit: number
  judgeMaxScore: number
  popularWeight: number
  judgeWeight: number
}

/** profiles 表 */
export interface Profile {
  id: string
  name: string
  role: UserRole
}

/** work_photos 表, url 是从 Storage 拼出来的公开地址 */
export interface WorkPhoto {
  id: string
  workId: string
  storagePath: string
  url: string
  sortOrder: number
}

/** works 表: 每人只有一份 */
export interface Work {
  id: string
  authorId: string
  title: string
  description: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

/** 页面展示用的聚合结构 */
export interface WorkEntry {
  work: Work
  author: Profile
  photos: WorkPhoto[]
  /** 用户票数 */
  userVotes: number
  /** 评委平均分, 没人打分时为 null */
  judgeScore: number | null
  /** 已打分的评委人数 */
  judgeCount: number
  /** 综合分 = 人气分 × popularWeight + 评委分 × judgeWeight, 满分 100 */
  totalScore: number
  /** 当前登录用户是否投过票 */
  votedByMe: boolean
  /** 当前登录用户 (评委) 打的分 */
  myJudgeScore: number | null
}

/** 排行榜的三个榜单 */
export type RankBoard = 'total' | 'popular' | 'judge'

/** 写操作的统一返回, 页面据此弹 toast */
export interface ActionResult {
  ok: boolean
  message: string
}

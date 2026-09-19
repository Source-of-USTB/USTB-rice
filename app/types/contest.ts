/**
 * 数据模型.
 *
 * 字段命名刻意贴近后续 Supabase 的表结构 (profiles / works / work_photos / votes),
 * 现阶段由 app/composables/useContestData.ts 里的 mock store 提供数据,
 * 接入 Supabase 时只需要替换该 store 的实现, 页面组件不用改.
 */

/** 比赛阶段: 上传阶段 -> 投票阶段 */
export type ContestPhase = 'upload' | 'voting'

/** 参赛者 / 评委 / 管理员 */
export type UserRole = 'player' | 'judge' | 'admin'

/** profiles 表 */
export interface Profile {
  id: string
  /** 展示昵称 */
  name: string
  /** 学院 / 班级等一句话介绍 */
  bio: string
  role: UserRole
}

/** work_photos 表: 一个作品可以有多张照片 */
export interface WorkPhoto {
  id: string
  workId: string
  url: string
  /** 排序, 第 0 张作为封面 */
  sortOrder: number
  createdAt: string
}

/** works 表: 一个用户只有一份文本 (标题 + 正文 + 标签) */
export interface Work {
  id: string
  authorId: string
  title: string
  description: string
  /** 桌面环境 / 配色 / 发行版等标签 */
  tags: string[]
  createdAt: string
  updatedAt: string
}

/** votes 表: 用户互投与评委打分都记在这里, 用 kind 区分 */
export interface Vote {
  id: string
  workId: string
  voterId: string
  kind: 'user' | 'judge'
  /** 用户投票恒为 1; 评委打分为 1-10 */
  score: number
  createdAt: string
}

/** 页面展示用的聚合结构, 由 work + author + photos + votes 拼出来 */
export interface WorkEntry {
  work: Work
  author: Profile
  photos: WorkPhoto[]
  /** 用户票数 */
  userVotes: number
  /** 评委平均分 (0-10), 没人打分时为 null */
  judgeScore: number | null
  /** 已打分的评委人数 */
  judgeCount: number
  /** 综合分 = 人气分 * 40% + 评委分 * 60%, 满分 100 */
  totalScore: number
  /** 当前登录用户是否投过票 */
  votedByMe: boolean
  /** 当前登录用户 (评委) 打的分, 没打过为 null */
  myJudgeScore: number | null
}

/** 排行榜的三个榜单 */
export type RankBoard = 'total' | 'popular' | 'judge'

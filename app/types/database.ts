/**
 * Supabase 表结构类型.
 *
 * 手写的, 和 supabase/schema.sql 保持一致. 之后装了 Supabase CLI 可以用
 *   supabase gen types typescript --project-id <ref> > app/types/database.ts
 * 直接覆盖这个文件.
 */
import type { ContestPhase, UserRole, VoteKind } from '~/types/contest'

type SettingsRow = {
  id: number
  phase_override: ContestPhase | null
  upload_deadline: string
  voting_deadline: string
  max_photos: number
  max_description: number
  user_vote_limit: number
  judge_max_score: number
  popular_weight: number
  judge_weight: number
  updated_at: string
}

type ProfileRow = {
  id: string
  name: string
  role: UserRole
  created_at: string
}

type WorkRow = {
  id: string
  author_id: string
  title: string
  description: string
  tags: string[]
  created_at: string
  updated_at: string
}

type PhotoRow = {
  id: string
  work_id: string
  storage_path: string
  sort_order: number
  created_at: string
}

type VoteRow = {
  id: string
  work_id: string
  voter_id: string
  kind: VoteKind
  score: number
  created_at: string
}

type ScoreRow = {
  work_id: string
  user_votes: number
  judge_score: number | null
  judge_count: number
}

export interface Database {
  public: {
    Tables: {
      contest_settings: {
        Row: SettingsRow
        Insert: Partial<SettingsRow> & { id?: number }
        Update: Partial<SettingsRow>
        Relationships: []
      }
      profiles: {
        Row: ProfileRow
        Insert: Pick<ProfileRow, 'id'> & Partial<ProfileRow>
        Update: Partial<ProfileRow>
        Relationships: []
      }
      works: {
        Row: WorkRow
        Insert: Pick<WorkRow, 'author_id'> & Partial<WorkRow>
        Update: Partial<WorkRow>
        Relationships: []
      }
      work_photos: {
        Row: PhotoRow
        Insert: Pick<PhotoRow, 'work_id' | 'storage_path'> & Partial<PhotoRow>
        Update: Partial<PhotoRow>
        Relationships: []
      }
      votes: {
        Row: VoteRow
        Insert: Pick<VoteRow, 'work_id' | 'voter_id' | 'kind'> & Partial<VoteRow>
        Update: Partial<VoteRow>
        Relationships: []
      }
    }
    Views: {
      work_scores: {
        Row: ScoreRow
        Relationships: []
      }
    }
    Functions: {
      current_phase: {
        Args: Record<string, never>
        Returns: ContestPhase
      }
    }
    Enums: {
      contest_phase: ContestPhase
      user_role: UserRole
      vote_kind: VoteKind
    }
    CompositeTypes: Record<string, never>
  }
}

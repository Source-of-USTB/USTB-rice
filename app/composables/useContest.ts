import type { ContestPhase } from '~/types/contest'

/** 比赛阶段与规则. 组件里判断"现在能不能改作品 / 能不能投票"都走这里 */
export function useContest() {
  const { phase } = useContestStore()

  const isUpload = computed(() => phase.value === 'upload')
  const isVoting = computed(() => phase.value === 'voting')

  const phaseLabel = computed(() => isUpload.value ? '上传阶段' : '投票阶段')

  const phaseDescription = computed(() => isUpload.value
    ? `现在可以提交作品, ${CONTEST_CONFIG.uploadDeadline} 截止收稿, 之后就改不了了。`
    : `作品已经截稿, 给喜欢的桌面投一票吧, 投票在 ${CONTEST_CONFIG.votingDeadline} 结束。`)

  const deadline = computed(() => isUpload.value ? CONTEST_CONFIG.uploadDeadline : CONTEST_CONFIG.votingDeadline)

  /** 只给页脚的开发开关用, 正式环境由管理员在 Supabase 里改 */
  function setPhase(next: ContestPhase) {
    phase.value = next
  }

  return { phase, isUpload, isVoting, phaseLabel, phaseDescription, deadline, setPhase, config: CONTEST_CONFIG }
}

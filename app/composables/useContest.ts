import type { ContestPhase } from '~/types/contest'

const PHASE_LABEL: Record<ContestPhase, string> = {
  upload: '上传阶段',
  voting: '投票阶段',
  ended: '投票已结束'
}

/** 比赛阶段与规则. 阶段由数据库的 current_phase() 给出, 前端不自己算 */
export function useContest() {
  const { snapshot } = useContestData()

  const settings = computed(() => snapshot.value.settings)
  const phase = computed(() => settings.value.phase)

  const isUpload = computed(() => phase.value === 'upload')
  const isVoting = computed(() => phase.value === 'voting')
  const isEnded = computed(() => phase.value === 'ended')

  const phaseLabel = computed(() => PHASE_LABEL[phase.value])

  const deadline = computed(() => formatDeadline(isUpload.value
    ? settings.value.uploadDeadline
    : settings.value.votingDeadline))

  const phaseDescription = computed(() => {
    if (isUpload.value) {
      return `现在可以提交作品, ${deadline.value || '收稿时间'} 截止, 之后就改不了了。`
    }
    if (isVoting.value) {
      return `作品已经截稿, 给喜欢的桌面投一票吧, 投票 ${deadline.value || ''} 结束。`
    }
    return '投票已经结束, 下面是最终结果。'
  })

  return { settings, phase, isUpload, isVoting, isEnded, phaseLabel, phaseDescription, deadline, config: settings }
}

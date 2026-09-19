/** 比赛阶段与规则, 全部来自 contest_state 视图 */
export function useContest() {
  const { snapshot } = useContestData()

  const settings = computed(() => snapshot.value.settings)
  const phase = computed(() => settings.value.phase)

  const isUpload = computed(() => phase.value === 'upload')
  const isVoting = computed(() => phase.value === 'voting')

  /** 进了投票阶段不等于还能投: 过了投票截止时间就关了 */
  const votingOpen = computed(() => settings.value.votingOpen)

  const phaseLabel = computed(() => {
    if (isUpload.value) {
      return '上传阶段'
    }
    return votingOpen.value ? '投票阶段' : '投票已结束'
  })

  const deadline = computed(() => formatDeadline(isUpload.value
    ? settings.value.uploadDeadline
    : settings.value.votingDeadline))

  const phaseDescription = computed(() => {
    if (isUpload.value) {
      return `现在可以提交作品, ${deadline.value || '收稿时间'} 截止, 之后就改不了了。`
    }
    if (votingOpen.value) {
      return `作品已经截稿, 给喜欢的桌面投一票吧, 投票 ${deadline.value || ''} 结束。`
    }
    return '投票已经结束, 下面是最终结果。'
  })

  return { settings, phase, isUpload, isVoting, votingOpen, phaseLabel, phaseDescription, deadline, config: settings }
}

<script setup lang="ts">
import type { ContestPhase } from '~/types/contest'

/**
 * 仅用于本地预览: 一键切换比赛阶段和登录身份, 方便 review 各种状态.
 * 正式接入 Supabase 后请整体删掉这个组件以及 SiteFooter 里的引用.
 */
const { phase, setPhase } = useContest()
const { currentUserId } = useContestStore()

const phaseItems = [
  { label: '上传阶段', value: 'upload' },
  { label: '投票阶段', value: 'voting' }
]

const identityItems = [
  { label: '参赛者 · 李思远', value: 'u-01' },
  { label: '参赛者 · 郑霖', value: 'u-08' },
  { label: '评委 · 罗老师', value: 'j-01' },
  { label: '未登录', value: 'guest' }
]

const phaseModel = computed({
  get: () => phase.value,
  set: (value: ContestPhase) => setPhase(value)
})

const identityModel = computed({
  get: () => currentUserId.value ?? 'guest',
  set: (value: string) => {
    currentUserId.value = value === 'guest' ? null : value
  }
})
</script>

<template>
  <div class="flex flex-wrap items-center justify-center gap-3 rounded-lg border border-dashed border-accented px-4 py-3">
    <span class="text-xs text-dimmed">本地预览开关 (接入 Supabase 后删除)</span>

    <USelect
      v-model="phaseModel"
      :items="phaseItems"
      size="xs"
      icon="i-lucide-clock"
      class="w-36"
    />

    <USelect
      v-model="identityModel"
      :items="identityItems"
      size="xs"
      icon="i-lucide-user"
      class="w-44"
    />
  </div>
</template>

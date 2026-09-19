<script setup lang="ts">
import type { WorkEntry } from '~/types/contest'

const props = defineProps<{
  entry: WorkEntry
}>()

const toast = useToast()
const { config } = useContest()
const { setJudgeScore } = useWorks()

const scores = computed(() => Array.from({ length: config.judgeMaxScore }, (_, index) => index + 1))

function onScore(score: number) {
  const result = setJudgeScore(props.entry.work.id, score)
  toast.add({
    title: result.message,
    color: result.ok ? 'success' : 'warning',
    icon: result.ok ? 'i-lucide-circle-check' : 'i-lucide-circle-alert'
  })
}
</script>

<template>
  <section class="flex flex-col gap-4 border-t border-default pt-6">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h2 class="m-0 flex items-center gap-2 text-base font-bold text-highlighted">
        <UIcon
          name="i-lucide-gavel"
          class="size-4 text-primary"
        />
        评委打分
      </h2>
      <span class="text-sm text-muted">
        {{ entry.myJudgeScore === null ? '你还没有给这份作品打分' : `你的评分: ${entry.myJudgeScore} 分` }}
      </span>
    </div>

    <div class="flex flex-wrap gap-2">
      <UButton
        v-for="score in scores"
        :key="score"
        :label="String(score)"
        :color="entry.myJudgeScore === score ? 'primary' : 'neutral'"
        :variant="entry.myJudgeScore === score ? 'solid' : 'outline'"
        size="sm"
        class="w-10 justify-center"
        @click="onScore(score)"
      />
    </div>

    <p class="m-0 text-xs text-dimmed">
      满分 {{ config.judgeMaxScore }} 分, 重新点击可以覆盖之前的评分。当前共 {{ entry.judgeCount }} 位评委打过分。
    </p>
  </section>
</template>

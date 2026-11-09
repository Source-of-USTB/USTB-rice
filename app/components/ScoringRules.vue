<script setup lang="ts">
const { config } = useContest()

const parts = computed(() => [
  {
    label: 'Agent 评分',
    weight: config.value.agentWeight,
    color: 'bg-primary',
    detail: '由主办方给出, 满分 100 分。'
  },
  {
    label: '评委打分',
    weight: config.value.judgeWeight,
    color: 'bg-primary/60',
    detail: `每位评委打 1 ~ ${config.value.judgeMaxScore} 分, 取平均后换算到 100 分。`
  },
  {
    label: '大众投票',
    weight: config.value.popularWeight,
    color: 'bg-primary/30',
    detail: `每人最多投 ${config.value.userVoteLimit} 票, 不能投自己。得票最多的作品记 100 分, 其余按票数比例折算。`
  }
])
</script>

<template>
  <section class="flex flex-col gap-5">
    <h2 class="m-0 text-lg font-bold text-highlighted">
      评分规则
    </h2>

    <div
      class="flex h-2 gap-0.5 overflow-hidden rounded-full"
      aria-hidden="true"
    >
      <span
        v-for="part in parts"
        :key="part.label"
        class="basis-0"
        :class="part.color"
        :style="{ flexGrow: part.weight }"
      />
    </div>

    <dl class="m-0 grid grid-cols-1 gap-6 sm:grid-cols-3">
      <div
        v-for="part in parts"
        :key="part.label"
        class="flex flex-col gap-1"
      >
        <dt class="flex items-center gap-2 text-sm text-muted">
          <span
            class="size-2 rounded-full"
            :class="part.color"
          />
          {{ part.label }}
        </dt>
        <dd class="m-0 text-2xl leading-tight font-bold tabular-nums text-highlighted">
          {{ formatPercent(part.weight) }}
        </dd>
        <dd class="m-0 text-sm text-toned">
          {{ part.detail }}
        </dd>
      </div>
    </dl>

    <p class="m-0 text-sm text-dimmed">
      综合分 = Agent 评分 × {{ formatPercent(config.agentWeight) }} + 评委打分 × {{ formatPercent(config.judgeWeight) }} + 大众投票 × {{ formatPercent(config.popularWeight) }}, 满分 100 分。还没出分的项按 0 分计。
    </p>
  </section>
</template>

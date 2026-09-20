<script setup lang="ts">
import type { RankBoard } from '~/types/contest'

useSeoMeta({
  title: '排行榜',
  description: '用户互投与评委打分的实时排名。'
})

const { isUpload, config } = useContest()
const { entries, rankedEntries } = useWorks()

const boardItems = [
  { label: '综合排名', value: 'total' },
  { label: '人气榜', value: 'popular' },
  { label: '评委榜', value: 'judge' }
]

const board = ref<RankBoard>('total')
const ranking = computed(() => rankedEntries(board.value))
const podium = computed(() => ranking.value.slice(0, 3))

const medalColors = ['text-amber-500', 'text-slate-400', 'text-orange-700']

/** 当前榜单下用来排序的那个数字, 展示在前三名下面 */
function primaryValue(entry: typeof ranking.value[number]) {
  if (board.value === 'popular') {
    return `${entry.userVotes} 票`
  }
  if (board.value === 'judge') {
    return entry.judgeScore === null ? '未评分' : `${formatScore(entry.judgeScore)} 分`
  }
  return `${formatScore(entry.totalScore)} 分`
}

const photoTotal = computed(() => entries.value.reduce((sum, entry) => sum + entry.photos.length, 0))
</script>

<template>
  <div>
    <PageHeading
      title="排行榜"
      description="综合分由同学们的投票和评委打分共同决定, 投票阶段实时更新。"
    />

    <div
      v-if="isUpload"
      class="flex flex-col gap-10"
    >
      <p class="m-0 text-muted">
        现在还是上传阶段, {{ formatDeadline(config.uploadDeadline) }} 截止收稿, 之后才会开放投票并公布排名。
      </p>

      <div class="flex flex-wrap gap-x-16 gap-y-6">
        <div class="flex flex-col gap-1">
          <span class="text-3xl leading-none font-bold tabular-nums text-highlighted">{{ entries.length }}</span>
          <span class="text-sm text-muted">已提交作品</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-3xl leading-none font-bold tabular-nums text-highlighted">{{ photoTotal }}</span>
          <span class="text-sm text-muted">截图总数</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xl leading-tight font-bold tabular-nums text-highlighted">{{ formatDeadline(config.uploadDeadline) }}</span>
          <span class="text-sm text-muted">投票开放时间</span>
        </div>
      </div>

      <NuxtLink
        to="/"
        class="w-fit text-sm text-primary hover:underline"
      >
        先去作品墙看看 →
      </NuxtLink>
    </div>

    <div
      v-else
      class="flex flex-col gap-10"
    >
      <UTabs
        v-model="board"
        :items="boardItems"
        :content="false"
        variant="link"
        class="w-full"
      />

      <section
        v-if="podium.length"
        class="grid grid-cols-1 gap-6 sm:grid-cols-3"
      >
        <article
          v-for="(entry, index) in podium"
          :key="entry.work.id"
          class="flex flex-col gap-3"
        >
          <NuxtLink
            :to="`/u/${entry.work.authorId}`"
            class="relative block aspect-video overflow-hidden rounded-lg bg-elevated"
          >
            <img
              v-if="entry.photos[0]"
              :src="entry.photos[0].url"
              :alt="`${entry.author.name} 的作品封面`"
              loading="lazy"
              class="size-full object-cover"
            >
            <span
              v-else
              class="flex size-full items-center justify-center text-dimmed"
            >
              <UIcon
                name="i-lucide-image-off"
                class="size-8"
              />
            </span>

            <span class="absolute start-3 top-3 flex items-center gap-1 rounded-full bg-black/65 px-2.5 py-1 text-sm font-bold text-white">
              <UIcon
                name="i-lucide-medal"
                class="size-4"
                :class="medalColors[index]"
              />
              No.{{ index + 1 }}
            </span>
          </NuxtLink>

          <div class="flex flex-col gap-1">
            <h2 class="m-0 text-base font-bold">
              <NuxtLink
                :to="`/u/${entry.work.authorId}`"
                class="text-highlighted no-underline hover:text-primary"
              >
                {{ entry.work.title || '未命名作品' }}
              </NuxtLink>
            </h2>
            <p class="m-0 text-sm text-muted">
              {{ entry.author.name }} · <span class="font-bold text-primary">{{ primaryValue(entry) }}</span>
            </p>
          </div>
        </article>
      </section>

      <section class="overflow-x-auto">
        <table class="w-full border-collapse text-sm">
          <thead>
            <tr class="border-b border-default text-left text-muted">
              <th class="py-3 pe-6 font-normal">
                名次
              </th>
              <th class="py-3 pe-6 font-normal">
                作品
              </th>
              <th class="py-3 pe-6 font-normal">
                作者
              </th>
              <th class="py-3 pe-6 text-right font-normal">
                用户票
              </th>
              <th class="py-3 pe-6 text-right font-normal">
                评委分
              </th>
              <th class="py-3 text-right font-normal">
                综合分
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(entry, index) in ranking"
              :key="entry.work.id"
              class="border-b border-muted last:border-b-0"
            >
              <td class="py-3 pe-6 tabular-nums text-dimmed">
                {{ index + 1 }}
              </td>
              <td class="py-3 pe-6">
                <NuxtLink
                  :to="`/u/${entry.work.authorId}`"
                  class="flex items-center gap-3 text-highlighted no-underline hover:text-primary"
                >
                  <img
                    v-if="entry.photos[0]"
                    :src="entry.photos[0].url"
                    :alt="`${entry.author.name} 的作品封面`"
                    loading="lazy"
                    class="h-10 w-16 shrink-0 rounded-md object-cover"
                  >
                  {{ entry.work.title || '未命名作品' }}
                </NuxtLink>
              </td>
              <td class="py-3 pe-6 text-toned">
                {{ entry.author.name }}
              </td>
              <td class="py-3 pe-6 text-right tabular-nums text-toned">
                {{ entry.userVotes }}
              </td>
              <td class="py-3 pe-6 text-right tabular-nums text-toned">
                {{ entry.judgeScore === null ? '—' : formatScore(entry.judgeScore) }}
              </td>
              <td class="py-3 text-right font-bold tabular-nums text-primary">
                {{ formatScore(entry.totalScore) }}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <p class="m-0 text-sm text-dimmed">
        综合分 = 人气分 × {{ config.popularWeight * 100 }}% + 评委分 × {{ config.judgeWeight * 100 }}%。
        人气分按当前最高票归一化到 100 分, 评委分为所有评委打分的平均值 (满分 {{ config.judgeMaxScore }} 分) 换算到 100 分。
      </p>
    </div>
  </div>
</template>

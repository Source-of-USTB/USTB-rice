<script setup lang="ts">
const route = useRoute()
const { snapshot } = useContestData()
const { entryByAuthor } = useWorks()
const { isVoting } = useContest()
const { user, isJudge } = useAuth()

const userId = computed(() => String(route.params.id))
const profile = computed(() => snapshot.value.profiles.find(item => item.id === userId.value) ?? null)
const entry = computed(() => entryByAuthor(userId.value))
const isMe = computed(() => user.value?.id === userId.value)

useSeoMeta({
  title: () => profile.value ? `${profile.value.name} 的作品` : '找不到该用户',
  description: () => entry.value?.work.description.slice(0, 80) ?? ''
})
</script>

<template>
  <div class="flex flex-col gap-8">
    <NuxtLink
      to="/"
      class="flex w-fit items-center gap-1 text-sm text-muted no-underline hover:text-primary"
    >
      <UIcon
        name="i-lucide-arrow-left"
        class="size-4"
      />
      返回作品墙
    </NuxtLink>

    <UEmpty
      v-if="!profile"
      variant="naked"
      icon="i-lucide-user"
      title="找不到这位同学"
      description="链接可能已经失效, 或者这位同学还没有注册。"
      :actions="[{ label: '回到作品墙', to: '/', icon: 'i-lucide-arrow-left' }]"
    />

    <template v-else>
      <section class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-center gap-4">
          <UAvatar
            :alt="profile.name"
            size="3xl"
          />

          <div class="flex flex-col gap-1">
            <div class="flex flex-wrap items-center gap-2">
              <h1 class="m-0 text-3xl leading-tight font-bold text-highlighted">
                {{ profile.name }}
              </h1>
              <UBadge
                v-if="profile.role === 'judge'"
                label="评委"
                color="primary"
                variant="subtle"
                size="sm"
              />
              <UBadge
                v-if="isMe"
                label="这是你"
                color="neutral"
                variant="subtle"
                size="sm"
              />
            </div>
          </div>
        </div>

        <div
          v-if="isMe"
          class="shrink-0"
        >
          <UButton
            to="/me"
            label="编辑我的作品"
            icon="i-lucide-pencil"
            color="neutral"
            variant="outline"
          />
        </div>
      </section>

      <UEmpty
        v-if="!entry"
        variant="naked"
        icon="i-lucide-image-off"
        title="还没有提交作品"
        description="这位同学还没有提交截图和说明。"
      />

      <template v-else>
        <section
          v-if="isVoting"
          class="flex flex-wrap items-end gap-x-12 gap-y-6"
        >
          <div class="flex flex-col gap-1">
            <span class="text-3xl leading-none font-bold tabular-nums text-highlighted">{{ entry.userVotes }}</span>
            <span class="text-sm text-muted">用户票数</span>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-3xl leading-none font-bold tabular-nums text-highlighted">
              {{ entry.judgeScore === null ? '—' : formatScore(entry.judgeScore) }}
            </span>
            <span class="text-sm text-muted">评委评分</span>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-3xl leading-none font-bold tabular-nums text-primary">{{ formatScore(entry.totalScore) }}</span>
            <span class="text-sm text-muted">综合得分</span>
          </div>

          <VoteButton
            :entry="entry"
            class="ms-auto"
          />
        </section>

        <JudgeScorePanel
          v-if="isVoting && isJudge"
          :entry="entry"
        />

        <section class="flex flex-col gap-4">
          <div class="flex flex-col gap-2">
            <h2 class="m-0 text-2xl leading-snug font-bold text-highlighted">
              {{ entry.work.title || '未命名作品' }}
            </h2>

            <div class="flex flex-wrap items-center gap-2 text-sm text-dimmed">
              <time>更新于 {{ formatDate(entry.work.updatedAt) }}</time>
              <span>·</span>
              <span>{{ entry.photos.length }} 张截图</span>
            </div>

            <div
              v-if="entry.work.tags.length"
              class="flex flex-wrap gap-1.5"
            >
              <UBadge
                v-for="tag in entry.work.tags"
                :key="tag"
                :label="tag"
                color="primary"
                variant="soft"
                size="sm"
              />
            </div>
          </div>

          <p
            v-if="entry.work.description"
            class="m-0 leading-loose whitespace-pre-line text-toned"
          >
            {{ entry.work.description }}
          </p>
          <p
            v-else
            class="m-0 text-muted"
          >
            这位同学还没写说明。
          </p>
        </section>

        <section
          v-if="entry.photos.length"
          class="flex flex-col gap-4"
        >
          <h2 class="m-0 text-base font-bold text-highlighted">
            作品截图
          </h2>
          <PhotoGallery
            :photos="entry.photos"
            :author-name="profile.name"
          />
        </section>
      </template>
    </template>
  </div>
</template>

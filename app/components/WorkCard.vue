<script setup lang="ts">
import type { WorkEntry } from '~/types/contest'

const props = defineProps<{
  entry: WorkEntry
}>()

const { isUpload } = useContest()

const cover = computed(() => props.entry.photos[0] ?? null)
const homeLink = computed(() => `/u/${props.entry.work.authorId}`)
const title = computed(() => props.entry.work.title || '未命名作品')
const summary = computed(() => props.entry.work.description.replace(/\s+/g, ' ').trim() || '这位同学还没写说明。')
</script>

<template>
  <article class="group flex flex-col overflow-hidden rounded-xl border border-default transition-colors hover:border-primary">
    <NuxtLink
      :to="homeLink"
      class="relative block aspect-video overflow-hidden bg-elevated"
    >
      <img
        v-if="cover"
        :src="cover.url"
        :alt="`${entry.author.name} 的作品封面`"
        loading="lazy"
        class="size-full object-cover transition-transform duration-300 group-hover:scale-105"
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

      <span
        v-if="entry.photos.length > 1"
        class="absolute end-2 bottom-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white"
      >
        {{ entry.photos.length }} 张
      </span>
    </NuxtLink>

    <div class="flex flex-1 flex-col gap-3 p-5">
      <h2 class="m-0 text-base font-bold">
        <NuxtLink
          :to="homeLink"
          class="text-highlighted no-underline hover:text-primary"
        >
          {{ title }}
        </NuxtLink>
      </h2>

      <p class="m-0 line-clamp-2 text-sm leading-relaxed text-muted">
        {{ summary }}
      </p>

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

      <div class="mt-auto flex items-center justify-between gap-3 border-t border-default pt-3">
        <NuxtLink
          :to="homeLink"
          class="flex min-w-0 items-center gap-2 text-sm text-toned no-underline hover:text-primary"
        >
          <UAvatar
            :alt="entry.author.name"
            size="2xs"
          />
          <span class="truncate">{{ entry.author.name }}</span>
        </NuxtLink>

        <VoteButton
          v-if="!isUpload"
          :entry="entry"
          size="xs"
        />
        <time
          v-else
          class="shrink-0 text-xs text-dimmed"
        >
          {{ formatDate(entry.work.updatedAt) }}
        </time>
      </div>
    </div>
  </article>
</template>

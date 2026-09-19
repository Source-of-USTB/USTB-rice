<script setup lang="ts">
import type { WorkPhoto } from '~/types/contest'

const props = defineProps<{
  photos: WorkPhoto[]
  authorName: string
}>()

const open = ref(false)
const activeIndex = ref(0)

const activePhoto = computed(() => props.photos[activeIndex.value] ?? null)

function show(index: number) {
  activeIndex.value = index
  open.value = true
}

function step(delta: number) {
  const total = props.photos.length
  if (total === 0) {
    return
  }
  activeIndex.value = (activeIndex.value + delta + total) % total
}

function onKeydown(event: KeyboardEvent) {
  if (!open.value) {
    return
  }
  if (event.key === 'ArrowRight') {
    step(1)
  } else if (event.key === 'ArrowLeft') {
    step(-1)
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="grid grid-cols-[repeat(auto-fill,minmax(min(100%,260px),1fr))] gap-4">
    <button
      v-for="(photo, index) in photos"
      :key="photo.id"
      type="button"
      class="group relative aspect-video overflow-hidden rounded-xl border border-default bg-elevated"
      :aria-label="`查看第 ${index + 1} 张截图`"
      @click="show(index)"
    >
      <img
        :src="photo.url"
        :alt="`${authorName} 的第 ${index + 1} 张截图`"
        loading="lazy"
        class="size-full object-cover transition-transform duration-300 group-hover:scale-105"
      >
      <span
        v-if="index === 0"
        class="absolute start-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white"
      >
        封面
      </span>
    </button>
  </div>

  <UModal
    v-model:open="open"
    :ui="{ content: 'max-w-5xl' }"
    :title="`${authorName} 的截图 ${activeIndex + 1} / ${photos.length}`"
    description="使用左右方向键或下方按钮切换截图"
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <img
          v-if="activePhoto"
          :src="activePhoto.url"
          :alt="`${authorName} 的第 ${activeIndex + 1} 张截图`"
          class="w-full rounded-lg border border-default bg-elevated object-contain"
        >

        <div
          v-if="photos.length > 1"
          class="flex items-center justify-between gap-3"
        >
          <UButton
            icon="i-lucide-chevron-left"
            color="neutral"
            variant="outline"
            label="上一张"
            @click="step(-1)"
          />
          <span class="text-sm text-muted">{{ activeIndex + 1 }} / {{ photos.length }}</span>
          <UButton
            trailing-icon="i-lucide-chevron-right"
            color="neutral"
            variant="outline"
            label="下一张"
            @click="step(1)"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const { entries, loading } = useWorks()

useSeoMeta({
  title: '作品墙',
  description: '全部参赛作品的截图与说明。'
})

const keyword = ref('')
const sortBy = ref<'latest' | 'popular'>('latest')

const sortItems = [
  { label: '最新更新', value: 'latest' },
  { label: '人气最高', value: 'popular' }
]

const visibleEntries = computed(() => {
  const word = keyword.value.trim().toLowerCase()

  const matched = entries.value.filter((entry) => {
    if (word === '') {
      return true
    }
    return [entry.work.title, entry.work.description, entry.author.name, ...entry.work.tags]
      .join(' ')
      .toLowerCase()
      .includes(word)
  })

  return sortBy.value === 'popular'
    ? matched.sort((a, b) => b.userVotes - a.userVotes)
    : matched.sort((a, b) => b.work.updatedAt.localeCompare(a.work.updatedAt))
})
</script>

<template>
  <div>
    <PageHeading
      title="作品墙"
      description="同学们提交的桌面美化作品, 点进去可以看完整截图和折腾过程。"
    />

    <div class="flex flex-col gap-6">
      <PhaseBanner />

      <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
        <UInput
          v-model="keyword"
          icon="i-lucide-search"
          placeholder="搜索作品、作者或标签"
          class="sm:max-w-xs"
        />

        <USelect
          v-model="sortBy"
          :items="sortItems"
          icon="i-lucide-arrow-up-down"
          class="w-40"
        />

        <p class="m-0 text-sm text-muted sm:ms-auto">
          共 {{ visibleEntries.length }} 份作品
        </p>
      </div>

      <section
        v-if="loading && !visibleEntries.length"
        class="grid grid-cols-[repeat(auto-fill,minmax(min(100%,320px),1fr))] items-start gap-6"
      >
        <USkeleton
          v-for="placeholder in 6"
          :key="placeholder"
          class="h-72 rounded-xl"
        />
      </section>

      <section
        v-else-if="visibleEntries.length"
        class="grid grid-cols-[repeat(auto-fill,minmax(min(100%,320px),1fr))] items-start gap-6"
      >
        <WorkCard
          v-for="entry in visibleEntries"
          :key="entry.work.id"
          :entry="entry"
        />
      </section>

      <UEmpty
        v-else
        variant="naked"
        icon="i-lucide-image-off"
        title="还没有匹配的作品"
        description="换一个关键词试试, 或者第一个来提交自己的桌面。"
        :actions="[{ label: '去上传作品', to: '/me', icon: 'i-lucide-image-plus' }]"
      />
    </div>
  </div>
</template>

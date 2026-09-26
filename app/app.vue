<script setup lang="ts">
const route = useRoute()

/**
 * 每个页面换一个标签页图标.
 *
 * 全站只挂一条 <link rel="icon">, 切页面时只改它的 href.
 * 不要改成各个页面自己 useHead 加一条: 离开页面时那条会被移除, 而浏览器并不会
 * 因此换回默认图标, 结果是没有覆盖的页面一直顶着上一页的图标.
 */
const FAVICONS: Array<[RegExp, string]> = [
  [/^\/rank/, 'leaderboard'],
  [/^\/me/, 'brush'],
  [/^\/u\//, 'desktop'],
  [/^\/$/, 'wallpaper']
]

const favicon = computed(() => {
  const hit = FAVICONS.find(([pattern]) => pattern.test(route.path))
  return `/icons/${hit ? hit[1] : 'palette'}.svg`
})

const title = 'USTB 系统美化大赛'
const description = '北京科技大学社团系统美化大赛: 展示你的桌面配色、窗口管理器与配置文件, 上传作品、互相投票, 一起把桌面做得更好看。'

useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', type: 'image/svg+xml', href: favicon }
  ],
  htmlAttrs: {
    lang: 'zh-CN'
  }
})

const { snapshot } = useContestData()

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  twitterCard: 'summary_large_image'
})
</script>

<template>
  <UApp>
    <div class="flex min-h-screen flex-col bg-default">
      <SiteHeader />

      <main class="mx-auto w-full max-w-shell flex-1 px-6 py-8 sm:px-8">
        <UAlert
          v-if="snapshot.loadError"
          class="mb-8"
          color="error"
          variant="subtle"
          icon="i-lucide-triangle-alert"
          title="读取数据失败"
          :description="`${snapshot.loadError} — 如果提示找不到表, 说明 supabase/schema.sql 还没在 Supabase 里执行过。`"
        />

        <NuxtPage />
      </main>

      <SiteFooter />
    </div>
  </UApp>
</template>

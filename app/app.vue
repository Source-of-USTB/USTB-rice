<script setup lang="ts">
const title = 'USTB 系统美化大赛'
const description = '北京科技大学社团系统美化大赛: 展示你的桌面配色、窗口管理器与配置文件, 上传作品、互相投票, 一起把桌面做得更好看。'

useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
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

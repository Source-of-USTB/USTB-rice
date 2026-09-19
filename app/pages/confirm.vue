<script setup lang="ts">
// 邮件链接和 GitHub 登录都会回跳到这里, 拿到 session 之后再进 /me
useSeoMeta({ title: '登录中' })

const account = useSupabaseUser()
const { refresh } = useContestData()

onMounted(() => {
  watch(account, async (value) => {
    if (value) {
      await refresh()
      await navigateTo('/me')
    }
  }, { immediate: true })
})
</script>

<template>
  <div class="flex flex-col items-center gap-3 py-24 text-center">
    <UIcon
      name="i-lucide-loader-circle"
      class="size-6 animate-spin text-muted"
    />
    <p class="m-0 text-muted">
      正在完成登录…
    </p>
    <NuxtLink
      to="/login"
      class="text-sm text-primary hover:underline"
    >
      卡住了? 回到登录页
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { phaseLabel, isEnded } = useContest()
const { user, isLoggedIn, signOut } = useAuth()

const navLinks = [
  { label: '作品墙', to: '/' },
  { label: '排行榜', to: '/rank' },
  { label: '我的作品', to: '/me' }
]

function isActive(to: string) {
  return to === '/' ? route.path === '/' : route.path.startsWith(to)
}

const userMenu = computed(() => [
  [
    { label: '我的作品', icon: 'i-lucide-panels-top-left', to: '/me' },
    // 拿不到 id 就整条不给: 拼成 /u/ 的话 /u/[id] 匹配不上, 路由会报一条 404 警告
    ...(user.value?.id
      ? [{ label: '我的主页', icon: 'i-lucide-user', to: `/u/${user.value.id}` }]
      : [])
  ],
  [
    { label: '退出登录', icon: 'i-lucide-log-out', color: 'error' as const, onSelect: () => signOut() }
  ]
])
</script>

<template>
  <header class="border-b border-default">
    <!-- 窄屏用 flex 让它自然折行, sm 以上换成三栏网格, 阶段才真的居中 -->
    <div class="mx-auto flex w-full max-w-shell flex-wrap items-center gap-x-6 gap-y-3 px-6 py-5 sm:grid sm:grid-cols-[1fr_auto_1fr] sm:px-8">
      <NuxtLink
        to="/"
        class="flex items-baseline gap-2 rounded-md outline-primary/25 focus-visible:outline-3"
      >
        <span class="text-lg font-bold text-highlighted">USTB Rice</span>
        <span class="hidden text-sm text-muted sm:inline">系统美化大赛</span>
      </NuxtLink>

      <span
        class="border-b-2 pb-1 text-base font-bold text-highlighted"
        :class="isEnded ? 'border-accented' : 'border-primary'"
      >{{ phaseLabel }}</span>

      <nav class="ms-auto flex items-center gap-4 sm:gap-5">
        <NuxtLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="text-sm transition-colors hover:text-primary"
          :class="isActive(link.to) ? 'font-bold text-primary' : 'text-toned'"
        >
          {{ link.label }}
        </NuxtLink>

        <UColorModeButton size="sm" />

        <UDropdownMenu
          v-if="isLoggedIn"
          :items="userMenu"
          :content="{ align: 'end' }"
        >
          <UButton
            color="neutral"
            variant="ghost"
            size="sm"
            trailing-icon="i-lucide-chevron-down"
          >
            <UAvatar
              :alt="user?.name"
              size="2xs"
            />
            <span class="hidden sm:inline">{{ user?.name }}</span>
          </UButton>
        </UDropdownMenu>

        <UButton
          v-else
          to="/login"
          label="登录"
          icon="i-lucide-log-in"
          size="sm"
          variant="subtle"
        />
      </nav>
    </div>
  </header>
</template>

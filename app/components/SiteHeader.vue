<script setup lang="ts">
const route = useRoute()
const { phaseLabel, isVoting } = useContest()
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
    { label: '我的主页', icon: 'i-lucide-user', to: `/u/${user.value?.id ?? ''}` }
  ],
  [
    { label: '退出登录', icon: 'i-lucide-log-out', color: 'error' as const, onSelect: () => signOut() }
  ]
])
</script>

<template>
  <header class="border-b border-default">
    <div class="mx-auto flex w-full max-w-shell flex-wrap items-center gap-x-6 gap-y-3 px-6 py-5 sm:px-8">
      <NuxtLink
        to="/"
        class="flex items-baseline gap-2 rounded-md outline-primary/25 focus-visible:outline-3"
      >
        <span class="text-lg font-bold text-highlighted">USTB Rice</span>
        <span class="hidden text-sm text-muted sm:inline">系统美化大赛</span>
      </NuxtLink>

      <UBadge
        :label="phaseLabel"
        :color="isVoting ? 'primary' : 'neutral'"
        variant="subtle"
        size="sm"
      />

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

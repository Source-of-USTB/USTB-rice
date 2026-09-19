<script setup lang="ts">
useSeoMeta({
  title: '登录',
  description: '使用校内邮箱登录, 参加系统美化大赛。'
})

const toast = useToast()
const { user, isLoggedIn, signIn, signOut } = useAuth()

const tabItems = [
  { label: '密码登录', value: 'password', slot: 'password' as const },
  { label: '邮箱链接', value: 'magic', slot: 'magic' as const }
]

const activeTab = ref('password')
const email = ref('')
const password = ref('')
const pending = ref(false)

/**
 * 目前只是本地模拟: 校验通过后直接把登录态切到参赛者 u-01.
 * 接入 Supabase 后替换成:
 *   supabase.auth.signInWithPassword({ email, password })
 *   supabase.auth.signInWithOtp({ email })
 *   supabase.auth.signInWithOAuth({ provider: 'github' })
 */
async function submit(mode: 'password' | 'magic') {
  if (!email.value.includes('@')) {
    toast.add({ title: '请填写正确的邮箱地址', color: 'warning', icon: 'i-lucide-circle-alert' })
    return
  }
  if (mode === 'password' && password.value.length < 6) {
    toast.add({ title: '密码至少 6 位', color: 'warning', icon: 'i-lucide-circle-alert' })
    return
  }

  pending.value = true

  if (mode === 'magic') {
    pending.value = false
    toast.add({
      title: '登录链接已发送',
      description: `请到 ${email.value} 查收邮件并点击链接完成登录。`,
      color: 'success',
      icon: 'i-lucide-mail'
    })
    return
  }

  signIn('u-01')
  pending.value = false
  toast.add({ title: '登录成功', color: 'success', icon: 'i-lucide-circle-check' })
  await navigateTo('/me')
}

function loginWithGithub() {
  signIn('u-01')
  toast.add({ title: '已通过 GitHub 登录', color: 'success', icon: 'i-lucide-circle-check' })
  return navigateTo('/me')
}
</script>

<template>
  <div class="mx-auto flex w-full max-w-md flex-col gap-6 py-6">
    <div class="flex flex-col gap-2 text-center">
      <h1 class="m-0 text-3xl leading-tight font-bold text-highlighted">
        登录
      </h1>
      <p class="m-0 text-muted">
        用校内邮箱登录后即可上传作品、参与投票。
      </p>
    </div>

    <section
      v-if="isLoggedIn"
      class="flex flex-col gap-4 text-center"
    >
      <div class="flex flex-col items-center gap-2">
        <UAvatar
          :alt="user?.name"
          size="lg"
        />
        <p class="m-0 text-highlighted">
          你已经以 <span class="font-bold">{{ user?.name }}</span> 的身份登录
        </p>
        <p class="m-0 text-sm text-muted">
          {{ user?.bio }}
        </p>
      </div>

      <div class="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <UButton
          to="/me"
          label="去我的作品"
          icon="i-lucide-panels-top-left"
        />
        <UButton
          label="退出登录"
          icon="i-lucide-log-out"
          color="neutral"
          variant="outline"
          @click="signOut()"
        />
      </div>
    </section>

    <section
      v-else
      class="flex flex-col gap-5"
    >
      <UTabs
        v-model="activeTab"
        :items="tabItems"
        variant="link"
        class="w-full"
      >
        <template #password>
          <form
            class="flex flex-col gap-4 pt-4"
            @submit.prevent="submit('password')"
          >
            <UFormField
              label="邮箱"
              name="email"
              required
            >
              <UInput
                v-model="email"
                type="email"
                placeholder="your-id@xs.ustb.edu.cn"
                icon="i-lucide-mail"
                autocomplete="email"
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="密码"
              name="password"
              required
            >
              <UInput
                v-model="password"
                type="password"
                placeholder="至少 6 位"
                icon="i-lucide-key-round"
                autocomplete="current-password"
                class="w-full"
              />
            </UFormField>

            <UButton
              type="submit"
              label="登录"
              block
              :loading="pending"
            />
          </form>
        </template>

        <template #magic>
          <form
            class="flex flex-col gap-4 pt-4"
            @submit.prevent="submit('magic')"
          >
            <UFormField
              label="邮箱"
              name="magic-email"
              description="我们会发一封带登录链接的邮件, 点开即可登录, 不需要记密码。"
              required
            >
              <UInput
                v-model="email"
                type="email"
                placeholder="your-id@xs.ustb.edu.cn"
                icon="i-lucide-mail"
                autocomplete="email"
                class="w-full"
              />
            </UFormField>

            <UButton
              type="submit"
              label="发送登录链接"
              block
              :loading="pending"
            />
          </form>
        </template>
      </UTabs>

      <USeparator label="或者" />

      <UButton
        label="使用 GitHub 登录"
        icon="i-simple-icons-github"
        color="neutral"
        variant="outline"
        block
        @click="loginWithGithub()"
      />

      <p class="m-0 text-center text-xs text-dimmed">
        首次登录会自动创建账号。请使用校内邮箱, 方便评委核对参赛身份。
      </p>
    </section>
  </div>
</template>

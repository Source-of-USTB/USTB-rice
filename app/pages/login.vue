<script setup lang="ts">
useSeoMeta({
  title: '登录',
  description: '使用邮箱登录, 参加系统美化大赛。'
})

const supabase = useSupabaseClient()
const toast = useToast()
const { user, isLoggedIn, signOut } = useAuth()

const tabItems = [
  { label: '登录', value: 'signin', slot: 'signin' as const },
  { label: '注册', value: 'signup', slot: 'signup' as const },
  { label: '邮箱链接', value: 'magic', slot: 'magic' as const }
]

const activeTab = ref('signin')
const email = ref('')
const password = ref('')
const nickname = ref('')
const pending = ref(false)

/** OAuth 和邮件链接登录完成后回到这个地址 */
function callbackUrl() {
  return `${window.location.origin}/confirm`
}

function warn(message: string) {
  toast.add({ title: message, color: 'warning', icon: 'i-lucide-circle-alert' })
}

function checkEmail() {
  if (!email.value.includes('@')) {
    warn('请填写正确的邮箱地址')
    return false
  }
  return true
}

async function signIn() {
  if (!checkEmail()) {
    return
  }

  pending.value = true
  const { error } = await supabase.auth.signInWithPassword({
    email: email.value.trim(),
    password: password.value
  })
  pending.value = false

  if (error) {
    warn(error.message === 'Invalid login credentials' ? '邮箱或密码不对' : error.message)
    return
  }

  toast.add({ title: '登录成功', color: 'success', icon: 'i-lucide-circle-check' })
  await navigateTo('/me')
}

async function signUp() {
  if (!checkEmail()) {
    return
  }
  if (nickname.value.trim() === '') {
    warn('起个昵称吧, 作品墙上会显示它')
    return
  }
  if (password.value.length < 6) {
    warn('密码至少 6 位')
    return
  }

  pending.value = true
  const { data, error } = await supabase.auth.signUp({
    email: email.value.trim(),
    password: password.value,
    options: {
      data: { name: nickname.value.trim() },
      emailRedirectTo: callbackUrl()
    }
  })
  pending.value = false

  if (error) {
    warn(error.message)
    return
  }

  // 项目开了邮箱验证时拿不到 session, 需要用户先去收件箱点一下
  if (!data.session) {
    toast.add({
      title: '注册成功, 请去邮箱确认',
      description: `确认邮件已经发到 ${email.value}, 点开里面的链接就能登录。`,
      color: 'success',
      icon: 'i-lucide-mail'
    })
    return
  }

  toast.add({ title: '注册成功', color: 'success', icon: 'i-lucide-circle-check' })
  await navigateTo('/me')
}

async function sendMagicLink() {
  if (!checkEmail()) {
    return
  }

  pending.value = true
  const { error } = await supabase.auth.signInWithOtp({
    email: email.value.trim(),
    options: { emailRedirectTo: callbackUrl() }
  })
  pending.value = false

  if (error) {
    warn(error.message)
    return
  }

  toast.add({
    title: '登录链接已发送',
    description: `请到 ${email.value} 查收邮件并点击链接完成登录。`,
    color: 'success',
    icon: 'i-lucide-mail'
  })
}

async function signInWithGithub() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: { redirectTo: callbackUrl() }
  })

  if (error) {
    warn(`GitHub 登录失败: ${error.message}`)
  }
}
</script>

<template>
  <div class="mx-auto flex w-full max-w-md flex-col gap-6 py-6">
    <div class="flex flex-col gap-2 text-center">
      <h1 class="m-0 text-3xl leading-tight font-bold text-highlighted">
        登录
      </h1>
      <p class="m-0 text-muted">
        登录之后就可以提交作品、参与投票。
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
        <template #signin>
          <form
            class="flex flex-col gap-4 pt-4"
            @submit.prevent="signIn()"
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

        <template #signup>
          <form
            class="flex flex-col gap-4 pt-4"
            @submit.prevent="signUp()"
          >
            <UFormField
              label="昵称"
              name="nickname"
              description="作品墙上显示的名字, 最多 24 个字。"
              required
            >
              <UInput
                v-model="nickname"
                placeholder="怎么称呼你"
                icon="i-lucide-user"
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="邮箱"
              name="signup-email"
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
              name="signup-password"
              required
            >
              <UInput
                v-model="password"
                type="password"
                placeholder="至少 6 位"
                icon="i-lucide-key-round"
                autocomplete="new-password"
                class="w-full"
              />
            </UFormField>

            <UButton
              type="submit"
              label="注册"
              block
              :loading="pending"
            />
          </form>
        </template>

        <template #magic>
          <form
            class="flex flex-col gap-4 pt-4"
            @submit.prevent="sendMagicLink()"
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
        @click="signInWithGithub()"
      />

      <p class="m-0 text-center text-xs text-dimmed">
        建议使用校内邮箱, 方便评委核对参赛身份。
      </p>
    </section>
  </div>
</template>

import type { Profile } from '~/types/contest'

/** 登录态. profiles 行由数据库触发器在注册时自动创建 */
export function useAuth() {
  const supabase = useSupabaseClient()
  const account = useSupabaseUser()
  const { snapshot, refresh } = useContestData()

  const user = computed<Profile | null>(() => {
    const id = account.value?.id
    if (!id) {
      return null
    }

    // profiles 还没拉回来时先用邮箱前缀顶一下, 避免头像和昵称闪一下空白
    return snapshot.value.profiles.find(profile => profile.id === id) ?? {
      id,
      name: account.value?.email?.split('@')[0] ?? '我',
      role: 'player'
    }
  })

  const isLoggedIn = computed(() => Boolean(account.value))
  const isJudge = computed(() => user.value?.role === 'judge' || user.value?.role === 'admin')

  async function signOut() {
    await supabase.auth.signOut()
    await refresh()
    await navigateTo('/')
  }

  return { account, user, isLoggedIn, isJudge, signOut }
}

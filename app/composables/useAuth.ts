import type { Profile } from '~/types/contest'

/** 登录态. 之后换成 @nuxtjs/supabase 的 useSupabaseUser / signInWithPassword */
export function useAuth() {
  const { profiles, currentUserId } = useContestStore()

  const user = computed<Profile | null>(() =>
    profiles.value.find(profile => profile.id === currentUserId.value) ?? null)

  const isLoggedIn = computed(() => user.value !== null)
  const isJudge = computed(() => user.value?.role === 'judge' || user.value?.role === 'admin')

  function signIn(userId = 'u-01') {
    currentUserId.value = userId
  }

  function signOut() {
    currentUserId.value = null
  }

  return { user, isLoggedIn, isJudge, signIn, signOut }
}

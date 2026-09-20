import type { Database } from '~/types/database.types'
import type { ActionResult, Profile } from '~/types/contest'

/** 昵称长度, 和 schema.sql 里 profiles.name 的 check 约束保持一致 */
const NAME_MIN = 1
const NAME_MAX = 24

/** 登录态. profiles 行由数据库触发器在注册时自动创建 */
export function useAuth() {
  const supabase = useSupabaseClient<Database>()
  const account = useSupabaseUser()
  const { snapshot, refresh } = useContestData()

  /**
   * 当前账号的 uuid.
   *
   * @nuxtjs/supabase v2 的 useSupabaseUser() 返回的是解码后的 JWT claims, 不是 auth.users
   * 那一行 —— 用户 id 在标准字段 sub 里, 对象上压根没有 id. v1 返回的才是 User, 字段叫 id.
   * 两个都认一下, 省得哪天模块又换回去.
   */
  const accountId = computed(() => {
    const claims = account.value as { id?: string, sub?: string } | null
    return claims?.id ?? claims?.sub ?? null
  })

  const user = computed<Profile | null>(() => {
    const id = accountId.value
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

  // 用 accountId 而不是 account: 拿不到 id 的"登录"对下游没有任何意义, 只会漏成更怪的状态
  const isLoggedIn = computed(() => Boolean(accountId.value))
  const isJudge = computed(() => user.value?.role === 'judge' || user.value?.role === 'admin')

  /**
   * 改昵称.
   *
   * 用 upsert 而不是 update: 注册触发器上线之前注册的账号可能没有 profiles 行,
   * update 打不中任何行还不会报错, 用户点了保存却什么都没发生.
   * 长度和"不能自己提权"在数据库里都再挡了一遍, 这里只是少发一次注定失败的请求.
   */
  async function saveMyName(name: string): Promise<ActionResult> {
    const id = accountId.value
    if (!id) {
      return { ok: false, message: '请先登录' }
    }

    const trimmed = name.trim()
    // 按码点数, 和 Postgres 的 char_length 对齐 (JS 的 .length 会把 emoji 算成 2)
    const length = [...trimmed].length
    if (length < NAME_MIN || length > NAME_MAX) {
      return { ok: false, message: `昵称需要 ${NAME_MIN} 到 ${NAME_MAX} 个字` }
    }

    const { error } = await supabase
      .from('profiles')
      .upsert({ id, name: trimmed }, { onConflict: 'id' })

    if (error) {
      return { ok: false, message: error.message || '昵称保存失败' }
    }

    await refresh()
    return { ok: true, message: '昵称已更新' }
  }

  async function signOut() {
    await supabase.auth.signOut()
    await refresh()
    await navigateTo('/')
  }

  return { account, accountId, user, isLoggedIn, isJudge, saveMyName, signOut }
}

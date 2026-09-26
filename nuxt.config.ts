// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxtjs/supabase'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  compatibilityDate: '2026-06-30',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  /*
   * 只用本机已经装好的字体, 不向任何字体服务发请求.
   *
   * @nuxt/fonts 是 @nuxt/ui 自带的依赖, 它会扫 CSS 里的 font-family 挨个去 provider 查.
   * main.css 的字体栈里有 "Noto Serif SC" 这类 Google Fonts 上的名字, 不关的话
   * 构建时会去 fonts.google.com 拉元数据, 网络不通就报一串 provider 初始化失败.
   * 这里的字体本来就指望用户机器上有, 没有就退到 serif, 不需要任何远程解析.
   */
  fonts: {
    provider: 'local'
  },

  supabase: {
    // 站点大部分页面 (作品墙、排行榜、他人主页) 是公开的,
    // 关掉模块自带的"未登录就跳转 /login", 由页面自己处理登录态.
    redirect: false
  }
})

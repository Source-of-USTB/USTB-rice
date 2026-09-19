// 首次启动时用 .env.example 生成 .env.
// 只在 .env 不存在时创建, 已有的文件绝不覆盖.
import { copyFileSync, existsSync } from 'node:fs'

const example = '.env.example'
const target = '.env'

if (existsSync(target)) {
  process.exit(0)
}

if (!existsSync(example)) {
  console.warn(`[setup-env] 找不到 ${example}, 跳过`)
  process.exit(0)
}

copyFileSync(example, target)
console.log(`[setup-env] 已根据 ${example} 创建 ${target}, 请填入 Supabase 的 URL 和 key`)

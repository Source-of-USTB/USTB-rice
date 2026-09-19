/** 把 ISO 时间戳格式化成 2026-10-06 的形式, 服务端和客户端结果一致, 不会造成 hydration 不匹配 */
export function formatDate(iso: string): string {
  return iso.slice(0, 10)
}

/**
 * 截止时间固定按北京时间显示, 精确到分钟.
 * 必须写死时区: 否则服务端 (通常是 UTC) 和用户浏览器算出来的字符串不一样, 会 hydration 不匹配.
 */
const DEADLINE_FORMAT = new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false
})

export function formatDeadline(iso: string): string {
  if (!iso) {
    return ''
  }

  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return DEADLINE_FORMAT.format(date).replace(/\//g, '-')
}

/** 保留一位小数, 整数则不显示小数点 */
export function formatScore(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

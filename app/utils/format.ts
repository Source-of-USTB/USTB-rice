/** 把 ISO 时间戳格式化成 2026-10-06 的形式, 服务端和客户端结果一致, 不会造成 hydration 不匹配 */
export function formatDate(iso: string): string {
  return iso.slice(0, 10)
}

/** 保留一位小数, 整数则不显示小数点 */
export function formatScore(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

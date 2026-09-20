# USTB Rice

[English](./README.md)

Source-of-USTB 系统美化大赛站点。前端 Nuxt 4 + Nuxt UI，登录、数据库和图片存储都用 Supabase。

每位参赛者提交一份美化过程说明和若干张截图。比赛分两个阶段：

- **上传阶段** —— 提交并修改自己的作品
- **投票阶段** —— 作品锁定，同学之间互相投票，评委打分

## 页面

```txt
/           作品墙
/login      登录 / 注册
/confirm    OAuth 与邮件链接的回跳页
/u/[id]     某位同学的作品
/me         管理自己的作品
/rank       排行榜
```

## 初始化

1. 建一个 Supabase 项目。
2. 把 `supabase/schema.sql` 在 SQL Editor 里整段跑一次。它会建好表、RLS 策略、触发器和存储桶，脚本是幂等的，改完重跑也没问题。
3. 复制 `.env.example` 为 `.env`，填入 Project Settings → API 里的项目地址和 publishable key。首次 `pnpm dev` 时如果 `.env` 不存在会自动帮你生成一份。
4. `pnpm install && pnpm dev`

比赛规则存在 `contest_settings` 那一行里，不在代码里。开放投票：

```sql
update public.contest_settings set phase = 'voting' where id = 1;
```

指定评委（让对方先登录一次，拿到 uuid 之后）：

```sql
update public.profiles set role = 'judge' where id = '<对方的 uuid>';
```

## 项目结构

```txt
supabase/schema.sql            建表、RLS 策略、触发器、存储桶
app/pages/                     页面路由
app/components/                公共组件
app/composables/               取数与写操作
app/types/contest.ts           领域模型
app/types/database.types.ts    表结构类型，与 schema.sql 对应
scripts/setup-env.mjs          .env 缺失时从 .env.example 生成
```

`useContestData` 一次把数据全取回来，每个写操作完成后调 `refresh()`。社团规模的比赛这样够用，也省得维护一堆增量状态。

## 环境变量

```txt
SUPABASE_URL=
SUPABASE_KEY=
```

`SUPABASE_KEY` 是 publishable key，它本来就会打进前端产物，不属于机密——真正保护数据的是行级安全策略，`schema.sql` 里已经配好了。`SUPABASE_SERVICE_KEY` 会绕过 RLS，只能在服务端使用，绝对不要提交。

所有规则在数据库里都再挡了一遍。前端的禁用状态只是顺手，策略和触发器才是边界。单张选票只有投票本人能看见，票数通过 `work_scores` 聚合视图公开。

## 计分方式

```txt
综合分 = 人气分 * popular_weight + 评委分 * judge_weight
```

人气分按当前最高票归一化，评委分取所有评委打分的平均值。两个权重、截图张数上限、说明字数和每人票数都来自 `contest_settings`。

## 构建

```bash
pnpm build
pnpm preview
```

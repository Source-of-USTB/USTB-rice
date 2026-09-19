# USTB Rice

[English](./README.md)

Source-of-USTB 系统美化大赛站点。

每位参赛者提交一份美化过程说明和若干张截图。比赛分两个阶段：

- **上传阶段** —— 提交并修改自己的作品
- **投票阶段** —— 作品锁定，同学之间互相投票，评委打分

## 页面

```txt
/           作品墙
/login      登录
/u/[id]     某位同学的作品
/me         管理自己的作品
/rank       排行榜
```

## 项目结构

```txt
app/pages/                     页面路由
app/components/                公共组件
app/composables/               比赛状态与数据读写
app/types/contest.ts           数据模型
app/utils/contest-seed.ts      比赛规则与假数据
public/mock/                   截图占位图
```

## 本地开发

```bash
pnpm install
pnpm dev
```

注意：

- 目前还没有接入 Supabase，数据都在内存里（`app/composables/useContestStore.ts`），刷新即重置。
- 数据模型已经按将来的表来设计：`profiles`、`works`、`work_photos`、`votes`。
- `app/components/DevToolbar.vue` 是页脚的开发用开关，可以切换比赛阶段和登录身份，上线前删掉。

## 环境变量

复制 `.env.example` 为 `.env`：

```txt
SUPABASE_URL=
SUPABASE_KEY=
```

`SUPABASE_KEY` 是 anon key，它本来就会打进前端产物，不属于机密——真正保护数据的是行级安全策略，所以每张表都要开启 RLS 并写好策略。

## 计分方式

```txt
综合分 = 人气分 * 40% + 评委分 * 60%
```

人气分按当前最高票归一化，评委分取所有评委打分的平均值。截图数量、说明字数、每人票数和权重都在 `CONTEST_CONFIG` 里。

## 构建

```bash
pnpm build
pnpm preview
```

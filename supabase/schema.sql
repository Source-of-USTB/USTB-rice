-- =====================================================================
-- USTB Rice · 系统美化大赛 数据库结构与权限
--
-- 用法: 在 Supabase 控制台的 SQL Editor 里整段执行一次.
--       脚本是幂等的, 改完重跑一遍也不会出错.
--
-- 设计要点:
--   1. 比赛规则 (阶段、截止日期、张数上限、票数上限、权重) 全部存在
--      contest_settings 这一行里, 管理员改数据库即可, 不用重新部署.
--   2. 所有规则都在数据库里再挡一次. 前端的禁用状态只是 UI,
--      有人直接调 REST API 一样会被 RLS 和触发器拦住.
--   3. 单张选票只有本人能看见, 票数通过 work_scores 聚合视图公开,
--      避免"谁投了谁"被扒出来.
-- =====================================================================


-- ---------------------------------------------------------------- 枚举
do $$ begin
  create type public.contest_phase as enum ('upload', 'voting');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.user_role as enum ('player', 'judge', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.vote_kind as enum ('user', 'judge');
exception when duplicate_object then null; end $$;


-- ---------------------------------------------------------------- 表
-- 全局设置, 永远只有 id = 1 这一行
create table if not exists public.contest_settings (
  id               smallint primary key default 1 check (id = 1),
  -- 阶段默认由下面两个截止时间自动推导; 填了这一列就强制覆盖 (延期、提前开、临时冻结)
  -- TODO: 5
  phase_override   public.contest_phase,
  upload_deadline  timestamptz   not null default now() + interval '30 days',
  voting_deadline  timestamptz   not null default now() + interval '45 days',
  max_photos       smallint      not null default 9,
  max_description  smallint      not null default 800,
  user_vote_limit  smallint      not null default 3,
  judge_max_score  smallint      not null default 10,
  popular_weight   numeric(3, 2) not null default 0.40,
  judge_weight     numeric(3, 2) not null default 0.60,
  updated_at       timestamptz   not null default now()
);

-- 两个权重加起来必须正好是 1, 否则综合分的满分就不是 100.
-- 放在 alter 里而不是上面的 create table 里: 表已经建过的话 create table if not exists
-- 会整段跳过, 约束加不上去.
do $$ begin
  alter table public.contest_settings
    add constraint contest_settings_weight_sum
    check (popular_weight >= 0 and judge_weight >= 0 and popular_weight + judge_weight = 1);
exception when duplicate_object then null; end $$;

insert into public.contest_settings (id) values (1) on conflict (id) do nothing;

-- 用户资料, 与 auth.users 一一对应
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  -- 不给默认值: 注册触发器一定会填, 手动插入也必须提供一个像样的名字
  name       text not null check (char_length(btrim(name)) between 1 and 24),
  role       public.user_role not null default 'player',
  created_at timestamptz not null default now()
);

-- 作品: 每人最多一份 (author_id 上的 unique 保证)
create table if not exists public.works (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid not null unique references public.profiles (id) on delete cascade,
  title       text   not null default '',
  description text   not null default '',
  tags        text[] not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 截图: 一份作品可以有多张
create table if not exists public.work_photos (
  id           uuid primary key default gen_random_uuid(),
  -- TODO: 2
  work_id      uuid not null references public.works (id) on delete cascade,
  -- 危险字段, 没防御.
  -- TODO: 1
  storage_path text not null,
  sort_order   smallint not null default 0,
  created_at   timestamptz not null default now()
);

create index if not exists work_photos_work_idx on public.work_photos (work_id, sort_order);

-- 投票: 用户互投与评委打分都记在这里, 用 kind 区分
create table if not exists public.votes (
  id         uuid primary key default gen_random_uuid(),
  work_id    uuid not null references public.works (id) on delete cascade,
  voter_id   uuid not null references public.profiles (id) on delete cascade,
  kind       public.vote_kind not null,
  score      smallint not null default 1,
  created_at timestamptz not null default now(),
  unique (work_id, voter_id, kind)
);

create index if not exists votes_work_idx on public.votes (work_id);
create index if not exists votes_voter_idx on public.votes (voter_id, kind);


-- ------------------------------------------------------------ 辅助函数
-- 这几个都用 security definer: 策略里要读 profiles/contest_settings,
-- 如果走调用者身份会和 profiles 自己的 RLS 策略递归.

-- TODO: 5
create or replace function public.current_phase()
returns public.contest_phase
language sql stable security definer set search_path = public as $$
  select coalesce(
    s.phase_override,
    case
      when now() < s.upload_deadline then 'upload'::public.contest_phase
      else 'voting'::public.contest_phase
    end
  )
  from public.contest_settings s
  where s.id = 1
$$;

-- 投票是否还开着. 自动模式下过了 voting_deadline 就自动关闭;
-- 手动设了 phase_override 就完全听管理员的, 不再看时间.
-- TODO: 7
create or replace function public.voting_open()
returns boolean
language sql stable security definer set search_path = public as $$
  select case
    when s.phase_override is not null then s.phase_override = 'voting'
    else now() >= s.upload_deadline and now() < s.voting_deadline
  end
  from public.contest_settings s
  where s.id = 1
$$;

create or replace function public.my_role()
returns public.user_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_judge()
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.my_role() in ('judge', 'admin'), false)
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.my_role() = 'admin', false)
$$;


-- ------------------------------------------------------------ 聚合视图
-- 单张选票是私密的, 但票数要公开. 视图以所有者身份执行, 越过 votes 的 RLS,
-- 只吐出聚合结果. Supabase 的检查器会把它标成 "security definer view",
-- 这里是有意为之.
drop view if exists public.work_scores;
create view public.work_scores with (security_invoker = off) as
select
  w.id                                                        as work_id,
  count(v.id) filter (where v.kind = 'user')::int             as user_votes,
  avg(v.score) filter (where v.kind = 'judge')::numeric(4, 2) as judge_score,
  count(v.id) filter (where v.kind = 'judge')::int            as judge_count
from public.works w
left join public.votes v on v.work_id = w.id
group by w.id;


-- 前端读这个视图而不是直接读表: phase 是推导出来的, 表里没有这一列
-- TODO: 8
drop view if exists public.contest_state;
create view public.contest_state with (security_invoker = off) as
select
  s.id,
  public.current_phase() as phase,
  public.voting_open()   as voting_open,
  s.phase_override,
  s.upload_deadline,
  s.voting_deadline,
  s.max_photos,
  s.max_description,
  s.user_vote_limit,
  s.judge_max_score,
  s.popular_weight,
  s.judge_weight
from public.contest_settings s
where s.id = 1;


-- -------------------------------------------------------------- 触发器
-- 设置的改动时间. 不用 security definer: 只改 new, 不读别的表.
create or replace function public.touch_contest_settings()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists contest_settings_touch on public.contest_settings;
create trigger contest_settings_touch
  before update on public.contest_settings
  for each row execute function public.touch_contest_settings();

-- 注册后自动建一条 profiles
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    left(coalesce(
      nullif(new.raw_user_meta_data ->> 'name', ''),
      nullif(new.raw_user_meta_data ->> 'user_name', ''),
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      split_part(coalesce(new.email, 'user'), '@', 1)
    ), 24)
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 谁都不能把自己提成评委/管理员
create or replace function public.guard_profile_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    new.role := old.role;
  end if;
  return new;
end $$;

drop trigger if exists profiles_guard_role on public.profiles;
create trigger profiles_guard_role
  before update on public.profiles
  for each row execute function public.guard_profile_role();

-- 作品: 维护 updated_at, 并限制说明字数
create or replace function public.enforce_work_rules()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  limit_chars smallint;
begin
  select max_description into limit_chars from public.contest_settings where id = 1;

  if char_length(new.description) > limit_chars then
    raise exception '说明不能超过 % 字', limit_chars using errcode = 'check_violation';
  end if;

  if array_length(new.tags, 1) > 6 then
    raise exception '标签最多 6 个' using errcode = 'check_violation';
  end if;

  new.updated_at := now();
  return new;
end $$;

drop trigger if exists works_enforce_rules on public.works;
create trigger works_enforce_rules
  before insert or update on public.works
  for each row execute function public.enforce_work_rules();

-- 截图张数上限
create or replace function public.enforce_photo_limit()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  limit_photos smallint;
  current_count int;
begin
  select max_photos into limit_photos from public.contest_settings where id = 1;
  select count(*) into current_count from public.work_photos where work_id = new.work_id;

  if current_count >= limit_photos then
    raise exception '每份作品最多 % 张截图', limit_photos using errcode = 'check_violation';
  end if;

  return new;
end $$;

drop trigger if exists work_photos_enforce_limit on public.work_photos;
create trigger work_photos_enforce_limit
  before insert on public.work_photos
  for each row execute function public.enforce_photo_limit();

-- 投票规则: 阶段、不能投自己、重复投票、票数上限、评委身份、分数范围.
-- 只挂在 insert 上: 票没有"改"这个操作, 换目标或者改分都是先撤再投.
create or replace function public.enforce_vote_rules()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  settings public.contest_settings;
  author   uuid;
  used     int;
begin
  select * into settings from public.contest_settings where id = 1;

  if not public.voting_open() then
    raise exception '现在不能投票, 投票尚未开始或已经结束' using errcode = 'check_violation';
  end if;

  select author_id into author from public.works where id = new.work_id;

  -- 两种票一起拦: 评委也不能给自己的作品打分
  if author = new.voter_id then
    raise exception '不能给自己的作品投票或打分' using errcode = 'check_violation';
  end if;

  -- 排在票数上限之前. 否则票投满之后重复投同一份会先撞上限, 报出误导的
  -- "每人最多投 N 份"; 而真落到表上的 unique 约束, 抛的是一句裸的英文约束名.
  if exists (
    select 1 from public.votes
    where work_id = new.work_id and voter_id = new.voter_id and kind = new.kind
  ) then
    raise exception '已经投过这份作品了, 要改先撤销' using errcode = 'unique_violation';
  end if;

  if new.kind = 'user' then
    select count(*) into used
    from public.votes
    where voter_id = new.voter_id and kind = 'user';

    if used >= settings.user_vote_limit then
      raise exception '每人最多投 % 份作品', settings.user_vote_limit using errcode = 'check_violation';
    end if;

    new.score := 1;
  else
    if not public.is_judge() then
      raise exception '只有评委可以打分' using errcode = 'check_violation';
    end if;

    if new.score < 1 or new.score > settings.judge_max_score then
      raise exception '评分必须在 1 到 % 之间', settings.judge_max_score using errcode = 'check_violation';
    end if;
  end if;

  return new;
end $$;

drop trigger if exists votes_enforce_rules on public.votes;
create trigger votes_enforce_rules
  before insert on public.votes
  for each row execute function public.enforce_vote_rules();

-- 撤票. 时间窗口放在触发器而不是策略里: 策略拦下来的 delete 只是影响 0 行,
-- 前端看不出区别还以为撤成功了; 放这里能给出一句人话.
-- delete 触发器里 new 是 null 只能读 old, 所以复用不了上面那个函数.
create or replace function public.enforce_vote_delete_rules()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- 只拦本人撤票. auth.uid() 为空 (service key、控制台) 或者对不上 (删作品/删账号时
  -- 级联带走的别人的票) 都放行, 否则比赛结束之后连删个账号都会被这里挡下来.
  if old.voter_id = (select auth.uid()) and not public.voting_open() then
    raise exception '投票已经结束, 不能再撤销' using errcode = 'check_violation';
  end if;

  return old;
end $$;

drop trigger if exists votes_enforce_delete_rules on public.votes;
create trigger votes_enforce_delete_rules
  before delete on public.votes
  for each row execute function public.enforce_vote_delete_rules();


-- ------------------------------------------------------------- RLS 策略
alter table public.contest_settings enable row level security;
alter table public.profiles         enable row level security;
alter table public.works            enable row level security;
alter table public.work_photos      enable row level security;
alter table public.votes            enable row level security;

-- contest_settings: 所有人可读, 只有管理员能改
drop policy if exists contest_settings_read on public.contest_settings;
create policy contest_settings_read on public.contest_settings
  for select to anon, authenticated using (true);

-- UPDATE 策略省略 with check 时 Postgres 会拿 using 当检查条件, 不用重复写一遍
drop policy if exists contest_settings_admin_write on public.contest_settings;
create policy contest_settings_admin_write on public.contest_settings
  for update to authenticated using (public.is_admin());

-- profiles: 所有人可读, 只能建/改自己的 (role 由触发器守住)
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles
  for select to anon, authenticated using (true);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert to authenticated with check (id = (select auth.uid()));

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- works: 所有人可读, 只能在上传阶段改自己的
drop policy if exists works_read on public.works;
create policy works_read on public.works
  for select to anon, authenticated using (true);

drop policy if exists works_insert_own on public.works;
create policy works_insert_own on public.works
  for insert to authenticated
  with check (author_id = (select auth.uid()) and public.current_phase() = 'upload');

drop policy if exists works_update_own on public.works;
create policy works_update_own on public.works
  for update to authenticated
  using (author_id = (select auth.uid()) and public.current_phase() = 'upload')
  with check (author_id = (select auth.uid()));

drop policy if exists works_delete_own on public.works;
create policy works_delete_own on public.works
  for delete to authenticated
  using (author_id = (select auth.uid()) and public.current_phase() = 'upload');

-- work_photos: 所有人可读, 只能在上传阶段动自己作品下的截图
drop policy if exists work_photos_read on public.work_photos;
create policy work_photos_read on public.work_photos
  for select to anon, authenticated using (true);

-- TODO: 1
-- continue
drop policy if exists work_photos_insert_own on public.work_photos;
create policy work_photos_insert_own on public.work_photos
  for insert to authenticated
  with check (
    public.current_phase() = 'upload'
    and exists (
      select 1 from public.works w
      where w.id = work_id and w.author_id = (select auth.uid())
    )
  );

drop policy if exists work_photos_update_own on public.work_photos;
create policy work_photos_update_own on public.work_photos
  for update to authenticated
  using (
    public.current_phase() = 'upload'
    and exists (
      select 1 from public.works w
      where w.id = work_id and w.author_id = (select auth.uid())
    )
  );

drop policy if exists work_photos_delete_own on public.work_photos;
create policy work_photos_delete_own on public.work_photos
  for delete to authenticated
  using (
    public.current_phase() = 'upload'
    and exists (
      select 1 from public.works w
      where w.id = work_id and w.author_id = (select auth.uid())
    )
  );

-- 管理员撤图的另一半: 只删 storage 里的文件会留下一条指向空地址的记录, 页面挂一张碎图.
drop policy if exists work_photos_admin_delete on public.work_photos;
create policy work_photos_admin_delete on public.work_photos
  for delete to authenticated using (public.is_admin());

-- votes: 只能看见自己投的; 票数走 work_scores 视图公开
drop policy if exists votes_read_own on public.votes;
create policy votes_read_own on public.votes
  for select to authenticated using (voter_id = (select auth.uid()));

-- 投和撤两条策略都只管这票是不是本人的. 规则 (阶段、评委身份、票数上限、不能投自己)
-- 统一交给触发器按 kind 判, 免得同一条规则在两个地方各写一遍还写不一样.
drop policy if exists votes_insert_own on public.votes;
create policy votes_insert_own on public.votes
  for insert to authenticated with check (voter_id = (select auth.uid()));

-- 没有 update 策略: 票只有投和撤, 评委改分走先撤再投.
-- 这一句是为了把旧版本留下的 votes_update_own_judge 清掉.
drop policy if exists votes_update_own_judge on public.votes;

drop policy if exists votes_delete_own_user on public.votes;
drop policy if exists votes_delete_own on public.votes;
create policy votes_delete_own on public.votes
  for delete to authenticated using (voter_id = (select auth.uid()));


-- --------------------------------------------------------------- 存储桶
-- 截图放在 work-photos 桶里, 每个人只能写自己 uid 命名的文件夹.
--
-- 体积和类型在桶这一层就卡死. 桶是公开的, 里面的东西由 Supabase 项目域名直接吐给浏览器,
-- 而那个域名上同时挂着 auth 接口 —— 放任别人传一个带脚本的 SVG 进来, 等于白送一个同源
-- 执行入口. 白名单拦的是上传时声明的 Content-Type, 而对象发出去时用的也是这个值,
-- 所以就算有人揣着 SVG 的字节谎报成 image/png, 浏览器拿到的也是 image/png, 解不出脚本.
--
-- do update 而不是 do nothing: 桶要是之前已经建过 (控制台点的, 或者旧版本脚本建的),
-- do nothing 会让下面这几列永远落不了地.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'work-photos', 'work-photos', true,
  10 * 1024 * 1024,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists work_photos_object_read on storage.objects;
create policy work_photos_object_read on storage.objects
  for select to anon, authenticated using (bucket_id = 'work-photos');

-- TODO: 15
drop policy if exists work_photos_object_insert on storage.objects;
create policy work_photos_object_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'work-photos'
    -- TODO: 17
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.current_phase() = 'upload'
  );

drop policy if exists work_photos_object_delete on storage.objects;
create policy work_photos_object_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'work-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.current_phase() = 'upload'
  );

-- 管理员撤下违规截图. 不看阶段: 投票期间发现问题也得能删.
-- 同一条命令上的多条 permissive 策略是 or 关系, 这条只是在上面那条之外多开一个口子.
drop policy if exists work_photos_object_admin_delete on storage.objects;
create policy work_photos_object_admin_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'work-photos' and public.is_admin());


-- ----------------------------------------------------------------- 授权
grant select on public.work_scores  to anon, authenticated;
grant select on public.contest_state to anon, authenticated;
grant usage on schema public to anon, authenticated;


-- =====================================================================
-- 建完之后还要手动做的两件事:
--
--   1. 指定评委. 让对方先注册一次, 然后:
--        update public.profiles set role = 'judge' where id = '<用户的 uuid>';
--      管理员同理, role = 'admin'.
--
--   2. 设置截止时间. 阶段会按时间自动切换, 不用半夜手动改:
--        update public.contest_settings
--        set upload_deadline = '2026-10-20 23:59:59+08',
--            voting_deadline = '2026-11-03 23:59:59+08'
--        where id = 1;
--      注意带上时区 (+08), 否则会按数据库的 UTC 算, 差 8 小时.
--
--      临时要人工干预时 (延期、提前开、出事冻结) 用 phase_override:
--        update public.contest_settings set phase_override = 'upload'  where id = 1;  -- 强制回到上传
--        update public.contest_settings set phase_override = 'voting'  where id = 1;  -- 强制开投票
--        update public.contest_settings set phase_override = null      where id = 1;  -- 交还给时间
-- =====================================================================

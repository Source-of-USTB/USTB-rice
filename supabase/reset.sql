-- =====================================================================
-- USTB Rice · 清空
--
-- 用法: 在 Supabase 控制台的 SQL Editor 里整段执行, 然后重跑 schema.sql.
--
-- 把 schema.sql 建过的东西全部删掉: 表、视图、函数、触发器、策略、枚举、
-- 存储桶连同里面的文件. auth.users 里的账号不动, 人还在, 重跑 schema.sql
-- 之后会给他们补回 profiles.
--
-- 所有参赛数据都会没, 想清楚再跑.
-- =====================================================================


-- ------------------------------------------------------- 别的 schema 里的
-- 这几样挂在 storage 和 auth 上, 删 public 的表带不走它们.

delete from storage.objects where bucket_id = 'work-photos';
delete from storage.buckets where id = 'work-photos';

drop policy if exists work_photos_object_read         on storage.objects;
drop policy if exists work_photos_object_insert       on storage.objects;
drop policy if exists work_photos_object_delete       on storage.objects;
drop policy if exists work_photos_object_admin_delete on storage.objects;

drop trigger if exists on_auth_user_created on auth.users;


-- ---------------------------------------------------------------- 表和视图
-- cascade 顺手带走索引、表上的策略和触发器.

drop table if exists public.votes            cascade;
drop table if exists public.work_photos      cascade;
drop table if exists public.works            cascade;
drop table if exists public.profiles         cascade;
drop table if exists public.contest_settings cascade;

drop view if exists public.work_scores   cascade;
drop view if exists public.contest_state cascade;


-- ------------------------------------------------------------------ 函数

drop function if exists public.current_phase()             cascade;
drop function if exists public.voting_open()               cascade;
drop function if exists public.my_role()                   cascade;
drop function if exists public.is_judge()                  cascade;
drop function if exists public.is_admin()                  cascade;
drop function if exists public.default_display_name(jsonb, text) cascade;
drop function if exists public.handle_new_user()           cascade;
drop function if exists public.guard_profile_role()        cascade;
drop function if exists public.touch_contest_settings()    cascade;
drop function if exists public.enforce_work_rules()        cascade;
drop function if exists public.enforce_photo_limit()       cascade;
drop function if exists public.delete_photo_object()       cascade;
drop function if exists public.enforce_vote_rules()        cascade;
drop function if exists public.enforce_vote_delete_rules() cascade;


-- ------------------------------------------------------------------ 枚举
-- 放最后: 上面的表和函数都引用它们.
-- 这一步不能省. drop table 不碰类型, 类型留着就会停在只有 upload 和 voting
-- 两个值的旧状态, schema.sql 得走 alter type 那条兼容路径才能补上 ended.

drop type if exists public.contest_phase cascade;
drop type if exists public.user_role     cascade;
drop type if exists public.vote_kind     cascade;

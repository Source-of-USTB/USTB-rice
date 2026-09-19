# TODO

1. work_photos.storage_path 是裸 text, 插入策略只校验 work_id 归属不看路径, 用户能只插记录不传文件把别人的图挂成自己的作品, 加格式约束和触发器强制首段目录等于作者 uid

2. 外键级联只删数据库记录, Storage 里的图片文件留成孤儿且仍可公开访问, 加 after delete 触发器清 storage.objects

3. addMyPhotos 用文件名取扩展名, 没后缀或 x.tar.gz 会生成畸形路径, 改成按 file.type 映射

4. 昵称注册时定死, profiles 前端没有写入路径, 在 /me 加一个输入框

5. 阶段现在按截止时间算加 phase_override 兜底, 另一条路是保留 phase 列加 pg_cron 定时翻, 待定

6. contest_settings.updated_at 没有触发器维护永远停在创建时间, 加触发器或者删掉这一列

7. voting_open() 没调 current_phase() 而是把阶段逻辑重推了一遍, 两者会给出矛盾答案(过了投票截止 phase 还是 voting 但投不了), 根源是枚举缺「已结束」状态, 加第三个阶段让 current_phase 独自说了算

8. 视图 phase 单纯封装了 current_phase 和 contest_settings, 无效封装, 改成直接调用 current_phase() 和查询 contest_settings

9. popular_weight 和 judge_weight 之和不受约束, 能存成 0.4 和 0.7 让综合分满分变成 110, 加 check 约束

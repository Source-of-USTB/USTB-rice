# TODO

1. ~~work_photos.storage_path 是裸 text 且插入策略不看路径, 用户能只插记录不传文件把别人的图挂成自己的作品, 而且 getPublicUrl 只做 encodeURI 不转义 .. 和 /, HTTP 层的路径穿越现在就成立, 将来任何把它当真实路径用的消费者(清理脚本、备份、图片管线)还会变成命令注入面; 删掉这一列, 存储键改成由 works.author_id 和 work_photos.id 两个 uuid 列拼出来, 让类型系统直接挡住畸形值, 不需要正则也不需要触发器; 已知代价是键里不再有扩展名 —— 显示不受影响(Content-Type 来自上传时写入的对象元数据, 浏览器认的是响应头不是 URL 后缀), Supabase 的 render/image 变换端点同样按对象走, 唯一影响是右键另存为会得到裸 uuid 文件名(需要时用 getPublicUrl 的 download 选项指定), 以及按后缀做规则的 CDN 缓存策略用不上(本项目没有)~~

2. ~~外键级联只删数据库记录, Storage 里的图片文件留成孤儿且仍可公开访问, 加 after delete 触发器清 storage.objects~~

3. ~~addMyPhotos 用文件名取扩展名会生成畸形路径, 第 1 条改成 uuid 拼键之后键里不再有扩展名(Content-Type 走对象元数据, 显示不依赖后缀), 这条随之消失~~

4. ~~昵称注册时定死, profiles 前端没有写入路径, 在 /me 加一个输入框~~

5. ~~阶段现在按截止时间算加 phase_override 兜底, 另一条路是保留 phase 列加 pg_cron 定时翻, 待定~~

6. ~~contest_settings.updated_at 没有触发器维护永远停在创建时间, 加触发器或者删掉这一列~~

7. ~~voting_open() 没调 current_phase() 而是把阶段逻辑重推了一遍, 两者会给出矛盾答案(过了投票截止 phase 还是 voting 但投不了), 根源是枚举缺「已结束」状态, 加第三个阶段让 current_phase 独自说了算~~

8. ~~视图 phase 单纯封装了 current_phase 和 contest_settings, 无效封装, 改成直接调用 current_phase() 和查询 contest_settings~~

9. ~~popular_weight 和 judge_weight 之和不受约束, 能存成 0.4 和 0.7 让综合分满分变成 110, 加 check 约束~~

10. ~~自投检查只写在 enforce_vote_rules 的 user 分支里, 评委能给自己的作品打分, 把 author = new.voter_id 那段移到 kind 判断外面对两种票都生效~~

11. ~~enforce_vote_rules 不查重复投票全靠表上的 unique 约束兜底, 票满时重复投同一份会先撞预算检查报出误导的「每人最多投 N 份」, 而且抛的是裸的 23505 英文约束名, 在预算检查之前先查一次这个 voter 对该 work 投过没有~~

12. ~~contest_settings_admin_write 的 with check (is_admin()) 是冗余样板, 表达式不引用新行任何列所以和 using 求值必然相同, 而且 UPDATE 策略省略 with check 时 Postgres 本来就会拿 using 当检查条件, 删掉零影响~~

13. ~~票只应该有增和删两种操作, 不存在改, 要换目标就先删再增; 删掉 votes_update_own_judge 策略, 给 kind = judge 补一条同样受 voting_open 约束的删除策略, enforce_vote_rules 的触发时机从 before insert or update 收成 before insert(预算计数里那个 id <> new.id 也可以去掉), 前端 setJudgeScore 的 upsert 改成先 delete 再 insert; 同时 votes 的策略应该只管归属不管规则(现有 insert 策略已经是这个形状), delete 策略里的 kind = user 和 voting_open 都拿掉只留 voter_id = auth.uid(), 规则统一交给触发器按 kind 判; 但必须配套补一个 before delete 触发器, 否则 voting_open 从策略里拿掉之后没人管删除的时间窗口, 投票结束了还能回去撤票 —— 注意 delete 触发器里 new 是 null 要用 old, 得单独写一个函数不能复用 enforce_vote_rules; 顺带白赚一条: 撤票失败时能抛出「投票已经结束」, 而不是现在这样 delete 静默影响 0 行、前端还以为成功了; 评委靠 update work_id 把分数搬到别的作品从而变相撤分那个洞会随之消失~~

14. ~~建桶语句没设 file_size_limit 和 allowed_mime_types, 任何登录用户能往公开桶里塞任意大小任意类型的文件, 传个带脚本的 SVG 上去就是以 Supabase 项目域名的身份执行(那个域名同时还挂着 auth 接口), 补上体积上限和 image/png,image/jpeg,image/webp 白名单; 注意现有的 on conflict (id) do nothing 会让这个改动对已经建好的桶完全不生效, 得改成 on conflict (id) do update set~~

15. ~~上传张数只有 enforce_photo_limit 数 work_photos 的行, 存储侧一张不管, 用户可以传一百个文件只插 max_photos 条记录, 多出来的就是没人引用又能公开下载的孤儿, 和第 2 条机制不同(那条是删记录留文件, 这条是压根没插过记录), 前端上传后插记录失败要回删, 另外需要一个对账清理~~

16. ~~storage.objects 上只有 authenticated 管自己文件的策略, 管理员没有任何策略, 要撤下一张违规截图只能进控制台或者拿 service key, 补一条 is_admin() 的 delete 策略~~

17. ~~(storage.foldername(name))[1] 只校验第一段目录, 后面的路径和文件名完全自由, 第 1 条把键换成 author_id/photo_id 之后这个洞不会自动消失, 策略要跟着收成完整两段的形状, 收紧之后第 15 条的乱传也一并挡掉~~

18. 截止时间还是建表那一刻算出来的 +30 天 / +45 天, 上线前 update contest_settings 改成真实日期, 时间戳必须带 +08, 不带会按数据库的 UTC 算差 8 小时

19. 管理员和评委只能在 SQL Editor 里 update profiles.role 指派, 站内没有任何入口, 而且对方必须先自己注册过一次才有 profiles 行

20. 部署到社团服务器: pnpm build 产出的 .output/ 是自包含的, 连 node_modules 都不用带, 拷 .output/ 和 .env 两样就够, 起进程是 PORT=3000 HOST=0.0.0.0 node .output/server/index.mjs, 配个 systemd unit 守着

21. cloudflared 隧道指向 http://localhost:3000, 内网走 http://<服务器IP>:3000, 两条路同一个进程

22. 挂上社团域名之后要去 Supabase 的 Auth → URL Configuration 改 Site URL, 并把 https://<社团域名>/confirm 加进 Redirect URLs; 想让内网 IP 那条也能登录就把 http://<服务器IP>:3000/confirm 一起加上, 不加的话 GitHub 登录和邮箱链接回跳会被拒

23. 手机端只保证了不横向溢出, 断点和折行都写了, 但没在真机上量过间距和点击区域, 上线前找台手机过一遍

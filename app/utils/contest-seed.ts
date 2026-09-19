import type { Profile, Vote, Work, WorkPhoto } from '~/types/contest'

/** 比赛规则相关的常量, 之后应该从 Supabase 的 contest_settings 表读 */
export const CONTEST_CONFIG = {
  /** 每人最多上传的照片数 */
  maxPhotos: 9,
  /** 作品说明的字数上限 */
  maxDescriptionLength: 800,
  /** 每个用户在投票阶段最多能投几份作品 */
  userVoteLimit: 3,
  /** 评委打分的满分 */
  judgeMaxScore: 10,
  /** 综合分里人气分的占比 */
  popularWeight: 0.4,
  /** 综合分里评委分的占比 */
  judgeWeight: 0.6,
  uploadDeadline: '2026-10-20',
  votingDeadline: '2026-11-03'
} as const

/**
 * 以下全部是本地假数据, 仅用于页面开发和 review.
 * 接入 Supabase 后整个文件都可以删掉.
 */

export function createSeedProfiles(): Profile[] {
  return [
    { id: 'u-01', name: '李思远', bio: '计通学院 · 折腾 Hyprland 两年', role: 'player' },
    { id: 'u-02', name: '陈牧', bio: '自动化学院 · Sway 原教旨主义者', role: 'player' },
    { id: 'u-03', name: '王一诺', bio: '材料学院 · i3wm 轻量至上', role: 'player' },
    { id: 'u-04', name: '赵启明', bio: '机械学院 · 我全都要的 KDE 党', role: 'player' },
    { id: 'u-05', name: '周雨桐', bio: '数理学院 · Lua 配置爱好者', role: 'player' },
    { id: 'u-06', name: '孙泽宇', bio: '经管学院 · GNOME 扩展收集癖', role: 'player' },
    { id: 'u-07', name: '吴清和', bio: '冶金学院 · 改 dwm 源码就是配置', role: 'player' },
    { id: 'u-08', name: '郑霖', bio: '能源学院 · 每周换一次配色', role: 'player' },
    { id: 'j-01', name: '罗老师', bio: '社团指导老师', role: 'judge' },
    { id: 'j-02', name: '何学长', bio: '上届冠军 · 特邀评委', role: 'judge' }
  ]
}

export function createSeedWorks(): Work[] {
  return [
    {
      id: 'w-01',
      authorId: 'u-01',
      title: '极光 Aurora · Hyprland 动效全开',
      description: '整套配色取自北极光的蓝紫渐变, 壁纸是自己用 shader 跑出来的。\n\n窗口管理器用 Hyprland, 打开了模糊和圆角, 工作区切换做了一点弹性动画。状态栏是 waybar, 自己写了一个显示实时网速和电池健康度的模块。终端 kitty + fish, 提示符用 starship, 字体是 Maple Mono NF。\n\n最满意的是锁屏和通知中心的过渡, 从半透明到实心只用了 180ms, 既不拖沓也不会太突兀。所有 dotfiles 已经整理到一个仓库里, 一条命令就能部署。',
      tags: ['Hyprland', 'Wayland', 'Arch Linux', '蓝紫渐变'],
      createdAt: '2026-09-28T10:12:00.000Z',
      updatedAt: '2026-10-06T21:40:00.000Z'
    },
    {
      id: 'w-02',
      authorId: 'u-02',
      title: 'Nord 极简 · 一块屏幕只做一件事',
      description: 'Sway + Nord 配色, 目标是让桌面上不出现任何多余的像素。\n\n没有 dock, 没有桌面图标, 状态栏只留了时间、电量和当前工作区。所有操作都靠快捷键, 鼠标基本不用碰。配色严格限制在 Nord 的 16 色里, 连 neovim 的语法高亮也重新映射过一遍。\n\n这套配置用了 8 个月, 期间只改过两次, 稳定性我很满意。',
      tags: ['Sway', 'Nord', 'Debian', '极简'],
      createdAt: '2026-09-29T14:02:00.000Z',
      updatedAt: '2026-10-02T09:15:00.000Z'
    },
    {
      id: 'w-03',
      authorId: 'u-03',
      title: 'Gruvbox 复古终端工作流',
      description: 'i3wm + Gruvbox, 一套很温暖的复古配色, 长时间看代码眼睛不容易累。\n\n重点在工作流: 四个工作区分别固定给浏览器、编辑器、终端和通讯软件, 用 i3 的 assign 规则自动归位。polybar 上写了一个显示 GitHub 通知数的模块。\n\n截图里是我平时写课程作业的真实状态, 没有专门摆拍。',
      tags: ['i3wm', 'Gruvbox', 'polybar'],
      createdAt: '2026-09-30T08:30:00.000Z',
      updatedAt: '2026-09-30T08:30:00.000Z'
    },
    {
      id: 'w-04',
      authorId: 'u-04',
      title: 'Breeze 深蓝 · 把 KDE 调成一块玻璃',
      description: 'KDE Plasma 6, 主题在 Breeze Dark 基础上把所有强调色换成了更深的蓝。\n\n用 kwin 脚本给窗口加了统一的圆角和背景模糊, 面板改成悬浮样式并且自动隐藏。图标用 Papirus 改色版本, 保证和面板的蓝一致。\n\nKDE 的可配置项实在太多, 这套方案我前后调了三周, 附上的截图分别是桌面、文件管理器和系统设置。',
      tags: ['KDE Plasma', 'Breeze', '毛玻璃'],
      createdAt: '2026-10-01T19:45:00.000Z',
      updatedAt: '2026-10-05T11:20:00.000Z'
    },
    {
      id: 'w-05',
      authorId: 'u-05',
      title: 'Tokyo Night · 全 Lua 的桌面',
      description: 'AwesomeWM 全部用 Lua 配置, 从状态栏到通知气泡都是自己写的 widget。\n\n配色是 Tokyo Night Storm, 蓝紫为主。做了一个圆形的系统监控盘, 悬停会展开成详细面板。通知用 naughty 重写了样式, 带进度条。\n\n配置文件加起来一千多行, 但因为是 Lua, 改起来比声明式配置舒服很多。',
      tags: ['AwesomeWM', 'Tokyo Night', 'Lua'],
      createdAt: '2026-10-02T22:10:00.000Z',
      updatedAt: '2026-10-07T16:05:00.000Z'
    },
    {
      id: 'w-06',
      authorId: 'u-06',
      title: 'Catppuccin Mocha · 温柔一点的 GNOME',
      description: 'GNOME 46, Catppuccin Mocha 配色, 想做一个不那么硬核、日常也能用的桌面。\n\n扩展用了 Blur my Shell、Dash to Dock 和 Just Perfection, 把顶栏调薄, dock 改成悬浮圆角。GTK 主题和 shell 主题统一成同一套 Catppuccin, 终端和编辑器也跟着换。\n\n这套配置我室友看了之后也装了一份, 应该算是比较容易接受的类型。',
      tags: ['GNOME', 'Catppuccin', 'Fedora'],
      createdAt: '2026-10-03T13:25:00.000Z',
      updatedAt: '2026-10-03T13:25:00.000Z'
    },
    {
      id: 'w-07',
      authorId: 'u-07',
      title: 'Everforest · 编译进二进制的配置',
      description: 'dwm + st + dmenu, 全部打了补丁重新编译, 配色是 Everforest 的暖绿灰。\n\n给 dwm 打了 vanitygaps、systray 和 fakefullscreen 补丁, st 加了字体回退和滚动。所有"配置"都在 config.h 里, 改完 make 一下就生效。\n\n整套东西开机内存占用不到 180MB, 在我那台 2014 年的旧笔记本上跑得很顺。',
      tags: ['dwm', 'Everforest', 'suckless'],
      createdAt: '2026-10-04T07:50:00.000Z',
      updatedAt: '2026-10-06T20:30:00.000Z'
    },
    {
      id: 'w-08',
      authorId: 'u-08',
      title: 'Rosé Pine · 一周一换的实验田',
      description: 'Wayfire 加一堆插件, 配色这周是 Rosé Pine Moon。\n\n开了立方体工作区切换和窗口抖动特效, 纯属好玩。壁纸和状态栏颜色用脚本从当前主题自动提取, 换主题只要改一个变量。\n\n截图里能看到我正在写的换肤脚本, 它会同时改 GTK、终端、编辑器和壁纸。',
      tags: ['Wayfire', 'Rosé Pine', '换肤脚本'],
      createdAt: '2026-10-05T16:40:00.000Z',
      updatedAt: '2026-10-08T10:55:00.000Z'
    }
  ]
}

/** 每份作品配 2-4 张截图 */
export function createSeedPhotos(): WorkPhoto[] {
  const groups: Record<string, string[]> = {
    'w-01': ['hyprland-aurora', 'awesome-tokyo', 'gnome-catppuccin', 'river-dracula'],
    'w-02': ['sway-nord', 'xfce-solarized'],
    'w-03': ['i3-gruvbox', 'dwm-everforest', 'sway-nord'],
    'w-04': ['kde-breeze', 'hyprland-aurora', 'gnome-catppuccin'],
    'w-05': ['awesome-tokyo', 'river-dracula', 'wayfire-rose', 'hyprland-aurora'],
    'w-06': ['gnome-catppuccin', 'wayfire-rose'],
    'w-07': ['dwm-everforest', 'i3-gruvbox', 'xfce-solarized'],
    'w-08': ['wayfire-rose', 'river-dracula', 'awesome-tokyo']
  }

  return Object.entries(groups).flatMap(([workId, slugs]) =>
    slugs.map((slug, index) => ({
      id: `${workId}-p${index + 1}`,
      workId,
      url: `/mock/${slug}.svg`,
      sortOrder: index,
      createdAt: '2026-10-06T12:00:00.000Z'
    }))
  )
}

/**
 * 种子票数. 用户票由若干个匿名同学投出, 评委票是两位评委的打分.
 * 当前登录用户 (u-01) 一票都没投, 方便在投票阶段直接试投票交互.
 */
export function createSeedVotes(): Vote[] {
  const userVoteCounts: Record<string, number> = {
    'w-01': 34,
    'w-02': 21,
    'w-03': 17,
    'w-04': 29,
    'w-05': 41,
    'w-06': 25,
    'w-07': 12,
    'w-08': 19
  }

  const judgeScores: Record<string, [number, number]> = {
    'w-01': [9, 8],
    'w-02': [8, 9],
    'w-03': [7, 7],
    'w-04': [8, 7],
    'w-05': [9, 9],
    'w-06': [7, 8],
    'w-07': [8, 8],
    'w-08': [6, 7]
  }

  const votes: Vote[] = []

  for (const [workId, count] of Object.entries(userVoteCounts)) {
    for (let i = 0; i < count; i++) {
      votes.push({
        id: `${workId}-uv-${i}`,
        workId,
        voterId: `anon-${workId}-${i}`,
        kind: 'user',
        score: 1,
        createdAt: '2026-10-25T12:00:00.000Z'
      })
    }
  }

  for (const [workId, [first, second]] of Object.entries(judgeScores)) {
    votes.push(
      { id: `${workId}-jv-1`, workId, voterId: 'j-01', kind: 'judge', score: first, createdAt: '2026-10-26T12:00:00.000Z' },
      { id: `${workId}-jv-2`, workId, voterId: 'j-02', kind: 'judge', score: second, createdAt: '2026-10-26T12:00:00.000Z' }
    )
  }

  return votes
}

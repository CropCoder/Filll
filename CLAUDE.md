# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

`filll.cn`（飞荔科学 Filll Science Studio / 未特生物 WeiteBio）是一个**纯静态网站仓库**，由多个相互独立的页面/子项目组成，无构建工具、无框架、无 `package.json`。日常维护主要是编辑 HTML 内嵌的样式/脚本，或子项目中的 `data.js` 数据文件。

## 技术栈（各页面基本一致）

- 纯静态 HTML/CSS/JS，可直接 `file://` 双击打开，也可用任意静态服务器托管
- 样式：Tailwind CSS 通过 CDN 引入（`https://cdn.tailwindcss.com`），页面级自定义颜色在 `<script>` 里配置 `tailwind.config`
- 字体：Google Fonts（Inter / Noto Sans SC）
- 3D：Three.js 通过 importmap CDN 引入（`weite.html` 用内联 `<script type="module">` 直接 `import * as THREE from 'three'`）
- 图表：Chart.js CDN（仅 `lab/index.html`）
- 无测试、无 lint、无构建流程

## 目录与子项目

| 路径 | 说明 |
|------|------|
| `index.html` | 主站首页（飞荔科学），Tailwind 单页，含 `css/style.css`（1230 行全局样式） |
| `wgs.html` / `weite.html` | 「群体重测序变异检测」产品页（未特生物），`weite.html` 含 Three.js 3D 地球 |
| `404.html` / `robots.txt` | 404 页面；`robots.txt` 当前 `Disallow: /`（全站禁止爬虫） |
| `Protein.mp4` | 首页视频素材（约 4.5MB，已入库） |
| `CDRT/` | 作物抗病机制与技术团队主页（已有自己的 `CLAUDE.md`），成员数据在 `data.js` 的 `DATA.scientists` |
| `LCFDB/` | 真菌基因注释数据库 FungalGenDB（菌株检索网页），见下节数据流 |
| `CropCoder/` | AI 农业智能平台落地页 |
| `wheatomics2.0/` | WheatOmics 2.0 多组学平台首页 |
| `lab/` | 植物免疫 Decoy 蛋白综述文章页（Nature 期刊风格），`md5sum.txt` 是测序数据文件校验清单 |

## 关键架构：数据驱动页面

两个子项目采用「数据文件 + 前端渲染」模式，日常维护**只改数据文件**，不碰渲染逻辑：

- **LCFDB**：`Example.txt`（31 列 TSV 注释表）→ 运行 R 脚本生成 `data.js`（挂载 `window.FDB_DATA`）→ `index.html` + `js/Script2-Strain-Search-App-V1.js` 渲染。数据缺失字段一律显示空状态、绝不编造。详见 `LCFDB/Runlog.md`。
- **CDRT**：`data.js` 中 `DATA.scientists` 数组驱动成员卡片，分类颜色/排序在 `catColors`、`categoryOrder`。

## 常用命令

```bash
# 本地预览（任选其一，在仓库根目录）
python3 -m http.server 8000          # 然后访问 http://localhost:8000
# 或直接浏览器打开对应 html 文件（LCFDB 明确支持 file:// 协议）

# 重新生成 LCFDB 数据文件（在 LCFDB 目录内运行）
cd LCFDB && Rscript Script1-Parse-Annotation-Data-V1.R
```

## 注意事项

- `js/` 目录下的 `app.js`、`main.js`、`three-scene.js` 目前**未被 `index.html` 引用**，属于遗留文件；其中 `app.js` import 的 `./page-renderers.js` 在仓库中不存在，不要误以为它们是主站当前逻辑入口。`index.html` 的交互逻辑内嵌在页尾 `<script>` 中。
- 部署方式：将相关 HTML/CSS/JS/图片上传到 Web 服务器即可，无编译步骤。
- 作者信息统一为 Jiwen Zhao（https://github.com/CropCoder），git 提交者名为 CropCoder。

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

作物抗病机制与技术团队 (CDRT) 的官方介绍主页，纯静态单页网站。其他应用程序请勿随便修改该文件！

## 技术架构

- 纯静态 HTML 单页面，无构建工具、无框架、无 package.json
- 使用 Tailwind CSS CDN (`https://cdn.tailwindcss.com`) 提供样式
- CSS 内嵌在 `<style>` 标签中，页面交互 JS 内嵌在 `<script>` 标签中
- 团队成员数据与配置独立存放在 `data.js` 文件中，通过 `<script src="./data.js">` 引入
- 图片资源存放在 `img/` 目录，同时提供原始格式和 avif 转换版本

## 页面结构

| 区块 | id | 说明 |
|------|-----|------|
| 导航栏 | `nav` | 固定顶部，含移动端汉堡菜单 |
| 首页横幅 | `hero` | 团队名称、简介、统计数字、合影照片 |
| 首席科学家 | - | PI 团队展示 |
| 团队成员 | `team` | 分类筛选（全部/高级科学家/主任科学家/青年科学家），动态渲染卡片 |
| 研究方向 | `research` | 6 个研究方向卡片 |
| 加入我们 | `join` | 博士后招聘链接（指向微信公众号文章） |
| 联系我们 | `contact` | 地址、微信、邮箱 |
| 页脚 | - | 网站维护联系信息 |

## 成员数据结构

成员数据定义在 `data.js` 的 `DATA.scientists` 数组中，每个对象的结构：
```js
{
  name: "姓名",
  title: "职称",
  email: "邮箱",
  category: "高级科学家" | "主任科学家" | "青年科学家",
  photo: "./img/xxx.jpg",
  bio: "简介文本",
  publicationLink: "Google Scholar / ORCID 链接（可选）"
}
```

分类颜色和排序也配置在 `data.js` 中（`catColors` 和 `categoryOrder`）。

## 文件说明

| 文件 | 用途 |
|------|------|
| `index.html` | 团队介绍主页，页面结构与交互逻辑 |
| `recruit.html` | 人才招聘页面，展示招聘岗位、薪酬待遇、联系方式 |
| `data.js` | 团队成员数据与分类配置，日常维护主要编辑此文件 |
| `img/` | 所有图片资源（成员照片、团队合影等） |

## 常用操作

- **修改/添加成员**: 编辑 `data.js` 中的 `DATA.scientists` 数组，新增成员照片放入 `img/` 目录
- **调整分类或颜色**: 编辑 `data.js` 中的 `catColors` 和 `categoryOrder`
- **修改研究方向**: 编辑 `index.html` 中 `#research` 区域的 HTML 卡片
- **修改联系方式**: 编辑 `index.html` 中 `#contact` 区域的 HTML
- **部署**: 将所有文件（`index.html`、`data.js`、`img/` 目录）上传到 Web 服务器即可

# GeneConvertToCS Tool

小麦中国春参考基因组基因 ID 在线批量转换工具。

## 简介

小麦中国春参考基因组目前已经更新了多个版本（CS1G、CS2G、CS3G、CAU、IAAS 等）。随着 T2T 等高质量基因组的发布，跨版本基因 ID 的对应与转换成为基因功能研究中的常见需求。本工具提供基于 Web 的批量转换服务，用户无需安装任何软件，即可在不同版本基因组基因 ID 之间进行映射转换。

## 功能特性

- 支持多版本小麦中国春参考基因组基因 ID 互转（IAAS、CS3G、CAU、CS2G、CS1G）
- 批量转换：一次粘贴多个基因 ID（每行一个，或空格/制表符分隔），无数量限制
- 内置示例数据，便于快速体验
- 结果表格支持搜索、排序、分页与未匹配高亮
- 一键导出 CSV 与 Excel（xlsx）文件
- 全流程本地计算，数据无需上传服务器，隐私安全
- 现代化界面（纯 CSS 设计系统，无图片图标依赖）

## 数据规模

基因映射数据库（SQLite）共收录 **264,504** 条对应关系：

| 版本 | 有效记录数 |
| --- | --- |
| IAAS | 255,174 |
| CS3G | 205,379 |
| CAU | 251,847 |
| CS2G | 205,379 |
| CS1G | 199,166 |

## 技术栈

- 纯静态 HTML + 原生 JavaScript（无前端框架依赖）
- 原生 CSS 设计系统（手写主题，无 UI 库依赖）
- SheetJS（xlsx@0.18.5，CDN 引入，用于 Excel 导出）
- 数据预处理：R（`Script1-Export-DB-To-JSON-V1.R`，将 SQLite 导出为 JSON）

## 项目结构

```
WheatGeneIDConvert/
├── index.html                       # 静态网页应用（核心，直接部署即可使用）
├── data/
│   ├── map_IAAS.json                # IAAS 版基因 ID 映射（源版本 → 目标版本数组）
│   ├── map_CS3G.json                # CS3G 版基因 ID 映射
│   ├── map_CAU.json                 # CAU 版基因 ID 映射
│   ├── map_CS2G.json                # CS2G 版基因 ID 映射
│   └── map_CS1G.json                # CS1G 版基因 ID 映射
├── Script1-Export-DB-To-JSON-V1.R  # 数据导出脚本（SQLite → JSON）
├── GeneConvertToCS.db               # 原始基因 ID 映射数据库（SQLite，用于重新导出）
├── www/                             # 旧版静态资源（info.png、stats.js，新版页面已不再引用）
├── global.R / ui.R / server.R       # 原 Shiny 版本（已不再使用，保留作参考）
└── README.md
```

## 快速开始

### 静态部署（推荐）

无需任何运行环境，将整个目录放到任意静态网站服务器（如 Nginx、GitHub Pages、
对象存储）即可。本地预览可在目录下启动一个简单的 HTTP 服务：

```bash
# 在项目目录下执行，浏览器打开 http://localhost:8000
python3 -m http.server 8000
```

> 说明：页面通过 `fetch("data/map_*.json")` 加载映射数据，受浏览器同源策略限制，
> 需以 HTTP 方式访问（不能直接双击 `file://` 打开）。

### 重新生成映射数据（可选）

当 `GeneConvertToCS.db` 更新后，运行以下脚本重新导出 JSON：

```bash
Rscript Script1-Export-DB-To-JSON-V1.R
```

## 使用方法

1. 使用 Excel 等工具将待转换的基因 ID 整理到一列
2. 复制粘贴到输入框（每行一个），或点击"使用示例数据"体验
3. 选择原始基因 ID 版本与目标基因 ID 版本
4. 点击"开始转换"
5. 查看结果表格，点击"下载结果表格"导出 CSV

示例基因 ID：`CSIAAS1AG0000200LC`、`CSIAAS1AG0006400HC`

## 版本说明

| 版本标识 | 来源 |
| --- | --- |
| IAAS | 北京大学现代农业研究院版本 |
| CAU | 中国农业大学版本 |
| CS1G / CS2G / CS3G | 中国春参考基因组不同版本 |

## 在线地址

https://filll.cn/WheatTools/GeneID

## 联系方式

- 开发团队：生信分析笔记
- 联系邮箱：admin@filll.cn

## 作者

Jiwen Zhao (https://github.com/CropCoder)

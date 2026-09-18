# Runlog — FDB 真菌数据库 01-菌株检索功能

## 2026-09-07

### 项目目标
基于 `Example.txt`（真菌基因功能注释表，31 列 TSV，53 条基因记录，物种 *Fusarium aberrans* CBS 119866），开发菌株基因检索与详情网页。排版参考设计图（FungalGenDB 风格）。

### 数据判断（读取表头与示例行后确认）

- **记录粒度**：每行 = 一个基因模型（GeneID：g1.t1 … g53.t1），为基因级注释表，非菌株级记录。
- **物种/菌株关系**：`Species` 列内部格式 `种_种加词__菌株`（如 `Fusarium_aberrans__CBS_119866`）。当前仅 1 个菌株；详情页采用 **复合键 `Species::GeneID`**，兼容未来多菌株/不同物种相同基因 ID 的情况。
- **缺失数据（一律空状态，不编造）**：蛋白/CDS 序列、结构域起止坐标、基因结构（染色体/链/外显子）坐标、GO 本体分类（数据仅有 GO 编号）。
- **数值原则**：E-value/Score 保留原始精度；E-value=0 是有效值（显示 0.0），不用作缺失判断。
- **字段映射**：31 个原始列 → 页面字段的完整映射表写入网页 Help 面板（帮助→字段映射）。

### 页面实现（按新版规范）

1. **顶部导航**：68px 深蓝横条（#1c4e8a）。左：可配置数据库名（CONFIG.brandName）+ 英文简介；中：宽搜索框（实时下拉显示命中的基因与匹配字段，如 "Description: acyl-CoA oxidase"，点击进详情）；右：Tools（导出 TSV/复制摘要）、Download、Help。
2. **面包屑**：Home → Species → Fusarium aberrans CBS 119866 → Gene → g46.t1。Species 级点击可筛选对应物种；Home 回列表。
3. **左侧目录**：225px 侧栏，9 个入口（Overview/Gene Model/Function/Orthology/GO Annotations/KEGG Pathways/Protein Domains/Sequences/External Links），内联 SVG 线性图标；浅蓝背景+蓝色文字+左侧蓝色竖线高亮；点击平滑滚动（scroll-margin 防止被固定导航遮挡），滚动联动更新选中项。
4. **详情头部**：双栏。左：主标题 "Gene {id}"（30px）+ 物种副标题 + 四色标签（蓝=蛋白长度、绿=功能描述、紫=KEGG KO、黄=EC）；右：小型摘要表（Gene ID/Species/Protein length）。长描述自动换行不重叠。
5. **九个模块**：
   - Overview：两列键值表（11 个字段，含精度保留的 E-value 科学计数法与有效 0 值）；
   - Function：描述/COG/EC/KO 标签列表（多值可换行）；
   - Orthology：单条键值展示；多条时紧凑表 + 可排序（为未来多同源关系数据预留）；
   - GO Annotations：**全部列入 Unclassified**（数据无本体分类，不按编号猜测），标注来源（eggNOG/InterProScan），联网时 Amigo API 取术语名称与定义供悬停展示（不影响分类策略）；
   - KEGG Pathways：Pathways/Modules/Reactions 分节展示（保留原始编号与前缀 ko:/map:），浅蓝标签+计数；
   - Protein Domains：SVG 轨道（横轴 1..蛋白长度，浅灰蛋白条，数据库固定配色+图例，重叠分轨，悬停展示名称/来源/起止），**仅有真实起止坐标时绘制**；当前数据无坐标 → 明确空状态 + 注释清单表；
   - Gene Model：无染色体/链/外显子数据 → 明确空状态；
   - Sequences：Protein/CDS 双标签页，Copy/Download FASTA/View full 按钮；当前无序列 → 空状态 + 操作禁用；
   - External Links：NCBI/UniProt/eggNOG/KEGG/InterPro，**direct**（精确 accession：KO/IPR/通路）与 **search**（本地基因 ID 非该库 accession，仅搜索入口）明确标注，新标签页打开。
6. **响应式**：≤1024px 单栏（侧栏折叠为横排 chip），搜索框自适应。

### 验证结果

- Node `--check` 通过；无头 Chrome 冒烟测试 **50 项全部通过**，无 JS 运行时错误。
- 关键断言：导航 68px 深蓝、搜索下拉匹配字段、面包屑全链路、目录 9 项+图标+滚动联动、双栏头部+四色标签、9 模块存在、Gene Model/Sequences/GO/结构域空状态、Unclassified 无猜测分类、外部链接 direct/search 标注、Esc 返回、窄屏单栏、Help 31 行映射。
- 截图 OCR 复核：列表页、详情头部、GO 模块渲染正常。
- 修复记录：InterPro 描述未纳入导航搜索（已补）；物种展示名下划线→空格并折叠双空格。

### 数据更新流程
更新 Example.txt 后重跑 `Rscript Script1-Parse-Annotation-Data-V1.R` 生成 data.js；若数据文件新增序列/坐标列，需同步扩展 R 脚本与前端模块（当前代码对缺失列自动显示空状态）。

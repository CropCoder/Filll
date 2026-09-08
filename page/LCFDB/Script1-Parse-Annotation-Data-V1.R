##############################################################################
# Script1-Parse-Annotation-Data-V1.R
#
# 功能简介：
#   解析真菌基因组功能注释结果文本文件（Example.txt，制表符分隔），
#   转换为前端检索网页可直接加载的 JavaScript 数据文件（data.js）。
#   输出数据以 window.FDB_DATA 全局变量形式挂载，
#   使得网页可通过 <script> 标签加载，支持 file:// 协议直接双击打开，
#   无需搭建任何 Web 服务器。
#
# 输入文件：
#   Example.txt    —— 制表符分隔的功能注释表（首行为列名，字段可含引号）
#
# 输出文件：
#   data.js        —— 网页数据文件（window.FDB_DATA = {...}）
#
# 作者：Jiwen Zhao (https://github.com/CropCoder)
##############################################################################

# ============================== 环境设置 ====================================
options(stringsAsFactors = FALSE)

# 获取脚本所在目录作为工作目录（兼容 RStudio 与命令行 Rscript 两种运行方式）
script_dir <- tryCatch(
  dirname(rstudioapi::getActiveDocumentContext()$path),
  error = function(e) {
    args <- commandArgs(trailingOnly = FALSE)
    f <- sub("^--file=", "", args[grep("^--file=", args)])
    if (length(f)) normalizePath(dirname(f)) else getwd()
  }
)
setwd(script_dir)

# ============================== 数据读取 ====================================
# read.table 的 quote 参数会自动处理字段内嵌双引号（如 InterPro_description 列）
dat <- read.table(
  "Example.txt",
  header = TRUE, sep = "\t", quote = "\"",
  comment.char = "", check.names = FALSE, fill = TRUE, na.strings = character()
)

cat("数据读取完成：", nrow(dat), "行 x", ncol(dat), "列\n")

# ============================== 辅助函数 ====================================
# 判断一个值是否为空占位符（-、空串、NA），用于后续列表字段拆分
is_empty_val <- function(x) {
  is.na(x) | trimws(x) == "" | x == "-"
}

# ============================== 数值类型修正 ================================
# 原始文本中的数值型字段统一转回数值，便于前端排序
for (col in c("Length_aa", "evalue", "score", "n_domains", "iprscan_hit")) {
  if (col %in% names(dat)) dat[[col]] <- as.numeric(dat[[col]])
}

# ============================== 前端展示字段预处理 ==========================
# 多值列表字段拆分为数组，方便前端以标签（tag）形式逐项展示

# eggNOG_OGs："28JW5@1|root,2QSAC@2759|Eukaryota,..." -> [{id,level}]
dat$ogs_array <- lapply(dat$eggNOG_OGs, function(v) {
  if (is_empty_val(v)) return(list())
  parts <- strsplit(v, ",")[[1]]
  lapply(parts, function(p) {
    if (!grepl("|", p, fixed = TRUE)) {
      kv <- c(id = trimws(p), level = "")
    } else {
      tmp <- strsplit(p, "|", fixed = TRUE)[[1]]
      kv <- c(id = tmp[1], level = tmp[2])
    }
    as.list(kv)   # 命名列表 -> JSON 对象 {id, level}
  })
})

# 拆分逗号分隔的多值列：GO 编号、InterPro 编号、结构域
split_list_col <- function(x) {
  x[is_empty_val(x)] <- ""
  unname(lapply(x, function(v) {
    if (v == "") character(0) else trimws(strsplit(v, ",", fixed = TRUE)[[1]])
  }))
}
# InterPro_description 列以分号分隔多个描述（单个描述内部可能含逗号）
split_semicolon_col <- function(x) {
  x[is_empty_val(x)] <- ""
  unname(lapply(x, function(v) {
    if (v == "") character(0) else trimws(strsplit(v, ";", fixed = TRUE)[[1]])
  }))
}
dat$go_array         <- split_list_col(dat$GOs_union)
dat$ipr_id_array     <- split_list_col(dat$InterPro_IDs)
dat$ipr_desc_array   <- split_semicolon_col(dat$InterPro_description)
dat$domain_array     <- split_list_col(dat$Domains)
dat$pfam_array       <- lapply(dat$PFAMs_eggnog, function(v) {
  if (is_empty_val(v)) character(0) else trimws(strsplit(v, ",", fixed = TRUE)[[1]])
})
dat$ko_array         <- lapply(dat$KEGG_ko, function(v) {
  if (is_empty_val(v)) character(0) else trimws(strsplit(v, ",", fixed = TRUE)[[1]])
})
dat$pathway_array    <- lapply(dat$KEGG_Pathway, function(v) {
  if (is_empty_val(v)) character(0) else trimws(strsplit(v, ",", fixed = TRUE)[[1]])
})
dat$module_array     <- lapply(dat$KEGG_Module, function(v) {
  if (is_empty_val(v)) character(0) else trimws(strsplit(v, ",", fixed = TRUE)[[1]])
})
dat$reaction_array   <- lapply(dat$KEGG_Reaction, function(v) {
  if (is_empty_val(v)) character(0) else trimws(strsplit(v, ",", fixed = TRUE)[[1]])
})
dat$rclass_array     <- lapply(dat$KEGG_rclass, function(v) {
  if (is_empty_val(v)) character(0) else trimws(strsplit(v, ",", fixed = TRUE)[[1]])
})
dat$brite_array      <- lapply(dat$BRITE, function(v) {
  if (is_empty_val(v)) character(0) else trimws(strsplit(v, ",", fixed = TRUE)[[1]])
})
dat$tc_array         <- lapply(dat$KEGG_TC, function(v) {
  if (is_empty_val(v)) character(0) else trimws(strsplit(v, ",", fixed = TRUE)[[1]])
})
dat$cazy_array       <- lapply(dat$CAZy, function(v) {
  if (is_empty_val(v)) character(0) else trimws(strsplit(v, ",", fixed = TRUE)[[1]])
})
dat$biggrxn_array    <- lapply(dat$BiGG_Reaction, function(v) {
  if (is_empty_val(v)) character(0) else trimws(strsplit(v, ",", fixed = TRUE)[[1]])
})
dat$cog_desc_array   <- lapply(dat$COG_description, function(v) {
  if (is_empty_val(v)) character(0) else trimws(strsplit(v, ";", fixed = TRUE)[[1]])
})

# ============================== 结构域绘图数据 ==============================
# 按 Pfam 数据库 28 个常见家族的代表色对结构域着色，
# 其余结构域使用统一灰色（参考 Pfam 官网的家族配色）
pfam_palette <- c(
  "PF00172"="#2dcf00", "PF00107"="#00c48f", "PF00067"="#f0e442", "PF00106"="#0072b2",
  "PF07690"="#ffa200", "PF00083"="#f71a93", "PF01425"="#b7008c", "PF01370"="#05642b",
  "PF01794"="#ee99b3", "PF00892"="#8a5fd0", "PF00226"="#b8d4a5", "PF00005"="#56b4e9",
  "PF00069"="#ff7b6f", "PF00001"="#a1a1a1", "PF00069"="#ff7b6f", "PF07714"="#b32a34",
  "PF00135"="#febbc1", "PF00271"="#4c94c4", "PF00171"="#cca0db", "PF00464"="#fdb863",
  "PF01041"="#b69b81", "PF00248"="#f4a167", "PF00040"="#9bc4f7", "PF00501"="#d55e00",
  "PF00027"="#a6c98f", "PF00514"="#ffd730", "PF00330"="#e98a75", "PF00005"="#56b4e9"
)
assign_pfam_color <- function(name) {
  m <- regmatches(name, regexpr("PF\\d{5}", name))
  if (length(m) && m %in% names(pfam_palette)) pfam_palette[[m]] else "#9e9e9e"
}

# 结构域字符串："Gene3D:G3DSA:1.20.5.340; PANTHER:PTHR31904; Pfam:PF04082"
# 拆分后解析为 {type, id, color} 三元组
dat$domains_parsed <- lapply(dat$Domains, function(v) {
  if (is_empty_val(v)) return(list())
  parts <- strsplit(v, ";")[[1]]
  lapply(parts, function(p) {
    p <- trimws(p)
    if (grepl(":", p, fixed = TRUE)) {
      kv  <- strsplit(p, ":", fixed = TRUE)[[1]]
      typ <- kv[1]
      id  <- paste(kv[-1], collapse = ":")
    } else {
      typ <- ""
      id  <- p
    }
    col <- if (typ == "Pfam") assign_pfam_color(id) else "#9e9e9e"
    as.list(c(type = typ, id = id, color = col))  # 命名列表 -> JSON 对象 {type,id,color}
  })
})

# ============================== 物种显示名 ==================================
# 数据文件内部物种名："Fusarium_aberrans__CBS_119866"
# 转换为网页展示名："Fusarium aberrans CBS 119866"
dat$species_display <- gsub("__", " ", dat$Species)

# 组装行级记录：仅保留前端渲染所需的字段，减少 data.js 体积
# 列表列用 I() 包装（AsIs 类），to_json 遇到 AsIs 强制按数组序列化，
# 避免 data.frame 单值单元格提取时被压成标量导致 JSON 类型不一致
keep_cols <- c(
  "GeneID", "Species", "Length_aa", "seed_ortholog", "evalue", "score",
  "max_annot_lvl", "COG_category", "Description", "Preferred_name", "EC",
  "KEGG_TC", "CAZy", "COG_description", "n_domains", "iprscan_hit",
  "GOs_eggnog", "GOs_interproscan",
  "species_display", "ogs_array", "go_array", "ipr_id_array",
  "ipr_desc_array", "domain_array", "pfam_array", "ko_array",
  "pathway_array", "module_array", "reaction_array", "rclass_array",
  "brite_array", "tc_array", "cazy_array", "biggrxn_array",
  "cog_desc_array", "domains_parsed"
)
list_cols <- c(
  "ogs_array", "go_array", "ipr_id_array", "ipr_desc_array",
  "domain_array", "pfam_array", "ko_array", "pathway_array",
  "module_array", "reaction_array", "rclass_array", "brite_array",
  "tc_array", "cazy_array", "biggrxn_array", "cog_desc_array",
  "domains_parsed"
)
rows <- lapply(seq_len(nrow(dat)), function(i) {
  row <- lapply(keep_cols, function(col) {
    v <- dat[[col]][[i]]
    if (col %in% list_cols) I(v) else v
  })
  names(row) <- keep_cols
  row
})

# ============================== 全局统计信息 ================================
species_list <- sort(unique(dat$Species))

# 汇总各物种的基因数量
species_counts <- as.data.frame(table(dat$Species), stringsAsFactors = FALSE)
names(species_counts) <- c("species", "genes")

# ============================== JSON 输出 ==================================
# 转义字符串，生成合法的 JSON 字符串字面量
json_escape_str <- function(s) {
  if (is.na(s)) return("null")
  s <- gsub("\\\\", "\\\\\\\\", s)          # 反斜杠 -> \\
  s <- gsub('"', '\\"', s)                  # 双引号 -> \"
  s <- gsub("\n", "\\n", s, fixed = TRUE)   # 换行 -> \n
  s <- gsub("\r", "\\r", s, fixed = TRUE)   # 回车 -> \r
  s <- gsub("\t", "\\t", s, fixed = TRUE)   # 制表符 -> \t
  paste0('"', s, '"')
}

# 将 R 对象序列化为 JSON 字符串（递归实现）
# 命名列表 -> JSON 对象 {key:value}；普通列表 -> JSON 数组 [item]
# AsIs 类（I() 包装）强制按数组序列化，保证单元素列表列也输出为 [x] 而非 x
to_json <- function(x) {
  if (is.null(x)) return("null")
  if (inherits(x, "AsIs")) {
    xx <- unclass(x)
    items <- vapply(xx, to_json, character(1))
    return(paste0("[", paste(items, collapse = ","), "]"))
  }
  if (is.list(x)) {
    nms <- names(x)
    if (!is.null(nms)) {
      items <- vapply(seq_along(x), function(i) {
        paste0(json_escape_str(nms[i]), ":", to_json(x[[i]]))
      }, character(1))
      return(paste0("{", paste(items, collapse = ","), "}"))
    }
    items <- vapply(x, to_json, character(1))
    return(paste0("[", paste(items, collapse = ","), "]"))
  }
  if (is.atomic(x)) {
    if (length(x) == 0) return("[]")
    if (length(x) == 1 && (is.character(x) || is.factor(x))) {
      return(json_escape_str(as.character(x)))
    }
    if (length(x) == 1 && is.logical(x)) {
      return(if (x) "true" else "false")
    }
    if (length(x) == 1 && is.numeric(x)) {
      if (is.na(x)) return("null")
      if (is.infinite(x)) return("null")
      return(format(x, scientific = 14, trim = TRUE))
    }
    # 向量：按元素类型分别序列化
    if (is.character(x) || is.factor(x)) {
      items <- vapply(as.character(x), json_escape_str, character(1))
    } else {
      items <- vapply(x, to_json, character(1))
    }
    return(paste0("[", paste(items, collapse = ","), "]"))
  }
  stop("不支持的对象类型")
}

json_rows    <- to_json(rows)
json_species <- to_json(as.list(species_list))
json_counts  <- to_json(as.list(species_counts$genes))
json_names   <- to_json(as.list(species_counts$species))

# 写入 data.js：window.FDB_DATA 全局变量，供网页 <script> 标签加载
out_lines <- c(
  "// FungalGenDB 菌株检索功能数据文件（由 Script1-Parse-Annotation-Data-V1.R 自动生成）",
  "// 请勿手动编辑本文件，数据更新后重新运行 R 脚本即可重新生成",
  paste0("window.FDB_DATA = {"),
  paste0("  version: ", json_escape_str(format(Sys.Date(), "%Y-%m-%d")), ","),
  paste0("  generatedAt: ", json_escape_str(format(Sys.time(), "%Y-%m-%d %H:%M:%S")), ","),
  paste0("  sourceFile: ", json_escape_str("Example.txt"), ","),
  paste0("  totalGenes: ", nrow(dat), ","),
  paste0("  species: ", json_names, ","),
  paste0("  speciesGeneCounts: ", json_counts, ","),
  paste0("  rows: ", json_rows),
  "};"
)
writeLines(out_lines, "data.js", useBytes = TRUE)

cat("输出文件 data.js 已生成：", nrow(dat), "条基因记录，", length(species_list), "个物种\n")
cat("文件大小：", format(file.size("data.js"), big.mark = ","), "字节\n")

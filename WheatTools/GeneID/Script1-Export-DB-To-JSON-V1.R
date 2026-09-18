# Script1-Export-DB-To-JSON-V1.R
# 功能说明：
#   将 GeneConvertToCS.db（SQLite）中 gene_convert 表的基因 ID 对应关系
#   导出为静态网站所需的 JSON 映射文件。按"源版本"拆分文件，前端按需加载，
#   从而在无后端、纯静态环境下实现基因 ID 批量转换。
# 作者：Jiwen Zhao (https://github.com/CropCoder)

library(DBI)
library(RSQLite)
library(jsonlite)

# ---- 1. 读取数据库 ----
dbfile <- "GeneConvertToCS.db"
con <- dbConnect(RSQLite::SQLite(), dbname = dbfile)
df <- dbGetQuery(con, "SELECT IAAS, CS3G, CAU, CS2G, CS1G FROM gene_convert")
dbDisconnect(con)

versions <- colnames(df)  # c("IAAS","CS3G","CAU","CS2G","CS1G")

# ---- 2. 输出目录 ----
out_dir <- "data"
dir.create(out_dir, showWarnings = FALSE, recursive = TRUE)

# ---- 3. 按源版本逐个导出映射文件 ----
for (src in versions) {
  targets <- setdiff(versions, src)  # 目标版本列（保持原相对顺序）

  # 仅保留源 ID 非空的行，并去重（保留首次出现，与原应用"取第 1 行"一致）
  keep <- !is.na(df[[src]]) & df[[src]] != ""
  sub <- df[keep, , drop = FALSE]
  dup <- duplicated(sub[[src]])
  sub <- sub[!dup, , drop = FALSE]

  keys <- sub[[src]]

  # 目标列矩阵（NA 统一转空字符串）
  mat <- do.call(cbind, lapply(targets, function(t) {
    x <- sub[[t]]
    x[is.na(x)] <- ""
    x
  }))
  colnames(mat) <- NULL

  # 拆分为命名列表：键 = 源 ID，值 = 目标版本值数组（顺序同 targets）
  rows <- asplit(mat, 1)
  names(rows) <- keys

  outfile <- file.path(out_dir, paste0("map_", src, ".json"))
  write_json(rows, outfile, pretty = FALSE, na = "null")

  cat(sprintf("%-5s : %d 条记录（去重前 %d） -> %s\n",
              src, length(rows), sum(keep), outfile))
}

library(shiny)
library(shinyjs)
library(bslib)
library(DBI)
library(RSQLite)
library(DT)
library(shinyalert)

# 先读取表的列名，作为版本选项
# 这里简化起见，先加载数据库列名函数：
get_version_cols <- function(dbfile = "GeneConvertToCS.db"){
  con <- dbConnect(RSQLite::SQLite(), dbname = dbfile)
  df <- dbGetQuery(con, "SELECT * FROM gene_convert LIMIT 1")
  dbDisconnect(con)
  colnames(df)
}

version_choices <- get_version_cols()

source("ui.R")
source("server.R")

shinyApp(
  ui = tagList(
    useShinyjs(),
    ui
  ),
  server = server
)

server <- function(input, output, session) {
  dbfile <- "GeneConvertToCS.db"

  max_line <- reactiveVal(100)

  observe({
        query <- parseQueryString(session$clientData$url_search)

        if (!is.null(query$key)) {
            if (query$key == "wangzhen") {
                shinyalert::shinyalert("温馨提示", 
      "王震博士，您已经授权开启高级功能，每次最多可以转换10000个基因", 
      type = "success",
      size="m"
      )
                max_line(10000)
            }
        }
    })

  res_df <- reactiveVal(NULL)

  observeEvent(input$run_test,{
    updateTextAreaInput(session, "input_genes", value = "CSIAAS1AG0000200LC CSIAAS1AG0006400HC")
  })
  
  observeEvent(input$run_convert, {
    req(input$input_genes, input$from_version, input$to_version)
    
    shinyjs::disable("run_convert")
    
    # 处理输入
    gene_vector <- strsplit(input$input_genes, "\\s+")[[1]]
    gene_vector <- gene_vector[gene_vector != ""]
    
    # 建立空结果数据框
    outdf <- data.frame(
      QueryGeneID = gene_vector,
      MatchedSourceID = NA_character_,
      ConvertedID = NA_character_,
      stringsAsFactors = FALSE
    )
    
    con <- dbConnect(RSQLite::SQLite(), dbname = dbfile)
    
    n <- length(gene_vector)

    if (n > max_line()){
      shinyalert::shinyalert("提示", 
      "由于服务器计算资源有限，目前免费支持小规模计算使用，请分批转换或者联系开发者 admin@filll.cn", 
      type = "warning",
      size="l"
      )
      return()
    }
    
    withProgress(message = "正在转换中，请稍候...", value = 0, {
      for(i in seq_len(n)) {
        # 单个ID查询
        query <- sprintf("SELECT * FROM gene_convert WHERE %s = ?", input$from_version)
        df_match <- dbGetQuery(con, query, params = list(gene_vector[i]))
        
        if(nrow(df_match) >= 1){
          # 如果匹配多行，默认取第1行（根据业务可以调整）
          outdf$MatchedSourceID[i] <- df_match[[input$from_version]][1]
          outdf$ConvertedID[i] <- df_match[[input$to_version]][1]
        }
        # 更新进度条
        Sys.sleep(0.01)
        incProgress(1/n, detail = paste0(i," / ", n))
      }
    })
    
    dbDisconnect(con)
    res_df(outdf)
    
    shinyjs::enable("run_convert")
  })
  
  output$result_table <- renderDT({
    req(res_df())
    datatable(res_df(), rownames = FALSE, options = list(pageLength = 10))
  })
  
  output$download_res <- downloadHandler(
    filename = function() {
      paste0("GeneConvertToCS_Result_", Sys.Date(), ".csv")
    },
    content = function(file) {
      df <- res_df()
      req(df)
      write.csv(df, file, row.names = FALSE, fileEncoding = "UTF-8")
    }
  )
}

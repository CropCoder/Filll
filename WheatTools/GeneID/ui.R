ui <- page_fixed(
  theme = bs_theme(bootswatch = "flatly"), # bslib主题
  
  tags$head(tags$title("GeneConvertToCS Tool - FIlll"),
    tags$link(rel = "shortcut icon", href = "https://www.filll.cn/upload/logo.png"),
    # 添加 51.la 统计代码
    tags$script(charset = "UTF-8", id = "LA_COLLECT", src = "//sdk.51.la/js-sdk-pro.min.js"),
    tags$script("LA.init({id:\"KvVBIPwOZivo9Ibo\",ck:\"KvVBIPwOZivo9Ibo\"})")
  ),
  br(),
  br(),
  fluidRow(
    column(
      width = 8,
      h1("📚 Gene ID Convert")
    ),
    column(
      width = 4,
      # 这里示例logo用网址替代，也可以用本地文件
      img(src = "https://www.filll.cn/upload/logo.png", height = "60px", style="float: right;")
    )
  ),
  br(),
  
  card(
    p("使用方法：首先使用Excel等工具将待转换的基因ID放到一列，然后复制粘贴到下方，选择原始基因ID版本和目标基因ID版本，点击开始转换按钮，即可得到转换结果。")
  ),
  
  # 批量转换
  fluidRow(
    column(
      width = 3,
      textAreaInput(
        inputId = "input_genes",
        label = "",
        rows = 9,
        placeholder = "请输入要转换的基因ID（每行一个）\n例如:\nCSIAAS1AG0000200LC\nCSIAAS1AG0000400HC\nTraesCS7D03G0267400\nTraesCSC1B01G013200\nTraesCSC1A01G002600LC\nTraesCSC1A01G000500LC"),
        actionButton("run_test", "使用示例数据")
    ),
    column(
      width = 3,
      br(),
      card(
        selectInput(
          inputId = "from_version",
          label = "选择原始基因ID版本",
          choices = version_choices,
          selected = version_choices[1]
        ),
        selectInput(
          inputId = "to_version",
          label = "选择目标基因ID版本",
          choices = version_choices,
          selected = version_choices[2]
        ),
        actionButton("run_convert", "开始转换", class = "btn-primary"),
        downloadButton("download_res", "下载结果表格")
      )
    ),
    column(
      width = 6,
      br(),
      card(
        card_header("使用帮助"),
        p("工具简介：小麦中国春参考基因组目前已经更新了多个版本，随着T2T等高质量
          基因组的出现，促进了基因功能与机制研究，但是不同版本的基因组基因 ID 转换仍比较麻烦,
          本工具可以在线进行基因ID的批量转换，目前支持中国农业大学 CAU 版本、北京大学现代农业研究院 IAAS 版本。示例：
          CSIAAS1AG0000200LC、CSIAAS1AG0006400HC"),
        p("工具网址：https://filll.cn/WheatTools/GeneID"),
        p("开发团队：生信分析笔记 "),
        p("联系邮箱：admin@filll.cn")
      )
    )
  ),
  
  hr(),
  
  fluidRow(
    column(
      width = 12,
      DTOutput("result_table")
    )
  ),
  br(),
  br(),

  img(src = "info.png", width = "100%", style="float: right;")


)

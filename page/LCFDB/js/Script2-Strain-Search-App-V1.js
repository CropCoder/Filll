/* ============================================================================
 * Script2-Strain-Search-App-V1.js (v2)
 *
 * 功能简介：
 *   FungalGenDB 基因详情页前端逻辑。
 *   数据来自 <script src="data.js"> 挂载的 window.FDB_DATA（由
 *   Script1-Parse-Annotation-Data-V1.R 生成），支持 file:// 直接打开。
 *   核心功能：导航搜索下拉 / 检索过滤 / 分页 / 基因详情页（9 个模块，
 *   侧栏目录滚动联动）/ 结构域 SVG 轨道（仅有坐标时）/ 序列与基因结构
 *   空状态 / TSV 导出 / Help 字段映射说明。
 *
 * 数据原则：
 *   - 使用 "Species + :: + GeneID" 复合键标识基因（不同物种可能存在相同基因 ID）
 *   - 数据表缺失的注释、序列、结构域坐标、基因结构一律显示空状态，绝不编造
 *   - E-value / Score 保留原始精度，数值 0 是有效值
 *
 * 作者：Jiwen Zhao (https://github.com/CropCoder)
 * ========================================================================== */

(function () {
  "use strict";

  /* ============================ 配置 ============================ */

  // 数据库名称与简介（顶部导航显示，可按需修改）
  var CONFIG = {
    brandName: "FungalGenDB",
    brandTag: "Fungal Genomics & Functional Annotation"
  };

  var PAGE_SIZE = 20;

  // COG 功能类别编号 -> 名称
  var COG_LABELS = {
    J: "Translation, ribosomal structure and biogenesis",
    A: "RNA processing and modification",
    K: "Transcription",
    L: "Replication, recombination and repair",
    B: "Chromatin structure and dynamics",
    D: "Cell cycle control, cell division, chromosome partitioning",
    Y: "Nuclear structure",
    V: "Defense mechanisms",
    T: "Signal transduction mechanisms",
    M: "Cell wall/membrane/envelope biogenesis",
    N: "Cell motility",
    Z: "Cytoskeleton",
    W: "Extracellular structures",
    U: "Intracellular trafficking, secretion, and vesicular transport",
    O: "Posttranslational modification, protein turnover, chaperones",
    X: "Mobilome: prophages, transposons",
    C: "Energy production and conversion",
    G: "Carbohydrate transport and metabolism",
    E: "Amino acid transport and metabolism",
    F: "Nucleotide transport and metabolism",
    H: "Coenzyme transport and metabolism",
    I: "Lipid transport and metabolism",
    P: "Inorganic ion transport and metabolism",
    Q: "Secondary metabolites biosynthesis, transport and catabolism",
    R: "General function prediction only",
    S: "Function unknown"
  };

  // 外部数据库链接模板（{id} 为精确 accession，{q} 为搜索关键词）
  var LINKS = {
    ncbiGene: "https://www.ncbi.nlm.nih.gov/gene/?term={q}",
    uniprot: "https://www.uniprot.org/uniprot/?query={q}",
    kegg: "https://www.kegg.jp/entry/{id}",
    keggPathway: "https://www.kegg.jp/pathway/{id}",
    keggModule: "https://www.kegg.jp/module/{id}",
    keggReaction: "https://www.kegg.jp/entry/{id}",
    eggnog: "https://eggnog6.embl.de/app/emapper?query={q}",
    interpro: "https://www.ebi.ac.uk/interpro/entry/{id}",
    amigo: "https://amigo.geneontology.org/amigo/term/{id}"
  };

  // 结构域数据库来源 -> 固定轨道颜色
  var DB_COLORS = {
    "Pfam": "#2e7db2", "Gene3D": "#e0973a", "PANTHER": "#7d57b0",
    "SMART": "#5a9d55", "SUPERFAMILY": "#c75b6d", "PRINTS": "#4e9aa6",
    "ProSitePatterns": "#b07a3e", "ProSiteProfiles": "#8a6fae",
    "Coils": "#6e7f8d", "Other": "#99a3ad"
  };
  function dbColor(type) { return DB_COLORS[type] || DB_COLORS.Other; }

  // 页面模块 -> 空状态提示（数据缺失时展示，绝不编造）
  var EMPTY_MSGS = {
    "gene-model": {
      title: "Gene structure is not available",
      sub: "The current data file does not contain chromosome positions, strand " +
        "information or exon / CDS coordinates. Gene structure visualization is disabled."
    },
    "sequences": {
      title: "No sequence data in the current data file",
      sub: "Example.txt provides annotation-level fields only. Attach FASTA data " +
        "(protein / CDS sequences) to enable sequence display, copy and download."
    },
    "domains": {
      title: "Domain coordinates are not available",
      sub: "The data file contains domain annotations (database and accession) but no " +
        "start / end positions on the protein sequence. The domain track cannot be " +
        "drawn without real coordinates."
    }
  };

  /* ============================ 工具函数 ============================ */

  function esc(s) {
    if (s === null || s === undefined) return "";
    return String(s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  // 数字 E-value 的科学计数法显示；null/undefined -> "-"；0 是有效值显示 0.0
  function fmtEvalue(v) {
    if (v === null || v === undefined || isNaN(v)) return "-";
    if (v === 0) return "0.0";
    return v.toExponential(2);
  }

  function fmtNum(v) {
    if (v === null || v === undefined || isNaN(v)) return "-";
    return String(v);
  }

  function splitCsv(v) {
    if (!v) return [];
    return String(v).split(",").map(function (s) { return s.trim(); }).filter(Boolean);
  }

  // 内部物种标识 "Genus_species__strain" -> 展示名 "Genus species strain"
  function speciesDisplay(sp) {
    return String(sp || "").replace(/_/g, " ").replace(/\s+/g, " ").trim();
  }

  function geneKeyOf(r) { return r.Species + "::" + r.GeneID; }

  function downloadText(name, text) {
    var blob = new Blob(["﻿" + text], { type: "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function toast(msg) {
    var el = document.getElementById("toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.classList.remove("show"); }, 2200);
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    return ok ? Promise.resolve() : Promise.reject(new Error("copy failed"));
  }

  // 关键词高亮（导航搜索下拉的匹配字段预览）
  function highlight(s, term) {
    var es = esc(s);
    if (!term) return es;
    var i = es.toLowerCase().indexOf(term.toLowerCase());
    if (i < 0) return es;
    return es.slice(0, i) + "<b>" + es.slice(i, i + term.length) + "</b>" + es.slice(i + term.length);
  }

  /* ============================ 数据加载与索引 ============================ */

  var DATA = window.FDB_DATA || { rows: [], species: [], speciesGeneCounts: [] };
  var rows = DATA.rows || [];

  // 扁平化检索索引（全小写，供关键词匹配）
  var FLAT = rows.map(function (r) {
    return {
      geneid: String(r.GeneID || "").toLowerCase(),
      species: String(r.Species || "").toLowerCase(),
      desc: String(r.Description || "").toLowerCase(),
      pref: String(r.Preferred_name || "").toLowerCase(),
      seed: String(r.seed_ortholog || "").toLowerCase(),
      go: (r.go_array || []).join(" ").toLowerCase(),
      ipr: (r.ipr_id_array || []).join(" ") + " " + (r.ipr_desc_array || []).join(" ").toLowerCase(),
      ko: (r.ko_array || []).join(" ").toLowerCase(),
      pwy: (r.pathway_array || []).join(" ").toLowerCase(),
      mod: (r.module_array || []).join(" ").toLowerCase(),
      pfam: (r.pfam_array || []).join(" ").toLowerCase(),
      dom: (r.domain_array || []).join(" ").toLowerCase(),
      ec: String(r.EC || "").toLowerCase()
    };
  });

  /* ============================ 状态 ============================ */

  var state = {
    q: "", species: "", cog: "", pfam: "", preset: "",
    lenMin: "", lenMax: "", evalue: "", scoreMin: "",
    sort: "geneid", page: 1,
    view: "list",                // list | detail
    detailKey: null,
    seqTab: "protein",
    seqExpanded: false,
    goNames: {}, goDefs: {},     // GO 术语名称/定义缓存（联网富集，仅用于悬停展示）
    orthoSort: { col: "evalue", dir: 1 }
  };

  /* ============================ 元素引用 ============================ */

  function $(id) { return document.getElementById(id); }

  var el = {
    brandName: $("brand-name"), brandTag: $("brand-tag"),
    navQ: $("nav-q"), searchDrop: $("search-drop"),
    crumb: $("crumb"), crumbbar: $("crumbbar"),
    viewList: $("view-list"), viewDetail: $("view-detail"),
    toc: $("toc"), detailMain: $("detail-main"),
    q: $("q"), fSpecies: $("f-species"), fCog: $("f-cog"),
    fPfam: $("f-pfam"), fPreset: $("f-preset"),
    nLenMin: $("n-len-min"), nLenMax: $("n-len-max"),
    nEvalue: $("n-evalue"), nScoreMin: $("n-score-min"),
    btnSearch: $("btn-search"), btnReset: $("btn-reset"),
    btnExport: $("btn-export"), btnCopy: $("btn-copy"),
    navDownload: $("nav-download"), navHelp: $("nav-help"),
    ltN: $("lt-n"), sort: $("sort"),
    resultBody: $("result-body"), emptyState: $("empty-state"),
    pager: $("pager"),
    helpModal: $("help-modal"), helpBody: $("help-body"), helpClose: $("help-close")
  };

  /* ============================ 初始化选项 ============================ */

  DATA.species.forEach(function (sp) {
    var opt = document.createElement("option");
    opt.value = sp;
    opt.textContent = speciesDisplay(sp);
    el.fSpecies.appendChild(opt);
  });

  rows.reduce(function (acc, r) {
    String(r.COG_category || "").split("").forEach(function (c) {
      if (c && acc.indexOf(c) < 0) acc.push(c);
    });
    return acc;
  }, []).sort().forEach(function (c) {
    var opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c + " · " + (COG_LABELS[c] || "");
    el.fCog.appendChild(opt);
  });

  rows.reduce(function (acc, r) {
    (r.pfam_array || []).forEach(function (p) {
      if (p && acc.indexOf(p) < 0) acc.push(p);
    });
    return acc;
  }, []).sort().forEach(function (p) {
    var opt = document.createElement("option");
    opt.value = p;
    opt.textContent = p;
    el.fPfam.appendChild(opt);
  });

  /* ============================ 检索过滤与结果表 ============================ */

  function currentResults() {
    var terms = state.q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    var lenMin = state.lenMin === "" ? null : parseFloat(state.lenMin);
    var lenMax = state.lenMax === "" ? null : parseFloat(state.lenMax);
    var evalueT = state.evalue === "" ? null : parseFloat(state.evalue);
    var scoreMin = state.scoreMin === "" ? null : parseFloat(state.scoreMin);

    var out = [];
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i], f = FLAT[i];
      if (terms.length && !terms.every(function (t) {
        return f.geneid.indexOf(t) >= 0 || f.species.indexOf(t) >= 0 ||
          f.desc.indexOf(t) >= 0 || f.pref.indexOf(t) >= 0 ||
          f.seed.indexOf(t) >= 0 || f.go.indexOf(t) >= 0 ||
          f.ipr.indexOf(t) >= 0 || f.ko.indexOf(t) >= 0 ||
          f.pwy.indexOf(t) >= 0 || f.mod.indexOf(t) >= 0 ||
          f.pfam.indexOf(t) >= 0 || f.dom.indexOf(t) >= 0 ||
          f.ec.indexOf(t) >= 0;
      })) continue;
      if (state.species && r.Species !== state.species) continue;
      if (state.cog && String(r.COG_category || "").indexOf(state.cog) < 0) continue;
      if (state.pfam && (r.pfam_array || []).indexOf(state.pfam) < 0) continue;
      if (lenMin !== null && !(r.Length_aa >= lenMin)) continue;
      if (lenMax !== null && !(r.Length_aa <= lenMax)) continue;
      if (evalueT !== null && !(r.evalue !== null && !isNaN(r.evalue) && r.evalue <= evalueT)) continue;
      if (scoreMin !== null && !(r.score !== null && !isNaN(r.score) && r.score >= scoreMin)) continue;
      if (state.preset) {
        var ok = false;
        switch (state.preset) {
          case "ko": ok = (r.ko_array || []).length > 0; break;
          case "go": ok = (r.go_array || []).length > 0; break;
          case "pfam": ok = (r.pfam_array || []).length > 0; break;
          case "cazy": ok = (r.cazy_array || []).length > 0; break;
          case "ec": ok = !!r.EC && r.EC !== "-"; break;
          case "pathway": ok = (r.pathway_array || []).length > 0; break;
        }
        if (!ok) continue;
      }
      out.push({ row: r, flat: f });
    }

    var s = state.sort;
    out.sort(function (a, b) {
      var x, y;
      switch (s) {
        case "len-desc": return (b.row.Length_aa || 0) - (a.row.Length_aa || 0);
        case "len-asc": return (a.row.Length_aa || 0) - (b.row.Length_aa || 0);
        case "score-desc": return (b.row.score || 0) - (a.row.score || 0);
        case "evalue-asc":
          x = (a.row.evalue === null || isNaN(a.row.evalue)) ? Infinity : a.row.evalue;
          y = (b.row.evalue === null || isNaN(b.row.evalue)) ? Infinity : b.row.evalue;
          return x - y;
        case "go-desc": return (b.row.go_array || []).length - (a.row.go_array || []).length;
        default:
          return String(a.row.GeneID).localeCompare(String(b.row.GeneID), undefined, { numeric: true });
      }
    });
    return out;
  }

  function chips(arr, cls, max) {
    if (!arr || !arr.length) return '<span class="chip more">–</span>';
    max = max || 4;
    var shown = arr.slice(0, max);
    var html = shown.map(function (v) {
      return '<span class="chip ' + cls + '">' + esc(v) + "</span>";
    }).join("");
    if (arr.length > shown.length) {
      html += '<span class="chip more">+' + (arr.length - shown.length) + "</span>";
    }
    return html;
  }

  // GO 徽标：仅有未分类编号时用灰色徽标显示总数，不猜测分类
  function goChipStr(row) {
    var n = (row.go_array || []).length;
    if (!n) return "";
    return '<span class="go-dot U" title="GO annotations (unclassified): ' + n + '">' + n + "</span>";
  }

  function renderTable() {
    var results = currentResults();
    var total = results.length;
    var pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    if (state.page > pages) state.page = pages;
    var start = (state.page - 1) * PAGE_SIZE;
    var pageRows = results.slice(start, start + PAGE_SIZE);

    el.ltN.textContent = total + " records";
    if (!total) {
      el.resultBody.innerHTML = "";
      el.emptyState.classList.remove("hidden");
      el.pager.innerHTML = "";
      return;
    }
    el.emptyState.classList.add("hidden");

    el.resultBody.innerHTML = pageRows.map(function (it) {
      var r = it.row;
      var key = geneKeyOf(r);
      return "<tr>" +
        '<td class="c-gene"><a class="gene-link" data-key="' + esc(key) + '">' + esc(r.GeneID) + "</a>" +
        '<div class="gene-species">' + esc(speciesDisplay(r.Species)) + "</div></td>" +
        '<td class="c-species">' + esc(speciesDisplay(r.Species)) + "</td>" +
        '<td class="c-len">' + fmtNum(r.Length_aa) + " aa</td>" +
        '<td class="c-desc">' + esc(r.Description || "–") +
          (r.EC && r.EC !== "-" ? ' <span class="chip">EC:' + esc(r.EC) + "</span>" : "") +
        "</td>" +
        '<td class="c-go">' + (goChipStr(r) || '<span class="chip more">–</span>') + "</td>" +
        '<td class="c-ko">' + chips(r.ko_array, "ko") + "</td>" +
        '<td class="c-pwy">' + chips(r.pathway_array, "pwy") + "</td>" +
        '<td class="c-ipr">' + chips(r.ipr_id_array, "ipr") + "</td>" +
        '<td class="c-dom">' + chips((r.domains_parsed || []).map(function (d) { return d.id; }), "dom") + "</td>" +
      "</tr>";
    }).join("");

    Array.prototype.forEach.call(el.resultBody.querySelectorAll(".gene-link"), function (a) {
      a.addEventListener("click", function () { openDetail(a.dataset.key); });
    });

    renderPager(total, pages);
  }

  function renderPager(total, pages) {
    var html = "";
    var p = state.page;
    var win = [];
    var from = Math.max(1, p - 2), to = Math.min(pages, p + 2);
    for (var i = from; i <= to; i++) win.push(i);
    if (win[0] > 1) win.unshift(1, "...");
    if (win[win.length - 1] < pages) win.push("...", pages);

    html += '<button type="button" data-pg="prev"' + (p <= 1 ? " disabled" : "") + ">‹</button>";
    win.forEach(function (pg) {
      if (pg === "...") html += '<span class="pg-info">…</span>';
      else {
        html += '<button type="button" data-pg="' + pg + '"' +
          (pg === p ? ' class="active"' : "") + ">" + pg + "</button>";
      }
    });
    html += '<button type="button" data-pg="next"' + (p >= pages ? " disabled" : "") + ">›</button>";
    html += '<span class="pg-info">' + pages + " pages / " + total + " records</span>";
    el.pager.innerHTML = html;

    Array.prototype.forEach.call(el.pager.querySelectorAll("button"), function (b) {
      b.addEventListener("click", function () {
        var v = b.dataset.pg;
        if (v === "prev") state.page = Math.max(1, p - 1);
        else if (v === "next") state.page = Math.min(pages, p + 1);
        else state.page = parseInt(v, 10);
        renderTable();
        window.scrollTo({ top: el.pager.offsetTop - 140, behavior: "smooth" });
      });
    });
  }

  function doSearch() {
    state.q = el.q.value;
    state.species = el.fSpecies.value;
    state.cog = el.fCog.value;
    state.pfam = el.fPfam.value;
    state.preset = el.fPreset.value;
    state.lenMin = el.nLenMin.value;
    state.lenMax = el.nLenMax.value;
    state.evalue = el.nEvalue.value;
    state.scoreMin = el.nScoreMin.value;
    state.page = 1;
    if (state.view === "detail") showList();
    renderTable();
  }

  function resetAll() {
    [el.q, el.navQ, el.nLenMin, el.nLenMax, el.nScoreMin].forEach(function (i) { i.value = ""; });
    el.fSpecies.value = "";
    el.fCog.value = "";
    el.fPfam.value = "";
    el.fPreset.value = "";
    el.nEvalue.value = "";
    el.sort.value = "geneid";
    state = Object.assign(state, {
      q: "", species: "", cog: "", pfam: "", preset: "",
      lenMin: "", lenMax: "", evalue: "", scoreMin: "",
      sort: "geneid", page: 1
    });
    showList();
    renderTable();
    toast("Filters reset");
  }

  /* ============================ 视图切换与面包屑 ============================ */

  function showList() {
    state.view = "list";
    state.detailKey = null;
    el.viewDetail.classList.add("hidden");
    el.viewList.classList.remove("hidden");
    renderCrumb();
    window.scrollTo({ top: 0 });
  }

  function renderCrumb() {
    var h = '<a href="#results" data-crumb="home">Home</a><span class="sep">›</span>';
    if (state.view === "detail" && state.detailKey) {
      var r = findRowByKey(state.detailKey);
      if (r) {
        h += '<a href="#results" data-crumb="species">Species</a><span class="sep">›</span>';
        h += '<a href="#results" data-crumb="sp" data-sp="' + esc(r.Species) + '">' +
          esc(speciesDisplay(r.Species)) + '</a><span class="sep">›</span>';
        h += "<span>Gene</span><span class=\"sep\">›</span>";
        h += '<span class="c-cur c-mono">' + esc(r.GeneID) + "</span>";
      }
    } else {
      h += '<span class="c-cur">Species</span>';
    }
    el.crumb.innerHTML = h;
    Array.prototype.forEach.call(el.crumb.querySelectorAll("a"), function (a) {
      a.addEventListener("click", function (ev) {
        ev.preventDefault();
        if (a.dataset.crumb === "home") {
          resetAll();
        } else if (a.dataset.crumb === "species" || a.dataset.crumb === "sp") {
          el.fSpecies.value = a.dataset.sp || "";
          doSearch();
        }
      });
    });
  }

  function findRowByKey(key) {
    for (var i = 0; i < rows.length; i++) {
      if (geneKeyOf(rows[i]) === key) return rows[i];
    }
    return null;
  }

  function openDetail(key) {
    var r = findRowByKey(key);
    if (!r) { toast("Gene record not found"); return; }
    state.view = "detail";
    state.detailKey = key;
    state.seqTab = "protein";
    state.seqExpanded = false;
    el.viewList.classList.add("hidden");
    el.viewDetail.classList.remove("hidden");
    renderDetail(r);
    renderCrumb();
    window.scrollTo({ top: 0 });
  }

  /* ============================ 详情页 ============================ */

  var SECTIONS = [
    { id: "overview", label: "Overview", ico: "grid" },
    { id: "gene-model", label: "Gene Model", ico: "dna" },
    { id: "function", label: "Function", ico: "func" },
    { id: "orthology", label: "Orthology", ico: "ortho" },
    { id: "go", label: "GO Annotations", ico: "go" },
    { id: "kegg", label: "KEGG Pathways", ico: "kegg" },
    { id: "domains", label: "Protein Domains", ico: "dom" },
    { id: "sequences", label: "Sequences", ico: "seq" },
    { id: "links", label: "External Links", ico: "link" }
  ];

  // 线性图标（内联 SVG，简洁线条）
  var ICONS = {
    grid: '<svg class="toc-ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><rect x="9" y="9" width="5" height="5" rx="1"/></svg>',
    dna: '<svg class="toc-ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 2v12M13 2v12M4 4c2-1.5 6-1.5 8 0M4 8c2-1.5 6-1.5 8 0M4 12c2-1.5 6-1.5 8 0"/></svg>',
    func: '<svg class="toc-ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 13l3.5-7L8 10l3-6 3 9"/></svg>',
    ortho: '<svg class="toc-ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="4" cy="4" r="2"/><circle cx="12" cy="12" r="2"/><path d="M5.5 5.5l5 5"/></svg>',
    go: '<svg class="toc-ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="5" cy="5" r="3"/><circle cx="11" cy="11" r="3"/></svg>',
    kegg: '<svg class="toc-ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 13V6l5-3 5 3v7M3 6l5 3 5-3M6.5 8v5M9.5 8v5"/></svg>',
    dom: '<svg class="toc-ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="4" width="4" height="8" rx="1"/><rect x="6" y="2" width="3" height="10" rx="1"/><rect x="10" y="6" width="5" height="6" rx="1"/></svg>',
    seq: '<svg class="toc-ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 4h12M2 8h12M2 12h8"/></svg>',
    link: '<svg class="toc-ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 10l4-4M5 4l2-2a2.8 2.8 0 014 4l-2 2M11 12l-2 2a2.8 2.8 0 01-4-4l2-2"/></svg>'
  };

  function renderDetail(r) {
    var sp = speciesDisplay(r.Species);
    var html = "";

    // ---------- 左侧目录 ----------
    html = "";
    var tocHtml = SECTIONS.map(function (s) {
      return '<a href="#sec-' + s.id + '" data-sec="' + s.id + '">' +
        (ICONS[s.ico] || "") + "<span>" + s.label + "</span></a>";
    }).join("");
    el.toc.innerHTML = tocHtml;
    el.toc.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function (ev) {
        ev.preventDefault();
        var t = $("sec-" + a.dataset.sec);
        if (t) {
          var y = t.getBoundingClientRect().top + window.pageYOffset -
            (parseInt(getComputedStyle(document.documentElement).getPropertyValue("--topbar-h")) || 68) - 14;
          window.scrollTo({ top: y, behavior: "smooth" });
        }
      });
    });

    // ---------- 详情头部（双栏） ----------
    html += '<div class="gene-head">';
    html += "<div>";
    html += '<h1 class="gene-title">Gene <span class="gid">' + esc(r.GeneID) + "</span></h1>";
    html += '<div class="gene-subtitle">' + esc(sp) + "</div>";
    // 彩色摘要标签：蛋白长度（蓝）、功能描述（绿）、KEGG KO（紫）、EC 编号（黄）
    html += '<div class="gene-tags">';
    html += '<span class="gtag blue"><span class="gt-label">Protein length:</span>' +
      (r.Length_aa === null ? "-" : r.Length_aa + " aa") + "</span>";
    if (r.Description && r.Description !== "-") {
      html += '<span class="gtag green"><span class="gt-label">Description:</span>' +
        esc(r.Description) + "</span>";
    }
    (r.ko_array || []).forEach(function (k) {
      html += '<span class="gtag purple"><span class="gt-label">KO:</span>' + esc(k) + "</span>";
    });
    if (r.EC && r.EC !== "-") {
      html += '<span class="gtag yellow"><span class="gt-label">EC:</span>' + esc(r.EC) + "</span>";
    }
    html += "</div></div>";
    // 右侧小型摘要表
    html += '<div class="summary-box"><table><tbody>';
    html += "<tr><td class=\"k\">Gene ID</td><td class=\"v mono\">" + esc(r.GeneID) + "</td></tr>";
    html += "<tr><td class=\"k\">Species</td><td class=\"v\">" + esc(sp) + "</td></tr>";
    html += "<tr><td class=\"k\">Protein length</td><td class=\"v\">" +
      (r.Length_aa === null ? "-" : r.Length_aa + " aa") + "</td></tr>";
    html += "</tbody></table></div>";
    html += "</div>";

    // ---------- 九个内容模块 ----------
    html += sec("overview", "Overview", "", renderOverview(r));
    html += sec("gene-model", "Gene Model", "",
      emptyStateBlock(EMPTY_MSGS["gene-model"]));
    html += sec("function", "Function", "Functional Annotation", renderFunction(r));
    html += sec("orthology", "Orthology", "", renderOrthology(r));
    html += sec("go", "GO Annotations", (r.go_array || []).length + " terms", renderGo(r));
    html += sec("kegg", "KEGG Pathways", "", renderKegg(r));
    html += sec("domains", "Protein Domains", "", renderDomains(r));
    html += sec("sequences", "Sequences", "", renderSequences(r));
    html += sec("links", "External Links", "", renderExternalLinks(r));

    el.detailMain.innerHTML = html;

    // 同源表排序（若存在）
    var orthoThs = el.detailMain.querySelectorAll("#sec-orthology .ortho-table th");
    Array.prototype.forEach.call(orthoThs, function (th) {
      th.addEventListener("click", function () {
        var col = th.dataset.col;
        if (state.orthoSort.col === col) state.orthoSort.dir *= -1;
        else state.orthoSort = { col: col, dir: 1 };
        var tbody = el.detailMain.querySelector("#sec-orthology tbody");
        if (tbody) sortOrthoTbody(tbody, col, state.orthoSort.dir);
      });
    });

    // 序列标签页与操作按钮
    bindSequenceControls(r);

    // 滚动联动
    initScrollspy();

    // GO 术语名称富集（悬停展示用，不改变未分类策略）
    enrichGoNames(r);
  }

  function sec(id, title, badge, body) {
    return '<div class="sec" id="sec-' + id + '">' +
      '<div class="sec-head"><h3>' + title + "</h3>" +
      (badge ? '<span class="sec-badge">' + badge + "</span>" : "") +
      "</div>" +
      '<div class="sec-body">' + body + "</div></div>";
  }

  function emptyStateBlock(msg) {
    return '<div class="empty-state">' +
      '<div class="es-title">' + esc(msg.title) + "</div>" +
      '<div class="es-sub">' + esc(msg.sub) + "</div></div>";
  }

  /* ---------- Overview：两列键值表格 ---------- */

  function kvRow(label, valueHtml, mono) {
    return "<dt>" + esc(label) + "</dt><dd" + (mono ? ' class="mono"' : "") + ">" +
      valueHtml + "</dd>";
  }

  function renderOverview(r) {
    var h = '<div class="kv-grid">';
    h += kvRow("Gene ID", esc(r.GeneID), true);
    h += kvRow("Species / Strain", esc(speciesDisplay(r.Species)));
    h += kvRow("Description", esc(r.Description || "-"));
    h += kvRow("Protein length", (r.Length_aa === null ? "-" : r.Length_aa + " aa"));
    h += kvRow("Seed ortholog", esc(r.seed_ortholog || "-"), true);
    h += kvRow("E-value", fmtEvalue(r.evalue), true);
    h += kvRow("Score", fmtNum(r.score), true);
    h += kvRow("COG category", esc(r.COG_category || "-") +
      (r.COG_category ? " · " + esc(COG_LABELS[r.COG_category] || "") : ""));
    h += kvRow("COG description", esc((r.cog_desc_array || []).join("; ") || "-"));
    h += kvRow("EC number", esc(r.EC || "-"), true);
    h += kvRow("KEGG KO", esc((r.ko_array || []).join(", ") || "-"), true);
    h += "</div>";
    return h;
  }

  /* ---------- Function：功能注释 ---------- */

  function renderFunction(r) {
    var h = "";
    h += '<div class="kv-grid" style="margin-bottom:12px">';
    h += kvRow("Description", esc(r.Description || "-"));
    h += kvRow("COG category", esc(r.COG_category || "-") +
      (r.COG_category ? " · " + esc(COG_LABELS[r.COG_category] || "") : ""));
    h += kvRow("COG description", esc((r.cog_desc_array || []).join("; ") || "-"));
    h += "</div>";
    // EC 编号标签列表
    h += "<div><strong style=\"font-size:13px;color:#2c3540\">EC number</strong>" +
      '<span class="term-count">(' +
      (r.EC && r.EC !== "-" ? splitCsv(r.EC).length : 0) + ")</span></div>";
    h += '<div class="term-list" style="margin:6px 0 12px">';
    if (r.EC && r.EC !== "-") {
      splitCsv(r.EC).forEach(function (ecn) {
        h += '<a class="term" href="https://www.brenda-enzymes.org/enzyme.php?ecno=' +
          encodeURIComponent(ecn) + '" target="_blank" rel="noopener" title="EC ' +
          esc(ecn) + '">' + esc(ecn) + "</a>";
      });
    } else {
      h += '<span style="font-size:12.5px;color:#7a8794">–</span>';
    }
    h += "</div>";
    // KEGG KO 标签列表（可换行）
    var kos = r.ko_array || [];
    h += "<div><strong style=\"font-size:13px;color:#2c3540\">KEGG KO</strong>" +
      '<span class="term-count">(' + kos.length + ")</span></div>";
    h += '<div class="term-list" style="margin-top:6px">';
    if (kos.length) {
      kos.forEach(function (k) {
        var id = k.replace(/^ko:/, "");
        h += '<a class="term" href="' + LINKS.kegg.replace("{id}", id) +
          '" target="_blank" rel="noopener">' + esc(k) + "</a>";
      });
    } else {
      h += '<span style="font-size:12.5px;color:#7a8794">–</span>';
    }
    h += "</div>";
    return h;
  }

  /* ---------- Orthology：同源关系 ---------- */

  function renderOrthology(r) {
    // 当前数据每条记录仅含一个 seed ortholog 比对；若未来出现多行
    // 同源关系，ortho_rows 会自动扩展为可排序表格
    var orthoRows = [];
    if (r.seed_ortholog && r.seed_ortholog !== "-") {
      orthoRows.push({
        species: speciesDisplay(r.Species),
        ortholog: r.seed_ortholog,
        evalue: r.evalue,
        score: r.score
      });
    }
    var h = "";
    if (!orthoRows.length) {
      return emptyStateBlock({
        title: "No orthology record",
        sub: "The data file does not contain a seed ortholog assignment for this gene."
      });
    }
    if (orthoRows.length === 1) {
      // 单条：键值展示
      h += '<div class="kv-grid">';
      h += kvRow("Seed ortholog", esc(orthoRows[0].ortholog), true);
      h += kvRow("E-value", fmtEvalue(orthoRows[0].evalue), true);
      h += kvRow("Score", fmtNum(orthoRows[0].score), true);
      h += "</div>";
    } else {
      // 多条：紧凑数据表，支持排序与展开
      h += '<table class="ortho-table"><thead><tr>' +
        '<th data-col="ortholog">Seed ortholog</th>' +
        '<th data-col="evalue">E-value</th>' +
        '<th data-col="score">Score</th></tr></thead><tbody id="ortho-tbody">';
      orthoRows.forEach(function (o) {
        h += "<tr><td class=\"mono\">" + esc(o.ortholog) +
          "</td><td class=\"mono\">" + fmtEvalue(o.evalue) +
          "</td><td class=\"mono\">" + fmtNum(o.score) + "</td></tr>";
      });
      h += "</tbody></table>";
    }
    return h;
  }

  function sortOrthoTbody(tbody, col, dir) {
    var trs = Array.prototype.slice.call(tbody.querySelectorAll("tr"));
    trs.sort(function (a, b) {
      var va = a.cells[col === "ortholog" ? 0 : col === "evalue" ? 1 : 2].textContent;
      var vb = b.cells[col === "ortholog" ? 0 : col === "evalue" ? 1 : 2].textContent;
      var na = parseFloat(va), nb = parseFloat(vb);
      if (!isNaN(na) && !isNaN(nb)) return (na - nb) * dir;
      return va.localeCompare(vb) * dir;
    });
    trs.forEach(function (tr) { tbody.appendChild(tr); });
  }

  /* ---------- GO Annotations：未分类策略 ---------- */

  function goItemHtml(r, go) {
    var name = state.goNames[go] || "";
    var def = state.goDefs[go] || "";
    var tip = name + (def ? " — " + def : "");
    if (tip.length > 200) tip = tip.slice(0, 197) + "…";
    return '<div class="go-item">' +
      '<a class="go-id" href="' + LINKS.amigo.replace("{id}", go) +
      '" target="_blank" rel="noopener" title="' + esc(tip) + '">' + esc(go) + "</a>" +
      '<span class="go-name">' + esc(name) + "</span>" +
      '<span class="go-src">' + esc(goSourceOf(r, go)) + "</span></div>";
  }

  function goSourceOf(r, go) {
    var fromEgg = splitCsv(r.GOs_eggnog).indexOf(go) >= 0;
    var fromIps = splitCsv(r.GOs_interproscan).indexOf(go) >= 0;
    if (fromEgg && fromIps) return "eggNOG + InterProScan";
    if (fromEgg) return "eggNOG";
    if (fromIps) return "InterProScan";
    return "annotation";
  }

  function renderGo(r) {
    var gos = r.go_array || [];
    if (!gos.length) {
      return emptyStateBlock({
        title: "No GO annotations",
        sub: "This gene has no GO term assigned in the current data file."
      });
    }
    // 数据仅有 GO 编号、无本体分类信息：按规范全部放入"Unclassified"，
    // 不根据编号猜测 MF/CC/BP 分类
    var h = '<div class="anno-block"><h4>Unclassified' +
      '<span class="ab-count">(' + gos.length + " terms)</span></h4>" +
      '<div class="go-list">' +
      gos.map(function (g) { return goItemHtml(r, g); }).join("") +
      "</div></div>";
    h += '<div class="dt-note" style="margin-top:10px">' +
      "The data file provides GO accession numbers only, without Molecular Function / " +
      "Cellular Component / Biological Process categories. All terms are listed as " +
      "Unclassified; no classification is inferred from accession numbers.</div>";
    return h;
  }

  // GO 术语名称/定义联网富集（仅用于悬停展示，不影响分类策略）
  function enrichGoNames(r) {
    var gos = (r.go_array || []).slice(0, 15);
    var missing = gos.filter(function (g) { return !state.goNames[g]; });
    if (!missing.length) return;
    var idx = 0;
    function next() {
      if (idx >= missing.length) { refreshGoIfOpen(); return; }
      var go = missing[idx++];
      var req = new XMLHttpRequest();
      req.timeout = 4000;
      req.onreadystatechange = function () {
        if (req.readyState === 4) {
          if (req.status === 200) {
            try {
              var d = JSON.parse(req.responseText);
              if (d && d.goid && d.label) {
                state.goNames[d.goid] = d.label;
                if (d.definition) state.goDefs[d.goid] = d.definition;
              }
            } catch (e) { /* 忽略解析错误 */ }
          }
          next();
        }
      };
      req.open("GET", "https://api.geneontology.org/api/ontology/term/" +
        encodeURIComponent(go), true);
      try { req.send(); } catch (e) { next(); }
    }
    next();
  }

  function refreshGoIfOpen() {
    if (state.view === "detail" && state.detailKey) {
      var r = findRowByKey(state.detailKey);
      var pane = $("sec-go");
      if (r && pane) {
        var body = pane.querySelector(".sec-body");
        if (body) body.innerHTML = renderGo(r);
      }
    }
  }

  /* ---------- KEGG Pathways ---------- */

  function renderKegg(r) {
    var h = "";
    var pwys = r.pathway_array || [];
    var mods = r.module_array || [];
    var rxns = r.reaction_array || [];

    h += "<div><strong style=\"font-size:13px;color:#2c3540\">Pathways</strong>" +
      '<span class="term-count">(' + pwys.length + ")</span></div>";
    h += '<div class="term-list" style="margin:6px 0 14px">';
    if (pwys.length) {
      pwys.forEach(function (p) {
        var id = p.replace(/^ko:/, "");
        h += '<a class="term" href="' + LINKS.keggPathway.replace("{id}", id) +
          '" target="_blank" rel="noopener" title="KEGG pathway ' + esc(p) + '">' + esc(p) + "</a>";
      });
    } else {
      h += '<span style="font-size:12.5px;color:#7a8794">–</span>';
    }
    h += "</div>";

    h += "<div><strong style=\"font-size:13px;color:#2c3540\">Modules</strong>" +
      '<span class="term-count">(' + mods.length + ")</span></div>";
    h += '<div class="term-list" style="margin:6px 0 14px">';
    if (mods.length) {
      mods.forEach(function (m) {
        h += '<a class="term" href="' + LINKS.keggModule.replace("{id}", m) +
          '" target="_blank" rel="noopener" title="KEGG module ' + esc(m) + '">' + esc(m) + "</a>";
      });
    } else {
      h += '<span style="font-size:12.5px;color:#7a8794">–</span>';
    }
    h += "</div>";

    h += "<div><strong style=\"font-size:13px;color:#2c3540\">Reactions</strong>" +
      '<span class="term-count">(' + rxns.length + ")</span></div>";
    h += '<div class="term-list" style="margin-top:6px">';
    if (rxns.length) {
      rxns.slice(0, 24).forEach(function (rn) {
        h += '<a class="term" href="' + LINKS.keggReaction.replace("{id}", rn) +
          '" target="_blank" rel="noopener" title="KEGG reaction ' + esc(rn) + '">' + esc(rn) + "</a>";
      });
      if (rxns.length > 24) {
        h += '<span class="term-count" style="margin-left:2px">+ ' + (rxns.length - 24) + " more</span>";
      }
    } else {
      h += '<span style="font-size:12.5px;color:#7a8794">–</span>';
    }
    h += "</div>";
    return h;
  }

  /* ---------- Protein Domains：SVG 轨道（仅有坐标时绘制） ---------- */

  function renderDomains(r) {
    var doms = r.domains_parsed || [];
    var len = r.Length_aa;
    if (!doms.length) {
      return emptyStateBlock({
        title: "No domain annotations",
        sub: "This gene has no protein domain assignment (n_domains = 0) in the current data file."
      });
    }
    // 检查是否含有真实起止坐标；无坐标时显示明确空状态 + 注释清单
    var withCoords = doms.filter(function (d) {
      return d && typeof d.start === "number" && typeof d.end === "number" &&
        d.start >= 1 && d.end >= d.start;
    });
    if (!withCoords.length || !len) {
      var h = emptyStateBlock(EMPTY_MSGS.domains);
      h += '<div style="margin-top:14px"><strong style="font-size:13px;color:#2c3540">' +
        "Domain annotations (" + doms.length + ")</strong></div>";
      h += '<table class="ortho-table" style="margin-top:6px"><thead><tr>' +
        "<th>#</th><th>Database</th><th>Accession</th></tr></thead><tbody>";
      doms.forEach(function (d, i) {
        h += "<tr><td>" + (i + 1) + "</td><td>" + esc(d.type || "-") +
          "</td><td class=\"mono\">" + esc(d.id) + "</td></tr>";
      });
      h += "</tbody></table>";
      return h;
    }
    // 有坐标：SVG 轨道（横轴 1..蛋白长度；不同数据库分轨，重叠分道）
    return renderDomainSvg(r, withCoords, len) + domainTable(r);
  }

  function renderDomainSvg(r, doms, len) {
    var W = 900, ML = 10, MR = 10, ROW_H = 15, ROW_GAP = 6, RULER_H = 20;
    var trackW = W - ML - MR;
    var x = function (pos) { return ML + trackW * (pos - 1) / len; };

    // 按数据库分组
    var byDb = {};
    doms.forEach(function (d) {
      var t = d.type || "Other";
      if (!byDb[t]) byDb[t] = [];
      byDb[t].push(d);
    });

    // 每组内分配泳道（重叠时分轨）
    var lanes = {};   // db -> [[d1, d2...], ...]
    Object.keys(byDb).forEach(function (db) {
      var items = byDb[db].slice().sort(function (a, b) { return a.start - b.start; });
      var dbLanes = [];
      items.forEach(function (d) {
        var placed = false;
        for (var i = 0; i < dbLanes.length; i++) {
          var last = dbLanes[i][dbLanes[i].length - 1];
          if (last.end < d.start) { dbLanes[i].push(d); placed = true; break; }
        }
        if (!placed) dbLanes.push([d]);
      });
      lanes[db] = dbLanes;
    });

    // 计算总高度
    var rowsCount = 0;
    Object.keys(lanes).forEach(function (db) { rowsCount += lanes[db].length; });
    var H = rowsCount * (ROW_H + ROW_GAP) + ROW_GAP + RULER_H + 6;

    var svg = "";
    var y = 4;
    Object.keys(lanes).forEach(function (db) {
      lanes[db].forEach(function (lane) {
        lane.forEach(function (d) {
          var x1 = x(d.start), x2 = x(d.end);
          var w = Math.max(2, x2 - x1);
          var tip = esc(d.id) + " | " + esc(d.type || "") + " | " +
            d.start + "-" + d.end + " aa";
          svg += '<rect x="' + x1.toFixed(1) + '" y="' + y + '" width="' + w.toFixed(1) +
            '" height="' + ROW_H + '" rx="3" fill="' + dbColor(db) +
            '" stroke="rgba(0,0,0,.15)"><title>' + tip + "</title></rect>";
        });
        y += ROW_H + ROW_GAP;
      });
    });
    // 每行下方以浅灰底条作为蛋白轨道背景
    var trackRows = "";
    var ry = 4;
    Object.keys(lanes).forEach(function (db) {
      lanes[db].forEach(function () {
        trackRows += '<rect x="' + ML + '" y="' + (ry + ROW_H + ROW_GAP - 4) +
          '" width="' + trackW + '" height="2" rx="1" fill="#e6ebf0"></rect>';
        ry += ROW_H + ROW_GAP;
      });
    });

    // 横轴刻度（1 .. len）
    var ticks = "";
    var TICKS = 6;
    for (var k = 0; k <= TICKS; k++) {
      var pos = 1 + k * (len - 1) / TICKS;
      var tx = x(pos);
      ticks += '<line x1="' + tx.toFixed(1) + '" y1="' + (H - RULER_H + 2) +
        '" x2="' + tx.toFixed(1) + '" y2="' + (H - RULER_H + 7) +
        '" stroke="#b8c2cc" stroke-width="1"></line>';
      ticks += '<text x="' + tx.toFixed(1) + '" y="' + (H - 6) +
        '" font-size="9.5" fill="#7a8794" text-anchor="middle" font-family="Arial">' +
        Math.round(pos) + "</text>";
    }
    ticks += '<line x1="' + ML + '" y1="' + (H - RULER_H + 2) + '" x2="' + (W - MR) +
      '" y2="' + (H - RULER_H + 2) + '" stroke="#b8c2cc" stroke-width="1"></line>';
    ticks += '<text x="' + ML + '" y="' + (H - 16) + '" font-size="9.5" fill="#7a8794"' +
      ' font-family="Arial">1 aa</text>';

    var legend = Object.keys(lanes).map(function (db) {
      return '<span class="lg-item"><span class="lg-sw" style="background:' + dbColor(db) +
        '"></span>' + esc(db) + "</span>";
    }).join("");

    return '<div class="domain-track">' +
      '<svg class="dt-svg" width="100%" viewBox="0 0 ' + W + " " + H +
      '" preserveAspectRatio="xMinYMid meet" xmlns="http://www.w3.org/2000/svg">' +
      trackRows + svg + ticks + "</svg>" +
      '<div class="dt-legend">' + legend + "</div>" +
      '<div class="dt-note">Protein length: ' + len +
      " aa · Domain positions are drawn from real start / end coordinates in the data file." +
      " Hover a block for details.</div></div>";
  }

  function domainTable(r) {
    var doms = r.domains_parsed || [];
    if (!doms.length) return "";
    return '<table class="ortho-table" style="margin-top:14px"><thead><tr>' +
      "<th>#</th><th>Database</th><th>Accession</th><th>Start</th><th>End</th></tr></thead><tbody>" +
      doms.map(function (d, i) {
        return "<tr><td>" + (i + 1) + "</td><td>" + esc(d.type || "-") +
          '</td><td class="mono"><a href="' + LINKS.interpro.replace("{id}", esc(d.id)) +
          '" target="_blank" rel="noopener">' + esc(d.id) + '</a></td>' +
          "<td class=\"mono\">" + (typeof d.start === "number" ? d.start : "-") + "</td>" +
          "<td class=\"mono\">" + (typeof d.end === "number" ? d.end : "-") + "</td></tr>";
      }).join("") + "</tbody></table>";
  }

  /* ---------- Sequences：两个标签页 + 真实数据为空状态 ---------- */

  function renderSequences(r) {
    var h = "";
    h += '<div class="seq-tabs">' +
      '<button type="button" data-seq="protein" class="' + (state.seqTab === "protein" ? "active" : "") +
      '">Protein sequence</button>' +
      '<button type="button" data-seq="cds" class="' + (state.seqTab === "cds" ? "active" : "") +
      '">CDS sequence</button></div>';

    // 当前数据文件不含任何序列：两个标签页均显示空状态，操作禁用
    h += '<div class="seq-toolbar">' +
      '<button class="btn-mini" id="seq-copy" disabled>Copy</button>' +
      '<button class="btn-mini" id="seq-download" disabled>Download FASTA</button>' +
      '<button class="btn-mini" id="seq-view" disabled>View full sequence</button>' +
      "</div>";
    h += '<div class="seq-head-line" id="seq-head"></div>';
    h += '<div class="seq-wrap"><div class="seq-mono" id="seq-body">' +
      emptyStateBlock(EMPTY_MSGS.sequences) + "</div></div>";
    return h;
  }

  function bindSequenceControls(r) {
    var tabs = el.detailMain.querySelectorAll(".seq-tabs button");
    Array.prototype.forEach.call(tabs, function (b) {
      b.addEventListener("click", function () {
        state.seqTab = b.dataset.seq;
        Array.prototype.forEach.call(tabs, function (x) {
          x.classList.toggle("active", x === b);
        });
        // 数据文件无序列：维持空状态，不切换内容
      });
    });
    // Copy / Download / View full 在无序列数据时保持禁用
    var ids = ["seq-copy", "seq-download", "seq-view"];
    ids.forEach(function (id) {
      var b = $(id);
      if (b) {
        b.disabled = true;
        b.addEventListener("click", function () {
          toast("Sequence data is not available in the current data file");
        });
      }
    });
  }

  /* ---------- External Links：direct / search 标注 ---------- */

  function linkBadge(label, href, kind, note) {
    return '<a class="link-badge" href="' + href + '" target="_blank" rel="noopener"' +
      (note ? ' title="' + esc(note) + '"' : "") + ">" + label +
      '<span class="lb-kind ' + kind + '">' + (kind === "direct" ? "direct" : "search") + "</span></a>";
  }

  function renderExternalLinks(r) {
    var links = [];
    var gid = r.GeneID;
    var sp = speciesDisplay(r.Species);

    // NCBI：本地基因 ID 不是 accession，标记为搜索入口
    links.push(linkBadge("NCBI Gene", LINKS.ncbiGene.replace("{q}",
      encodeURIComponent(gid + " " + sp)), "search",
      "Search entry: " + gid + " in " + sp + " (local gene ID, not an NCBI accession)"));
    // UniProt：搜索入口
    links.push(linkBadge("UniProt", LINKS.uniprot.replace("{q}",
      encodeURIComponent(gid)), "search",
      "Search entry: " + gid + " (local gene ID, not a UniProt accession)"));
    // eggNOG：seed ortholog 有值时为精确查询，否则搜索
    if (r.seed_ortholog && r.seed_ortholog !== "-") {
      links.push(linkBadge("eggNOG", LINKS.eggnog.replace("{q}",
        encodeURIComponent(r.seed_ortholog)), "direct",
        "Query: " + r.seed_ortholog + " (seed ortholog from eggNOG annotation)"));
    } else {
      links.push(linkBadge("eggNOG", LINKS.eggnog.replace("{q}",
        encodeURIComponent(gid)), "search", "Search entry: " + gid));
    }
    // KEGG：KO 编号为精确 accession
    (r.ko_array || []).forEach(function (k) {
      var id = k.replace(/^ko:/, "");
      links.push(linkBadge("KEGG " + esc(k), LINKS.kegg.replace("{id}", id), "direct",
        "KEGG Orthology entry: " + k));
    });
    // InterPro：IPR 编号为精确 accession
    (r.ipr_id_array || []).slice(0, 6).forEach(function (id) {
      links.push(linkBadge("InterPro " + esc(id), LINKS.interpro.replace("{id}", id), "direct",
        "InterPro entry: " + id));
    });
    // KEGG 通路入口
    (r.pathway_array || []).slice(0, 6).forEach(function (p) {
      var id = p.replace(/^ko:/, "");
      links.push(linkBadge("KEGG " + esc(p), LINKS.keggPathway.replace("{id}", id), "direct",
        "KEGG pathway: " + p));
    });

    var h = '<div class="link-list">' + links.join("") + "</div>";
    h += '<div class="dt-note" style="margin-top:12px">' +
      '<b>direct</b>: links to an exact database entry (verified accession). ' +
      '<b>search</b>: opens a search query — the local gene ID is not a valid accession ' +
      "for that database and is not presented as one.</div>";
    return h;
  }

  /* ---------- 侧栏目录滚动联动 ---------- */

  function initScrollspy() {
    var links = el.toc.querySelectorAll("a");
    var secs = Array.prototype.slice.call(el.detailMain.querySelectorAll(".sec"));
    if (!secs.length) return;

    function onScroll() {
      var offset = (parseInt(getComputedStyle(document.documentElement)
        .getPropertyValue("--topbar-h")) || 68) + 10;
      var cur = null;
      secs.forEach(function (s) {
        var top = s.getBoundingClientRect().top;
        if (top <= offset + 60) cur = s.id.replace("sec-", "");
      });
      links.forEach(function (a) {
        a.classList.toggle("active", a.dataset.sec === cur);
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ============================ 导航搜索下拉 ============================ */

  function navSearch(term) {
    term = (term || "").trim().toLowerCase();
    if (term.length < 2) { hideNavDrop(); return; }

    // 命中字段收集：实际匹配的字段名 + 匹配值
    var hits = [];
    rows.forEach(function (r, i) {
      var f = FLAT[i];
      var matched = [];
      function m(label, hay, pretty) {
        if (hay.indexOf(term) >= 0) {
          matched.push({ label: label, pretty: pretty || hay });
        }
      }
      m("Gene ID", f.geneid, r.GeneID);
      m("Species", f.species, speciesDisplay(r.Species));
      m("Description", f.desc, r.Description);
      m("Preferred name", f.pref, r.Preferred_name);
      m("Seed ortholog", f.seed, r.seed_ortholog);
      (r.go_array || []).forEach(function (g) {
        if (g.toLowerCase().indexOf(term) >= 0) matched.push({ label: "GO", pretty: g });
      });
      (r.ipr_id_array || []).forEach(function (g) {
        if (g.toLowerCase().indexOf(term) >= 0) matched.push({ label: "InterPro", pretty: g });
      });
      (r.ipr_desc_array || []).forEach(function (g) {
        if (g.toLowerCase().indexOf(term) >= 0) matched.push({ label: "InterPro description", pretty: g });
      });
      (r.ko_array || []).forEach(function (g) {
        if (g.toLowerCase().indexOf(term) >= 0) matched.push({ label: "KEGG KO", pretty: g });
      });
      (r.pathway_array || []).forEach(function (g) {
        if (g.toLowerCase().indexOf(term) >= 0) matched.push({ label: "KEGG Pathway", pretty: g });
      });
      (r.pfam_array || []).forEach(function (g) {
        if (g.toLowerCase().indexOf(term) >= 0) matched.push({ label: "Pfam", pretty: g });
      });
      if (f.ec.indexOf(term) >= 0 && r.EC && r.EC !== "-") {
        matched.push({ label: "EC number", pretty: r.EC });
      }
      if (matched.length) {
        hits.push({ row: r, matched: matched.slice(0, 2) });
      }
    });

    // 排序：基因 ID 精确命中 > 前缀命中 > 其他
    hits.sort(function (a, b) {
      var ga = String(a.row.GeneID).toLowerCase(), gb = String(b.row.GeneID).toLowerCase();
      var sa = ga === term ? 0 : ga.indexOf(term) === 0 ? 1 : 2;
      var sb = gb === term ? 0 : gb.indexOf(term) === 0 ? 1 : 2;
      return sa - sb || ga.localeCompare(gb, undefined, { numeric: true });
    });

    renderNavDrop(hits.slice(0, 10), term);
  }

  function renderNavDrop(hits, term) {
    if (!hits.length) {
      el.searchDrop.innerHTML = '<div class="sd-empty">No matching genes for "' +
        esc(term) + '"</div>';
    } else {
      var h = "";
      var curGene = "";
      hits.forEach(function (hit) {
        var r = hit.row;
        var key = geneKeyOf(r);
        if (curGene !== key) {
          curGene = key;
          h += '<div class="sd-group">Gene</div>';
        }
        h += '<button type="button" class="sd-item" data-key="' + esc(key) + '">' +
          '<div class="sd-gid">' + esc(r.GeneID) +
          ' <span class="sd-sp">' + esc(speciesDisplay(r.Species)) + "</span></div>" +
          '<div class="sd-match">' +
          hit.matched.map(function (m) {
            return esc(m.label) + ": " + highlight(m.pretty, term);
          }).join(" · ") +
          "</div></button>";
      });
      el.searchDrop.innerHTML = h;
      Array.prototype.forEach.call(el.searchDrop.querySelectorAll(".sd-item"), function (b) {
        b.addEventListener("click", function () {
          hideNavDrop();
          el.navQ.value = "";
          openDetail(b.dataset.key);
        });
      });
    }
    el.searchDrop.hidden = false;
  }

  function hideNavDrop() {
    el.searchDrop.hidden = true;
    el.searchDrop.innerHTML = "";
  }

  /* ============================ 导出与复制 ============================ */

  // 原始 31 列字段名（与 Example.txt 表头一致）
  var TSV_COLS = [
    "Species", "GeneID", "Length_aa", "seed_ortholog", "evalue", "score",
    "eggNOG_OGs", "max_annot_lvl", "COG_category", "Description",
    "Preferred_name", "GOs_eggnog", "EC", "KEGG_ko", "KEGG_Pathway",
    "KEGG_Module", "KEGG_Reaction", "KEGG_rclass", "BRITE", "KEGG_TC",
    "CAZy", "BiGG_Reaction", "PFAMs_eggnog", "COG_description",
    "GOs_interproscan", "GOs_union", "InterPro_IDs", "InterPro_description",
    "Domains", "n_domains", "iprscan_hit"
  ];

  function rawVal(row, key) {
    var v = row[key];
    if (v === null || v === undefined) return "-";
    if (Array.isArray(v)) return v.join(",");
    return v;
  }

  function tsvCell(v) {
    if (v === null || v === undefined) return "-";
    return String(v).replace(/\t/g, " ").replace(/\r?\n/g, " ");
  }

  function geneTsvLine(r) {
    return TSV_COLS.map(function (c) {
      if (c === "GOs_union") return tsvCell((r.go_array || []).join(","));
      if (c === "PFAMs_eggnog") return tsvCell((r.pfam_array || []).join(","));
      if (c === "KEGG_ko") return tsvCell((r.ko_array || []).join(","));
      if (c === "KEGG_Pathway") return tsvCell((r.pathway_array || []).join(","));
      if (c === "KEGG_Module") return tsvCell((r.module_array || []).join(","));
      if (c === "KEGG_Reaction") return tsvCell((r.reaction_array || []).join(","));
      if (c === "KEGG_rclass") return tsvCell((r.rclass_array || []).join(","));
      if (c === "BRITE") return tsvCell((r.brite_array || []).join(","));
      if (c === "KEGG_TC") return tsvCell((r.tc_array || []).join(","));
      if (c === "CAZy") return tsvCell((r.cazy_array || []).join(","));
      if (c === "BiGG_Reaction") return tsvCell((r.biggrxn_array || []).join(","));
      if (c === "COG_description") return tsvCell((r.cog_desc_array || []).join(";"));
      if (c === "InterPro_IDs") return tsvCell((r.ipr_id_array || []).join(","));
      if (c === "InterPro_description") return tsvCell((r.ipr_desc_array || []).join(";"));
      if (c === "Domains") return tsvCell((r.domain_array || []).join(";"));
      if (c === "eggNOG_OGs") {
        return tsvCell((r.ogs_array || []).map(function (o) {
          return o.id + (o.level ? "@" + o.level : "");
        }).join(","));
      }
      return tsvCell(rawVal(r, c));
    }).join("\t");
  }

  function exportCurrentTsv() {
    var results = currentResults();
    if (!results.length) { toast("No results to export"); return; }
    var lines = [TSV_COLS.join("\t")];
    results.forEach(function (it) { lines.push(geneTsvLine(it.row)); });
    downloadText("FungalGenDB_search_result.tsv", lines.join("\n"));
    toast("Exported " + results.length + " records");
  }

  function geneSummary(r) {
    var sp = speciesDisplay(r.Species);
    var lines = [];
    lines.push("Gene ID: " + r.GeneID);
    lines.push("Species: " + sp);
    lines.push("Protein length: " + (r.Length_aa === null ? "-" : r.Length_aa) + " aa");
    lines.push("Description: " + (r.Description || "-"));
    lines.push("COG category: " + (r.COG_category || "-"));
    lines.push("EC: " + (r.EC || "-"));
    lines.push("KEGG KO: " + ((r.ko_array || []).join(", ") || "-"));
    lines.push("Seed ortholog: " + (r.seed_ortholog || "-"));
    lines.push("E-value: " + fmtEvalue(r.evalue) + "  Score: " + fmtNum(r.score));
    lines.push("GO: " + ((r.go_array || []).join(", ") || "-"));
    lines.push("KEGG Pathways: " + ((r.pathway_array || []).join(", ") || "-"));
    lines.push("InterPro: " + ((r.ipr_id_array || []).join(", ") || "-"));
    lines.push("Domains: " + ((r.domains_parsed || []).map(function (d) { return d.id; }).join(", ") || "-"));
    return lines.join("\n");
  }

  function copyCurrentSummary() {
    if (state.view !== "detail" || !state.detailKey) {
      toast("Open a gene detail page first");
      return;
    }
    var r = findRowByKey(state.detailKey);
    if (!r) return;
    copyText(geneSummary(r)).then(function () {
      toast("Gene summary copied to clipboard");
    }, function () {
      toast("Copy failed");
    });
  }

  /* ============================ Help 模态框 ============================ */

  function renderHelp() {
    var mapRows = [
      ["Species", "Species / strain identifier (internal form: Genus_species__strain)", "Species / Strain"],
      ["GeneID", "Gene model identifier (e.g. g46.t1)", "Gene ID"],
      ["Length_aa", "Protein length in amino acids", "Protein length"],
      ["seed_ortholog", "Best-hit ortholog from eggNOG annotation", "Seed ortholog"],
      ["evalue", "BLAST E-value of the ortholog assignment (0 is a valid value)", "E-value"],
      ["score", "Bit score of the ortholog assignment", "Score"],
      ["eggNOG_OGs", "eggNOG orthologous group lineage", "Orthology lineage"],
      ["max_annot_lvl", "Taxonomic level of the best annotation", "Annotation level"],
      ["COG_category", "COG functional category letter(s)", "COG category"],
      ["Description", "Functional description", "Description"],
      ["Preferred_name", "Preferred protein name", "Preferred name"],
      ["GOs_eggnog", "GO terms assigned by eggNOG", "GO (source)"],
      ["EC", "Enzyme Commission number(s)", "EC number"],
      ["KEGG_ko", "KEGG Orthology ID(s)", "KEGG KO"],
      ["KEGG_Pathway", "KEGG pathway ID(s)", "Pathways"],
      ["KEGG_Module", "KEGG module ID(s)", "Modules"],
      ["KEGG_Reaction", "KEGG reaction ID(s)", "Reactions"],
      ["KEGG_rclass", "KEGG reaction class ID(s)", "Reaction classes"],
      ["BRITE", "KEGG BRITE hierarchy ID(s)", "BRITE"],
      ["KEGG_TC", "Transporter classification ID(s)", "KEGG TC"],
      ["CAZy", "CAZy family annotation", "CAZy"],
      ["BiGG_Reaction", "BiGG metabolic reaction ID(s)", "BiGG reactions"],
      ["PFAMs_eggnog", "Pfam families assigned by eggNOG", "Pfam"],
      ["COG_description", "COG functional description(s)", "COG description"],
      ["GOs_interproscan", "GO terms assigned by InterProScan", "GO (source)"],
      ["GOs_union", "Union of GO terms (both sources)", "GO annotations"],
      ["InterPro_IDs", "InterPro entry ID(s)", "InterPro"],
      ["InterPro_description", "InterPro entry description(s)", "InterPro description"],
      ["Domains", "Domain annotations (database:accession list; no start/end coordinates)", "Domains"],
      ["n_domains", "Number of domain annotations", "Domain count"],
      ["iprscan_hit", "InterProScan hit flag", "InterProScan hit"]
    ];
    var t = '<table class="ortho-table"><thead><tr><th>Source column</th><th>Meaning</th>' +
      "<th>Page field</th></tr></thead><tbody>" +
      mapRows.map(function (m) {
        return "<tr><td class=\"mono\">" + m[0] + "</td><td>" + esc(m[1]) +
          "</td><td>" + esc(m[2]) + "</td></tr>";
      }).join("") + "</tbody></table>";
    return t;
  }

  function openHelp() {
    el.helpBody.innerHTML =
      "<h3>About this page</h3>" +
      "<p>Gene detail pages for the FungalGenDB strain database. One page per gene model " +
      "(one row of the annotation table). Gene records are identified by a composite key: " +
      "<b>Species :: GeneID</b>, because different species may share the same gene ID.</p>" +
      "<h3>Source column → page field mapping</h3>" + renderHelp() +
      "<h3>Data availability</h3><ul>" +
      "<li>The current data file (Example.txt) contains annotation-level fields only.</li>" +
      "<li>No protein / CDS sequences, no domain start-end coordinates and no gene-structure " +
      "(chromosome / strand / exon) data are present; the corresponding modules show explicit " +
      "empty states and are never fabricated.</li>" +
      "<li>GO accessions are listed under <b>Unclassified</b> because the data file does not " +
      "provide Molecular Function / Cellular Component / Biological Process categories, and no " +
      "classification is inferred from accession numbers.</li></ul>" +
      "<h3>External links</h3><ul>" +
      "<li><b>direct</b> — links to an exact database entry (e.g. KEGG KO, InterPro IPR).</li>" +
      "<li><b>search</b> — opens a search query; the local gene ID is not a valid accession " +
      "for that database and is not presented as one.</li></ul>";
    el.helpModal.classList.remove("hidden");
  }

  function closeHelp() {
    el.helpModal.classList.add("hidden");
  }

  /* ============================ 事件绑定 ============================ */

  function bindEvents() {
    // 配置化数据库名称
    el.brandName.textContent = CONFIG.brandName;
    el.brandTag.textContent = CONFIG.brandTag;

    el.btnSearch.addEventListener("click", doSearch);
    el.btnReset.addEventListener("click", resetAll);
    el.sort.addEventListener("change", function () {
      state.sort = el.sort.value;
      state.page = 1;
      renderTable();
    });
    el.q.addEventListener("keydown", function (ev) { if (ev.key === "Enter") doSearch(); });
    [el.nLenMin, el.nLenMax, el.nScoreMin].forEach(function (inp) {
      inp.addEventListener("keydown", function (ev) { if (ev.key === "Enter") doSearch(); });
    });

    // 导航搜索框
    el.navQ.addEventListener("input", function () { navSearch(el.navQ.value); });
    el.navQ.addEventListener("focus", function () { navSearch(el.navQ.value); });
    el.navQ.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter") {
        var first = el.searchDrop.querySelector(".sd-item");
        if (first && !el.searchDrop.hidden) {
          first.click();
        } else {
          el.q.value = el.navQ.value;
          doSearch();
        }
      }
      if (ev.key === "Escape") hideNavDrop();
    });
    document.addEventListener("click", function (ev) {
      if (!el.searchDrop.hidden && !el.searchDrop.contains(ev.target) &&
          ev.target !== el.navQ) hideNavDrop();
    });

    // 全局快捷键："/" 聚焦搜索框；Esc 返回列表
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "/" && !/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) {
        ev.preventDefault();
        el.navQ.focus();
      }
      if (ev.key === "Escape" && state.view === "detail" && el.helpModal.classList.contains("hidden")) {
        showList();
      }
    });

    // Tools 下拉
    var ddBtn = document.querySelector(".dd-btn");
    var dd = document.getElementById("dd-tools");
    ddBtn.addEventListener("click", function (ev) {
      ev.stopPropagation();
      dd.classList.toggle("open");
    });
    document.addEventListener("click", function () { dd.classList.remove("open"); });

    // 导出 / 复制 / 下载 / Help
    el.btnExport.addEventListener("click", exportCurrentTsv);
    el.btnCopy.addEventListener("click", copyCurrentSummary);
    el.navDownload.addEventListener("click", function (ev) {
      ev.preventDefault();
      exportCurrentTsv();
    });
    el.navHelp.addEventListener("click", function (ev) {
      ev.preventDefault();
      openHelp();
    });
    el.helpClose.addEventListener("click", closeHelp);
    el.helpModal.addEventListener("click", function (ev) {
      if (ev.target === el.helpModal) closeHelp();
    });
  }

  /* ============================ 启动 ============================ */

  function init() {
    bindEvents();
    renderCrumb();
    renderTable();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();

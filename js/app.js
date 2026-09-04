/* ============================================
   filll.cn — 主应用逻辑
   SPA 路由、暗色模式、搜索、交互组件
   Author: Jiwen Zhao (https://github.com/CropCoder)
   ============================================ */

import { initPageRenderers } from './page-renderers.js';

// =============================================
// 状态管理
// =============================================
const state = {
  currentRoute: 'home',
  theme: localStorage.getItem('filll-theme') || 'light',
  searchQuery: '',
  charts: {},
};

// =============================================
// 路由系统
// =============================================
const routes = ['home', 'plantpsdb', 'cropcoder', 'scan', 'dashboard'];

function navigate(hash) {
  const route = hash.replace('#', '') || 'home';
  if (!routes.includes(route)) return navigate('home');

  state.currentRoute = route;

  // 更新导航高亮
  document.querySelectorAll('.nav-link').forEach(el => {
    el.classList.toggle('active', el.dataset.nav === route);
  });

  // 更新页面内容
  renderPage(route);

  // 更新 URL hash
  if (window.location.hash !== `#${route}`) {
    history.pushState(null, '', `#${route}`);
  }

  // 关闭搜索面板
  closeSearch();

  // 关闭移动端菜单
  document.getElementById('mainNav').classList.remove('mobile-open');
}

// =============================================
// 页面渲染
// =============================================
function renderPage(route) {
  const main = document.getElementById('mainContent');
  const renderers = initPageRenderers();

  // 滚动到顶部
  window.scrollTo({ top: 0, behavior: 'instant' });

  // 渲染对应页面
  if (renderers[route]) {
    main.innerHTML = renderers[route]();
  } else {
    main.innerHTML = renderers.home();
  }

  // 初始化当前页面的交互
  requestAnimationFrame(() => {
    initPageInteractions(route);
  });
}

// =============================================
// 页面交互初始化（每个页面独有）
// =============================================
function initPageInteractions(route) {
  // 滚动展示动画
  initRevealObserver();

  // 各页面特有功能
  switch (route) {
    case 'home':
      initStatCounters();
      break;
    case 'plantpsdb':
      initStatCounters();
      initAccordion();
      initTabs();
      initCopyDoi();
      break;
    case 'cropcoder':
      break;
    case 'scan':
      initAccordion();
      break;
    case 'dashboard':
      initCharts();
      initStatCounters();
      break;
  }
}

// =============================================
// 滚动展示动画
// =============================================
let revealObserver = null;

function initRevealObserver() {
  if (revealObserver) {
    revealObserver.disconnect();
  }

  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
}

// =============================================
// 数字计数器动画
// =============================================
function initStatCounters() {
  const counters = document.querySelectorAll('.stat-number[data-target]');
  let animated = new Set();

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !animated.has(entry.target)) {
        animated.add(entry.target);
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(el => counterObserver.observe(el));
}

function animateCounter(el) {
  const target = parseInt(el.dataset.target, 10);
  const duration = 1800;
  const start = performance.now();

  function update(now) {
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.floor(eased * target).toLocaleString();
    if (p < 1) requestAnimationFrame(update);
    else el.textContent = target.toLocaleString();
  }
  requestAnimationFrame(update);
}

// =============================================
// 折叠面板 (Accordion)
// =============================================
function initAccordion() {
  document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
      const item = header.closest('.accordion-item');
      const open = item.classList.contains('open');
      // 关闭同组其他项目
      const group = item.closest('.accordion');
      if (group) {
        group.querySelectorAll('.accordion-item.open').forEach(other => {
          if (other !== item) other.classList.remove('open');
        });
      }
      item.classList.toggle('open', !open);
    });
  });
}

// =============================================
// Tab 切换
// =============================================
function initTabs() {
  document.querySelectorAll('.tab-bar').forEach(bar => {
    bar.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.tab;
        const panel = bar.closest('.tab-container');

        bar.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        if (panel) {
          panel.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
          const targetPanel = panel.querySelector(`.tab-panel[data-tab="${target}"]`);
          if (targetPanel) targetPanel.classList.add('active');
        }
      });
    });
  });
}

// =============================================
// 复制 DOI
// =============================================
function initCopyDoi() {
  document.querySelectorAll('.btn-copy').forEach(btn => {
    btn.addEventListener('click', async () => {
      const doi = btn.dataset.doi || '';
      try {
        await navigator.clipboard.writeText(doi);
      } catch {
        const ta = document.createElement('textarea');
        ta.value = doi; ta.style.cssText = 'position:fixed;opacity:0;';
        document.body.appendChild(ta); ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      btn.classList.add('copied');
      const orig = btn.innerHTML;
      btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> 已复制`;
      setTimeout(() => { btn.classList.remove('copied'); btn.innerHTML = orig; }, 2000);
    });
  });
}

// =============================================
// 数据可视化图表 (Chart.js)
// =============================================
function initCharts() {
  if (typeof Chart === 'undefined') {
    // Chart.js 未加载，稍后再试
    setTimeout(initCharts, 500);
    return;
  }

  // 清除旧图表
  Object.values(state.charts).forEach(c => { try { c.destroy(); } catch(e) {} });
  state.charts = {};

  // 物种分布柱状图
  const speciesCtx = document.getElementById('chart-species');
  if (speciesCtx) {
    state.charts.species = new Chart(speciesCtx, {
      type: 'bar',
      data: {
        labels: ['拟南芥', '水稻', '玉米', '大豆', '小麦', '番茄', '大麦', '烟草'],
        datasets: [{
          label: '蛋白质数量',
          data: [4230, 3150, 2780, 1960, 1520, 1280, 950, 820],
          backgroundColor: 'rgba(13,110,158,0.7)',
          borderColor: 'rgba(13,110,158,1)',
          borderWidth: 1,
          borderRadius: 3,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(216,220,227,0.3)' }, ticks: { font: { size: 10 } } },
          x: { grid: { display: false }, ticks: { font: { size: 10 } } }
        }
      }
    });
  }

  // 胁迫类型饼图
  const stressCtx = document.getElementById('chart-stress');
  if (stressCtx) {
    state.charts.stress = new Chart(stressCtx, {
      type: 'doughnut',
      data: {
        labels: ['高温胁迫', '低温胁迫', '干旱胁迫', '盐胁迫', '氧化胁迫', '其他'],
        datasets: [{
          data: [2850, 2310, 1980, 1760, 1240, 860],
          backgroundColor: ['#0d6e9e', '#5a8fbb', '#2d7d46', '#c96a2b', '#b8860b', '#8a8aa0'],
          borderWidth: 0,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right', labels: { boxWidth: 12, padding: 12, font: { size: 10 } } }
        },
        cutout: '55%',
      }
    });
  }

  // 功能分类雷达图
  const funcCtx = document.getElementById('chart-functions');
  if (funcCtx) {
    state.charts.functions = new Chart(funcCtx, {
      type: 'radar',
      data: {
        labels: ['IDR 预测', '液液相分离', '凝聚体形成', '应激颗粒', 'RNA 结合', '分子伴侣'],
        datasets: [{
          label: '已注释蛋白',
          data: [85, 72, 68, 55, 78, 42],
          backgroundColor: 'rgba(13,110,158,0.2)',
          borderColor: 'rgba(13,110,158,1)',
          pointBackgroundColor: 'rgba(13,110,158,1)',
          borderWidth: 2,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            beginAtZero: true, max: 100,
            ticks: { stepSize: 20, font: { size: 9 } },
            grid: { color: 'rgba(216,220,227,0.3)' }
          }
        },
        plugins: { legend: { display: false } }
      }
    });
  }

  // 月度增长折线图
  const growthCtx = document.getElementById('chart-growth');
  if (growthCtx) {
    state.charts.growth = new Chart(growthCtx, {
      type: 'line',
      data: {
        labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
        datasets: [{
          label: '蛋白质条目增长',
          data: [15200, 16100, 17200, 18000, 18800, 19352],
          borderColor: '#0d6e9e',
          backgroundColor: 'rgba(13,110,158,0.08)',
          fill: true,
          tension: 0.3,
          pointRadius: 3,
          pointBackgroundColor: '#0d6e9e',
          borderWidth: 2,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: false, grid: { color: 'rgba(216,220,227,0.3)' }, ticks: { font: { size: 10 } } },
          x: { grid: { display: false }, ticks: { font: { size: 10 } } }
        }
      }
    });
  }
}

// =============================================
// 搜索功能
// =============================================
const searchIndex = [];

function buildSearchIndex() {
  searchIndex.length = 0;
  document.querySelectorAll('[data-search]').forEach(el => {
    const section = el.dataset.section || '';
    const route = el.dataset.route || '';
    searchIndex.push({
      title: el.dataset.search,
      desc: el.dataset.searchDesc || '',
      section,
      route,
      el,
    });
  });
}

function performSearch(query) {
  const q = query.toLowerCase().trim();
  const results = document.getElementById('searchResults');

  if (!q) {
    results.classList.remove('has-results');
    results.innerHTML = '';
    return;
  }

  // 搜索静态内容
  const mainText = document.getElementById('mainContent').textContent;
  const matches = [];

  // 从 searchIndex 中搜索
  searchIndex.forEach(item => {
    if (item.title.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q)) {
      matches.push(item);
    }
  });

  // 再从全部文本搜索段落
  if (matches.length < 8) {
    const lines = mainText.split('\n').filter(l => l.trim().length > 10);
    lines.forEach((line, i) => {
      if (line.toLowerCase().includes(q) && matches.length < 10) {
        const isDuplicate = matches.some(m => m.title === line.trim().slice(0, 40));
        if (!isDuplicate) {
          matches.push({
            title: line.trim().slice(0, 60),
            desc: line.trim().slice(0, 100),
            route: state.currentRoute,
            isContent: true,
          });
        }
      }
    });
  }

  if (matches.length > 0) {
    results.classList.add('has-results');
    results.innerHTML = matches.slice(0, 10).map(m => `
      <div class="search-result-item" data-route="${m.route}" ${m.el ? `data-selector="click"` : ''}>
        ${m.section ? `<span class="result-section">${m.section}</span>` : ''}
        <div class="result-title">${m.title}</div>
        ${m.desc ? `<div class="result-desc">${m.desc}</div>` : ''}
      </div>
    `).join('');

    results.querySelectorAll('.search-result-item').forEach(item => {
      item.addEventListener('click', () => {
        const route = item.dataset.route;
        if (route && routes.includes(route)) {
          navigate(route);
        }
        closeSearch();
      });
    });
  } else {
    results.classList.add('has-results');
    results.innerHTML = `<div class="search-result-item"><div class="result-desc">未找到 "${q}" 相关内容</div></div>`;
  }
}

function openSearch() {
  const panel = document.getElementById('searchPanel');
  const input = document.getElementById('searchInput');
  panel.classList.add('open');
  setTimeout(() => input.focus(), 100);
}

function closeSearch() {
  const panel = document.getElementById('searchPanel');
  const input = document.getElementById('searchInput');
  panel.classList.remove('open');
  input.value = '';
  document.getElementById('searchResults').classList.remove('has-results');
}

// =============================================
// 暗色/浅色模式切换
// =============================================
function setTheme(theme) {
  state.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('filll-theme', theme);

  // 更新图标
  const sunIcon = document.querySelector('.sun-icon');
  const moonIcon = document.querySelector('.moon-icon');
  if (sunIcon && moonIcon) {
    sunIcon.style.display = theme === 'light' ? '' : 'none';
    moonIcon.style.display = theme === 'dark' ? '' : 'none';
  }
}

function toggleTheme() {
  setTheme(state.theme === 'light' ? 'dark' : 'light');
}

// =============================================
// 滚动进度条
// =============================================
function initScrollProgress() {
  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  bar.id = 'scrollProgress';
  document.body.appendChild(bar);

  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.width = `${Math.min(progress, 100)}%`;
  }, { passive: true });
}

// =============================================
// 初始化
// =============================================
document.addEventListener('DOMContentLoaded', () => {
  // 设置主题
  setTheme(state.theme);

  // 路由监听
  window.addEventListener('hashchange', () => {
    navigate(window.location.hash);
  });
  window.addEventListener('popstate', () => {
    navigate(window.location.hash);
  });

  // 导航栏点击
  document.querySelectorAll('[data-nav]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const route = link.dataset.nav;
      navigate(route);
    });
  });

  // 主题切换
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);

  // 搜索
  document.getElementById('searchToggle').addEventListener('click', openSearch);
  document.getElementById('searchClose').addEventListener('click', closeSearch);
  document.getElementById('searchInput').addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    performSearch(e.target.value);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSearch();
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      openSearch();
    }
  });

  // 滚动进度条
  initScrollProgress();

  // 初始导航
  const initialHash = window.location.hash || '#home';
  navigate(initialHash);

  // 延迟构建搜索索引
  setTimeout(buildSearchIndex, 300);
});

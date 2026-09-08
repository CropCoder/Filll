/* ============================================================================
   filll.js — Filll Studio 首页交互逻辑
   ----------------------------------------------------------------------------
   功能：顶部导航 / 移动菜单 / Hero 粒子网络 Canvas / 交叉地图 hover 高亮 /
         滚动 reveal 动画。零依赖，原生实现，支持 file:// 直接打开。
   作者：Jiwen Zhao (https://github.com/CropCoder)
   ============================================================================ */

(function () {
  "use strict";

  /* ============================ 移动端菜单 ============================ */
  var burger = document.getElementById('nav-burger');
  var mobileMenu = document.getElementById('mobile-menu');

  if (burger && mobileMenu) {
    burger.addEventListener('click', function () {
      mobileMenu.classList.toggle('open');
    });
    // 点击菜单项后关闭
    mobileMenu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        mobileMenu.classList.remove('open');
      });
    });
  }

  /* ============================ 滚动 reveal 动画 ============================ */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(function (el) { revealObs.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('visible'); });
  }

  /* ============================ 交叉地图 hover 高亮 ============================ */
  // 每个节点对应高亮其所有邻接边；简化处理：hover 节点时高亮所有连接到它的边
  var mapEdges = document.querySelectorAll('.map-edge');
  var mapNodes = document.querySelectorAll('.map-node');

  mapNodes.forEach(function (node) {
    var id = node.getAttribute('data-node');

    node.addEventListener('mouseenter', function () {
      node.classList.add('hover');
      mapEdges.forEach(function (edge) {
        var a = edge.getAttribute('data-a');
        var b = edge.getAttribute('data-b');
        if (a === id || b === id) edge.classList.add('hover');
      });
    });

    node.addEventListener('mouseleave', function () {
      node.classList.remove('hover');
      mapEdges.forEach(function (edge) { edge.classList.remove('hover'); });
    });
  });

  /* ============================ Hero 粒子网络 ============================ */
  var canvas = document.getElementById('hero-particles');
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext('2d');
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var lowPerf = window.innerWidth < 768 || reduced;

    var W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    var NODE_COUNT = lowPerf ? 42 : 88;
    var LINK_DIST = lowPerf ? 120 : 150;
    var nodes = [];
    var mouse = { x: -9999, y: -9999 };

    // 配色：以 lime / cyan / purple 为主，低透明度形成生物网络
    var COLORS = [
      [183, 243, 107], // lime
      [120, 220, 232], // cyan
      [145, 139, 255], // purple
      [101, 214, 154]  // green
    ];

    function rand(min, max) { return Math.random() * (max - min) + min; }

    function initNodes() {
      nodes = [];
      for (var i = 0; i < NODE_COUNT; i++) {
        nodes.push({
          x: rand(0, W),
          y: rand(0, H),
          vx: rand(-0.25, 0.25),
          vy: rand(-0.25, 0.25),
          r: rand(1.2, 2.6),
          c: COLORS[(Math.random() * COLORS.length) | 0],
          phase: rand(0, Math.PI * 2),
          amp: rand(0.3, 1.0)
        });
      }
    }

    function resize() {
      var rect = canvas.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initNodes();
    }

    function draw(t) {
      ctx.clearRect(0, 0, W, H);

      var i, j, a, b, dx, dy, dist, alpha;

      // 移动节点（带轻微正弦漂移 + 边界反弹）
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        a.x += a.vx + Math.sin(t * 0.0004 + a.phase) * 0.04 * a.amp;
        a.y += a.vy + Math.cos(t * 0.0004 + a.phase) * 0.04 * a.amp;
        if (a.x < -10) a.x = W + 10; else if (a.x > W + 10) a.x = -10;
        if (a.y < -10) a.y = H + 10; else if (a.y > H + 10) a.y = -10;
      }

      // 连线
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        for (j = i + 1; j < nodes.length; j++) {
          b = nodes[j];
          dx = a.x - b.x; dy = a.y - b.y;
          dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < LINK_DIST) {
            alpha = (1 - dist / LINK_DIST) * 0.28;
            ctx.strokeStyle = 'rgba(183, 243, 107, ' + alpha.toFixed(3) + ')';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // 节点 + 鼠标吸引发光
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        var glow = 0;
        var mx = a.x - mouse.x, my = a.y - mouse.y;
        var md = Math.sqrt(mx * mx + my * my);
        if (md < 120) glow = (1 - md / 120) * 0.9;

        ctx.beginPath();
        ctx.arc(a.x, a.y, a.r + glow * 1.6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + a.c[0] + ',' + a.c[1] + ',' + a.c[2] + ',' +
          (0.5 + glow * 0.5).toFixed(3) + ')';
        ctx.fill();
      }
    }

    var running = true;
    var startTime = performance.now();

    function loop() {
      if (!running) return;
      draw(performance.now() - startTime);
      requestAnimationFrame(loop);
    }

    // 指针位置（canvas 局部坐标）
    function onMove(e) {
      var rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    }

    resize();
    window.addEventListener('resize', resize);
    canvas.parentElement.addEventListener('mousemove', onMove);
    canvas.parentElement.addEventListener('mouseleave', function () {
      mouse.x = mouse.y = -9999;
    });

    // 尊重减少动态偏好：仍绘制静态网络，但不启动动画循环
    if (reduced) {
      draw(0);
    } else {
      requestAnimationFrame(loop);
    }

    // 页面不可见时暂停
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { running = false; }
      else if (!reduced) { running = true; requestAnimationFrame(loop); }
    });
  }

  /* ============================ 导航点击平滑滚动 ============================ */
  // html 已设置 scroll-behavior: smooth，无需额外处理；仅处理 hash 空链接
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
})();

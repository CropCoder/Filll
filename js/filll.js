/* ============================================================================
   filll.js — Filll Studio 首页交互逻辑
   ----------------------------------------------------------------------------
   功能：顶部导航 / 移动菜单 / 滚动 reveal 动画。零依赖，原生实现。
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

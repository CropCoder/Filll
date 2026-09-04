/* ============================================
   PlantPSDB — Apple-style Interactions
   Scroll reveal, counters, copy, mouse tracking
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // --- Navbar scroll effect ---
  const nav = document.getElementById('nav');
  let navTicking = false;

  function updateNav() {
    if (window.scrollY > 10) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
    navTicking = false;
  }

  window.addEventListener('scroll', () => {
    if (!navTicking) {
      requestAnimationFrame(updateNav);
      navTicking = true;
    }
  }, { passive: true });

  // --- Scroll Reveal Observer ---
  const revealEls = document.querySelectorAll('.reveal');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -32px 0px',
  });

  revealEls.forEach(el => revealObserver.observe(el));

  // --- Counter animation ---
  const statNumbers = document.querySelectorAll('.stat-number');
  let countersAnimated = false;

  function animateCounter(el) {
    const target = parseInt(el.getAttribute('data-target'), 10);
    const duration = 2000;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(eased * target);
      el.textContent = current.toLocaleString();
      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        el.textContent = target.toLocaleString();
      }
    }
    requestAnimationFrame(update);
  }

  function checkCounters() {
    if (countersAnimated) return;
    const statsSection = document.querySelector('.stats');
    if (!statsSection) return;
    const rect = statsSection.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.8) {
      countersAnimated = true;
      statNumbers.forEach(el => animateCounter(el));
    }
  }

  window.addEventListener('scroll', () => {
    if (!countersAnimated) checkCounters();
  }, { passive: true });
  checkCounters();

  // --- Mouse tracking for feature card glow ---
  const featureCards = document.querySelectorAll('.feature-card');
  featureCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  });

  // --- Copy DOI ---
  const btnCopy = document.getElementById('btnCopy');
  if (btnCopy) {
    btnCopy.addEventListener('click', () => {
      const doi = btnCopy.getAttribute('data-doi');
      navigator.clipboard.writeText(doi).then(() => {
        btnCopy.classList.add('copied');
        const originalHTML = btnCopy.innerHTML;
        btnCopy.innerHTML = `
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
          已复制
        `;
        setTimeout(() => {
          btnCopy.classList.remove('copied');
          btnCopy.innerHTML = originalHTML;
        }, 2000);
      }).catch(() => {
        const ta = document.createElement('textarea');
        ta.value = doi;
        ta.style.cssText = 'position:fixed;opacity:0;';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch (err) {}
        document.body.removeChild(ta);
        btnCopy.textContent = '已复制';
        setTimeout(() => { btnCopy.textContent = '复制 DOI'; }, 2000);
      });
    });
  }
});

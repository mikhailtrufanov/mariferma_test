/* Shared page interactions. No request is sent by the order forms yet. */
(() => {
  const header = document.querySelector('.hdr');
  const updateHeader = () => header?.classList.toggle('scrolled', scrollY > 10);
  addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();

  document.querySelectorAll('.hero-slider, .gallery-main, .lead-slider').forEach(gallery => {
    const track = gallery.querySelector('.hero-track, .lead-track');
    const slides = [...gallery.querySelectorAll('.hero-slide, .lead-slide, .gslide')];
    if (!slides.length) return;
    const dotsWrap = gallery.querySelector('.hero-dots');
    const thumbs = [...gallery.parentElement.querySelectorAll('.gthumb')];
    if (dotsWrap) {
      dotsWrap.replaceChildren(...slides.map(() => document.createElement('span')));
      dotsWrap.setAttribute('aria-hidden', 'true');
    }
    let index = 0;
    const go = value => {
      index = (value + slides.length) % slides.length;
      const current = slides[index];
      if (current.dataset.bg) {
        current.style.backgroundImage = `url('${current.dataset.bg}')`;
        delete current.dataset.bg;
      }
      if (track) track.style.transform = `translateX(${-index * 100}%)`;
      else slides.forEach((slide, i) => slide.classList.toggle('on', i === index));
      thumbs.forEach((thumb, i) => thumb.classList.toggle('on', i === index));
      if (dotsWrap) [...dotsWrap.children].forEach((dot, i) => dot.classList.toggle('on', i === index));
    };
    const previous = gallery.querySelector('[id$="Prev"]');
    const next = gallery.querySelector('[id$="Next"]');
    if (previous) previous.onclick = () => go(index - 1);
    if (next) next.onclick = () => go(index + 1);
    thumbs.forEach((thumb, i) => { thumb.onclick = () => go(i); });
    go(0);
  });

  const optButton = document.getElementById('mode-opt');
  const retailButton = document.getElementById('mode-retail');
  if (optButton && retailButton) {
    const setMode = mode => {
      const opt = mode === 'opt';
      optButton.setAttribute('aria-pressed', String(opt));
      retailButton.setAttribute('aria-pressed', String(!opt));
      document.querySelectorAll('[data-opt][data-retail]').forEach(element => {
        element.textContent = element.dataset[mode];
      });
      const priceOpt = document.getElementById('priceOpt');
      const priceRet = document.getElementById('priceRet');
      if (priceOpt) priceOpt.hidden = !opt;
      if (priceRet) priceRet.hidden = opt;
      ['retailDesc', 'retailNote'].forEach(id => { const element = document.getElementById(id); if (element) element.hidden = opt; });
      document.getElementById('del-opt')?.classList.toggle('active', opt);
      document.getElementById('del-retail')?.classList.toggle('active', !opt);
    };
    optButton.onclick = () => setMode('opt');
    retailButton.onclick = () => setMode('retail');
    document.getElementById('heroRetail')?.addEventListener('click', () => setMode('retail'));
    setMode('opt');
  }

  const loadBackground = element => {
    if (!element.dataset.bg) return;
    element.style.backgroundImage = `url('${element.dataset.bg}')`;
    delete element.dataset.bg;
  };
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { loadBackground(entry.target); observer.unobserve(entry.target); }
    }), { rootMargin: '300px 0px', threshold: 0.01 });
    document.querySelectorAll('.lazy-bg[data-bg]').forEach(element => observer.observe(element));
  } else document.querySelectorAll('.lazy-bg[data-bg]').forEach(loadBackground);
})();

    (() => {
      const header = document.querySelector('.hdr');
      const menu = header?.querySelector('.nav');
      const burger = header?.querySelector('.burger');
      const compact = matchMedia('(max-width: 1120px)');
      if (menu && burger) {
        header.classList.add('menu-ready');
        const closeMenu = (restoreFocus = false) => {
          menu.classList.remove('is-open');
          burger.setAttribute('aria-expanded', 'false');
          burger.setAttribute('aria-label', 'Открыть меню');
          if (restoreFocus) burger.focus();
        };
        burger.addEventListener('click', () => {
          const open = !menu.classList.contains('is-open');
          menu.classList.toggle('is-open', open);
          burger.setAttribute('aria-expanded', String(open));
          burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
        });
        menu.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(true); });
        document.addEventListener('keydown', event => {
          if (event.key === 'Escape' && menu.classList.contains('is-open')) closeMenu(true);
        });
        document.addEventListener('click', event => { if (!header.contains(event.target)) closeMenu(); });
        header.addEventListener('focusout', event => { if (!header.contains(event.relatedTarget)) closeMenu(); });
        compact.addEventListener('change', () => closeMenu(menu.contains(document.activeElement) && compact.matches));
      }

      // Gestures reuse each gallery's existing arrow handlers and lazy loading.
      document.querySelectorAll('.hero-slider, .gallery-main, .lead-slider').forEach(gallery => {
        const previous = gallery.querySelector('[id$="Prev"]');
        const next = gallery.querySelector('[id$="Next"]');
        if (!previous || !next) return;
        let start = null;
        gallery.addEventListener('pointerdown', event => {
          if (!event.isPrimary) { start = null; return; }
          if (event.button !== 0 || event.target.closest('button, a')) return;
          start = { id: event.pointerId, x: event.clientX, y: event.clientY };
          gallery.setPointerCapture(event.pointerId);
        });
        gallery.addEventListener('pointerup', event => {
          if (!start || event.pointerId !== start.id) return;
          const dx = event.clientX - start.x, dy = event.clientY - start.y;
          start = null;
          if (gallery.hasPointerCapture(event.pointerId)) gallery.releasePointerCapture(event.pointerId);
          if (Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy) * 1.5) (dx < 0 ? next : previous).click();
        });
        gallery.addEventListener('pointercancel', () => { start = null; });
        gallery.addEventListener('lostpointercapture', () => { start = null; });
        gallery.addEventListener('keydown', event => {
          if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault(); (event.key === 'ArrowLeft' ? previous : next).click();
          }
        });
        gallery.tabIndex = 0;
        gallery.setAttribute('role', 'region');
        gallery.setAttribute('aria-label', gallery.getAttribute('aria-label') || 'Фотографии: листайте свайпом или стрелками');
        const thumbs = gallery.parentElement.querySelectorAll('.gthumb');
        const status = document.createElement('p');
        status.className = 'gallery-status'; status.setAttribute('aria-live', 'polite'); status.setAttribute('aria-atomic', 'true');
        gallery.after(status);
        const update = () => {
          const dots = gallery.querySelectorAll('.hero-dots span');
          const slides = gallery.querySelectorAll('.hero-slide, .lead-slide, .gslide');
          const active = thumbs.length ? [...thumbs].findIndex(t => t.classList.contains('on')) :
            dots.length ? [...dots].findIndex(d => d.classList.contains('on')) : [...slides].findIndex(s => s.classList.contains('on'));
          status.textContent = `Фото ${Math.max(0, active) + 1} из ${slides.length}`;
          thumbs.forEach(t => t.setAttribute('aria-pressed', String(t.classList.contains('on'))));
        };
        previous.addEventListener('click', update); next.addEventListener('click', update);
        thumbs.forEach(t => t.addEventListener('click', update)); update();
      });

      const form = document.querySelector('.form');
      const modeInput = form?.querySelector('[name="purchase-mode"]');
      const direction = form?.querySelector('[name="direction"]');
      const productInput = form?.querySelector('[name="product"]');
      const retailButton = document.getElementById('mode-retail');
      const optButton = document.getElementById('mode-opt');
      const syncMode = () => {
        const mode = retailButton?.getAttribute('aria-pressed') === 'true' ? 'retail' : 'opt';
        if (modeInput) modeInput.value = mode === 'retail' ? 'В розницу' : 'Оптом';
        document.querySelectorAll('.prod .more, .relcard, .crumbs a[href*="#products"]').forEach(link => {
          const url = new URL(link.href, location.href);
          url.searchParams.set('mode', mode); link.href = url.href;
        });
      };
      optButton?.addEventListener('click', syncMode);
      retailButton?.addEventListener('click', syncMode);
      document.getElementById('heroRetail')?.addEventListener('click', syncMode);
      document.querySelectorAll('[data-purchase-mode]').forEach(link => link.addEventListener('click', () => {
        (link.dataset.purchaseMode === 'retail' ? retailButton : optButton)?.click();
        if (productInput && link.dataset.orderProduct) productInput.value = link.dataset.orderProduct;
      }));
      modeInput?.addEventListener('change', () => { (modeInput.value === 'В розницу' ? retailButton : optButton)?.click(); });
      if (new URLSearchParams(location.search).get('mode') === 'retail') retailButton?.click();
      syncMode();
      document.querySelectorAll('.prod .req').forEach(link => link.addEventListener('click', () => {
        if (productInput) productInput.value = link.closest('.prod').querySelector('.pname').textContent.trim();
        if (direction) direction.value = 'Продукция фермы';
        syncMode();
      }));
    })();
  
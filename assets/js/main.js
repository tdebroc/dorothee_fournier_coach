(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---------- Hero title: split into animated letters ---------- */
  const title = $('[data-split]');
  if (title) {
    const label = title.textContent.trim();
    let i = 0;
    title.setAttribute('aria-label', label);
    title.innerHTML = label.split(' ').map(word =>
      `<span class="word" aria-hidden="true">${[...word].map(ch => `<span class="char" style="--i:${i++}">${ch}</span>`).join('')}</span>`
    ).join(' ');
  }

  /* ---------- Nav: scrolled state, hide on scroll down, progress ---------- */
  const nav = $('.nav');
  const bar = $('.progress span');
  const hero = $('.hero');
  let lastY = window.scrollY;

  const onScroll = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    nav.classList.toggle('is-scrolled', y > 40);
    const pastHero = y > hero.offsetHeight * .8;
    if (!nav.classList.contains('is-open')) {
      nav.classList.toggle('is-hidden', pastHero && y > lastY + 4);
      if (y < lastY - 4 || !pastHero) nav.classList.remove('is-hidden');
    }
    lastY = y;
  };

  /* ---------- Mobile menu ---------- */
  const toggle = $('.nav__toggle');
  $$('.nav__menu li').forEach((li, i) => li.style.setProperty('--i', i));
  const setMenu = open => {
    nav.classList.remove('is-hidden');
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open);
    toggle.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    document.body.style.overflow = open ? 'hidden' : '';
  };
  toggle.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  $$('.nav__menu a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  /* ---------- Reveal on scroll ---------- */
  const ridge = $('.ridge path');
  if (ridge) ridge.parentElement.style.setProperty('--len', Math.ceil(ridge.getTotalLength()));

  const revealTargets = $$('.reveal, .ridge, .process__step');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });
    revealTargets.forEach(el => io.observe(el));
  } else {
    revealTargets.forEach(el => el.classList.add('is-visible'));
  }

  /* ---------- Active section in nav ---------- */
  const links = new Map($$('.nav__menu a[href^="#"]').map(a => [a.getAttribute('href').slice(1), a]));
  const spy = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      links.forEach(a => a.classList.remove('is-active'));
      links.get(entry.target.id)?.classList.add('is-active');
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id], .hero').forEach(s => spy.observe(s));

  /* ---------- Parallax ---------- */
  const layers = reduceMotion ? [] : $$('[data-parallax]');
  const parallax = () => {
    const vh = innerHeight;
    layers.forEach(el => {
      const box = el.parentElement.getBoundingClientRect();
      if (box.bottom < -100 || box.top > vh + 100) return;
      const speed = parseFloat(el.dataset.parallax);
      const offset = (box.top + box.height / 2 - vh / 2) * -speed;
      el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
    });
  };

  let ticking = false;
  const frame = () => {
    onScroll();
    parallax();
    ticking = false;
  };
  const request = () => {
    if (!ticking) { ticking = true; requestAnimationFrame(frame); }
  };
  addEventListener('scroll', request, { passive: true });
  addEventListener('resize', request);
  frame();

  /* ---------- Strategy filters ---------- */
  const filters = $$('.filter');
  const strategies = $$('.strategy');
  filters.forEach(btn => btn.addEventListener('click', () => {
    const type = btn.dataset.filter;
    filters.forEach(b => {
      b.classList.toggle('is-active', b === btn);
      b.setAttribute('aria-pressed', b === btn);
    });
    strategies.forEach(card => {
      const show = type === 'all' || card.dataset.type === type;
      if (show) {
        card.classList.remove('is-hidden');
        card.classList.add('is-visible');
        requestAnimationFrame(() => requestAnimationFrame(() => card.classList.remove('is-hiding')));
      } else {
        card.classList.add('is-hiding');
        setTimeout(() => card.classList.contains('is-hiding') && card.classList.add('is-hidden'), reduceMotion ? 0 : 400);
      }
    });
  }));

  /* ---------- Testimonials slider ---------- */
  const slider = $('.slider');
  if (slider) {
    const slides = $$('.slide', slider);
    const dotsWrap = $('.slider__dots');
    const controls = $('.slider__controls');
    const DURATION = 7000;
    let index = 0;
    let timer = null;
    let paused = false;

    controls.style.setProperty('--slide-ms', `${DURATION}ms`);
    const dots = slides.map((_, i) => {
      const b = document.createElement('button');
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-label', `Témoignage ${i + 1}`);
      b.addEventListener('click', () => go(i, true));
      dotsWrap.appendChild(b);
      return b;
    });

    const go = (n, user = false) => {
      index = (n + slides.length) % slides.length;
      slides.forEach((s, i) => {
        s.classList.toggle('is-active', i === index);
        s.setAttribute('aria-hidden', i !== index);
      });
      dots.forEach((d, i) => {
        d.setAttribute('aria-selected', 'false');
        if (i === index) {
          void d.offsetWidth;
          d.setAttribute('aria-selected', 'true');
        }
      });
      if (user) restart();
    };

    const restart = () => {
      clearInterval(timer);
      if (!reduceMotion && !paused) timer = setInterval(() => go(index + 1), DURATION);
    };

    const setPaused = p => {
      paused = p;
      controls.classList.toggle('is-paused', p);
      if (p) clearInterval(timer); else restart();
    };

    $$('.slider__btn').forEach(b => b.addEventListener('click', () => go(index + Number(b.dataset.dir), true)));
    const section = slider.closest('section');
    section.addEventListener('mouseenter', () => setPaused(true));
    section.addEventListener('mouseleave', () => setPaused(false));
    section.addEventListener('focusin', () => setPaused(true));
    section.addEventListener('focusout', () => setPaused(false));
    section.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') go(index + 1, true);
      if (e.key === 'ArrowLeft') go(index - 1, true);
    });

    let touchX = null;
    slider.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
    slider.addEventListener('touchend', e => {
      if (touchX === null) return;
      const dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1), true);
      touchX = null;
    });

    go(0);
    restart();
  }

  /* ---------- Accordion ---------- */
  $$('.acc__btn').forEach(btn => {
    const panel = document.getElementById(btn.getAttribute('aria-controls'));
    const sync = () => panel.classList.toggle('is-open', btn.getAttribute('aria-expanded') === 'true');
    sync();
    btn.addEventListener('click', () => {
      btn.setAttribute('aria-expanded', btn.getAttribute('aria-expanded') !== 'true');
      sync();
    });
  });
})();

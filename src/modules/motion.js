// Every GSAP animation on the page: boot screen, hero entrance, scroll reveals, rating bars,
// odometers, the horizontal "season select" and the DeuceTennis draft announcement.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { $, $$ } from '../lib/dom.js';

gsap.registerPlugin(ScrollTrigger, SplitText);

/* ---------- helpers ---------- */
function setScrollbarVar() {
  const sbw = window.innerWidth - document.documentElement.clientWidth;
  document.documentElement.style.setProperty('--sbw', `${Math.max(0, sbw)}px`);
}

function countUp(el, { duration = 1.6, delay = 0 } = {}) {
  const end = parseFloat(el.dataset.count);
  if (Number.isNaN(end)) return;
  const state = { v: 0 };
  el.textContent = '0';
  gsap.to(state, {
    v: end,
    duration,
    delay,
    ease: 'power3.out',
    onUpdate: () => {
      el.textContent = Math.round(state.v).toLocaleString('en-US');
    },
  });
}

/* ---------- odometers (career totals) ---------- */
function buildOdometers() {
  $$('[data-odo]').forEach((el) => {
    const value = el.dataset.odo;
    el.textContent = '';
    el.classList.add('odo');
    const sr = document.createElement('span');
    sr.className = 'sr-only';
    sr.textContent = value;
    el.append(sr);
    for (const ch of value) {
      if (/\d/.test(ch)) {
        const col = document.createElement('span');
        col.className = 'odo__col';
        col.dataset.d = ch;
        col.setAttribute('aria-hidden', 'true');
        const strip = document.createElement('span');
        strip.className = 'odo__strip';
        strip.innerHTML = '01234567890123456789'
          .split('')
          .map((d) => `<span>${d}</span>`)
          .join('');
        col.append(strip);
        el.append(col);
      } else {
        const sep = document.createElement('span');
        sep.textContent = ch;
        sep.setAttribute('aria-hidden', 'true');
        el.append(sep);
      }
    }
  });
}

function rollOdometers(root) {
  $$('.odo__col', root).forEach((col, i) => {
    const strip = col.firstElementChild;
    strip.style.transitionDelay = `${(i * 0.06).toFixed(2)}s`;
    strip.style.transform = `translateY(-${Number(col.dataset.d) + 10}em)`;
  });
}

/* ---------- boot screen ---------- */
function intro(lenis) {
  const el = $('[data-intro]');
  const root = document.documentElement;
  if (!el || !root.classList.contains('intro-on')) {
    el?.remove();
    root.classList.remove('intro-on');
    return Promise.resolve();
  }
  try {
    sessionStorage.setItem('jm-intro', '1');
  } catch {
    /* private mode: the intro just plays again next time */
  }
  lenis?.stop();
  root.style.overflow = 'hidden';

  return new Promise((resolve) => {
    let released = false;
    const release = () => {
      if (!released) {
        released = true;
        resolve();
      }
    };
    const tl = gsap.timeline({
      onComplete: () => {
        el.remove();
        root.classList.remove('intro-on');
        root.style.overflow = '';
        lenis?.start();
        release();
      },
    });
    tl.from('.intro__ball', { y: -90, duration: 0.75, ease: 'bounce.out' })
      .from('.intro__eyebrow, .intro__title, .intro__tip', { y: 14, opacity: 0, duration: 0.5, stagger: 0.06, ease: 'power3.out' }, 0.1)
      .to('.intro__bar span', { scaleX: 1, duration: 1.0, ease: 'power2.inOut' }, 0.2)
      .add(release, '+=0.05')
      .to(el, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.75, ease: 'expo.inOut' }, '<');

    const skip = () => tl.progress(1);
    el.addEventListener('click', skip, { once: true });
    window.addEventListener('keydown', skip, { once: true });
  });
}

/* ---------- hero entrance ---------- */
function heroIn() {
  const chars = SplitText.create('.hero__line', { type: 'chars' }).chars;
  // Un-hide first so every .from() below records opacity 1 as its end value.
  gsap.set('[data-hero-in]', { opacity: 1 });
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  tl.from('.court__lines path', { strokeDashoffset: 1, duration: 2, ease: 'power2.inOut', stagger: 0.06 }, 0)
    .from('.hero__eyebrow', { y: 18, opacity: 0, duration: 0.8 }, 0.05)
    .from(chars, { yPercent: 115, opacity: 0, rotate: 5, duration: 1.1, stagger: 0.035 }, 0.1)
    .from('.hero__meta', { y: 18, opacity: 0, duration: 0.8 }, 0.45)
    .from('.hero__lead', { y: 22, opacity: 0, duration: 0.9 }, 0.55)
    .from('.hero__ctas', { y: 22, opacity: 0, duration: 0.9 }, 0.65)
    .from('.card3d', { rotateY: -70, rotateX: 8, y: 70, opacity: 0, duration: 1.6 }, 0.15)
    .from('.hero__hint', { opacity: 0, duration: 0.6 }, 1.1)
    .from('.ticker', { yPercent: 100, opacity: 0, duration: 0.9 }, 0.7);
  $$('.pcard [data-count]').forEach((el, i) => countUp(el, { duration: 1.4, delay: 0.55 + i * 0.05 }));
}

/* ---------- section titles + generic reveals ---------- */
function titles() {
  $$('[data-split]').forEach((el) => {
    SplitText.create(el, {
      type: 'words',
      autoSplit: true,
      onSplit(self) {
        return gsap.from(self.words, {
          y: 46,
          opacity: 0,
          rotateX: -35,
          duration: 1,
          ease: 'expo.out',
          stagger: 0.05,
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        });
      },
    });
  });
}

function reveals() {
  const items = $$('[data-reveal]');
  gsap.set(items, { opacity: 0, y: 36 });
  ScrollTrigger.batch(items, {
    start: 'top 90%',
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: 'expo.out',
        stagger: 0.07,
        overwrite: true,
        clearProps: 'transform,opacity',
      }),
  });
}

/* ---------- 01 attributes + totals ---------- */
function attributes() {
  $$('.attr').forEach((card) => {
    const bar = $('.attr__bar span', card);
    const num = $('.attr__val', card);
    const value = Number(card.dataset.value);
    gsap.set(bar, { scaleX: 0 });
    num.textContent = '0';
    ScrollTrigger.create({
      trigger: card,
      start: 'top 86%',
      once: true,
      onEnter: () => {
        gsap.to(bar, { scaleX: 1, duration: 1.6, delay: 0.15, ease: 'expo.out' });
        const state = { v: 0 };
        gsap.to(state, {
          v: value,
          duration: 1.6,
          delay: 0.15,
          ease: 'expo.out',
          onUpdate: () => {
            num.textContent = Math.round(state.v);
          },
        });
      },
    });
  });

  const totals = $('.totals');
  if (totals) {
    ScrollTrigger.create({ trigger: totals, start: 'top 85%', once: true, onEnter: () => rollOdometers(totals) });
  }
}

/* ---------- 03 career: season select ---------- */
function seasons(lenis) {
  const root = $('[data-seasons]');
  if (!root) return;
  const track = $('.seasons__track', root);
  const panels = $$('.season', root);
  const tabs = $$('.rail__tab', root);
  const fill = $('.rail__fill', root);
  const dots = $$('.fo__dots i', root);
  const mm = gsap.matchMedia();

  mm.add('(min-width: 1100px) and (min-height: 700px)', () => {
    root.classList.add('is-horizontal');
    setScrollbarVar();
    const distance = () => Math.max(0, track.scrollWidth - document.documentElement.clientWidth);
    const tween = gsap.to(track, { x: () => -distance(), ease: 'none' });
    const st = ScrollTrigger.create({
      trigger: root,
      start: 'top top',
      end: () => `+=${distance()}`,
      pin: true,
      scrub: 0.8,
      animation: tween,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate(self) {
        fill.style.transform = `scaleX(${self.progress})`;
        const active = Math.round(self.progress * (panels.length - 1));
        tabs.forEach((t, k) => t.classList.toggle('is-active', k === active));
      },
    });

    panels.forEach((panel) => {
      gsap.from($$('[data-s-in]', panel), {
        y: 50,
        opacity: 0,
        duration: 0.8,
        ease: 'expo.out',
        stagger: 0.06,
        scrollTrigger: { trigger: panel, containerAnimation: tween, start: 'left 70%', toggleActions: 'play none none reverse' },
      });
      const num = $('.season__num', panel);
      gsap.fromTo(num, { xPercent: 40 }, {
        xPercent: -40,
        ease: 'none',
        scrollTrigger: { trigger: panel, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true },
      });
    });
    if (dots.length) {
      gsap.from(dots, {
        scale: 0,
        opacity: 0.2,
        duration: 0.4,
        stagger: { each: 0.03, from: 'random' },
        scrollTrigger: { trigger: panels[2], containerAnimation: tween, start: 'left 55%', once: true },
      });
    }

    const jump = (e) => {
      const i = Number(e.currentTarget.dataset.i);
      const y = st.start + (st.end - st.start) * (i / (panels.length - 1));
      if (lenis) lenis.scrollTo(y, { duration: 1.2 });
      else window.scrollTo({ top: y, behavior: 'smooth' });
    };
    tabs.forEach((t) => t.addEventListener('click', jump));

    return () => {
      root.classList.remove('is-horizontal');
      tabs.forEach((t) => t.removeEventListener('click', jump));
    };
  });

  mm.add('(max-width: 1099px), (max-height: 699px)', () => {
    panels.forEach((panel) => {
      gsap.from($$('[data-s-in]', panel), {
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: 'expo.out',
        stagger: 0.06,
        scrollTrigger: { trigger: panel, start: 'top 82%', once: true },
      });
    });
    if (dots.length) {
      gsap.from(dots, {
        scale: 0,
        opacity: 0.2,
        duration: 0.4,
        stagger: { each: 0.03, from: 'random' },
        scrollTrigger: { trigger: dots[0].parentElement, start: 'top 90%', once: true },
      });
    }
  });
}

/* ---------- 04 the draft ---------- */
function draft() {
  const spot = $('.spotlight');
  if (!spot) return;
  const withLine = $('[data-spot-with]', spot);
  const chars = SplitText.create(withLine, { type: 'chars' }).chars;
  gsap
    .timeline({ scrollTrigger: { trigger: spot, start: 'top 72%', once: true } })
    .from(chars, { opacity: 0, duration: 0.01, stagger: 0.028, ease: 'none' })
    .from('.spotlight__logo', { scale: 0.55, opacity: 0, filter: 'blur(14px)', duration: 0.9, ease: 'back.out(1.6)' }, '+=0.15')
    .from('.spotlight__ambient', { opacity: 0, duration: 1.2 }, '<');

  gsap.fromTo('.spotlight__ambient', { yPercent: -8 }, {
    yPercent: 10,
    ease: 'none',
    scrollTrigger: { trigger: spot, start: 'top bottom', end: 'bottom top', scrub: true },
  });

  const stats = $('.dstats');
  if (stats) {
    ScrollTrigger.create({
      trigger: stats,
      start: 'top 85%',
      once: true,
      onEnter: () => $$('[data-count]', stats).forEach((el, i) => countUp(el, { duration: 1.6, delay: i * 0.05 })),
    });
  }
}

/* ---------- 06 scouting stamp ---------- */
function stamp() {
  const s = $('[data-stamp]');
  if (!s) return;
  gsap.from(s, {
    scale: 2.6,
    opacity: 0,
    rotate: -14,
    duration: 0.5,
    ease: 'back.out(2.2)',
    scrollTrigger: { trigger: '.report', start: 'top 62%', once: true },
    onComplete: () => gsap.fromTo('.report', { x: -4 }, { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)', clearProps: 'transform' }),
  });
}

/* ---------- entry ---------- */
export function initMotion({ lenis, reduce }) {
  setScrollbarVar();
  window.addEventListener('resize', setScrollbarVar);

  if (reduce) {
    $('[data-intro]')?.remove();
    document.documentElement.classList.remove('intro-on');
    return;
  }

  buildOdometers();
  titles();
  reveals();
  attributes();
  seasons(lenis);
  draft();
  stamp();
  intro(lenis).then(heroIn);

  let pending;
  document.addEventListener('layout:changed', () => {
    clearTimeout(pending);
    pending = setTimeout(() => ScrollTrigger.refresh(), 150);
  });
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener('load', () => ScrollTrigger.refresh());
}

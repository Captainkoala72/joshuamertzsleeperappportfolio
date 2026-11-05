// Fixed nav: smooth anchor jumps, mobile menu, active-section highlight and the scroll progress bar.
import { $, $$, reduceMotion } from '../lib/dom.js';

export function initNav(lenis) {
  const nav = $('[data-nav]');
  const toggle = $('.nav__toggle');
  const menu = $('#mobile-menu');
  const bar = $('[data-progress]');
  const links = $$('.nav__links a');

  const setMenu = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.hidden = !open;
    if (open) lenis?.stop();
    else lenis?.start();
  };
  toggle.addEventListener('click', () => setMenu(menu.hidden));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !menu.hidden) {
      setMenu(false);
      toggle.focus();
    }
  });
  window.matchMedia('(min-width: 961px)').addEventListener('change', (e) => {
    if (e.matches && !menu.hidden) setMenu(false);
  });

  // In-page links scroll smoothly and leave focus on the section they land on.
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const hash = a.getAttribute('href');
    if (hash.length < 2) return;
    const target = document.getElementById(hash.slice(1));
    if (!target) return;
    e.preventDefault();
    if (!menu.hidden) setMenu(false);
    const toTop = hash === '#top';
    if (lenis) {
      lenis.scrollTo(toTop ? 0 : target, { offset: toTop ? 0 : -(nav.offsetHeight + 12), duration: 1.4 });
    } else {
      target.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'start' });
    }
    history.replaceState(null, '', hash);
    if (!toTop) {
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }
  });

  // Nav background + progress bar
  const onScroll = (y, progress) => {
    nav.classList.toggle('is-scrolled', y > 12);
    bar.style.transform = `scaleX(${Math.min(1, Math.max(0, progress))})`;
  };
  if (lenis) {
    lenis.on('scroll', (l) => onScroll(l.scroll, l.progress));
  } else {
    const read = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      onScroll(window.scrollY, max > 0 ? window.scrollY / max : 0);
    };
    window.addEventListener('scroll', read, { passive: true });
    read();
  }

  // Highlight the section in the middle of the screen
  const byId = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        links.forEach((l) => l.classList.remove('is-active'));
        byId.get(entry.target.id)?.classList.add('is-active');
      }
    },
    { rootMargin: '-45% 0px -50% 0px' },
  );
  byId.forEach((_, id) => {
    const section = document.getElementById(id);
    if (section) io.observe(section);
  });
  const hero = document.getElementById('top');
  if (hero) {
    new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) links.forEach((l) => l.classList.remove('is-active'));
      },
      { rootMargin: '-45% 0px -50% 0px' },
    ).observe(hero);
  }
}

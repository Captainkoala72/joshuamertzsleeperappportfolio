// The hero player card: tilts toward the pointer (with a holo shine) and flips on click/tap/Enter.
import { gsap } from 'gsap';
import { $ } from '../lib/dom.js';

export function initCard(reduce) {
  const wrap = $('[data-card]');
  if (!wrap) return;
  const card = $('.pcard', wrap);

  const flip = () => {
    const on = !card.classList.contains('is-flipped');
    card.classList.toggle('is-flipped', on);
    card.setAttribute('aria-pressed', String(on));
  };
  card.addEventListener('click', flip);
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      flip();
    }
  });

  if (reduce || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const rotX = gsap.quickTo(card, 'rotationX', { duration: 0.6, ease: 'power3' });
  const rotY = gsap.quickTo(card, 'rotationY', { duration: 0.6, ease: 'power3' });

  wrap.addEventListener('pointermove', (e) => {
    const r = wrap.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    rotY((px - 0.5) * 24);
    rotX((0.5 - py) * 20);
    card.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
    card.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
  });
  wrap.addEventListener('pointerleave', () => {
    rotX(0);
    rotY(0);
  });
}

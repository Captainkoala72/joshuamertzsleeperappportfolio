// Project "highlight package" modal + full-size image lightbox. Both use native <dialog>.
import { projects, POSITIONS } from '../data/projects.js';
import { $, $$, esc, imgSrc } from '../lib/dom.js';

function initLightbox(lenis) {
  const dlg = $('[data-lightbox]');
  const img = $('[data-lb-img]', dlg);
  const cap = $('[data-lb-cap]', dlg);
  const prev = $('[data-lb-prev]', dlg);
  const next = $('[data-lb-next]', dlg);
  let items = [];
  let index = 0;
  let opener = null;

  const show = () => {
    const item = items[index];
    img.src = item.src;
    img.alt = item.alt || item.caption || '';
    cap.textContent = item.caption || '';
    prev.hidden = next.hidden = items.length < 2;
  };
  const go = (step) => {
    index = (index + step + items.length) % items.length;
    show();
  };

  prev.addEventListener('click', () => go(-1));
  next.addEventListener('click', () => go(1));
  $('[data-close]', dlg).addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (e) => {
    if (e.target === dlg || e.target.classList.contains('lightbox__fig')) dlg.close();
  });
  dlg.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') go(-1);
    if (e.key === 'ArrowRight') go(1);
  });
  dlg.addEventListener('close', () => {
    if (!$('[data-modal]').open) lenis?.start();
    opener?.focus?.({ preventScroll: true });
  });

  return {
    open(list, start = 0, from = null) {
      if (!list.length) return;
      items = list;
      index = Math.max(0, Math.min(start, list.length - 1));
      opener = from;
      show();
      if (!dlg.open) dlg.showModal();
      lenis?.stop();
    },
  };
}

function initModal(lenis, lightbox) {
  const dlg = $('[data-modal]');
  const el = {
    inner: $('.modal__inner', dlg),
    info: $('.modal__info', dlg),
    img: $('[data-modal-img]', dlg),
    cap: $('[data-modal-cap]', dlg),
    zoom: $('[data-modal-zoom]', dlg),
    thumbs: $('[data-modal-thumbs]', dlg),
    meta: $('[data-modal-meta]', dlg),
    title: $('[data-modal-title]', dlg),
    tag: $('[data-modal-tag]', dlg),
    body: $('[data-modal-body]', dlg),
  };
  const list = projects.filter((p) => !p.action);
  let index = 0;
  let imageIndex = 0;
  let opener = null;

  const setImage = (k) => {
    const images = list[index].images;
    imageIndex = (k + images.length) % images.length;
    const [key, caption] = images[imageIndex];
    el.img.src = imgSrc(key, 'full');
    el.img.alt = caption;
    el.cap.textContent = caption;
    $$('button', el.thumbs).forEach((b, n) => b.setAttribute('aria-current', String(n === imageIndex)));
  };

  const render = (i) => {
    index = (i + list.length) % list.length;
    const p = list[index];
    el.meta.innerHTML = `<span class="modal__pick">Pick ${esc(p.pick)}</span><span class="pos pos--${esc(p.pos)}">${POSITIONS[p.pos]}</span><span class="status status--${esc(p.status[0])}">${esc(p.status[1])}</span>`;
    el.title.textContent = p.title;
    el.tag.textContent = p.tagline;

    let html = (p.body || [p.summary]).map((t) => `<p>${esc(t)}</p>`).join('');
    if (p.lineup) html += `<h4>The lineup</h4><ul class="lineup">${p.lineup.map(([n, t]) => `<li><strong>${esc(n)}</strong><span>${esc(t)}</span></li>`).join('')}</ul>`;
    if (p.features) html += `<h4>Highlights</h4><ul class="ticks">${p.features.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>`;
    if (p.tech) html += `<h4>Built with</h4><ul class="chips chips--sm">${p.tech.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`;
    el.body.innerHTML = html;

    el.thumbs.innerHTML =
      p.images.length > 1
        ? p.images
            .map(
              ([key, caption], n) =>
                `<button type="button" data-thumb="${n}" aria-label="Show screenshot ${n + 1}: ${esc(caption)}"><img src="${imgSrc(key)}" alt="" loading="lazy" decoding="async"></button>`,
            )
            .join('')
        : '';
    el.thumbs.hidden = p.images.length < 2;
    setImage(0);
    el.info.scrollTop = 0;
    el.inner.scrollTop = 0;
  };

  el.thumbs.addEventListener('click', (e) => {
    const b = e.target.closest('[data-thumb]');
    if (b) setImage(Number(b.dataset.thumb));
  });
  el.zoom.addEventListener('click', () => {
    const p = list[index];
    lightbox.open(
      p.images.map(([key, caption]) => ({ src: imgSrc(key, 'full'), caption, alt: caption })),
      imageIndex,
      el.zoom,
    );
  });
  $('[data-modal-prev]', dlg).addEventListener('click', () => render(index - 1));
  $('[data-modal-next]', dlg).addEventListener('click', () => render(index + 1));
  $('[data-close]', dlg).addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (e) => {
    if (e.target === dlg) dlg.close();
  });
  dlg.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') setImage(imageIndex + 1);
    if (e.key === 'ArrowLeft') setImage(imageIndex - 1);
  });
  dlg.addEventListener('close', () => {
    lenis?.start();
    opener?.focus?.({ preventScroll: true });
  });

  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-open]');
    if (!trigger) return;
    const i = list.findIndex((p) => p.id === trigger.dataset.open);
    if (i < 0) return;
    opener = trigger;
    render(i);
    dlg.showModal();
    lenis?.stop();
  });
}

export function initDialogs(lenis) {
  const lightbox = initLightbox(lenis);
  initModal(lenis, lightbox);

  // Any element with data-lb="group" opens the lightbox with every image in that group.
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-lb]');
    if (!t) return;
    const group = $$('[data-lb]').filter((g) => g.dataset.lb === t.dataset.lb);
    lightbox.open(
      group.map((g) => ({ src: g.dataset.src, caption: g.dataset.caption, alt: g.querySelector('img')?.alt || '' })),
      group.indexOf(t),
      t,
    );
  });
}

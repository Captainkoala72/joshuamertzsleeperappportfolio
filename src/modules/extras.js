// Small interactions: click-to-load YouTube, copy-email button and the sample post poll.
import { $, $$, toast } from '../lib/dom.js';

function initYouTube() {
  $$('[data-yt]').forEach((btn) => {
    btn.addEventListener(
      'click',
      () => {
        const frame = document.createElement('iframe');
        frame.className = 'yt-frame';
        frame.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(btn.dataset.yt)}?autoplay=1&rel=0&playsinline=1`;
        frame.title = 'DeuceTennis showcase video';
        frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
        frame.allowFullscreen = true;
        frame.referrerPolicy = 'strict-origin-when-cross-origin';
        frame.setAttribute('data-lenis-prevent', '');
        btn.replaceWith(frame);
        frame.focus();
      },
      { once: true },
    );
  });
}

function initCopy() {
  $$('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const text = btn.dataset.copy;
      try {
        await navigator.clipboard.writeText(text);
        toast('Email copied');
      } catch {
        window.location.href = `mailto:${text}`;
      }
    });
  });
}

function initPoll() {
  const poll = $('[data-poll]');
  const thanks = $('[data-poll-thanks]');
  if (!poll) return;
  poll.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-vote]');
    if (!btn) return;
    $$('[data-vote]', poll).forEach((b) => {
      b.classList.toggle('is-picked', b === btn);
      b.setAttribute('aria-pressed', String(b === btn));
    });
    if (thanks) thanks.hidden = false;
  });
}

export function initExtras() {
  initYouTube();
  initCopy();
  initPoll();
}

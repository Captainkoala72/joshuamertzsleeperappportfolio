// big-shoulders-display maps "./*" to "./*.css", so these two skip the extension.
import '@fontsource/big-shoulders-display/800';
import '@fontsource/big-shoulders-display/900';
import '@fontsource/barlow/400.css';
import '@fontsource/barlow/500.css';
import '@fontsource/barlow/600.css';
import '@fontsource/barlow/700.css';
import '@fontsource/barlow-condensed/600.css';
import '@fontsource/barlow-condensed/700.css';
import '@fontsource/barlow-condensed/800.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/700.css';
import 'lenis/dist/lenis.css';
import './styles/main.css';

import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { reduceMotion } from './lib/dom.js';
import { renderTicker, renderBoard, renderVault, renderLinks } from './modules/render.js';
import { initDialogs } from './modules/dialogs.js';
import { initCard } from './modules/card.js';
import { initNav } from './modules/nav.js';
import { initExtras } from './modules/extras.js';
import { initMotion } from './modules/motion.js';
import { initLive } from './modules/live.js';

gsap.registerPlugin(ScrollTrigger);

const reduce = reduceMotion();

// Data-driven sections first, so the animations below can find them.
renderTicker();
renderBoard();
renderVault();
renderLinks();

// Smooth scrolling (skipped for reduced motion), driven by GSAP's ticker so ScrollTrigger stays in sync.
let lenis = null;
if (!reduce) {
  lenis = new Lenis({ autoRaf: false, lerp: 0.1 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

initNav(lenis);
initDialogs(lenis);
initCard(reduce);
initExtras();
initMotion({ lenis, reduce });
initLive();

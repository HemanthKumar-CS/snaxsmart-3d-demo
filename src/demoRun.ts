// @ts-nocheck
import { enhancePage } from './enhancements';
import logoUrl from './assets/logo.png';
import machineUrl from './assets/machine.png';
import rack from './photos/rack.jpg';
import g1 from './photos/g1.jpg'; import g2 from './photos/g2.jpg'; import g3 from './photos/g3.jpg';
import g4 from './photos/g4.jpg'; import g5 from './photos/g5.jpg'; import g6 from './photos/g6.jpg';
import blog1 from './photos/blog1.jpg'; import blog2 from './photos/blog2.jpg';

const ASSETS = { logo: logoUrl, machine: machineUrl, rack, g1, g2, g3, g4, g5, g6, blog1, blog2 };
export function initPage() {
  document.querySelectorAll('[data-asset]').forEach(i => {
    const url = ASSETS[i.dataset.asset];
    if (!url || i.getAttribute('src') === url) return;
    i.decoding = 'async';
    if (i.dataset.asset !== 'logo') i.loading = 'lazy';
    i.src = url;
  });
  document.querySelectorAll('.cc[data-city]').forEach(el => {
    el.setAttribute('role', 'button'); el.tabIndex = 0;
    el.setAttribute('aria-pressed', String(el.classList.contains('hl')));
  });
  document.querySelectorAll('.tb').forEach(el => el.setAttribute('aria-pressed', String(el.classList.contains('on'))));
  document.dispatchEvent(new Event('snaxpage'));
}

export function runDemo() {
  initPage();
  const cleanupEnhancements = enhancePage();
  const events = new AbortController();
  const machines = [], observers = [];
  let disposed = false;
  document.addEventListener('click', e => {
    const tab = e.target.closest?.('.tb');
    if (tab) {
      const wrap = tab.closest('.wrap');
      wrap.querySelectorAll('.tb').forEach(b => { b.classList.toggle('on', b === tab); b.setAttribute('aria-pressed', String(b === tab)); });
      wrap.querySelectorAll('.tp').forEach(p => p.classList.toggle('on', p.dataset.pane === tab.dataset.tab));
      initPage();
    }
  }, { signal: events.signal });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.getElementById('card1')?.classList.remove('on', 'pinned');
      document.querySelector('.rack-toggle')?.setAttribute('aria-expanded', 'false');
    }
  }, { signal: events.signal });

  const rows = Array.from(document.querySelectorAll('#story .srow'));
  const copy = [null,
    ['Pick a snack', 'Choose from healthy bars, nuts, chips, juices and more.'],
    ['Pay with UPI or card', '100% cashless. Scan the QR, tap your card or use a wallet.'],
    ['Dispensed. We handle the rest.', 'Vend sensors confirm the drop. Our team monitors stock and refills it for you.']];
  const originalRows = rows.map(row => row.innerHTML);
  const card = document.getElementById('sfcard');
  card.hidden = true;
  rows.forEach((row, k) => {
    if (!copy[k]) return;
    row.replaceChildren();
    const number = document.createElement('i'); number.className = 'sn'; number.textContent = k;
    const heading = document.createElement('h3'); heading.textContent = copy[k][0];
    const paragraph = document.createElement('p'); paragraph.textContent = copy[k][1];
    row.append(number, heading, paragraph);
  });
  let storyMachine, active = -1, scrollFrame = 0;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const storyStage = document.getElementById('stage');
  const screens = [['SNAX', 'Pick a snack', 'Rack A1 - D5'], ['SNAX', 'Pick a snack', 'Rack A1 - D5'], ['C1', 'Pay with UPI', 'Scan QR or tap card'], ['ENJOY!', 'Snack dispensed', 'Take from tray', true]];
  const clamp = value => Math.max(0, Math.min(1, value));
  const navEl = document.querySelector('.nav'), storyFrame = document.querySelector('#sfloat .frame');
  let navHeight = 0;
  const setNavHeight = () => { navHeight = navEl.offsetHeight; document.documentElement.style.setProperty('--nav-height', navHeight + 'px'); };
  setNavHeight();
  const navObserver = new ResizeObserver(() => { setNavHeight(); scheduleStory(); });
  navObserver.observe(navEl);
  function updateStory() {
    scrollFrame = 0;
    if (disposed || window.__snaxPaused) return;
    // Read all geometry first, then write, so no layout is forced mid-frame.
    const bounds = storyStage.getBoundingClientRect();
    if (bounds.top > innerHeight || bounds.bottom < navHeight) return;
    const mobile = innerWidth <= 760;
    const focus = mobile ? navHeight + storyFrame.offsetHeight + 64 : navHeight + (innerHeight - navHeight) * .5;
    const rects = rows.map(row => row.getBoundingClientRect());
    let k = 0, progress = 0;
    rects.forEach((rect, i) => {
      if (rect.top <= focus) { k = i; progress = clamp((focus - rect.top) / rect.height); }
    });
    if (active !== k) {
      active = k;
      rows.forEach((row, i) => row.classList.toggle('act', i === k));
      storyStage.dataset.step = String(k);
      if (storyMachine) { storyMachine.setScreen(...screens[k]); storyMachine.setPaid(k === 3); }
    }
    storyStage.style.setProperty('--story-progress', ((k + progress) / 4 * 100).toFixed(1) + '%');
    if (!storyMachine) return;
    const ramp = clamp(Math.min(progress / .25, (1 - progress) / .22));
    const zoom = ramp * ramp * (3 - 2 * ramp);
    storyMachine.setView(['full', 'products', 'qr', 'tray'][k], -.22, motion.matches ? 0 : zoom);
    storyMachine.setDrop(k === 3 ? (motion.matches ? 1 : clamp((progress - .2) / .45)) : 0);
  }
  function scheduleStory() { if (!scrollFrame) scrollFrame = requestAnimationFrame(updateStory); }
  window.addEventListener('scroll', scheduleStory, { passive: true, signal: events.signal });
  window.addEventListener('resize', scheduleStory, { signal: events.signal });
  window.addEventListener('snaxvisibility', scheduleStory, { signal: events.signal });
  motion.addEventListener('change', scheduleStory, { signal: events.signal });
  scheduleStory();

  function mountWhenNear(host, options, ready) {
    const poster = document.createElement('img'); poster.src = machineUrl;
    poster.alt = 'SnaxSmart vending machine'; poster.className = 'machine-poster';
    host.appendChild(poster);
    let started = false;
    async function mount() {
      if (started || disposed) return; started = true;
      try {
        const { createMachine } = await import('./machine');
        if (disposed) return;
        const machine = createMachine(host, { logo: logoUrl, ...options });
        machines.push(machine); poster.remove(); ready?.(machine);
      } catch (error) {
        host.querySelectorAll('canvas').forEach(canvas => canvas.remove());
        console.warn('3D preview unavailable; showing the machine image.', error);
      }
    }
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) { observer.disconnect(); mount(); }
      }, { rootMargin: '160px' }); observer.observe(host); observers.push(observer);
    } else mount();
    return poster;
  }
  const hero = document.getElementById('m1'), rackCard = document.getElementById('card1');
  const posters = [mountWhenNear(hero, { spin: true, onHover: on => rackCard.classList.toggle('on', on) }),
    mountWhenNear(document.getElementById('m2'), { rest: -.22 }, machine => { storyMachine = machine; machine.setGlow(false); active = -1; scheduleStory(); })];
  const rackButton = document.createElement('button'); rackButton.type = 'button'; rackButton.className = 'rack-toggle';
  rackButton.textContent = rackCard.querySelector('h4').textContent; rackButton.setAttribute('aria-controls', 'card1'); rackButton.setAttribute('aria-expanded', 'false');
  rackButton.addEventListener('click', () => { const open = rackCard.classList.toggle('pinned'); rackButton.setAttribute('aria-expanded', String(open)); });
  hero.appendChild(rackButton);
  return () => {
    disposed = true; cleanupEnhancements(); events.abort(); cancelAnimationFrame(scrollFrame); navObserver.disconnect();
    observers.forEach(observer => observer.disconnect()); machines.forEach(machine => machine.destroy());
    posters.forEach(poster => poster.remove()); rackButton.remove();
    rows.forEach((row, i) => { row.innerHTML = originalRows[i]; }); card.hidden = false;
  };
}

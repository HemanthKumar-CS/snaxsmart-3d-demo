const locations: Record<string, [string, string]> = {
  "Bengaluru": [
    "Karnataka",
    "South"
  ],
  "Chennai": [
    "Tamil Nadu",
    "South"
  ],
  "Pune": [
    "Maharashtra",
    "West"
  ],
  "Mysuru": [
    "Karnataka",
    "South"
  ],
  "Shirwal": [
    "Maharashtra",
    "West"
  ],
  "Hyderabad": [
    "Telangana",
    "South"
  ],
  "Delhi / NCR": [
    "National Capital Region",
    "North"
  ],
  "Ahmedabad": [
    "Gujarat",
    "West"
  ],
  "Coimbatore": [
    "Tamil Nadu",
    "South"
  ],
  "Chikballapur": [
    "Karnataka",
    "South"
  ],
  "Nelamangala": [
    "Karnataka",
    "South"
  ]
};
// Service areas are from SnaxSmart's published Bengaluru and Pune location pages.
const coverage: Record<string, string> = {
  Bengaluru: 'Serving workplace hubs including Whitefield, Bellandur, Electronic City and Manyata Tech Park.',
  Pune: 'Serving workplace hubs including Hinjewadi, Magarpatta, Baner and Kharadi.',
};

export function enhancePage() {
  const events = new AbortController();
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const animations = new Set<Animation>();
  const seen = new WeakSet<Element>();
  function animate(element: Element, delay = 0) {
    if (motion.matches) return;
    element.getAnimations().forEach(animation => animation.cancel());
    if (element.matches('h1, h2')) {
      if (!element.querySelector('.text-word')) {
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        const nodes: Text[] = []; while (walker.nextNode()) nodes.push(walker.currentNode as Text);
        nodes.forEach(node => {
          const fragment = document.createDocumentFragment();
          node.textContent!.split(/(\s+)/).forEach(part => {
            if (!part.trim()) fragment.append(document.createTextNode(part));
            else { const word = document.createElement('span'); word.className = 'text-word'; word.textContent = part; fragment.append(word); }
          }); node.replaceWith(fragment);
        });
      }
      element.querySelectorAll('.text-word').forEach((word, index) => {
        const animation = word.animate([{opacity:0,transform:'translateY(.55em)'},{opacity:1,transform:'translateY(0)'}],{duration:620,delay:Math.min(index*40,360),easing:'cubic-bezier(.22,1,.36,1)',fill:'backwards'});
        animations.add(animation); animation.finished.then(()=>animations.delete(animation)).catch(()=>animations.delete(animation));
      });
      return;
    }
    const animation = element.animate([{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 460, delay, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' });
    animations.add(animation);
    animation.finished.then(() => animations.delete(animation)).catch(() => animations.delete(animation));
  }
  const observer = new IntersectionObserver(entries => {
    let order = 0;
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      observer.unobserve(entry.target);
      if (seen.has(entry.target)) continue;
      seen.add(entry.target);
      animate(entry.target, Math.min(order++ * 55, 165));
    }
  }, { threshold: .08 });
  const pending = new Set<Element>();
  function watch() {
    for (const el of pending) if (!el.isConnected) { observer.unobserve(el); pending.delete(el); }
    document.querySelectorAll('.hero .hl > *, .sec h2, .sthead h2, .dcard, .fc, .ts, .ic, .bcard, .location-detail, .phead h1, .phead .lead').forEach(el => {
      if (!seen.has(el)) { observer.observe(el); pending.add(el); }
    });
  }
  document.addEventListener('snaxpage', watch, { signal: events.signal });
  motion.addEventListener('change', () => { if (motion.matches) animations.forEach(a => a.cancel()); }, { signal: events.signal });
  watch();

  const map = document.getElementById('cities')!;
  let geographic: Awaited<ReturnType<typeof import('./locationMap')['createLocationMap']>> | undefined;
  let disposed = false;
  const mapObserver = new IntersectionObserver(async entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    mapObserver.disconnect();
    try {
      const { createLocationMap } = await import('./locationMap');
      if (!disposed) geographic = createLocationMap(map, selectCity);
    } catch { map.querySelector<HTMLElement>('.map-network-note')!.hidden = false; }
  }, {rootMargin:'120px'});
  mapObserver.observe(map);
  function selectCity(city: string) {
    geographic?.select(city);
    const location = locations[city];
    if (!location || map.querySelector('.location-detail h3')!.textContent === city) return;
    map.querySelectorAll<HTMLElement | SVGElement>('[data-city]').forEach(el => {
      const selected = el.dataset.city === city;
      el.classList.toggle('hl', selected);
      el.setAttribute('aria-pressed', String(selected));
    });
    map.querySelector('.location-kicker')!.textContent = location[0] + ' · ' + location[1] + ' India';
    map.querySelector('.location-detail h3')!.textContent = city;
    map.querySelector('.location-copy')!.textContent = coverage[city] || 'Explore fully managed snack vending for your workplace in ' + city + '. Contact our team to discuss your site and installation.';
    map.querySelector('.map-selected')!.textContent = city;
    animate(map.querySelector('.location-detail')!);
  }
  map.addEventListener('click', event => {
    const target = event.target as Element;
    const region = target.closest<HTMLElement>('[data-region]');
    if (region) {
      map.querySelectorAll<HTMLElement>('[data-region]').forEach(button => button.setAttribute('aria-pressed', String(button === region)));
      const visible = Object.keys(locations).filter(city => region.dataset.region === 'All' || locations[city][1] === region.dataset.region);
      map.querySelectorAll<HTMLElement>('.cc').forEach(button => { button.hidden = !visible.includes(button.dataset.city!); });
      map.querySelectorAll<SVGElement>('.mk').forEach(pin => { const enabled = visible.includes(pin.dataset.city!); pin.classList.toggle('muted', !enabled); pin.setAttribute('tabindex', enabled ? '0' : '-1'); pin.style.pointerEvents = enabled ? '' : 'none'; });
      const selected = map.querySelector<HTMLElement>('.cc.hl')!;
      if (selected.hidden) selectCity(visible[0]);
      geographic?.filter(visible);
    }
    const city = target.closest<HTMLElement>('[data-city]');
    if (city) selectCity(city.dataset.city!);
  }, { signal: events.signal });
  map.addEventListener('keydown', event => {
    const pin = (event.target as Element).closest<HTMLElement>('.mk, .geo-pin');
    if (pin && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); event.stopPropagation(); selectCity(pin.dataset.city!); }
  }, { signal: events.signal, capture: true });
  return () => { disposed = true; mapObserver.disconnect(); geographic?.destroy(); events.abort(); observer.disconnect(); animations.forEach(a => a.cancel()); };
}

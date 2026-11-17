import L from 'leaflet';
import geography from './assets/coverage-geography.json';
import states from './assets/coverage-states.json';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';

// City centres indicate service locations, not individual machine installations.
const centres = {
  Bengaluru: [12.9716,77.5946], Chennai: [13.0827,80.2707], Pune: [18.5204,73.8567],
  Mysuru: [12.2958,76.6394], Shirwal: [18.1509,73.9777], Hyderabad: [17.385,78.4867],
  'Delhi / NCR': [28.6139,77.209], Ahmedabad: [23.0225,72.5714], Coimbatore: [11.0168,76.9558],
  Chikballapur: [13.4355,77.7315], Nelamangala: [13.098,77.395],
};
export function createLocationMap(section: HTMLElement, choose: (city: string) => void) {
  const host = section.querySelector<HTMLElement>('.geographic-map')!;
  const fallback = section.querySelector<SVGElement>('.mapsvg')!;
  const reset = section.querySelector<HTMLButtonElement>('.map-reset')!;
  host.hidden = false;
  let selected = section.querySelector('.location-detail h3')!.textContent!;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const map = L.map(host, {scrollWheelZoom:false, dragging:!matchMedia('(pointer: coarse)').matches, zoomAnimation:!reduced.matches, fadeAnimation:false, zoomControl:false, zoomSnap:.25, minZoom:3, maxZoom:7, maxBounds:[[0,59],[41,105]], maxBoundsViscosity:.8}).setView([21,79],4);
  L.control.zoom({position:'bottomleft'}).addTo(map);
  map.attributionControl.setPrefix(false);
  L.geoJSON(geography, {interactive:false,smoothFactor:.4,style: feature => ({fillColor:feature.properties.name === 'India' ? '#315e47' : '#1b3e33',color:'#567566',weight:1,fillOpacity:1})}).addTo(map);
  L.geoJSON(states, {interactive:false,smoothFactor:.4,style:{fill:false,color:'#7a9b80',weight:.7,opacity:.48}}).addTo(map);
  map.attributionControl.addAttribution('<a href="https://www.naturalearthdata.com/">Natural Earth</a>');
  for (const [name,coordinate,ocean] of [['INDIA',[23,81],false],['NEPAL',[28.8,84.2],false],['SRI LANKA',[7.4,81.7],false],['Arabian Sea',[16,67.8],true],['Bay of Bengal',[16,88],true]]) {
    L.marker(coordinate,{interactive:false,keyboard:false,zIndexOffset:-1000,icon:L.divIcon({className:'geography-label' + (ocean ? ' sea-label' : ''),html:name,iconSize:[120,24],iconAnchor:[60,12]})}).addTo(map);
  }
  const clusters = L.markerClusterGroup({
    animate:false, disableClusteringAtZoom:7, maxClusterRadius:46, showCoverageOnHover:false,
    iconCreateFunction: cluster => L.divIcon({className:'location-cluster',html:'<span>' + cluster.getChildCount() + '</span>',iconSize:[40,40]}),
  }).addTo(map);
  const pin = L.divIcon({className:'geo-pin',html:'<svg viewBox="0 0 36 48" aria-hidden="true" focusable="false"><path class="pin-body" d="M18 45C15 40 3 28 3 17a15 15 0 0 1 30 0c0 11-12 23-15 28Z"/><circle class="pin-centre" cx="18" cy="17" r="5"/></svg>',iconSize:[44,44],iconAnchor:[22,40]});
  const markers = Object.entries(centres).map(([city,coordinates]) => {
    const marker = L.marker(coordinates,{title:city,alt:city,icon:pin}).bindTooltip(city,{direction:'top',offset:[0,-36],className:'city-tooltip',permanent:true});
    marker.on('add', () => {
      const el = marker.getElement()!;
      el.dataset.city = city; el.setAttribute('aria-label','Explore ' + city);
      el.classList.toggle('hl',city === selected); el.setAttribute('aria-pressed',String(city === selected));
    });
    marker.on('click', () => choose(city));
    return {city,marker};
  });
  clusters.addLayers(markers.map(({marker}) => marker));
  function labelClusters() {
    host.querySelectorAll<HTMLElement>('.location-cluster').forEach(el => el.setAttribute('aria-label','Explore ' + el.textContent + ' nearby locations'));
  }
  function clusterKey(event: KeyboardEvent) {
    const el = (event.target as Element).closest('.location-cluster');
    if (!el || (event.key !== 'Enter' && event.key !== ' ')) return;
    const cluster = markers.map(({marker}) => clusters.getVisibleParent(marker)).find(parent => parent?.getElement() === el);
    if (cluster) { event.preventDefault(); event.stopPropagation(); cluster.zoomToBounds({padding:[48,48],animate:false}); }
  }
  map.on('zoomend',() => { labelClusters(); host.querySelectorAll<HTMLElement>('.geography-label').forEach(el => { el.style.display = map.getZoom() > 5 ? 'none' : ''; }); });
  host.addEventListener('keydown',clusterKey,{capture:true});
  fallback.style.display = 'none';
  const resize = new ResizeObserver(() => { if(host.offsetWidth) map.invalidateSize({pan:false}); }); resize.observe(host);
  function overview() { map.stop(); map.fitBounds([[5,66],[37,98]],{padding:[14,14],animate:false}); }
  function resetView() { section.querySelector<HTMLButtonElement>('[data-region=All]')!.click(); overview(); }
  reset.hidden = false; reset.addEventListener('click',resetView);
  overview(); labelClusters();
  return {
    filter(cities: string[]) {
      clusters.clearLayers();
      clusters.addLayers(markers.filter(({city}) => cities.includes(city)).map(({marker}) => marker));
      map.stop(); map.fitBounds(cities.map(city => centres[city]),{padding:[48,48],maxZoom:7,animate:false}); labelClusters();
    },
    select(city: string) {
      if (!centres[city]) return;
      selected = city; clusters.clearLayers();
      clusters.addLayer(markers.find(item => item.city === city)!.marker);
      map.stop(); map.setView(centres[city],6,{animate:false});
      markers.forEach(({city:name,marker}) => {
        const active = name === city; const el = marker.getElement();
        el?.classList.toggle('hl',active); el?.setAttribute('aria-pressed',String(active));
        marker.setZIndexOffset(active ? 1000 : 0);
        if(active)marker.openTooltip();else marker.closeTooltip();
      });
    },
    destroy() { resize.disconnect(); host.removeEventListener('keydown',clusterKey,{capture:true}); reset.removeEventListener('click',resetView); map.remove(); fallback.style.display = ''; host.hidden = true; reset.hidden = true; },
  };
}

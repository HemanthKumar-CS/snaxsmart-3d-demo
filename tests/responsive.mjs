import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { existsSync, mkdirSync } from 'node:fs';
import { spawn } from 'node:child_process';

const edge = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const browser = await chromium.launch({ headless: true, ...(existsSync(edge) ? { executablePath: edge } : {}) });
const page = await browser.newPage();
const errors = [];
const externalRequests = [];
page.on('request', request => { if (request.url().startsWith('http') && new URL(request.url()).origin !== new URL(base).origin) externalRequests.push(request.url()); });
page.on('pageerror', error => errors.push(error.message));
await page.addInitScript(() => {
  window.drawCalls = 0;
  for (const Context of [window.WebGLRenderingContext, window.WebGL2RenderingContext]) {
    if (!Context) continue;
    const draw = Context.prototype.drawElements;
    Context.prototype.drawElements = function (...args) { window.drawCalls++; return draw.apply(this, args); };
  }
});
const base = process.env.TEST_URL || 'http://127.0.0.1:5179';
let server;
mkdirSync('test-results', { recursive: true });
try {
  if (!process.env.TEST_URL) {
    server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5179', '--strictPort'], { windowsHide: true, stdio: 'ignore' });
    for (let attempt = 0; attempt < 50; attempt++) {
      if (server.exitCode !== null) throw new Error('Test server could not start on port 5179');
      if (await fetch(base).then(r => r.ok).catch(() => false)) break;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  await page.setViewportSize({ width: 1440, height: 700 });
  await page.goto(base);
  await page.locator('#m1 canvas').waitFor();
  assert.equal(await page.locator('.hero h1').textContent(),'Healthy snack vending machines, on rent for your workplace.');
  assert.ok(await page.locator('.hero h1 .text-word').count() > 5,'Headline uses staggered word reveals');
  assert.equal(await page.locator('canvas').count(), 1, 'Story renderer should be deferred');
  await page.screenshot({path:'test-results/desktop.png'});
  for (const [width, height] of [[320,740],[390,844],[768,1024],[1024,768],[1440,900],[2560,1440],[844,390]]) {
    await page.setViewportSize({ width, height });
    for (const route of ['', 'about', 'services', 'industries', 'resources', 'faq', 'contact']) {
      await page.goto(base + '/#/' + route);
      await page.locator(route ? '.pg h1' : '.hero h1').waitFor();
      const overflow = await page.evaluate(() => Array.from(document.querySelectorAll('body *')).filter(el => {
        if (el.closest('.leaflet-pane')) return false; // Tiles are intentionally clipped by the map viewport.
        const r = el.getBoundingClientRect(); const s = getComputedStyle(el);
        return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && (r.right > innerWidth + 1 || r.left < -1);
      }).map(el => el.tagName + '.' + el.className).slice(0,10));
      assert.deepEqual(overflow, [], width + 'px /' + route + ' overflows: ' + overflow.join(', '));
    }
  }
  for (const [width, height] of [[1440,900],[390,844],[844,390]]) {
    await page.setViewportSize({width,height}); await page.goto(base);
    await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
    for (const step of [1,2,3,2]) {
      await page.evaluate(step => {
        const nav = document.querySelector('.nav').offsetHeight;
        const row = document.querySelector('.srow[data-k="' + step + '"]');
        const focus = innerWidth <= 760 ? nav + document.querySelector('#sfloat .frame').offsetHeight + 64 : nav + (innerHeight-nav)*.5;
        window.scrollTo(0, row.getBoundingClientRect().top + scrollY + row.offsetHeight*.5-focus);
      },step);
      await page.waitForFunction(step => document.querySelector('#stage').dataset.step === String(step),step);
      await page.locator('#m2 canvas').waitFor();
      await page.waitForTimeout(900);
      const frame = await page.locator('#sfloat .frame').boundingBox();
      const navBottom = await page.locator('.nav').evaluate(el=>el.getBoundingClientRect().bottom);
      assert.ok(frame.y >= navBottom-1 && frame.y+frame.height <= height+1, 'Pinned 3D must fit viewport at '+width+'px');
      await page.screenshot({path:'test-results/story-'+width+'-'+step+'.png'});
    }
  }
  await page.setViewportSize({width:390,height:844});
  await page.goto(base);
  await page.screenshot({path:'test-results/mobile.png'});
  await page.locator('#story').scrollIntoViewIfNeeded();
  await page.screenshot({path:'test-results/story-mobile.png'});
  await page.locator('.hero').scrollIntoViewIfNeeded();
  await page.locator('.rack-toggle').click();
  assert.equal(await page.locator('.rack-toggle').getAttribute('aria-expanded'),'true');
  await page.locator('#story').scrollIntoViewIfNeeded();
  await page.locator('#m2 canvas').waitFor();
  for (const text of ['Pick a snack','Pay with UPI or card','Dispensed. We handle the rest.']) await page.getByRole('heading',{name:text,exact:true}).waitFor();
  await page.goto(base + '/#/resources');
  for (const tab of await page.locator('.tb').all()) {
    await tab.click(); assert.equal(await tab.getAttribute('aria-pressed'),'true');
    assert.equal(await page.locator('.tp.on').count(),1);
  }
  await page.goto(base);
  await page.locator('#cities').scrollIntoViewIfNeeded();
  await page.locator('.geo-pin').first().waitFor();
  assert.equal(await page.locator('.leaflet-tile').count(),0,'Map is vector rendered, with no raster tiles');
  assert.ok(await page.locator('.leaflet-overlay-pane svg path').count() > 30,'Local geography includes coastlines and state boundaries');
  assert.ok(await page.locator('.location-cluster').count() > 0,'Overview groups nearby locations');
  const firstCluster = page.locator('.location-cluster').filter({hasText:/^2$/});
  await firstCluster.focus(); await page.keyboard.press('Enter');
  await page.locator('.geo-pin[data-city="Pune"]').waitFor();
  await page.locator('.geo-pin[data-city="Shirwal"]').waitFor();
  await page.locator('.map-reset').click();
  const city = page.locator('.cc').first(); await city.focus(); await page.keyboard.press('Enter');
  assert.equal(await city.getAttribute('aria-pressed'),'true');
  await page.locator('[data-region="West"]').click();
  assert.equal(await page.locator('.cc:visible').count(),3);
  const westTotal = await page.evaluate(() => document.querySelectorAll('.geo-pin').length + Array.from(document.querySelectorAll('.location-cluster')).reduce((sum,el) => sum + Number(el.textContent),0));
  assert.equal(westTotal,3,'Filtered map retains every location through clustering');
  await page.locator('.cc[data-city="Pune"]').click();
  assert.equal(await page.locator('.location-detail h3').textContent(),'Pune');
  assert.match(await page.locator('.location-copy').textContent(),/Hinjewadi/);
  await page.locator('[data-region="North"]').click();
  assert.equal(await page.locator('.cc:visible').count(),1);
  assert.equal(await page.locator('.location-detail h3').textContent(),'Delhi / NCR');
  await page.locator('[data-region="All"]').click();
  assert.equal(await page.locator('.cc:visible').count(),11);
  await page.locator('.cc[data-city="Chennai"]').click();
  await page.locator('.geo-pin[data-city="Chennai"]').focus(); await page.keyboard.press('Enter');
  assert.equal(await page.locator('.location-detail h3').textContent(),'Chennai');
  await page.locator('.cc[data-city="Bengaluru"]').click();
  await page.locator('#cities').scrollIntoViewIfNeeded();
  await page.waitForTimeout(700);
  await page.screenshot({path:'test-results/map-mobile.png'});
  await page.locator('.ft').scrollIntoViewIfNeeded();
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, document.body.scrollHeight); });
  await page.waitForTimeout(400);

  const calls = await page.evaluate(()=>window.drawCalls);
  await page.waitForTimeout(250);
  assert.equal(await page.evaluate(()=>window.drawCalls),calls,'Offscreen machines must stop drawing');
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto(base);
  await page.locator('#m1 canvas').waitFor();
  await page.waitForTimeout(500);
  assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length),0,'Reduced motion disables decorative animation');
  const reduced = await page.evaluate(()=>window.drawCalls);
  await page.waitForTimeout(250);
  assert.equal(await page.evaluate(()=>window.drawCalls),reduced,'Reduced motion must settle');
  await page.evaluate(async () => {
    const { createMachine } = await import('/src/machine.ts');
    const host = document.createElement('div'); host.style.cssText = 'width:240px;height:320px'; document.body.appendChild(host);
    for (let i = 0; i < 3; i++) { const machine = createMachine(host); machine.setView('qr'); machine.destroy(); }
    if (host.childElementCount) throw new Error('Renderer cleanup left a canvas'); host.remove();
  });
  const fallback = await browser.newPage();
  await fallback.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      return type.includes('webgl') ? null : original.call(this, type, ...args);
    };
  });
  await fallback.goto(base);
  await fallback.waitForFunction(() => document.querySelector('#m1 .machine-poster')?.naturalWidth > 0);
  await fallback.waitForTimeout(300);
  assert.equal(await fallback.locator('#m1 canvas').count(), 0, 'WebGL failure keeps the image fallback');
  await fallback.close();
  assert.deepEqual(errors,[], 'Browser runtime errors');
  assert.deepEqual(externalRequests,[],'Rendering the site and map requires no third-party requests');
  console.log('PASS: 49 responsive route checks, 12 pinned-story checks, deferred 3D, controls, region filters, city details, keyboard map, offscreen pause, reduced motion, cleanup, fallback, and no runtime errors.');
} finally { await browser.close(); server?.kill(); }

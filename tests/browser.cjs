// Integración real: requiere Playwright y Edge/Chromium, solo como herramientas de prueba.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const artifacts = path.join(root, '.test-artifacts');

test('Navegador: IndexedDB, reinicio, descargas/importación y controles responsive', { timeout: 120000 }, async () => {
  fs.mkdirSync(artifacts, { recursive: true });
  const profile = fs.mkdtempSync(path.join(artifacts, 'profile-'));
  const server = http.createServer((req, res) => {
    const name = new URL(req.url, 'http://localhost').pathname;
    const file = path.resolve(root, '.' + (name === '/' ? '/index.html' : name));
    if (!file.startsWith(root + path.sep)) { res.writeHead(403); res.end(); return; }
    try {
      res.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html');
      res.end(fs.readFileSync(file));
    } catch { res.writeHead(404); res.end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  const options = { headless: true, executablePath: process.env.BROWSER_EXECUTABLE || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', viewport: { width: 1280, height: 900 } };
  let context;
  const errors = [];
  async function openPage(ctx) {
    const page = await ctx.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(url);
    await page.waitForFunction(() => !window.RainGame.saves.busy);
    return page;
  }
  try {
    context = await chromium.launchPersistentContext(profile, options);
    let page = await openPage(context);
    await page.locator('[data-action="continue"]').click();
    assert.match(await page.locator('#save-status').textContent(), /No hay partida/);
    await page.locator('[data-action="start"]').click();
    await page.waitForFunction(() => window.RainGame.saves.active);
    await page.evaluate(async () => {
      const g = window.RainGame;
      g.screens.pause();
      g.collection.completePickup(g.state.current.items[0]);
      g.state.current.resources.money = 123;
      g.state.current.house.rooms.push({ id: 'future-kitchen' });
      await g.saves.save();
    });
    const stored = await page.evaluate(async () => (await window.RainGame.database.read()).data);
    assert.equal(stored.resources.money, 123);
    assert.equal(stored.items[0].status, 'basket');
    // Cerrar todo el contexto y reabrir el mismo perfil prueba persistencia en disco.
    await context.close();
    context = await chromium.launchPersistentContext(profile, options);
    page = await openPage(context);
    await page.locator('[data-action="continue"]').click();
    await page.waitForFunction(() => window.RainGame.saves.active);
    assert.deepEqual(await page.evaluate(() => {
      const g = window.RainGame;
      g.screens.pause();
      const s = g.state.current;
      return [s.resources.money, s.basket.length, s.basket[0] === s.items.find(p => p.id === s.basket[0].id), s.house.rooms[0].id];
    }), [123, 1, true, 'future-kitchen']);
    await page.locator('[data-action="saves"]').click();
    const downloading = page.waitForEvent('download');
    await page.locator('[data-action="export"]').click();
    const download = await downloading;
    assert.match(download.suggestedFilename(), /^antes-de-la-lluvia-dia-1-.*\.json$/);
    const exported = path.join(artifacts, 'partida-exportada.json');
    await download.saveAs(exported);
    const imported = JSON.parse(fs.readFileSync(exported, 'utf8'));
    assert.equal(imported.version, 2);
    imported.data.resources.money = 456;
    const filePayload = { name: 'partida.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(imported)) };
    page.once('dialog', dialog => dialog.dismiss());
    await page.locator('#import-file').setInputFiles(filePayload);
    await page.waitForFunction(() => !window.RainGame.saves.busy);
    assert.equal(await page.evaluate(() => window.RainGame.state.current.resources.money), 123);
    page.once('dialog', dialog => dialog.accept());
    await page.locator('#import-file').setInputFiles(filePayload);
    await page.waitForFunction(() => window.RainGame.state.current.resources.money === 456);
    await page.evaluate(() => window.RainGame.screens.pause());
    await page.locator('[data-action="saves"]').click();
    await page.locator('#import-file').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{"version":99}') });
    await page.waitForFunction(() => document.getElementById('save-status').textContent.includes('inválida'));
    assert.equal(await page.evaluate(() => window.RainGame.state.current.resources.money), 456);
    // El respaldo del reemplazo sigue accesible después de varios autoguardados.
    await page.evaluate(async () => { await window.RainGame.saves.save(); await window.RainGame.saves.save(); });
    await page.locator('[data-action="backups"]').click();
    await page.locator('[data-action^="backup-"]').first().waitFor();
    page.once('dialog', dialog => dialog.accept());
    await page.locator('[data-action^="backup-"]').first().click();
    await page.waitForFunction(() => window.RainGame.state.current.resources.money === 123);
    await page.evaluate(() => window.RainGame.screens.pause());
    // Un aborto real de IndexedDB deja current intacto.
    assert.equal(await page.evaluate(async () => {
      const g = window.RainGame;
      const before = JSON.stringify(await g.database.read());
      const put = IDBObjectStore.prototype.put;
      IDBObjectStore.prototype.put = function (...args) { this.transaction.abort(); return put.apply(this, args); };
      let failed = false;
      try { await g.database.write(g.saveFormat.snapshot()); } catch { failed = true; }
      finally { IDBObjectStore.prototype.put = put; }
      return failed && JSON.stringify(await g.database.read()) === before;
    }), true);
    await page.evaluate(async () => {
      const g = window.RainGame;
      g.calendar.endDay();
      await g.saves.save();
    });
    await page.locator('[data-action="nextDay"]').click();
    assert.equal(await page.evaluate(() => window.RainGame.state.current.day), 2);
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Escape');
    await page.screenshot({ path: path.join(artifacts, 'desktop.png'), fullPage: true });
    // Ciclo completo de Fase 2 con menú real y el mismo botón de acción.
    page.once('dialog', dialog => dialog.accept());
    await page.evaluate(() => window.RainGame.saves.start());
    await page.evaluate(() => {
      const g = window.RainGame;
      for (const p of g.state.current.items) { g.collection.completePickup(p); g.collection.deposit(); }
      Object.assign(g.state.current.player, g.config.settings.door);
      g.screens.pause();
    });
    await page.locator('[data-action="orders"]').click();
    await page.locator('[data-action="order:view:order-1"]').click();
    await page.locator('[data-action="order:accept:order-1"]').click();
    await page.locator('[data-action="order:load:order-1"]').click();
    assert.equal(await page.evaluate(() => window.RainGame.state.current.basket.length), 3);
    await page.locator('[data-action="resume"]').click();
    await page.evaluate(() => Object.assign(window.RainGame.state.current.player, window.RainGame.config.laundry.station));
    await page.keyboard.down('Space');
    await page.evaluate(() => { for (let i = 0; i < 100; i++) window.RainGame.engine.update(.1); });
    await page.keyboard.up('Space');
    assert.equal(await page.evaluate(() => window.RainGame.state.current.basket.every(p => p.cleanliness === 100)), true);
    for (let slot = 0; slot < 3; slot++) {
      await page.evaluate(slot => Object.assign(window.RainGame.state.current.player, window.RainGame.state.garmentPosition(slot, 8)), slot);
      await page.keyboard.down('Space');
      await page.waitForFunction(slot => window.RainGame.state.current.items.some(p => p.orderId && p.slot === slot && p.status === 'hanging'), slot);
      await page.keyboard.up('Space');
      await page.evaluate(() => window.RainGame.engine.update(.02));
    }
    await page.evaluate(() => {
      const g = window.RainGame;
      g.engine.update(40);
      for (const p of g.orders.goods(g.state.current.orders[0])) g.collection.completePickup(p);
      Object.assign(g.state.current.player, g.config.settings.door);
      g.collection.deposit();
      g.screens.pause();
    });
    await page.locator('[data-action="orders"]').click();
    await page.locator('[data-action="order:view:order-1"]').click();
    await page.screenshot({ path: path.join(artifacts, 'pedido-listo.png'), fullPage: true });
    await page.locator('[data-action="order:deliver:order-1"]').click();
    assert.equal(await page.evaluate(() => window.RainGame.state.current.orders[0].state), 'delivered');
    assert.equal(await page.evaluate(() => window.RainGame.state.current.resources.money), 66);
    await page.evaluate(() => window.RainGame.saves.save());
    // Capturas y controles por Pointer Events en orientaciones de celular.
    const mobile = await context.browser().newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    const phone = await openPage(mobile);
    await phone.locator('[data-action="start"]').click();
    await phone.waitForFunction(() => window.RainGame.saves.active);
    const touch = await mobile.newCDPSession(phone);
    for (const [width, height, name] of [[390, 844, 'portrait'], [844, 390, 'landscape'], [320, 568, 'small']]) {
      await phone.setViewportSize({ width, height });
      await phone.evaluate(() => { window.RainGame.camera.configureViewport(); window.RainGame.screens.resume(); });
      const joystick = phone.locator('#joystick');
      const pauseBox = await phone.locator('#pause').boundingBox();
      assert.ok(pauseBox && pauseBox.y < 40, 'La pausa no debe superponerse a la ayuda');
      const box = await joystick.boundingBox();
      assert.ok(box && box.x >= 0 && box.y >= 0 && box.x + box.width <= width + 1 && box.y + box.height <= height + 1);
      const action = await phone.locator('[data-key="collect"]').boundingBox();
      assert.ok(action && action.x >= 0 && action.y >= 0 && action.x + action.width <= width + 1 && action.y + action.height <= height + 1);
      const points = [{ x: box.x + box.width / 2, y: box.y + box.height / 2, id: 1 },
        { x: action.x + action.width / 2, y: action.y + action.height / 2, id: 2 }];
      await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: points });
      points[0].x += 20;
      await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: points });
      assert.equal(await phone.evaluate(() => window.RainGame.controls.joystick.x > 0 && window.RainGame.controls.keys.has('collect')), true);
      await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      assert.equal(await phone.evaluate(() => window.RainGame.controls.joystick.x === 0 && window.RainGame.controls.keys.size === 0), true);
      if (width > height) assert.equal(await phone.locator('.score-stat > span').evaluate(el => getComputedStyle(el).fontSize), '0px');
      await phone.screenshot({ path: path.join(artifacts, `${name}.png`) });
      await phone.evaluate(() => { if (window.RainGame.state.current.mode === 'playing') window.RainGame.screens.pause(); });
      await phone.locator('[data-action="saves"]').click();
      await phone.locator('[data-action="export"]').scrollIntoViewIfNeeded();
      await phone.screenshot({ path: path.join(artifacts, `${name}-menu.png`) });
      await phone.evaluate(() => window.RainGame.screens.resume());
      await phone.evaluate(() => window.RainGame.screens.pause());
      await phone.locator('[data-action="orders"]').click();
      await phone.screenshot({ path: path.join(artifacts, `${name}-orders.png`) });
      await phone.locator('[data-action="resume"]').click();
    }
    await mobile.close();
    assert.deepEqual(errors, []);
  } finally {
    if (context) await context.close();
    await new Promise(resolve => server.close(resolve));
  }
});

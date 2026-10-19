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
      g.state.current.house.legacy.rooms.push({ id: 'future-kitchen' });
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
      return [s.resources.money, s.basket.length, s.basket[0] === s.items.find(p => p.id === s.basket[0].id), s.house.legacy.rooms[0].id];
    }), [123, 1, true, 'future-kitchen']);
    await page.locator('[data-action="saves"]').click();
    const downloading = page.waitForEvent('download');
    await page.locator('[data-action="export"]').click();
    const download = await downloading;
    assert.match(download.suggestedFilename(), /^antes-de-la-lluvia-dia-1-.*\.json$/);
    const exported = path.join(artifacts, 'partida-exportada.json');
    await download.saveAs(exported);
    const imported = JSON.parse(fs.readFileSync(exported, 'utf8'));
    assert.equal(imported.version, 7);
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
    assert.equal(await page.evaluate(() => window.RainGame.state.current.reputation.score), 63);
    await page.evaluate(() => window.RainGame.saves.save());
    await page.reload();
    await page.waitForFunction(() => !window.RainGame.saves.busy);
    await page.locator('[data-action="continue"]').click();
    await page.waitForFunction(() => window.RainGame.saves.active);
    assert.equal(await page.evaluate(() => window.RainGame.state.current.reputation.score), 63);
    await page.evaluate(() => window.RainGame.screens.pause());
    await page.locator('[data-action="forecast"]').click();
    assert.match(await page.locator('#panel').textContent(), /El cielo de hoy/);
    await page.screenshot({ path: path.join(artifacts, 'forecast-desktop.png'), fullPage: true });
    await page.locator('[data-action="reputation"]').click();
    assert.match(await page.locator('#panel').textContent(), /63\/100/);
    await page.screenshot({ path: path.join(artifacts, 'reputation-desktop.png'), fullPage: true });
    await page.locator('[data-action="resume"]').click();
    await page.evaluate(() => window.RainGame.screens.pause());
    await page.locator('[data-action="family"]').click();
    await page.locator('[data-action^="family:pay:"]').first().click();
    assert.equal(await page.evaluate(() => window.RainGame.state.current.resources.money), 60);
    await page.locator('[data-action="family:talk:jaqui"]').click();
    await page.screenshot({ path: path.join(artifacts, 'familia-desktop.png'), fullPage: true });
    await page.locator('[data-action="family:mate"]').click();
    await page.waitForFunction(() => window.RainGame.state.current.family.mate > 0);
    await page.screenshot({ path: path.join(artifacts, 'mates-desktop.png'), fullPage: true });
    await page.waitForFunction(() => window.RainGame.state.current.dayEnded);
    await page.locator('[data-action="nextDay"]').waitFor();
    await page.evaluate(() => window.RainGame.saves.save());
    await page.reload();
    await page.waitForFunction(() => !window.RainGame.saves.busy);
    await page.locator('[data-action="continue"]').click();
    await page.waitForFunction(() => window.RainGame.saves.active);
    assert.equal(await page.evaluate(() => window.RainGame.state.current.family.events[0].paid), true);
    assert.equal(await page.evaluate(() => window.RainGame.state.current.family.restedDay), 1);
    // Casa explorable: entrada por acción, movimiento, estante y compras por menú.
    await page.evaluate(() => {
      const g = window.RainGame;
      g.screens.resume(); Object.assign(g.state.current.player, g.config.settings.door);
    });
    await page.keyboard.press('Space');
    await page.waitForFunction(() => window.RainGame.state.current.scene === 'house');
    await page.keyboard.down('ArrowRight');
    await page.waitForFunction(() => window.RainGame.state.current.player.x > 250);
    await page.keyboard.up('ArrowRight');
    await page.evaluate(() => Object.assign(window.RainGame.state.current.player, { x: 460, y: 400 }));
    await page.keyboard.press('Space');
    await page.locator('[data-action="house:unload"]').waitFor();
    await page.screenshot({ path: path.join(artifacts, 'casa-almacenamiento.png'), fullPage: true });
    await page.locator('[data-action="resume"]').click();
    await page.evaluate(() => {
      const g = window.RainGame;
      g.state.current.resources.money = 300; // Presupuesto de prueba para revisar compras.
      g.screens.pause();
    });
    await page.locator('[data-action="house"]').click();
    await page.locator('[data-action="house:materials"]').click();
    await page.locator('[data-action="house:room:maria"]').click();
    await page.locator('[data-action="house:furniture:maria-bed"]').click();
    assert.equal(await page.evaluate(() => window.RainGame.state.current.resources.money), 219);
    await page.locator('[data-action="resume"]').click();
    await page.evaluate(() => { const g = window.RainGame; Object.assign(g.state.current.player, { x: 685, y: 230 }); g.hud.update(); g.renderer.render(); });
    await page.screenshot({ path: path.join(artifacts, 'casa-interior-desktop.png'), fullPage: true });
    await page.evaluate(() => window.RainGame.saves.save());
    await context.close();
    context = await chromium.launchPersistentContext(profile, options);
    page = await openPage(context);
    await page.locator('[data-action="continue"]').click();
    await page.waitForFunction(() => window.RainGame.saves.active);
    assert.deepEqual(await page.evaluate(() => {
      const s = window.RainGame.state.current;
      return [s.scene, s.player.x, s.house.rooms.some(r => r.id === 'maria'), s.house.furniture.some(f => f.id === 'maria-bed')];
    }), ['house', 685, true, true]);
    await page.evaluate(() => { window.RainGame.screens.resume(); window.RainGame.screens.pause(); });
    await page.locator('[data-action="saves"]').click();
    const interiorDownload = page.waitForEvent('download');
    await page.locator('[data-action="export"]').click();
    const interiorFile = path.join(artifacts, 'partida-interior.json');
    await (await interiorDownload).saveAs(interiorFile);
    page.once('dialog', dialog => dialog.accept());
    await page.locator('#import-file').setInputFiles(interiorFile);
    await page.waitForFunction(() => !window.RainGame.saves.busy);
    assert.equal(await page.evaluate(() => window.RainGame.state.current.scene), 'house');
    await page.evaluate(() => { const g = window.RainGame; g.screens.resume(); Object.assign(g.state.current.player, g.config.house.door); });
    await page.keyboard.press('Space');
    await page.waitForFunction(() => window.RainGame.state.current.scene === 'yard');
    // Construcción real: catálogo, herramientas, previsualización, reubicación y retiro.
    await page.evaluate(() => { const g = window.RainGame; g.state.current.resources.money = 1000; g.screens.pause(); });
    await page.locator('[data-action="build"]').click();
    await page.locator('[data-action="build:materials"]').click();
    await page.locator('[data-action="build:materials"]').click();
    await page.locator('[data-action="build:tool:basket8"]').click();
    await page.locator('[data-action="build:select:covered"]').click();
    assert.equal(await page.evaluate(() => window.RainGame.state.current.mode), 'building');
    assert.equal(await page.evaluate(() => { const g = window.RainGame, time = g.state.current.elapsed; g.engine.update(2); return time === g.state.current.elapsed; }), true);
    await page.keyboard.press('ArrowRight');
    await page.screenshot({ path: path.join(artifacts, 'construccion-preview-desktop.png'), fullPage: true });
    await page.locator('#build-confirm').click();
    assert.equal(await page.evaluate(() => window.RainGame.state.current.constructions[0].x), 520);
    await page.locator('[data-action="build:move:build-1"]').click();
    await page.keyboard.press('ArrowDown');
    assert.equal(await page.locator('#build-confirm').isDisabled(), true);
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowRight');
    await page.locator('#build-confirm').click();
    await page.locator('[data-action="build:select:flowers"]').click();
    await page.locator('#build-confirm').click();
    page.once('dialog', dialog => dialog.dismiss());
    await page.locator('[data-action="build:remove:build-2"]').click();
    assert.equal(await page.evaluate(() => window.RainGame.state.current.constructions[1].removed), false);
    page.once('dialog', dialog => dialog.accept());
    await page.locator('[data-action="build:remove:build-2"]').click();
    assert.equal(await page.evaluate(() => window.RainGame.state.current.constructions[1].removed), true);
    await page.locator('[data-action="resume"]').click();
    await page.evaluate(async () => {
      const g = window.RainGame, s = g.state.current;
      g.orders.accept('order-2'); Object.assign(s.player, g.config.settings.door); g.laundry.load('order-2');
      const items = [...s.basket];
      items.forEach((p, i) => { p.cleanliness = 100; p.wetness = 100; Object.assign(s.player, g.yard.position(8 + i)); g.laundry.hang(p, 8 + i); });
      g.renderer.render(); await g.saves.save();
    });
    await page.screenshot({ path: path.join(artifacts, 'patio-ampliado-desktop.png'), fullPage: true });
    await context.close(); context = await chromium.launchPersistentContext(profile, options); page = await openPage(context);
    await page.locator('[data-action="continue"]').click(); await page.waitForFunction(() => window.RainGame.saves.active);
    assert.deepEqual(await page.evaluate(() => { const g = window.RainGame, s = g.state.current; return [s.constructions[0].x, s.constructions[1].removed, s.basketCapacity, g.yard.slots().length, s.items.filter(p => p.status === 'hanging' && p.slot >= 8).length]; }), [540, true, 8, 10, 2]);
    await page.evaluate(() => { window.RainGame.screens.resume(); window.RainGame.screens.pause(); });
    await page.locator('[data-action="saves"]').click();
    const yardDownload = page.waitForEvent('download'); await page.locator('[data-action="export"]').click();
    const yardFile = path.join(artifacts, 'partida-patio.json'); await (await yardDownload).saveAs(yardFile);
    page.once('dialog', dialog => dialog.accept()); await page.locator('#import-file').setInputFiles(yardFile);
    await page.waitForFunction(() => !window.RainGame.saves.busy);
    assert.equal(await page.evaluate(() => window.RainGame.state.current.constructions[0].x), 540);
    // Fase 7: máquina por menú y Jaqui activa; recuperar un lote sin volver a pagarlo.
    await page.evaluate(() => {
      const g = window.RainGame, s = g.state.current;
      s.daySeconds = 86400; g.climate.newDay(s);
      g.orders.goods(s.orders[1]).forEach(p => p.wetness = 10);
      g.screens.resume(); g.screens.pause();
    });
    await page.locator('[data-action="build"]').click();
    await page.locator('[data-action="build:select:washer"]').click();
    await page.keyboard.press('ArrowLeft');
    await page.locator('#build-confirm').click();
    await page.locator('[data-action="resume"]').click();
    await page.evaluate(() => {
      const g = window.RainGame, s = g.state.current;
      g.orders.accept('order-3'); Object.assign(s.player, g.config.settings.door); g.laundry.load('order-3');
      Object.assign(s.player, { x: 510, y: 295 }); g.screens.pause();
    });
    await page.locator('[data-action="work"]').click();
    await page.locator('[data-action="work:start:build-3"]').click();
    await page.locator('[data-action="work:task:collect"]').click();
    await page.screenshot({ path: path.join(artifacts, 'automatizacion-desktop.png'), fullPage: true });
    await page.locator('[data-action="resume"]').click();
    await page.evaluate(() => { const g = window.RainGame; for (let i = 0; i < 300; i++) g.engine.update(1 / 60); g.renderer.render(); });
    assert.equal(await page.evaluate(() => window.RainGame.state.current.workshop.helper.scene), 'yard');
    await page.screenshot({ path: path.join(artifacts, 'jaqui-y-maquina.png'), fullPage: true });
    const paidWater = await page.evaluate(() => window.RainGame.state.current.resources.water);
    await page.evaluate(() => window.RainGame.saves.save());
    await context.close(); context = await chromium.launchPersistentContext(profile, options); page = await openPage(context);
    await page.locator('[data-action="continue"]').click(); await page.waitForFunction(() => window.RainGame.saves.active);
    assert.equal(await page.evaluate(() => window.RainGame.state.current.workshop.machines[0].cycles), 1);
    assert.equal(await page.evaluate(() => window.RainGame.state.current.workshop.helper.active), true);
    await page.evaluate(() => { const g = window.RainGame; g.screens.resume(); for (let i = 0; i < 1800; i++) g.engine.update(1 / 60); g.screens.pause(); });
    assert.equal(await page.evaluate(() => window.RainGame.state.current.resources.water), paidWater);
    await page.locator('[data-action="work"]').click();
    await page.locator('[data-action="work:unload:build-3"]').click();
    assert.equal(await page.evaluate(() => window.RainGame.state.current.workshop.machines[0].items.length), 0);
    assert.equal(await page.evaluate(() => window.RainGame.state.current.basket.some(p => p.orderId === 'order-3' && p.cleanliness === 100)), true);
    await page.locator('[data-action="work:skills"]').click();
    await page.screenshot({ path: path.join(artifacts, 'habilidades-desktop.png'), fullPage: true });
    // Capturas y controles por Pointer Events en orientaciones de celular.
    const mobile = await context.browser().newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    const phone = await openPage(mobile);
    await phone.locator('[data-action="start"]').click();
    await phone.waitForFunction(() => window.RainGame.saves.active);
    const touch = await mobile.newCDPSession(phone);
    for (const [width, height, name] of [[390, 844, 'portrait'], [844, 390, 'landscape'], [320, 568, 'small']]) {
      await phone.setViewportSize({ width, height });
      await phone.evaluate(() => { const g = window.RainGame; g.camera.configureViewport(); g.screens.resume(); Object.assign(g.state.current.player, { x: 500, y: 300 }); });
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
      await phone.evaluate(() => window.RainGame.screens.pause());
      await phone.locator('[data-action="forecast"]').click();
      await phone.screenshot({ path: path.join(artifacts, `${name}-forecast.png`) });
      await phone.locator('[data-action="reputation"]').click();
      await phone.locator('[data-action="resume"]').scrollIntoViewIfNeeded();
      await phone.screenshot({ path: path.join(artifacts, `${name}-reputation.png`) });
      await phone.locator('[data-action="resume"]').click();
      await phone.evaluate(() => { const g = window.RainGame; Object.assign(g.state.current.player, g.config.settings.door); g.hud.update(); });
      await phone.locator('[data-key="collect"]').tap();
      await phone.waitForFunction(() => window.RainGame.state.current.scene === 'house');
      await phone.screenshot({ path: path.join(artifacts, `${name}-casa.png`) });
      await phone.evaluate(() => { const g = window.RainGame; g.screens.pause(); });
      await phone.locator('[data-action="house"]').click();
      await phone.locator('[data-action="house:furniture:basin"]').scrollIntoViewIfNeeded();
      await phone.screenshot({ path: path.join(artifacts, `${name}-muebles.png`) });
      await phone.locator('[data-action="resume"]').click();
      await phone.evaluate(() => { const g = window.RainGame; Object.assign(g.state.current.player, g.config.house.door); g.hud.update(); });
      await phone.locator('[data-key="collect"]').tap();
      await phone.waitForFunction(() => window.RainGame.state.current.scene === 'yard');
      // Todos los nombres de clima deben mantener accesible la pausa en el HUD.
      await phone.evaluate(() => window.RainGame.screens.pause());
      await phone.locator('[data-action="family"]').click();
      await phone.locator('[data-action="family:talk:jaqui"]').click();
      await phone.locator('[data-action="resume"]').scrollIntoViewIfNeeded();
      await phone.screenshot({ path: path.join(artifacts, `${name}-familia.png`) });
      await phone.locator('[data-action="resume"]').click();
      await phone.evaluate(() => { const g = window.RainGame; g.state.current.resources.money = 1000; g.screens.pause(); });
      await phone.locator('[data-action="build"]').click();
      await phone.locator('[data-action="build:select:flowers"]').click();
      for (let i = 0; i < ['portrait', 'landscape', 'small'].indexOf(name); i++) await phone.locator('[data-build="right"]').tap();
      assert.equal(await phone.locator('.touch-controls').isVisible(), false);
      const toolbar = await phone.locator('#build-toolbar').boundingBox();
      assert.ok(toolbar && toolbar.x >= 0 && toolbar.y >= 0 && toolbar.x + toolbar.width <= width + 1 && toolbar.y + toolbar.height <= height + 1);
      const selectedBottom = await phone.evaluate(() => { const g = window.RainGame, c = g.buildMenu.camera(), p = g.buildMenu.preview; return (p.y + g.yard.size(p).h - c.y) * c.scale; });
      assert.ok(selectedBottom < toolbar.y, 'La previsualización debe quedar por encima de los botones');
      await phone.screenshot({ path: path.join(artifacts, `${name}-construccion.png`) });
      await phone.locator('#build-confirm').tap();
      assert.equal(await phone.evaluate(() => window.RainGame.yard.active().length), ['portrait', 'landscape', 'small'].indexOf(name) + 1);
      await phone.locator('[data-action="resume"]').click();
      await phone.evaluate(() => window.RainGame.screens.pause());
      await phone.locator('[data-action="work"]').click();
      await phone.locator('[data-action="work:task:collect"]').click();
      await phone.locator('[data-action="work:skills"]').scrollIntoViewIfNeeded();
      await phone.screenshot({ path: path.join(artifacts, `${name}-automatizacion.png`) });
      await phone.locator('[data-action="work:skills"]').click();
      await phone.locator('[data-action="resume"]').click();
      for (const kind of ['heat', 'wind', 'storm']) {
        await phone.evaluate(kind => { const g = window.RainGame; g.state.current.climate.segments[0].kind = kind; g.hud.update(); }, kind);
        const weatherPause = await phone.locator('#pause').boundingBox();
        assert.ok(weatherPause && weatherPause.y < 40, `HUD de ${kind} a ${width}px`);
      }
    }
    await mobile.close();
    assert.deepEqual(errors, []);
  } finally {
    if (context) await context.close();
    await new Promise(resolve => server.close(resolve));
  }
});

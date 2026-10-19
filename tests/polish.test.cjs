const { test } = require('node:test');
const assert = require('node:assert/strict');
const { performance } = require('node:perf_hooks');
const { createGame } = require('./helpers.cjs');
function setup() { const r = createGame(); r.game.screens.startCampaign(); return r; }

test('Guía: registra pasos reales, permite ocultar pistas y persiste sin cambiar recursos', () => {
  const { game: g } = setup(), s = g.state.current;
  const money = s.resources.money;
  assert.equal(g.guide.next().id, 'family'); g.guideMenu.show();
  assert.equal(s.resources.money, money); assert.equal(s.mode, 'paused');
  g.collection.completePickup(s.items[0]); g.collection.deposit(); g.orders.accept(s.orders[0].id);
  g.guide.observe(); assert.ok(s.guide.done.includes('family')); assert.ok(s.guide.done.includes('accept'));
  g.guideMenu.action('guide:hints'); assert.equal(g.guide.next(), null);
  s.guide.exported = true; g.guide.observe();
  const save = g.saveFormat.snapshot(), restored = g.saveFormat.restore(save);
  assert.equal(restored.guide.hints, false); assert.ok(restored.guide.done.includes('backup'));
  assert.equal(restored.resources.money, 30);
  const bad = JSON.parse(JSON.stringify(save)); bad.data.guide.done.push('bad-step');
  assert.throws(() => g.saveFormat.validate(bad), /guía/);
  const old = JSON.parse(JSON.stringify(save)); old.version = 7; delete old.data.guide;
  const migrated = g.saveFormat.restore(old); assert.ok(migrated.guide.done.includes('accept')); g.saveFormat.snapshot(migrated);
});

test('Guía: exportar texto sin descarga no modifica la partida; el archivo preparado incluye el paso', async () => {
  const { game: g, window } = createGame();
  g.database.read = async () => null; g.database.write = async () => {};
  window.confirm = () => true; await g.saves.init(); await g.saves.start();
  const before = g.state.current.guide.exported;
  const raw = g.saves.exportText(); assert.equal(JSON.parse(raw).data.guide.exported, before);
  const prepared = g.saves.exportText(true); assert.equal(JSON.parse(prepared).data.guide.exported, true);
  assert.equal(g.state.current.guide.exported, before);
  g.guide.exported(); assert.equal(g.state.current.guide.exported, true);
});

test('Rendimiento: un frame lento conserva doce pasos y actualiza el HUD una sola vez', () => {
  const { game: g } = setup(); let writes = 0;
  g.hud.update = () => writes++;
  g.engine.resetTime(); g.engine.frame(0); g.engine.frame(200);
  assert.ok(Math.abs(g.state.current.elapsed - .2) < 1e-9);
  assert.equal(writes, 2);
});

test('Rendimiento: el HUD no vuelve a escribir texto que no cambió', () => {
  const { game: g, elements } = setup(); g.hud.update(); let writes = 0;
  for (const el of elements.values()) {
    let value = el.textContent;
    Object.defineProperty(el, 'textContent', { get: () => value, set: next => { value = next; writes++; }, configurable: true });
  }
  g.hud.update(); g.hud.update(); assert.equal(writes, 0);
  g.state.current.daySeconds = 86400; g.climate.newDay(g.state.current); g.hud.update();
  assert.equal(elements.get('timer-unit').textContent, ' m');
});

test('Audio: lluvia estable no acumula eventos y las preferencias bloqueadas no rompen el juego', () => {
  const { game: g, window } = setup(); let changes = 0;
  g.audio.enabled = true; g.audio.context = { currentTime: 1 };
  g.audio.rain = { stop() {} }; g.audio.rainGain = { gain: { setTargetAtTime() { changes++; } } };
  for (let i = 0; i < 600; i++) g.audio.weather(1);
  assert.equal(changes, 1); g.audio.weather(.5); g.audio.weather(0); assert.equal(changes, 3);
  const preferences = new Map([['rain-game-sound', 'on']]);
  window.localStorage = { getItem: key => preferences.get(key), setItem: (key, value) => preferences.set(key, value) };
  g.audio.loadPreferences(); assert.equal(g.audio.enabled, true);
  g.audio.enabled = false; g.audio.rememberPreference(); assert.equal(preferences.get('rain-game-sound'), 'off');
  Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } });
  assert.doesNotThrow(() => g.audio.loadPreferences()); assert.doesNotThrow(() => g.audio.rememberPreference());
});

test('Animaciones reducidas: Jaqui conserva el estado y omite el giro de tropiezo', () => {
  const { game: g } = setup(), s = g.state.current;
  s.workshop.helper.active = true; s.workshop.helper.task = 'return'; s.workshop.helper.scene = 'yard'; s.workshop.helper.stumble = 1;
  let rotations = 0; g.dom.context.rotate = () => rotations++;
  g.familyDrawing.member(s.family.members[1]); assert.equal(rotations, 1);
  g.preferences.reducedMotion = true; g.familyDrawing.member(s.family.members[1]); assert.equal(rotations, 1);
  assert.equal(s.workshop.helper.stumble, 1);
});

test('Navegación: Jaqui recalcula su ruta al construir en un paso, sin atravesar el cerco', () => {
  const { game: g } = setup(), s = g.state.current;
  s.resources.money = 100; g.house.materials(); s.daySeconds = 86400; g.climate.newDay(s);
  g.helper.assign('collect'); const h = s.workshop.helper, m = s.family.members[1];
  h.scene = 'yard'; Object.assign(m, { x: 174, y: 270 }); g.helper.update(.01);
  assert.equal(g.yard.place('fence', 240, 260, 1), null);
  for (let i = 0; i < 180 * 60; i++) {
    g.engine.update(1 / 60);
    assert.equal(g.player.canStand(m.x, m.y, true, { ...s, scene: h.scene }), true);
  }
  assert.equal(s.saved, 8); g.saveFormat.snapshot();
});

test('Navegación: tampoco se puede encerrar a Jaqui si María está dentro de la casa', () => {
  const { game: g } = setup(), s = g.state.current;
  s.resources.money = 1000; g.house.materials();
  g.helper.assign('collect'); s.workshop.helper.scene = 'yard'; Object.assign(s.family.members[1], { x: 850, y: 410 });
  s.scene = 'house'; Object.assign(s.player, { x: 230, y: 465 });
  assert.equal(g.yard.place('fence', 820, 360), null); assert.equal(g.yard.place('fence', 800, 380, 1), null);
  assert.equal(g.yard.place('fence', 820, 440), null); assert.ok(g.yard.place('fence', 880, 380, 1));
  g.saveFormat.snapshot();
});

test('Importación final: rechaza lotes duplicados, identidad falsa y desgaste incoherente', () => {
  const { game: g } = setup(), s = g.state.current;
  s.resources.money = 1000; g.house.materials(); g.yard.place('washer', 100, 320);
  g.orders.accept(s.orders[0].id); Object.assign(s.player, g.config.settings.door); g.laundry.load(s.orders[0].id);
  Object.assign(s.player, { x: 130, y: 375 }); g.automation.start('build-1');
  const save = g.saveFormat.snapshot();
  for (const mutate of [e => e.data.workshop.machines[0].items.push(e.data.workshop.machines[0].items[0]),
    e => e.data.items.find(p => p.status === 'machine').machineId = 'build-99',
    e => e.data.items.find(p => p.status === 'machine').status = 'basket',
    e => e.data.workshop.machines[0].wear = 5,
    e => e.data.laundry.ledger.find(e => e.kind === 'automation').amount = -99]) {
    const invalid = JSON.parse(JSON.stringify(save)); mutate(invalid); assert.throws(() => g.saveFormat.validate(invalid));
  }
});

test('Balance: treinta jornadas y noventa pedidos pagan insumos y gastos sin deuda', t => {
  const started = performance.now(), { game: g } = setup(), s = g.state.current;
  s.daySeconds = 86400; g.climate.newDay(s);
  for (const p of [...s.items]) { g.collection.completePickup(p); g.collection.deposit(); }
  for (let day = 1; day <= 30; day++) {
    for (const order of s.orders.filter(o => o.state === 'available')) {
      assert.equal(g.orders.accept(order.id), null); Object.assign(s.player, g.config.settings.door);
      assert.equal(g.laundry.load(order.id), null); Object.assign(s.player, g.config.laundry.station);
      const items = [...s.basket];
      for (const item of items) {
        const cost = g.skills.washCost();
        if (s.resources.water < cost.water || s.resources.soap < cost.soap) assert.equal(g.orders.buySupplies(), null);
        assert.equal(g.laundry.wash(item, 5), true);
      }
      items.forEach((p, slot) => { Object.assign(s.player, g.yard.position(slot)); assert.equal(g.laundry.hang(p, slot), true); });
      for (let i = 0; i < 30 && items.some(p => p.wetness > 1); i++) g.engine.update(10);
      assert.ok(items.every(p => p.wetness <= 1));
      items.forEach(p => g.collection.completePickup(p)); Object.assign(s.player, g.config.settings.door); g.collection.deposit();
      assert.equal(g.orders.deliver(order.id), null);
    }
    for (const event of s.family.events.filter(e => !e.paid)) assert.equal(g.family.pay(event.id), null);
    assert.ok(s.resources.money >= 12); g.saveFormat.snapshot();
    if (day < 30) { g.calendar.endDay(); g.calendar.advanceDay(); }
  }
  assert.equal(s.orders.filter(o => o.state === 'delivered').length, 90);
  const income = g.economy.summary(); assert.equal(s.resources.money, 30 + income.income - income.expenses);
  assert.ok(s.resources.money > 30); assert.ok(s.resources.water >= 0 && s.resources.soap >= 0);
  t.diagnostic(`Simulación de balance sin presión de plazo: saldo $${s.resources.money}; ${Math.round(performance.now() - started)} ms de prueba, sin renderizado de navegador.`);
});

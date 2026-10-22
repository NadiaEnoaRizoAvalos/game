const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createGame } = require('./helpers.cjs');
function setup() {
  const { game: g } = createGame(); g.screens.startCampaign();
  const s = g.state.current; s.resources.money = 2000; s.resources.water = 100; s.resources.soap = 100;
  for (let i = 0; i < 3; i++) assert.equal(g.house.materials(), null);
  s.daySeconds = 86400; g.climate.newDay(s);
  return g;
}
function load(g, index = 0) { const s = g.state.current; g.orders.accept(s.orders[index].id); Object.assign(s.player, g.config.settings.door); assert.equal(g.laundry.load(s.orders[index].id), null); return [...s.basket]; }
function tick(g, seconds, check = () => {}) { for (let i = 0; i < seconds * 60; i++) { g.engine.update(1 / 60); check(); } }
function clearFamily(g) { for (const p of g.state.current.items.filter(p => !p.orderId && p.status === 'hanging')) { g.collection.completePickup(p); g.collection.deposit(); } }

test('Automatización: lote paga una vez, conserva identidad y reanuda sin otro consumo', () => {
  const g = setup(), s = g.state.current;
  assert.equal(g.yard.place('washer', 100, 320), null);
  const items = load(g), water = s.resources.water, soap = s.resources.soap;
  Object.assign(s.player, { x: 130, y: 375 });
  const money = s.resources.money;
  assert.equal(g.automation.start('build-1'), null);
  assert.equal(s.resources.water, water - 6); assert.equal(s.resources.soap, soap - 2); assert.equal(s.resources.money, money - 2);
  assert.ok(g.automation.start('build-1')); assert.ok(g.automation.unload('build-1'));
  assert.ok(g.yard.move('build-1', 500, 240)); assert.ok(g.yard.remove('build-1'));
  tick(g, 4);
  const encoded = g.saveFormat.snapshot(), restored = g.saveFormat.restore(encoded);
  g.state.current = restored; g.screens.resume();
  tick(g, 9);
  assert.equal(restored.workshop.machines[0].remaining, 0);
  assert.equal(restored.resources.water, water - 6); assert.equal(restored.resources.money, money - 2);
  assert.equal(g.automation.unload('build-1'), null);
  assert.equal(restored.basket.length, 3);
  assert.deepEqual(Array.from(restored.basket, p => p.id), Array.from(items, p => p.id));
  assert.ok(restored.basket.every(p => p.cleanliness === 100 && p.wetness === 100));
  assert.ok(g.automation.unload('build-1'));
  g.saveFormat.snapshot();
});

test('Automatización: capacidad por volumen, secadora, pausa y protección climática', () => {
  const g = setup(), s = g.state.current;
  g.yard.place('washer', 100, 320); g.yard.place('dryer', 100, 540);
  const items = load(g, 2); // Dos sábanas: seis unidades.
  Object.assign(s.player, { x: 130, y: 375 }); g.automation.start('build-1');
  assert.equal(s.workshop.machines[0].items.length, 1); assert.equal(s.basket.length, 1);
  g.screens.pause(); g.engine.update(5); assert.equal(s.workshop.machines[0].remaining, 12);
  g.screens.resume(); tick(g, 13); g.automation.unload('build-1');
  Object.assign(s.player, { x: 130, y: 595 });
  assert.equal(g.automation.start('build-2'), null);
  s.climate.segments[0].kind = 'storm'; s.rainIntensity = 1;
  tick(g, 11); assert.equal(g.automation.unload('build-2'), null);
  assert.equal(items[0].wetness, 0); assert.equal(items[0].cleanliness, 100);
  assert.equal(items[1].cleanliness, 20); // La máquina no toma la otra sábana sucia.
  g.saveFormat.snapshot();
});

test('Automatización: cinco lotes exigen mantenimiento único con máquina vacía', () => {
  const g = setup(), s = g.state.current;
  g.yard.place('washer', 100, 320); const items = load(g);
  Object.assign(s.player, { x: 130, y: 375 });
  assert.ok(g.automation.service('build-1'));
  for (let i = 0; i < 5; i++) {
    items.forEach(p => p.cleanliness = 20);
    assert.equal(g.automation.start('build-1'), null); tick(g, 13);
    assert.equal(g.automation.unload('build-1'), null);
  }
  assert.ok(g.automation.start('build-1'));
  const money = s.resources.money;
  assert.equal(g.automation.service('build-1'), null); assert.equal(s.resources.money, money - 6);
  assert.ok(g.automation.service('build-1'));
  assert.equal(s.workshop.machines[0].wear, 0); g.saveFormat.snapshot();
});

test('Automatización: no toma insumos inexistentes ni reinicia un lavado manual parcial', () => {
  const g = setup(), s = g.state.current;
  g.yard.place('washer', 100, 320); const items = load(g);
  Object.assign(s.player, { x: 130, y: 375 });
  s.resources.soap = 0; const water = s.resources.water;
  assert.ok(g.automation.start('build-1')); assert.equal(s.resources.water, water);
  s.resources.soap = 10; items.forEach(p => p.washProgress = .5);
  assert.ok(g.automation.start('build-1')); assert.equal(s.workshop.machines[0].cycles, 0);
  items.forEach(p => p.washProgress = 0); s.resources.money = 0;
  assert.ok(g.automation.start('build-1')); assert.equal(s.basket.length, 3);
});

test('Habilidades: progresan por uso, limitan beneficios y conservan consumo al reanudar', () => {
  const g = setup(), s = g.state.current, [item] = load(g);
  Object.assign(s.player, g.config.laundry.station);
  for (let i = 0; i < 10; i++) { item.cleanliness = 20; g.laundry.wash(item, 4); }
  assert.equal(g.skills.level('maria', 'washing'), 1);
  assert.ok(g.laundry.duration(item) < 3);
  assert.equal(g.automation.purchase('filter'), null); assert.ok(g.automation.purchase('filter'));
  assert.equal(g.skills.washCost().water, 1);
  s.skills.maria.washing = 1000000;
  assert.equal(g.skills.level('maria', 'washing'), 5);
  g.skills.gain('maria', ['washing']); assert.equal(s.skills.maria.washing, 1000000);
  const before = s.orders.length; s.skills.maria.management = 50; s.day++;
  g.climate.newDay(s); g.family.newDay(s); g.orders.generate(s);
  assert.equal(s.orders[before].price, g.orders.customer(s.orders[before].clientId).price + 5);
  g.saveFormat.snapshot();
});

test('Sensores: solo dos sogas elegidas se protegen con aviso de lluvia; pagos persistentes', () => {
  const g = setup(), s = g.state.current;
  g.yard.place('rope', 500, 240); g.yard.place('rope', 640, 240); g.yard.place('rope', 780, 240);
  assert.ok(g.automation.installRoof('build-1'));
  assert.equal(g.automation.purchase('sensor'), null);
  assert.equal(g.automation.installRoof('build-1'), null); assert.equal(g.automation.installRoof('build-2'), null);
  assert.ok(g.automation.installRoof('build-3')); assert.ok(g.automation.installRoof('build-1'));
  const garment = { status: 'hanging', ...g.yard.position(8) };
  assert.equal(g.yard.cover(garment), 1);
  s.climate.segments[1].kind = 'rain'; s.elapsed = s.daySeconds / 4 - 10;
  assert.equal(g.yard.cover(garment), .1);
  s.workshop.sensor = false; assert.equal(g.yard.cover(garment), 1);
  g.saveFormat.snapshot();
});

test('Jaqui: camina por puertas y patio, recoge con volumen limitado y vuelve a casa', () => {
  const g = setup(), s = g.state.current;
  const expected = s.items.reduce((n, p) => n + g.collection.scoreFor(p), 0);
  assert.equal(g.helper.assign('collect'), null);
  let outside = false;
  tick(g, 160, () => {
    const h = s.workshop.helper, m = s.family.members[1]; outside ||= h.scene === 'yard';
    assert.equal(g.player.canStand(m.x, m.y, true, { ...s, scene: h.scene }), true);
    assert.ok(g.helper.used() <= g.helper.capacity());
  });
  assert.equal(outside, true); assert.equal(s.saved, 8); assert.equal(s.points, expected);
  assert.ok(s.skills.jaqui.coordination > 0);
  assert.equal(g.helper.assign('return'), null); tick(g, 30);
  assert.equal(s.workshop.helper.active, false); assert.equal(s.workshop.helper.scene, 'house');
  assert.equal(g.helper.used(), 0); g.saveFormat.snapshot();
});

test('Jaqui: transporta prendas y traspasa solo lo que cabe junto a María', () => {
  const g = setup(), s = g.state.current;
  g.orders.accept(s.orders[0].id); g.helper.assign('transport');
  tick(g, 30);
  assert.equal(s.workshop.helper.scene, 'yard'); assert.equal(g.helper.used(), 3);
  assert.ok(g.helper.receive());
  const m = s.family.members[1]; Object.assign(s.player, { x: m.x, y: m.y });
  assert.equal(g.helper.receive(), null); assert.equal(s.basket.length, 3); assert.equal(g.helper.used(), 0);
  assert.equal(new Set(s.items.map(p => p.id)).size, s.items.length);
  g.saveFormat.snapshot();
});

test('Jaqui: rutina requiere agenda y tiende prendas limpias sin ocupar dos veces la soga', () => {
  const g = setup(), s = g.state.current; clearFamily(g);
  assert.ok(g.helper.assign('schedule')); g.automation.purchase('planner');
  g.orders.accept(s.orders[0].id);
  g.orders.goods(s.orders[0]).forEach(p => { p.cleanliness = 100; p.wetness = 100; });
  g.helper.assign('hang'); tick(g, 35);
  assert.ok(g.orders.goods(s.orders[0]).some(p => p.status === 'hanging'));
  const hanging = s.items.filter(p => p.status === 'hanging');
  assert.equal(new Set(hanging.map(p => p.slot)).size, hanging.length);
  assert.equal(g.helper.assign('schedule'), null); tick(g, 100);
  assert.equal(g.orders.goods(s.orders[0]).filter(p => p.status === 'stored').length, 3);
  g.saveFormat.snapshot();
});

test('Jaqui: carrera con María por una prenda no duplica ropa ni experiencia', () => {
  const g = setup(), s = g.state.current, item = s.items[0], h = s.workshop.helper, m = s.family.members[1];
  g.helper.assign('collect'); h.scene = 'yard'; Object.assign(m, { x: item.x, y: item.y });
  h.target = { kind: 'pickup', itemId: item.id }; h.work = .8;
  g.collection.completePickup(item); g.helper.update(.2);
  assert.equal(item.status, 'basket'); assert.equal(s.basket.length, 1); assert.equal(g.helper.used(), 0); assert.equal(h.actions, 0);
  g.saveFormat.snapshot();
});

test('Jaqui: caminos y guantes reducen tropiezos; el error conserva la prenda y admite relavado', () => {
  let seed = 0;
  while (true) { const value = ((Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296; if (value > .018 && value < .025) break; seed++; }
  for (const protection of ['none', 'path', 'gloves']) {
    const g = setup(), s = g.state.current; g.orders.accept(s.orders[0].id);
    const item = g.orders.goods(s.orders[0])[0]; item.status = 'helper'; item.cleanliness = 90;
    g.helper.assign('transport'); const h = s.workshop.helper; h.scene = 'yard'; h.seed = seed; h.distance = 79;
    Object.assign(s.family.members[1], { x: 510, y: 250 });
    if (protection === 'path') g.yard.place('path', 500, 240);
    if (protection === 'gloves') g.automation.purchase('gloves');
    g.helper.update(1 / 60);
    assert.equal(h.stumbles, protection === 'none' ? 1 : 0);
    assert.equal(item.status, 'helper');
    if (protection === 'none') {
      assert.equal(item.cleanliness, 85);
      Object.assign(s.player, s.family.members[1]); assert.equal(g.helper.receive(), null);
      Object.assign(s.player, g.config.laundry.station); g.laundry.wash(item, 4);
      assert.equal(item.cleanliness, 100);
    }
    g.saveFormat.snapshot();
  }
});

test('Automatización: pausa y construcción detienen a Jaqui y a las máquinas', () => {
  const g = setup(), s = g.state.current; g.yard.place('washer', 100, 320); load(g);
  Object.assign(s.player, { x: 130, y: 375 }); g.automation.start('build-1'); g.helper.assign('collect');
  g.screens.pause(); const before = JSON.stringify(s.workshop); g.engine.update(10);
  assert.equal(JSON.stringify(s.workshop), before);
  g.buildMenu.select('flowers'); g.engine.update(10); assert.equal(JSON.stringify(s.workshop), before);
});

test('Automatización: recuperación de Jaqui en camino, migración v6 y rechazo de estados falsos', () => {
  const g = setup(), s = g.state.current; g.helper.assign('collect'); tick(g, 10);
  const save = g.saveFormat.snapshot(); g.state.current = g.saveFormat.restore(save); g.screens.resume(); tick(g, 150);
  assert.equal(g.state.current.saved, 8);
  const current = g.saveFormat.snapshot();
  for (const mutate of [e => e.data.skills.jaqui.speed = -1, e => e.data.workshop.owned.push('sensor'),
    e => e.data.workshop.helper.scene = 'house', e => e.data.workshop.helper.seed = NaN,
    e => e.data.workshop.machines.push({ id: 'build-99', items: [], cycles: 0, services: 0, wear: 0, remaining: 0 })]) {
    const invalid = JSON.parse(JSON.stringify(current)); mutate(invalid); assert.throws(() => g.saveFormat.validate(invalid));
  }
  const old = g.saveFormat.snapshot(g.calendar.newGame()); old.version = 6; delete old.data.workshop;
  old.data.skills = { futureSkill: 7 }; old.data.automations.push({ id: 'future-task' });
  const restored = g.saveFormat.restore(old);
  assert.equal(restored.workshop.legacySkills.futureSkill, 7); assert.equal(restored.workshop.legacyAutomations[0].id, 'future-task');
  assert.equal(restored.resources.money, 30); g.saveFormat.snapshot(restored);
});

test('Automatización: el reloj y los lotes dan el mismo resultado a 5 y 60 FPS', () => {
  const results = [];
  for (const fps of [5, 60]) {
    const g = setup(), s = g.state.current; g.yard.place('washer', 100, 320); load(g);
    Object.assign(s.player, { x: 130, y: 375 }); g.automation.start('build-1'); g.helper.assign('collect');
    g.engine.resetTime(); g.engine.frame(0);
    for (let i = 1; i <= fps * 8; i++) g.engine.frame(i * 1000 / fps);
    results.push([s.elapsed, s.workshop.machines[0].remaining, s.family.members[1].x, s.family.members[1].y]);
  }
  for (let i = 0; i < results[0].length; i++) assert.ok(Math.abs(results[0][i] - results[1][i]) < 1e-8);
});

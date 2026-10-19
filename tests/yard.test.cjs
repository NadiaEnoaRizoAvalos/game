const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createGame } = require('./helpers.cjs');
function setup() {
  const { game: g } = createGame(); g.screens.startCampaign();
  g.state.current.resources.money = 1000;
  for (let i = 0; i < 3; i++) assert.equal(g.house.materials(), null);
  return g;
}

test('Patio: construcciones y herramientas cobran una vez y conservan materiales', () => {
  const g = setup(), s = g.state.current, money = s.resources.money;
  assert.equal(g.yard.place('rope', 500, 240), null);
  assert.equal(s.resources.money, money - 28); assert.equal(s.resources.wood, 16);
  const before = s.resources.money;
  assert.ok(g.yard.place('flowers', 500, 240)); assert.equal(s.resources.money, before);
  assert.equal(g.yard.tool('basket8'), null); assert.equal(s.basketCapacity, 8);
  assert.ok(g.yard.tool('basket8')); assert.equal(s.resources.money, before - 24);
  assert.equal(g.yard.tool('basket12'), null); assert.equal(s.basketCapacity, 12);
  assert.equal(g.yard.tool('washboard'), null);
  assert.equal(s.resources.wood, 15);
  g.saveFormat.snapshot();
});

test('Patio: respeta zonas originales, cuadrícula, límites, saldo y madera', () => {
  const g = setup(), s = g.state.current;
  for (const args of [['tree', 140, 220], ['fence', 140, 400], ['rope', 400, 160], ['basin', 280, 220],
    ['flowers', 500.5, 240], ['flowers', 500, 241], ['tree', 940, 580], ['tree', 500, 240, 1]]) {
    assert.ok(g.yard.place(...args), args.join(','));
  }
  assert.equal(s.constructions.length, 0);
  assert.ok(g.yard.tool('basket12'));
  s.resources.wood = 0; assert.ok(g.yard.place('rope', 500, 240));
  s.resources.money = 12; assert.ok(g.yard.place('flowers', 500, 240));
  assert.equal(s.resources.money, 12);
});

test('Patio: límite activo no cobra de más y retirar libera un lugar', () => {
  const g = setup(), s = g.state.current;
  for (let y = 60; y < 600 && g.yard.active().length < 64; y += 20) {
    for (let x = 40; x < 960 && g.yard.active().length < 64; x += 20) g.yard.place('path', x, y);
  }
  assert.equal(g.yard.active().length, 64);
  const money = s.resources.money;
  assert.match(g.yard.place('path', 500, 240), /límite/);
  assert.equal(s.resources.money, money);
  const first = s.constructions[0]; assert.equal(g.yard.remove(first.id), null);
  assert.equal(g.yard.place('path', first.x, first.y), null);
  assert.equal(g.yard.active().length, 64); assert.equal(s.yard.nextId, 66);
  g.saveFormat.snapshot();
});

test('Patio: un cerco no puede cerrar el único paso ni encerrar a María', () => {
  const g = setup(), s = g.state.current;
  Object.assign(s.player, { x: 850, y: 410 });
  assert.equal(g.yard.place('fence', 820, 360), null);
  assert.equal(g.yard.place('fence', 800, 380, 1), null);
  assert.equal(g.yard.place('fence', 820, 440), null);
  const before = s.resources.money;
  assert.match(g.yard.place('fence', 880, 380, 1), /acceso|encerr/);
  assert.equal(s.resources.money, before);
  assert.equal(s.constructions.length, 3);
  assert.equal(g.yard.connected(s), true);
  assert.equal(g.player.canStand(810, 400), false);
  assert.equal(g.yard.place('flowers', 880, 380), null); // Una decoración transitable sí permite salir.
  g.saveFormat.snapshot();
});

test('Patio: mantiene libre el frente de los depósitos aunque María esté lejos', () => {
  const g = setup(), s = g.state.current;
  assert.equal(g.yard.place('storage', 820, 400), null);
  const money = s.resources.money;
  assert.match(g.yard.place('fence', 820, 440), /acceso|encerr/);
  assert.equal(s.resources.money, money);
  assert.equal(g.yard.connected(s), true);
});

test('Patio: un canasto antiguo de 8 unidades puede ampliarse a 12', () => {
  const g = setup(), s = g.state.current;
  const old = g.saveFormat.snapshot(); old.version = 5; delete old.data.yard;
  old.data.basketCapacity = 8;
  g.state.current = g.saveFormat.restore(old);
  assert.equal(g.yard.tool('basket12'), null);
  assert.equal(g.state.current.basketCapacity, 12);
  g.saveFormat.snapshot();
});

test('Patio: sogas nuevas conservan ID, capacidad, ropa y posición tras guardar', () => {
  const g = setup(), s = g.state.current;
  assert.equal(g.yard.place('rope', 500, 240), null);
  assert.equal(g.yard.slots().length, 10);
  g.orders.accept(s.orders[0].id);
  Object.assign(s.player, g.config.settings.door); g.laundry.load(s.orders[0].id);
  const item = s.basket[0]; item.cleanliness = 100; item.wetness = 100;
  Object.assign(s.player, g.yard.position(8));
  assert.equal(g.laundry.hang(item, 8), true);
  assert.equal(g.laundry.hang(s.basket[0], 8), false);
  const snapshot = g.saveFormat.snapshot(), restored = g.saveFormat.restore(snapshot);
  const saved = restored.items.find(p => p.id === item.id);
  assert.equal(saved.slot, 8); assert.equal(saved.x, 540); assert.equal(saved.ropeId, 4);
  assert.ok(g.yard.move('build-1', 640, 240)); assert.ok(g.yard.remove('build-1'));
  g.collection.completePickup(item);
  assert.equal(item.slot, null);
  assert.equal(g.yard.move('build-1', 640, 240), null);
  assert.equal(g.yard.position(8).x, 680);
  const money = s.resources.money;
  assert.equal(g.yard.remove('build-1'), null); assert.equal(s.resources.money, money + 14);
  assert.ok(g.yard.remove('build-1')); assert.equal(g.yard.position(8), null);
  assert.equal(g.yard.slots().length, 8);
  g.saveFormat.snapshot();
});

test('Patio: techos reducen lluvia y polvo y árboles agregan sombra', () => {
  const g = setup(), s = g.state.current;
  g.collection.completePickup(s.items.find(p => p.slot === 3)); g.collection.deposit();
  assert.equal(g.yard.place('covered', 500, 240), null);
  assert.equal(g.yard.place('tree', 640, 240), null);
  g.orders.accept(s.orders[0].id);
  Object.assign(s.player, g.config.settings.door); g.laundry.load(s.orders[0].id);
  const [protectedItem, exposed] = s.basket;
  for (const [p, slot] of [[protectedItem, 8], [exposed, 3]]) {
    p.cleanliness = 100; p.wetness = 0; Object.assign(s.player, g.yard.position(slot));
    assert.equal(g.laundry.hang(p, slot), true);
  }
  s.rainIntensity = 1; s.climate.segments[0].kind = 'storm';
  g.climate.update(2);
  assert.ok(protectedItem.wetness < exposed.wetness / 2);
  assert.equal(g.climate.shelter({ x: 700, y: 280 }), true);
  s.rainIntensity = 0; s.climate.segments[0].kind = 'wind';
  protectedItem.cleanliness = exposed.cleanliness = 100;
  g.climate.update(2);
  assert.ok(protectedItem.cleanliness > exposed.cleanliness);
});

test('Patio: caminos mejoran velocidad y tabla reduce tiempo sin cambiar consumos', () => {
  const g = setup(), s = g.state.current;
  assert.equal(g.yard.place('path', 240, 400), null);
  Object.assign(s.player, { x: 250, y: 410 }); g.player.move(1, 0, .02);
  assert.ok(Math.abs(s.player.x - 250 - 225 * 1.15 * .02) < 1e-9);
  assert.equal(g.yard.tool('washboard'), null);
  g.orders.accept(s.orders[0].id); Object.assign(s.player, g.config.settings.door); g.laundry.load(s.orders[0].id);
  const item = s.basket[0], soap = s.resources.soap;
  Object.assign(s.player, g.config.laundry.station);
  assert.ok(Math.abs(g.laundry.duration(item) - 2.4) < 1e-9);
  g.laundry.wash(item, 3);
  assert.equal(item.cleanliness, 100); assert.equal(s.resources.soap, soap - 1);
});

test('Patio: lavadero y depósito sirven para lavar, cargar y guardar, sin entregar a clientes', () => {
  const g = setup(), s = g.state.current;
  assert.equal(g.yard.place('storage', 100, 320), null);
  assert.equal(g.yard.place('basin', 100, 540), null);
  g.orders.accept(s.orders[0].id);
  Object.assign(s.player, { x: 130, y: 372 });
  assert.equal(g.house.atStorage(), true); assert.equal(g.house.context().kind, 'storage');
  assert.equal(g.laundry.load(s.orders[0].id), null);
  Object.assign(s.player, { x: 130, y: 592 });
  assert.equal(g.laundry.nearStation(), true);
  assert.equal(g.laundry.wash(s.basket[0], 3), true);
  Object.assign(s.player, { x: 130, y: 372 });
  g.collection.deposit(); assert.equal(s.basket.length, 0);
  assert.ok(g.orders.deliver(s.orders[0].id));
  g.saveFormat.snapshot();
});

test('Patio: previsualizar, cancelar y salir no cobran ni hacen avanzar la simulación', () => {
  const g = setup(), s = g.state.current, money = s.resources.money, time = s.elapsed;
  g.buildMenu.select('rope'); assert.equal(s.mode, 'building');
  assert.equal(g.buildMenu.error(), null);
  g.engine.update(10); assert.equal(s.elapsed, time);
  g.buildMenu.move(-1, 0); assert.equal(g.buildMenu.preview.x, 480);
  assert.equal(s.resources.money, money);
  g.buildMenu.finish(); assert.equal(s.mode, 'playing'); assert.equal(s.constructions.length, 0);
  g.buildMenu.select('rope'); g.buildMenu.confirm();
  assert.equal(s.constructions.length, 1); assert.equal(s.resources.money, money - 28);
  g.buildMenu.confirm(); assert.equal(s.constructions.length, 1);
});

test('Patio: JSON valida compras, colisiones y madera; migración v5 preserva progreso', () => {
  const g = setup(), s = g.state.current;
  g.yard.place('rope', 500, 240); g.yard.tool('basket8');
  g.calendar.endDay(); g.calendar.advanceDay();
  const encoded = g.saveFormat.snapshot(), restored = g.saveFormat.restore(encoded);
  assert.equal(restored.day, 2); assert.equal(restored.constructions[0].x, 500); assert.equal(restored.basketCapacity, 8);
  for (const mutate of [e => e.data.constructions[0].x = 140, e => e.data.constructions[0].x = 501,
    e => e.data.constructions[0].type = 'machine', e => e.data.constructions[0].removed = true,
    e => e.data.basketCapacity = 100, e => e.data.yard.tools.push('basket8'),
    e => e.data.laundry.ledger.find(e => e.kind === 'yard').amount = -1, e => e.data.resources.wood++]) {
    const invalid = JSON.parse(JSON.stringify(encoded)); mutate(invalid);
    assert.throws(() => g.saveFormat.validate(invalid));
  }
  const old = g.saveFormat.snapshot(g.calendar.newGame()); old.version = 5; delete old.data.yard;
  old.data.constructions.push({ id: 'reserved-future-path' });
  const migrated = g.saveFormat.restore(old);
  assert.equal(migrated.constructions.length, 0); assert.equal(migrated.yard.legacyConstructions[0].id, 'reserved-future-path');
  assert.equal(migrated.resources.money, 30); assert.equal(migrated.house.rooms.length, 3);
  g.saveFormat.snapshot(migrated);
});

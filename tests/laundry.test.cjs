const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createGame } = require('./helpers.cjs');

function setup() {
  const { game } = createGame();
  game.screens.startCampaign();
  const s = game.state.current;
  // La ropa familiar se guarda para liberar las ocho posiciones originales.
  for (const p of s.items) p.status = 'saved';
  s.saved = s.items.length;
  const order = s.orders[0];
  assert.equal(game.orders.accept(order.id), null);
  Object.assign(s.player, game.config.settings.door);
  return { game, s, order };
}
function washAndHang(game, order) {
  const s = game.state.current;
  assert.equal(game.laundry.load(order.id), null);
  Object.assign(s.player, game.config.laundry.station);
  for (const p of [...s.basket]) assert.equal(game.laundry.wash(p, 10), true);
  let slot = 0;
  for (const p of [...s.basket]) {
    Object.assign(s.player, game.state.garmentPosition(slot, 8));
    assert.equal(game.laundry.hang(p, slot++), true);
  }
}

test('Pedido completo: aceptar, lavar, tender, secar, guardar y cobrar una sola vez', () => {
  const { game, s, order } = setup();
  assert.equal(game.orders.stage(order), 'accepted');
  washAndHang(game, order);
  assert.equal(game.orders.stage(order), 'drying');
  game.laundry.update(40);
  for (const p of game.orders.goods(order)) game.collection.completePickup(p);
  Object.assign(s.player, game.config.settings.door);
  game.collection.deposit();
  assert.equal(game.orders.stage(order), 'ready');
  const before = s.resources.money;
  assert.equal(game.orders.deliver(order.id), null);
  assert.equal(s.resources.money, before + order.price);
  assert.equal(game.orders.stage(order), 'delivered');
  assert.ok(game.orders.deliver(order.id));
  assert.equal(s.resources.money, before + order.price);
  assert.equal(s.laundry.ledger.filter(e => e.kind === 'delivery').length, 1);
  game.saveFormat.validate(game.saveFormat.snapshot());
});

test('Insumos se pagan una vez, lavado interrumpido y recuperación conservan progreso', () => {
  const { game, s, order } = setup();
  game.laundry.load(order.id);
  const p = s.basket[0];
  Object.assign(s.player, game.config.laundry.station);
  const water = s.resources.water;
  game.laundry.wash(p, .5);
  assert.equal(game.orders.stage(order), 'washing');
  assert.equal(s.resources.water, water - 2);
  const restored = game.saveFormat.restore(game.saveFormat.snapshot());
  game.state.current = restored;
  game.laundry.wash(restored.basket[0], 10);
  assert.equal(restored.resources.water, water - 2);
  assert.equal(restored.basket[0].cleanliness, 100);
  assert.equal(restored.basket[0].wetness, 100);
  assert.equal(game.laundry.wash(restored.basket[0], 10), false);
});

test('Capacidad por volumen y descarga automática no deshacen una carga en la puerta', () => {
  const { game, s, order } = setup();
  s.basketCapacity = 1;
  game.laundry.load(order.id);
  assert.equal(s.basket.length, 1);
  game.collection.update(.1);
  assert.equal(s.basket.length, 1);
  Object.assign(s.player, { x: 300, y: 300 });
  game.collection.update(.1);
  Object.assign(s.player, game.config.settings.door);
  game.collection.update(.1);
  assert.equal(s.basket.length, 0);
  assert.equal(game.orders.goods(order).filter(p => p.status === 'stored').length, 3);
});

test('Ropa incompleta, sucia o mojada no se entrega; insumos inexistentes no se consumen', () => {
  const { game, s, order } = setup();
  assert.ok(game.orders.deliver(order.id));
  game.laundry.load(order.id);
  Object.assign(s.player, game.config.laundry.station);
  s.resources.soap = 0;
  const water = s.resources.water;
  assert.equal(game.laundry.wash(s.basket[0], 10), false);
  assert.equal(s.resources.water, water);
  assert.equal(s.basket[0].washProgress, 0);
  s.resources.money = 0;
  assert.ok(game.orders.buySupplies());
  assert.equal(s.resources.soap, 0);
  assert.ok(game.orders.deliver(order.id));
});

test('Lluvia obliga a secar nuevamente; el techo protege ropa almacenada', () => {
  const { game, s, order } = setup();
  washAndHang(game, order);
  game.laundry.update(40);
  const clothes = game.orders.goods(order);
  game.collection.completePickup(clothes[0]);
  game.collection.deposit();
  s.elapsed = s.weatherProfile.delay + s.weatherProfile.stormAfter;
  game.weather.update(5);
  assert.equal(clothes[0].wetness, 0);
  assert.ok(clothes[1].wetness > 0);
  const wet = clothes[1].wetness;
  game.laundry.update(5);
  assert.equal(clothes[1].wetness, wet);
  assert.equal(game.orders.stage(order), 'drying');
});

test('Pedidos entre días, cupos, aceptación duplicada y generación idempotente', () => {
  const { game, s, order } = setup();
  const size = s.items.length;
  assert.ok(game.orders.accept(order.id));
  assert.equal(s.items.length, size);
  for (const o of s.orders.slice(1)) assert.equal(game.orders.accept(o.id), null);
  game.calendar.endDay(); game.calendar.advanceDay();
  assert.equal(order.state, 'accepted');
  assert.equal(game.orders.goods(order).length, 3);
  const count = s.orders.length;
  game.orders.generate();
  assert.equal(s.orders.length, count);
  assert.ok(game.orders.accept(s.orders.find(o => o.state === 'available').id));
  assert.equal(s.items.length, size + 4);
});

test('Un lugar ocupado no admite otra prenda; distancia y limpieza se validan', () => {
  const { game, s, order } = setup();
  game.laundry.load(order.id);
  const first = s.basket[0];
  Object.assign(s.player, game.state.garmentPosition(0, 8));
  assert.equal(game.laundry.hang(first, 0), false);
  Object.assign(s.player, game.config.laundry.station);
  for (const p of s.basket) game.laundry.wash(p, 10);
  assert.equal(game.laundry.hang(first, 0), false);
  Object.assign(s.player, game.state.garmentPosition(0, 8));
  assert.equal(game.laundry.hang(first, 0), true);
  assert.equal(game.laundry.hang(s.basket[0], 0), false);
});

test('Migración de formato 1 conserva prendas y recursos y concede kit una sola vez', () => {
  const { game } = createGame();
  game.screens.startCampaign();
  const old = game.saveFormat.snapshot();
  old.version = 1;
  delete old.data.laundry;
  old.data.orders = [{ id: 'future-order' }];
  old.data.resources.money = 7;
  const state = game.saveFormat.restore(old);
  assert.equal(state.resources.money, 37);
  assert.equal(state.laundry.legacyOrders[0].id, 'future-order');
  assert.equal(state.items.length, old.data.items.length);
  const again = game.saveFormat.restore(game.saveFormat.snapshot(state));
  assert.equal(again.resources.money, 37);
});

test('El esquema rechaza prendas huérfanas, pagos duplicados y pedidos sin prendas', () => {
  const { game } = setup();
  for (const mutate of [
    e => e.data.items.find(p => p.orderId).orderId = 'order-999',
    e => e.data.orders[0].count++,
    e => e.data.orders[0].paid = 100,
    e => e.data.items.find(p => p.orderId).washProgress = -1,
    e => e.data.laundry.clients[0].completed = 5
  ]) {
    const e = game.saveFormat.snapshot(); mutate(e);
    assert.throws(() => game.saveFormat.validate(e));
  }
});

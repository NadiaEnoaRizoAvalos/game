const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createGame } = require('./helpers.cjs');
function setup() { const { game, elements } = createGame(); game.screens.startCampaign(); return { g: game, s: game.state.current, elements }; }

test('Vecinos: fila corresponde a ofertas, no bloquea ni altera la entrada original', () => {
  const { g, s } = setup();
  const waiting = g.customers.waiting();
  assert.equal(waiting.length, 3);
  assert.equal(new Set(waiting.map(v => `${v.x},${v.y}`)).size, 3);
  for (const v of waiting) {
    assert.equal(v.order.clientId, v.client.id);
    assert.equal(g.player.canStand(v.x, v.y), true);
    Object.assign(s.player, { x: v.x - 20, y: v.y });
    g.player.move(1, 0, .18);
    assert.ok(s.player.x > v.x, 'Se puede atravesar el lugar de espera');
  }
  Object.assign(s.player, { x: 174, y: 270 });
  assert.equal(g.house.context().kind, 'enter');
  assert.equal(g.house.transition('house'), true);
  assert.equal(g.customers.nearby(), null);
});

test('Vecinos: interacción abre atención en casa con retrato, condiciones y dos decisiones', () => {
  const { g, s, elements } = setup();
  const v = g.customers.waiting()[0];
  assert.equal(g.customers.attend(v.order.id), false, 'No se teletransporta desde lejos');
  Object.assign(s.player, { x: v.x, y: v.y });
  assert.equal(g.house.context().label, 'ATENDER');
  g.house.queueAction(); g.house.interact();
  assert.equal(s.scene, 'house'); assert.equal(s.mode, 'paused');
  const html = elements.get('panel').innerHTML;
  for (const text of ['ATENCIÓN EN CASA', 'customer-portrait', v.client.name, `$${v.order.price}`, `día ${v.order.dueDay}`, `${v.order.requiredQuality}%`, 'ACEPTAR PEDIDO', 'RECHAZAR PEDIDO']) assert.ok(html.includes(text), text);
  assert.equal(s.orders[0].state, 'available', 'Atender no acepta automáticamente');
  assert.equal(g.customers.attend(), true, 'También se atiende estando dentro');
});

test('Vecinos: aceptar y rechazar son idempotentes, conservan recursos y retiran al cliente', () => {
  const { g, s } = setup(); const [first, second] = s.orders;
  const resources = JSON.stringify(s.resources), rep = s.reputation.score;
  assert.equal(g.orders.accept(first.id), null);
  assert.equal(g.orders.reject(second.id), null);
  assert.ok(g.orders.reject(first.id)); assert.ok(g.orders.accept(second.id)); assert.ok(g.orders.reject(second.id));
  assert.equal(g.orders.goods(first).length, first.count);
  assert.equal(g.orders.goods(second).length, 0);
  assert.equal(g.customers.waiting().length, 1);
  assert.equal(JSON.stringify(s.resources), resources); assert.equal(s.reputation.score, rep);
  assert.equal(second.rejectedDay, 1);
  const snapshot = g.saveFormat.snapshot();
  g.state.current = g.saveFormat.restore(g.saveFormat.parse(JSON.stringify(snapshot)));
  assert.equal(g.customers.waiting().length, 1);
  assert.equal(g.state.current.orders[1].state, 'rejected');
  g.calendar.endDay(); g.calendar.advanceDay();
  assert.equal(g.state.current.orders[0].state, 'accepted');
  assert.equal(g.state.current.orders[1].state, 'rejected');
  assert.equal(g.customers.waiting().length, 3);
  assert.ok(g.customers.waiting().every(v => v.order.offeredDay === 2));
});

test('Vecinos: formato 8 conserva ofertas; formato 9 rechaza decisiones adulteradas', () => {
  const { g, s } = setup(); const original = g.saveFormat.snapshot(); original.version = 8;
  g.state.current = g.saveFormat.restore(original);
  assert.equal(g.customers.waiting().length, 3);
  g.orders.reject(s.orders[0].id);
  const valid = g.saveFormat.snapshot();
  for (const mutate of [v => v.data.orders[0].rejectedDay = 99, v => v.data.orders[0].paid = 1,
    v => v.data.orders[0].acceptedDay = 1, v => v.version = 8,
    v => { v.data.orders[0].state = 'available'; }]) {
    const bad = JSON.parse(JSON.stringify(valid)); mutate(bad);
    assert.throws(() => g.saveFormat.validate(bad));
  }
});

test('Vecinos: evitan construcciones y no agregan colisiones ni modifican el mapa', () => {
  const { g, s } = setup();
  s.resources.money = 500; s.resources.wood = 20;
  assert.equal(g.yard.place('basin', 100, 320, 0), null);
  const before = JSON.stringify(s.constructions);
  const waiting = g.customers.waiting();
  assert.equal(waiting.length, 3);
  for (const v of waiting) assert.equal(g.player.canStand(v.x, v.y), true);
  g.renderer.render();
  assert.equal(JSON.stringify(s.constructions), before);
});

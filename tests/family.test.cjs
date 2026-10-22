const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createGame } = require('./helpers.cjs');
function setup() { const { game: g } = createGame(); g.screens.startCampaign(); return g; }

test('Familia: gastos atómicos, reserva comercial e historial', () => {
  const g = setup(), s = g.state.current, e = s.family.events[0];
  assert.equal(g.family.pay(e.id), null);
  assert.equal(s.resources.money, 24);
  assert.ok(g.family.pay(e.id));
  assert.equal(s.laundry.ledger.length, 1);
  assert.equal(g.economy.summary().expenses, 6);
  g.calendar.endDay(); g.calendar.advanceDay();
  s.resources.money = 12;
  assert.ok(g.family.pay(s.family.events.at(-1).id));
  assert.equal(s.resources.money, 12);
  assert.equal(s.family.events.at(-1).paid, false);
  assert.equal(g.economy.transact('invalid', NaN, 'family'), false);
});

test('Familia: aplazar no duplica necesidades y aparecen eventos escolares', () => {
  const g = setup(), s = g.state.current;
  for (let i = 0; i < 12; i++) { g.calendar.endDay(); g.calendar.advanceDay(); }
  assert.equal(s.family.events.length, 4);
  assert.ok(s.family.events.some(e => e.kind === 'school'));
  assert.equal(s.resources.money, 30);
  g.family.newDay(s);
  assert.equal(s.family.events.length, 4);
});

test('Familia: ayuda en especie recuperable sin duplicación diaria', () => {
  const g = setup(), s = g.state.current;
  assert.ok(g.family.aid());
  s.resources.money = 0; s.resources.water = 0; s.resources.soap = 0;
  assert.equal(g.family.aid(), null);
  assert.equal(s.resources.water, 12);
  assert.equal(s.resources.soap, 6);
  s.resources.water = 0; s.resources.soap = 0;
  assert.ok(g.family.aid());
  g.calendar.endDay(); g.calendar.advanceDay();
  assert.equal(g.family.aid(), null);
});

test('Familia: José tiene horario y conversaciones persistentes; pausa detiene movimiento', () => {
  const g = setup(), s = g.state.current;
  assert.equal(g.family.present('jose'), false);
  assert.match(g.family.talk('jose'), /escuela/);
  s.elapsed = s.daySeconds * .5;
  assert.equal(g.family.present('jose'), true);
  g.family.talk('jose');
  assert.equal(s.family.members[0].talkedDay, 1);
  const x = s.family.members[1].x;
  g.engine.update(.1);
  assert.notEqual(s.family.members[1].x, x);
  g.screens.pause();
  const paused = s.family.members[1].x;
  g.engine.update(2);
  assert.equal(s.family.members[1].x, paused);
});

test('Familia: mates opcionales, pedidos futuros y cierre único con resumen', () => {
  const g = setup(), s = g.state.current;
  g.orders.accept(s.orders[0].id); // Vence mañana.
  assert.equal(g.family.rest(), null);
  const x = s.player.x;
  g.controls.keys.add('right');
  g.engine.update(2);
  assert.equal(s.player.x, x);
  g.screens.pause(); const left = s.family.mate;
  g.engine.update(3); assert.equal(s.family.mate, left);
  g.screens.resume(); g.engine.update(2);
  assert.equal(s.dayEnded, true);
  assert.equal(s.family.restedDay, 1);
  assert.equal(s.orders[0].state, 'accepted');
  g.screens.resume(); assert.equal(s.mode, 'playing');
  g.calendar.advanceDay();
  assert.ok(g.family.rest()); // Ahora vence el pedido pendiente.
});

test('Familia: exportación, importación, migración v3 y rechazo de pagos falsos', () => {
  const g = setup(), s = g.state.current;
  g.family.pay(s.family.events[0].id);
  const save = g.saveFormat.snapshot();
  const restored = g.saveFormat.restore(JSON.parse(JSON.stringify(save)));
  assert.equal(restored.family.events[0].paid, true);
  assert.equal(restored.resources.money, 24);
  save.data.family.events[0].paid = false;
  assert.throws(() => g.saveFormat.validate(save), /gasto pendiente/);
  const old = g.saveFormat.snapshot(); old.version = 3;
  old.data.laundry.ledger = []; delete old.data.family;
  const migrated = g.saveFormat.restore(old);
  assert.equal(migrated.resources.money, 24);
  assert.equal(migrated.family.events.length, 1);
  g.family.initialize(migrated);
  assert.equal(migrated.family.events.length, 1);
});

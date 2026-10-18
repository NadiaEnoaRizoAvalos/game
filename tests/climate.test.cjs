const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createGame } = require('./helpers.cjs');
function setup() {
  const { game } = createGame(); game.screens.startCampaign();
  return { game, s: game.state.current };
}
function prepared(game, order) {
  assert.equal(game.orders.accept(order.id), null);
  for (const p of game.orders.goods(order)) { p.cleanliness = 100; p.wetness = 0; }
  Object.assign(game.state.current.player, game.config.settings.door);
}

test('Ocho climas, pronóstico persistente, aviso anticipado y transición de lluvia gradual', () => {
  const { game, s } = setup();
  const kinds = new Set();
  for (let day = 1; day <= 4; day++) game.climate.plan(day, 240).forEach(p => kinds.add(p.kind));
  assert.equal(kinds.size, 8);
  s.elapsed = 50; game.weather.update(.1);
  assert.equal(s.climate.warned, 1);
  assert.equal(game.climate.next().kind, 'breeze');
  s.elapsed = 180; game.weather.update(.1);
  assert.ok(s.rainIntensity > 0 && s.rainIntensity < .18);
  const restored = game.saveFormat.restore(game.saveFormat.snapshot());
  assert.equal(JSON.stringify(restored.climate), JSON.stringify(s.climate));
  assert.equal(restored.rainIntensity, s.rainIntensity);
});

test('Polvo y calor exigen otro lavado, pero nunca afectan prendas bajo techo', () => {
  const { game, s } = setup();
  const order = s.orders.find(o => o.type === 'blouse');
  prepared(game, order);
  const [exposed, stored] = game.orders.goods(order);
  const family = s.items.find(p => p.slot === 0 && p.status === 'hanging');
  family.status = 'saved'; s.saved++;
  Object.assign(exposed, game.state.garmentPosition(0, 8), { slot: 0, status: 'hanging' });
  s.climate.segments[0].kind = 'wind';
  game.weather.update(10);
  assert.ok(exposed.cleanliness < 100);
  assert.equal(stored.cleanliness, 100);
  assert.ok(game.laundry.needsWash(exposed));
  game.saveFormat.validate(game.saveFormat.snapshot());
  game.collection.completePickup(exposed);
  Object.assign(s.player, game.config.laundry.station);
  assert.equal(game.laundry.wash(exposed, 10), true);
  assert.equal(exposed.cleanliness, 100);
  Object.assign(s.player, game.state.garmentPosition(0, 8));
  game.laundry.hang(exposed, 0); exposed.wetness = 0;
  s.climate.segments[0].kind = 'heat'; game.weather.update(10);
  assert.ok(exposed.cleanliness < 100);
  assert.equal(stored.wetness, 0);
});

test('Secado depende de tela, humedad ambiental y sombra; lluvia no seca', () => {
  const rate = (kind, type, shade) => {
    const { game, s } = setup();
    const order = s.orders[0]; prepared(game, order);
    const p = game.orders.goods(order)[0];
    Object.assign(p, { status: 'hanging', wetness: 100, type, x: shade ? 936 : 500, y: shade ? 372 : 300 });
    s.climate.segments[0].kind = kind;
    game.laundry.update(1);
    return 100 - p.wetness;
  };
  assert.ok(rate('sun', 'shirt', false) > rate('clouds', 'shirt', false));
  assert.ok(rate('sun', 'shirt', false) > rate('sun', 'shirt', true));
  assert.ok(rate('sun', 'sock', false) > rate('sun', 'jacket', false));
  const { game, s } = setup();
  s.rainIntensity = .5;
  const p = s.items[0]; p.wetness = 80;
  game.laundry.update(5); assert.equal(p.wetness, 80);
});

test('Buen servicio recupera reputación; retraso menor no causa queja grave', () => {
  const { game, s } = setup();
  const order = s.orders[0]; prepared(game, order);
  s.reputation.score = 10;
  assert.equal(game.orders.deliver(order.id), null);
  assert.equal(s.reputation.score, 13);
  const next = s.orders[1]; prepared(game, next);
  s.day = next.dueDay + 1; game.climate.newDay(s);
  assert.equal(game.orders.deliver(next.id), null);
  assert.equal(s.reputation.complaints.length, 0);
  assert.equal(s.reputation.score, 11);
  const score = s.reputation.score;
  game.reputation.review(s, next);
  assert.equal(s.reputation.score, score);
  game.saveFormat.validate(game.saveFormat.snapshot());
});

test('Tres quejas graves del mismo cliente suspenden tres días; no se duplican', () => {
  const { game, s } = setup();
  const first = s.orders[0]; first.dueDay = 1;
  for (let i = 0; i < 2; i++) s.orders.push({ ...first, id: `order-${s.laundry.nextOrderId++}` });
  const jobs = s.orders.filter(o => o.clientId === first.clientId);
  jobs.forEach(o => prepared(game, o));
  s.day = 3; game.climate.newDay(s);
  game.reputation.closeDay(s);
  const client = s.laundry.clients.find(c => c.id === first.clientId);
  assert.equal(client.strikes, 3);
  assert.equal(client.blockedUntil, 6);
  assert.equal(s.reputation.complaints.length, 3);
  assert.equal(s.reputation.score, 36);
  game.reputation.closeDay(s);
  assert.equal(s.reputation.score, 36);
  game.orders.generate();
  assert.equal(s.orders.some(o => o.state === 'available' && o.clientId === first.clientId), false);
  game.saveFormat.validate(game.saveFormat.snapshot());
  s.day = 6; game.climate.newDay(s); game.reputation.newDay(s);
  assert.equal(client.blockedUntil, 0);
  assert.equal(client.strikes, 0);
  assert.equal(game.reputation.available(client.id, s), true);
});

test('Baja reputación reduce ofertas sin eliminar la posibilidad de recuperarse', () => {
  const { game, s } = setup();
  s.reputation.score = 0;
  game.calendar.endDay(); game.calendar.advanceDay();
  assert.equal(s.orders.filter(o => o.state === 'available').length, 1);
  const order = s.orders.find(o => o.state === 'available'); prepared(game, order);
  game.orders.deliver(order.id);
  assert.equal(s.reputation.score, 3);
  assert.equal(s.resources.money, 30 + order.price);
});

test('Migrar formato 2 preserva negocios y formato 1 reubica solo si el lavadero ocupa su posición', () => {
  const { game, s } = setup();
  prepared(game, s.orders[0]); game.orders.deliver(s.orders[0].id);
  const old = game.saveFormat.snapshot(); old.version = 2;
  delete old.data.climate; delete old.data.reputation;
  for (const c of old.data.laundry.clients) { delete c.trust; delete c.strikes; delete c.blockedUntil; }
  const restored = game.saveFormat.restore(old);
  assert.equal(restored.resources.money, s.resources.money);
  assert.equal(restored.orders[0].state, 'delivered');
  assert.equal(restored.reputation.score, 60);
  const legacy = game.saveFormat.snapshot(game.calendar.newGame()); legacy.version = 1;
  delete legacy.data.laundry; delete legacy.data.climate; delete legacy.data.reputation;
  legacy.data.orders = []; legacy.data.player.x = 310; legacy.data.player.y = 230;
  const migrated = game.saveFormat.restore(legacy);
  assert.equal(migrated.player.y, 267);
  assert.equal(migrated.items.length, 8);
});

test('Esquema rechaza pronóstico inválido, confianza fuera de rango y quejas duplicadas', () => {
  const { game } = setup();
  for (const mutate of [
    e => e.data.climate.segments[0].kind = 'unknown',
    e => e.data.climate.segments[0].start = 1,
    e => e.data.reputation.score = 101,
    e => e.data.laundry.clients[0].strikes = 4,
    e => e.data.reputation.complaints.push({ orderId: 'order-999' })
  ]) {
    const e = game.saveFormat.snapshot(); mutate(e);
    assert.throws(() => game.saveFormat.validate(e));
  }
});

test('Clima, calidad y secado producen el mismo resultado a 5 y 60 FPS; pausa los congela', () => {
  const run = fps => {
    const { game, s } = setup();
    s.climate.segments[0].kind = 'rain';
    game.engine.frame(0);
    for (let i = 1; i <= fps * 8; i++) game.engine.frame(i * 1000 / fps);
    game.screens.pause();
    const wet = s.items[0].wetness;
    game.engine.update(10);
    assert.equal(s.items[0].wetness, wet);
    return [s.rainIntensity, wet];
  };
  const slow = run(5), fast = run(60);
  assert.ok(Math.abs(slow[0] - fast[0]) < 1e-9);
  assert.ok(Math.abs(slow[1] - fast[1]) < 1e-9);
});

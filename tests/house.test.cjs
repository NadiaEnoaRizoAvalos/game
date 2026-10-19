const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createGame } = require('./helpers.cjs');
function setup() { const { game: g } = createGame(); g.screens.startCampaign(); return g; }
function enter(g) { Object.assign(g.state.current.player, g.config.settings.door); assert.equal(g.house.transition('house'), true); }
function upgradeAll(g) {
  g.state.current.resources.money = 1000;
  for (let i = 0; i < 6; i++) assert.equal(g.house.materials(), null);
  for (const r of g.config.house.rooms.filter(r => r.price)) assert.equal(g.house.buy('room', r.id), null);
  for (const f of g.config.house.furniture.filter(f => f.price)) assert.equal(g.house.buy('furniture', f.id), null);
}

test('Casa: toque breve entre fotogramas se procesa una vez; pausa lo descarta', () => {
  const { game: g, window } = createGame(); g.screens.startCampaign();
  const key = { key: ' ', repeat: false, preventDefault() {} };
  window.events.keydown(key); window.events.keyup(key);
  assert.equal(g.controls.keys.size, 0);
  g.engine.update(.02);
  assert.equal(g.state.current.scene, 'house');
  g.engine.update(.02); assert.equal(g.state.current.scene, 'house');
  Object.assign(g.state.current.player, g.config.house.door);
  window.events.keydown(key); window.events.keyup(key);
  g.screens.pause(); g.screens.resume(); g.engine.update(.02);
  assert.equal(g.state.current.scene, 'house');
});

test('Casa: cambio de escena con acción preserva mundo, reloj y canasto', () => {
  const g = setup(), s = g.state.current, item = s.items[0];
  g.collection.completePickup(item);
  const points = s.points, elapsed = s.elapsed;
  Object.assign(s.player, { x: 500, y: 300 });
  assert.equal(g.house.transition('house'), false);
  Object.assign(s.player, g.config.settings.door); s.laundry.leaveDoor = true;
  g.controls.keys.add('collect'); g.engine.update(.01);
  assert.equal(s.scene, 'house'); assert.equal(s.basket[0], item);
  assert.equal(s.points, points); assert.ok(s.elapsed > elapsed);
  assert.equal(g.house.transition('invalid'), false);
  g.engine.update(.01); // Soltar entre acciones.
  Object.assign(s.player, g.config.house.door);
  g.controls.keys.add('collect'); g.engine.update(.01);
  assert.equal(s.scene, 'yard'); assert.equal(s.items[0], item);
  assert.equal(s.player.y, 270);
});

test('Casa: paredes y muebles detienen al jugador; las puertas conectan habitaciones', () => {
  const g = setup(), s = g.state.current; enter(g);
  assert.equal(g.player.canStand(80, 200), false);
  assert.equal(g.player.canStand(180, 260), false);
  assert.equal(g.player.canStand(380, 200), true);
  assert.equal(g.player.canStand(380, 420), true);
  assert.equal(g.player.canStand(495, 310), true);
  assert.equal(g.player.canStand(610, 200), false);
  Object.assign(s.player, { x: 340, y: 200 });
  g.player.move(1, 0, .4); assert.ok(s.player.x > 400);
  Object.assign(s.player, { x: 340, y: 270 });
  g.player.move(1, 0, .4); assert.ok(s.player.x < 370);
  Object.assign(s.player, { x: 120, y: 400 });
  g.player.move(-1, 0, 5); assert.ok(s.player.x > 90);
});

test('Casa: mejoras tienen costo único, materiales, dependencias y reserva', () => {
  const g = setup(), s = g.state.current;
  assert.ok(g.house.buy('room', 'jose'));
  assert.ok(g.house.buy('room', 'maria'));
  s.resources.money = 100;
  assert.equal(g.house.materials(), null); assert.equal(s.resources.money, 82);
  assert.equal(g.house.buy('room', 'maria'), null);
  assert.equal(s.resources.money, 37); assert.equal(s.resources.wood, 2);
  assert.ok(g.house.buy('room', 'maria')); assert.equal(s.resources.money, 37);
  assert.equal(g.house.buy('furniture', 'wardrobe'), null);
  assert.equal(s.resources.money, 17);
  assert.ok(g.house.materials());
  g.saveFormat.snapshot();
});

test('Casa: todo el plano amueblado es alcanzable y ningún acceso queda bloqueado', () => {
  const g = setup(); upgradeAll(g); enter(g);
  const s = g.state.current, step = 5;
  const visited = new Set(), queue = [[230, 465]];
  visited.add('230,465');
  for (let head = 0; head < queue.length; head++) {
    const [x, y] = queue[head];
    for (const [dx, dy] of [[step, 0], [-step, 0], [0, step], [0, -step]]) {
      const nx = x + dx, ny = y + dy, key = `${nx},${ny}`;
      if (!visited.has(key) && g.house.canStand(nx, ny, s)) { visited.add(key); queue.push([nx, ny]); }
    }
  }
  for (const r of g.house.rooms()) assert.ok(queue.some(([x, y]) => x > r.x + 15 && x < r.x + r.w - 15 && y > r.y + 15 && y < r.y + r.h - 15), r.id);
  for (const f of g.house.furniture().filter(f => !f.walkable)) {
    assert.ok(queue.some(([x, y]) => Math.hypot(x - f.x - f.w / 2, y - f.y - f.h - 12) < 32), f.id);
  }
  g.saveFormat.snapshot();
});

test('Casa: estantes cargan y guardan prendas sin duplicar; entrega sigue en puerta exterior', () => {
  const g = setup(), s = g.state.current;
  g.orders.accept(s.orders[0].id); enter(g);
  Object.assign(s.player, { x: 460, y: 400 });
  assert.equal(g.house.atStorage(), true);
  assert.equal(g.laundry.load(s.orders[0].id), null);
  assert.equal(s.basket.length, 3);
  g.collection.deposit(); g.collection.deposit();
  assert.equal(s.basket.length, 0);
  assert.equal(g.orders.goods(s.orders[0]).filter(p => p.status === 'stored').length, 3);
  assert.ok(g.orders.deliver(s.orders[0].id));
  assert.equal(g.collection.nearest(), null);
  g.saveFormat.snapshot();
});

test('Casa: patio simulado bajo lluvia mientras el canasto interior permanece protegido', () => {
  const g = setup(), s = g.state.current;
  g.collection.completePickup(s.items[0]); enter(g);
  s.climate.segments[0].kind = 'storm'; s.rainIntensity = 1;
  g.engine.update(1);
  assert.equal(s.basket[0].wetness, 0);
  assert.ok(s.items[1].wetness > 0);
  assert.ok(s.elapsed > 0);
  g.screens.pause(); const elapsed = s.elapsed, wetness = s.items[1].wetness;
  g.engine.update(2); assert.equal(s.elapsed, elapsed); assert.equal(s.items[1].wetness, wetness);
});

test('Casa: lavado interior usa los mismos insumos e identidad, sin tender dentro', () => {
  const g = setup(), s = g.state.current; upgradeAll(g);
  g.orders.accept(s.orders[0].id); enter(g);
  Object.assign(s.player, { x: 460, y: 400 }); g.laundry.load(s.orders[0].id);
  Object.assign(s.player, { x: 830, y: 400 });
  const item = s.basket[0], soap = s.resources.soap;
  assert.equal(g.laundry.wash(item, 10), true);
  assert.equal(item.cleanliness, 100); assert.equal(s.resources.soap, soap - 1);
  assert.equal(g.laundry.hang(item, 0), false);
  assert.equal(g.laundry.freeSlot(), null);
});

test('Casa: guardado interior y ampliaciones sobreviven JSON; v4 migra sin perder familia', () => {
  const g = setup(), s = g.state.current; upgradeAll(g); enter(g);
  g.family.pay(s.family.events[0].id);
  const save = g.saveFormat.snapshot(), restored = g.saveFormat.restore(save);
  assert.equal(restored.scene, 'house'); assert.equal(restored.player.x, 230);
  assert.equal(restored.house.rooms.length, 7); assert.equal(restored.family.events[0].paid, true);
  assert.equal(restored.house.furniture.length, 12);
  const old = g.saveFormat.snapshot(g.calendar.newGame()); old.version = 4;
  old.data.house = { rooms: [{ id: 'future-room' }], furniture: [] };
  old.data.family.members[0].x = 376; old.data.family.members[0].y = 155;
  const migrated = g.saveFormat.restore(old);
  assert.equal(migrated.scene, 'yard'); assert.equal(migrated.house.legacy.rooms[0].id, 'future-room');
  assert.equal(migrated.resources.money, 30); assert.equal(migrated.family.events.length, 1);
  g.saveFormat.snapshot(migrated);
  for (const mutate of [e => e.data.scene = 'unknown', e => e.data.player.x = 80,
    e => e.data.house.rooms.push({ id: 'invalid' }), e => e.data.resources.wood++,
    e => e.data.house.furniture.push({ id: 'wardrobe' })]) {
    const invalid = JSON.parse(JSON.stringify(save)); mutate(invalid);
    assert.throws(() => g.saveFormat.validate(invalid));
  }
});

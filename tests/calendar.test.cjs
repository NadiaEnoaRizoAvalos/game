const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createGame } = require('./helpers.cjs');

test('El reloj conserva 12 segundos a 5, 10, 20, 30 y 60 FPS', () => {
  for (const fps of [5, 10, 20, 30, 60]) {
    const { game } = createGame();
    game.screens.startCampaign();
    game.engine.frame(0);
    for (let i = 1; i <= fps * 12; i++) game.engine.frame(i * 1000 / fps);
    assert.ok(Math.abs(game.state.current.elapsed - 12) < 1e-8, `FPS ${fps}`);
    game.screens.pause();
    game.engine.frame(100000);
    game.engine.frame(101000);
    assert.ok(Math.abs(game.state.current.elapsed - 12) < 1e-8);
    game.screens.resume();
    game.engine.frame(200000);
    game.engine.frame(201000);
    assert.ok(Math.abs(game.state.current.elapsed - 13) < 1e-8);
  }
});

test('Los días preservan identidad, canasto, puntos, recursos y mundo', () => {
  const { game } = createGame();
  game.screens.startCampaign();
  const s = game.state.current;
  const pending = s.items[2];
  game.collection.completePickup(s.items[0]);
  const carried = s.basket[0];
  s.points = 42;
  s.resources.money = 70;
  s.constructions.push({ id: 'future-path' });
  game.calendar.endDay();
  assert.equal(s.mode, 'paused');
  assert.equal(game.calendar.advanceDay(), true);
  assert.equal(game.calendar.advanceDay(), false);
  assert.equal(game.state.current, s);
  assert.equal(s.day, 2);
  assert.equal(s.elapsed, 0);
  assert.equal(s.basket[0], carried);
  assert.ok(s.items.includes(pending));
  assert.equal(s.points, 42);
  assert.equal(s.resources.money, 70);
  assert.equal(s.constructions.length, 1);
  assert.equal(new Set(s.items.map(p => p.id)).size, s.items.length);
});

test('Capacidad por volumen configurable y recogida idempotente', () => {
  const { game } = createGame();
  game.screens.startCampaign();
  const s = game.state.current;
  const sheet = s.items.find(p => p.type === 'sheet');
  s.basketCapacity = 2;
  game.collection.completePickup(sheet);
  assert.equal(s.basket.length, 0);
  s.basketCapacity = 8;
  game.collection.completePickup(sheet);
  game.collection.completePickup(sheet);
  assert.equal(game.collection.usedSpace(), 3);
  assert.equal(s.basket.length, 1);
});

test('Noche presenta resumen sin borrar ropa ni forzar el día siguiente', () => {
  const { game } = createGame();
  game.screens.startCampaign();
  const s = game.state.current;
  s.elapsed = s.daySeconds - .01;
  game.engine.update(.02);
  assert.equal(s.day, 1);
  assert.equal(s.dayEnded, true);
  assert.equal(s.mode, 'paused');
  const items = s.items;
  game.screens.resume();
  game.engine.update(2);
  assert.equal(s.mode, 'playing');
  assert.equal(s.items, items);
  game.calendar.advanceDay();
  assert.equal(s.day, 2);
});

test('Un frame de 6 segundos y frames fraccionarios conservan tiempo y humedad', () => {
  const run = timestamps => {
    const { game } = createGame();
    game.screens.startCampaign();
    game.state.current.weatherProfile.delay = 0;
    game.engine.frame(0);
    timestamps.forEach(time => game.engine.frame(time));
    return game.state.current;
  };
  const slow = run([6000, 6007, 6017]);
  const fast = run([...Array.from({ length: 360 }, (_, i) => (i + 1) * 1000 / 60), 6007, 6017]);
  assert.ok(Math.abs(slow.elapsed - fast.elapsed) < 1e-9);
  assert.ok(Math.abs(slow.elapsed - 6.0166666667) < 1e-8);
  assert.ok(Math.abs(slow.items[0].wetness - fast.items[0].wetness) < 1e-9);
});

test('La duración configurada se aplica a nuevas partidas sin depender de niveles', () => {
  const { game } = createGame();
  game.config.simulation.daySeconds = 120;
  game.config.levels = [];
  game.screens.startCampaign();
  assert.equal(game.state.current.daySeconds, 120);
  assert.equal(game.state.current.weatherProfile.delay, 54);
  game.engine.update(1);
  game.renderer.render();
  assert.equal(game.state.current.elapsed, 1);
});

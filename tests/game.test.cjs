// Pruebas sin dependencias: ejecutá `node --test tests/game.test.cjs`.
// El DOM simulado verifica lógica y eventos, no reemplaza una prueba visual real.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const root = path.join(__dirname, '..');

/** Carga los mismos scripts y en el mismo orden que index.html. */
function createGame() {
  const elements = new Map();
  const context = new Proxy({}, {
    get: (object, key) => object[key] ?? (() => {}),
    set: (object, key, value) => { object[key] = value; return true; }
  });
  function element() {
    const events = {};
    return {
      events, style: {}, dataset: {}, classList: { add() {}, remove() {} },
      addEventListener(name, callback) { events[name] = callback; },
      setAttribute() {}, getContext: () => context,
      getBoundingClientRect: () => ({ width: 1000, height: 640 }),
      setPointerCapture() {}, releasePointerCapture() {}
    };
  }
  const document = {
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, element());
      return elements.get(id);
    },
    querySelectorAll: () => [], addEventListener() {}
  };
  const window = element();
  const sandbox = { document, window, console, Math, setTimeout: () => 0,
    requestAnimationFrame: () => 0 };
  vm.createContext(sandbox);
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const scripts = [...html.matchAll(/<script[^>]*src="([^"]+)"[^>]*>/g)];
  assert.equal(scripts.length, 21, 'Todos los módulos deben estar incluidos');
  for (const [, filename] of scripts) {
    vm.runInContext(fs.readFileSync(path.join(root, filename), 'utf8'), sandbox, { filename });
  }
  return { game: window.RainGame, window, elements };
}

test('Arranque, tres niveles, sogas accesibles y selección cercana', () => {
  const { game } = createGame();
  assert.equal(game.state.current.mode, 'menu');
  for (let level = 0; level < 3; level++) {
    game.screens.loadLevel(level);
    const state = game.state.current;
    assert.equal(new Set(state.items.map(item => item.y)).size, 3);
    for (const item of state.items) {
      assert.ok(game.player.canStand(item.x, item.y));
      Object.assign(state.player, { x: item.x, y: item.y });
      assert.equal(game.collection.nearest(), item);
    }
  }
});

test('Movimiento diagonal normalizado y pausa sin avanzar tiempo', () => {
  const { game } = createGame();
  game.screens.loadLevel(0);
  const player = game.state.current.player;
  Object.assign(player, { x: 500, y: 300 });
  game.player.move(1, 0, 0.1);
  const distance = player.x - 500;
  Object.assign(player, { x: 500, y: 300 });
  game.player.move(1, -1, 0.1);
  assert.ok(Math.abs(Math.hypot(player.x - 500, player.y - 300) - distance) < 0.001);
  game.screens.pause();
  game.engine.update(1);
  assert.equal(game.state.current.elapsed, 0);
  game.screens.resume();
  assert.equal(game.state.current.mode, 'playing');
});

test('Recoger, cancelar, animar y guardar sin duplicar puntos', () => {
  const { game } = createGame();
  game.screens.loadLevel(0);
  const state = game.state.current;
  const item = state.items[0];
  Object.assign(state.player, { x: item.x, y: item.y });
  game.controls.keys.add('collect');
  game.engine.update(0.2);
  assert.ok(state.progress > 0);
  game.controls.clearInputs();
  game.engine.update(0.01);
  assert.equal(state.progress, 0);
  game.controls.keys.add('collect');
  game.engine.update(item.time + 0.01);
  game.controls.clearInputs();
  assert.equal(state.basket.length, 1);
  assert.equal(state.flights.length, 1);
  game.engine.update(0.6);
  assert.equal(state.flights.length, 0);
  Object.assign(state.player, game.config.settings.door);
  game.engine.update(0.01);
  assert.equal(state.basket.length, 0);
  assert.ok(state.depositAnim);
  const points = state.points;
  assert.ok(points > 0);
  game.engine.update(1.2);
  assert.equal(state.points, points);
  assert.equal(state.depositAnim, null);
});

test('Lluvia global gradual, humedad, tormenta y final de partida', () => {
  const { game } = createGame();
  game.screens.loadLevel(0);
  const state = game.state.current;
  state.elapsed = state.level.delay;
  game.engine.update(0.01);
  assert.ok(state.rainIntensity > 0 && state.rainIntensity < 0.1);
  assert.ok(state.items.every(item => item.wetness > 0));
  for (let frame = 0; frame < 2000 && state.mode === 'playing'; frame++) {
    game.engine.update(0.05);
  }
  assert.equal(state.rainIntensity, 1);
  assert.equal(state.mode, 'results');
  assert.notEqual(game.drawing.wetColor('#eee9d0', 100), '#eee9d0');
  game.renderer.render();
});

test('Joystick circular, multitáctil y limpieza de entradas', () => {
  const { game } = createGame();
  const controls = game.controls;
  const neutral = controls.joystickVector(1, 1, 32);
  assert.equal(neutral.x, 0);
  assert.equal(neutral.y, 0);
  const diagonal = controls.joystickVector(40, -40, 32);
  assert.ok(Math.abs(Math.hypot(diagonal.x, diagonal.y) - 1) < 0.001);
  controls.touchHeld.set(1, { directions: ['left', 'up'] });
  controls.touchHeld.set(2, { directions: ['collect'] });
  controls.refreshTouchKeys();
  assert.ok(controls.keys.has('up') && controls.keys.has('collect'));
  controls.touchHeld.delete(1);
  controls.refreshTouchKeys();
  assert.ok(!controls.keys.has('up') && controls.keys.has('collect'));
  controls.clearInputs();
  assert.equal(controls.keys.size, 0);
});

test('Cámara vertical/horizontal, resolución y pausa al girar', () => {
  const { game, window } = createGame();
  window.matchMedia = () => ({ matches: true });
  window.devicePixelRatio = 2;
  for (const [width, height] of [[390, 844], [844, 390], [844, 330], [320, 568]]) {
    const camera = game.camera.cameraFor(width, height, { x: 950, y: 600 });
    assert.ok(camera.x >= 0 && camera.y >= 0);
    assert.ok(camera.x + camera.visibleW <= 1000.001);
    assert.ok(camera.y + camera.visibleH <= 640.001);
    assert.ok(950 >= camera.x && 950 <= camera.x + camera.visibleW);
    assert.ok(600 >= camera.y && 600 <= camera.y + camera.visibleH);
    game.dom.canvas.getBoundingClientRect = () => ({ width, height });
    game.camera.configureViewport();
    assert.equal(game.dom.canvas.width, width * 2);
    assert.equal(game.dom.canvas.height, height * 2);
    game.renderer.render();
  }
  game.screens.loadLevel(0);
  window.events.orientationchange();
  assert.equal(game.state.current.mode, 'paused');
  assert.equal(game.controls.keys.size, 0);
});

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createGame } = require('./helpers.cjs');

async function setup() {
  const result = createGame();
  const { game, window } = result;
  const records = new Map();
  game.database.read = async (key = 'current') => records.get(key) ?? null;
  game.database.write = async (value, archive) => {
    const old = records.get('current');
    if (old) records.set('previous', old);
    if (archive && old) records.set('backup', old);
    records.set('current', JSON.parse(JSON.stringify(value)));
  };
  window.confirm = () => true;
  await game.saves.init();
  return { ...result, records };
}

test('JSON round-trip reconstruye referencias únicas y todos los campos persistentes', () => {
  const { game } = createGame();
  game.screens.startCampaign();
  const s = game.state.current;
  game.collection.completePickup(s.items[0]);
  s.resources.money = 75;
  const order = s.orders[0];
  game.orders.accept(order.id);
  s.characters = [{ id: 'jaqui', experience: 1 }];
  s.yard.legacyConstructions = [{ id: 'rope-4' }];
  s.house.legacy.rooms.push({ id: 'kitchen' });
  s.workshop.legacySkills = { washing: 2 };
  s.upgrades = [{ id: 'basket-8' }];
  s.basketCapacity = 8;
  s.yard.baseBasketCapacity = 8;
  const encoded = game.saveFormat.snapshot();
  const restored = game.saveFormat.restore(game.saveFormat.parse(JSON.stringify(encoded)));
  assert.equal(restored.basket[0], restored.items.find(p => p.id === restored.basket[0].id));
  assert.equal(restored.resources.money, 75);
  assert.equal(restored.house.legacy.rooms[0].id, 'kitchen');
  assert.equal(restored.orders[0].dueDay, order.dueDay);
  assert.equal(restored.orders[0].state, 'accepted');
  assert.equal(restored.basketCapacity, 8);
  assert.equal(restored.target, null);
  assert.equal(restored.flights.length, 0);
  game.state.current = restored;
  game.collection.deposit();
  const points = restored.points;
  game.collection.deposit();
  assert.equal(restored.points, points);
  assert.equal(restored.items[0].status, 'saved');
  assert.equal(s.items[0].status, 'basket');
});

test('Rechaza versiones, campos ausentes, IDs repetidos, sobrecarga y posiciones inválidas', () => {
  const { game } = createGame();
  game.screens.startCampaign();
  const mutations = [
    e => e.version = 99,
    e => delete e.data.resources,
    e => e.data.items[1].id = e.data.items[0].id,
    e => e.data.items.forEach(p => p.status = 'basket'),
    e => e.data.items[0].wetness = -1,
    e => e.data.items[0].type = 'constructor',
    e => e.data.items[0].status = 'missing',
    e => e.data.items[0].slot = e.data.items[1].slot,
    e => e.data.player.x = 100,
    e => e.data.saved = 1,
    e => e.data.day = 0,
    e => e.data.elapsed = Infinity,
    e => e.data.rainIntensity = 1,
    e => e.data.resources.soap = -1
  ];
  // La posición dentro de la casa debe ser rechazada.
  mutations[8] = e => { e.data.player.x = 100; e.data.player.y = 100; };
  for (const mutate of mutations) {
    const envelope = game.saveFormat.snapshot();
    mutate(envelope);
    assert.throws(() => game.saveFormat.validate(envelope));
  }
  assert.throws(() => game.saveFormat.parse('{broken'));
  assert.throws(() => game.saveFormat.parse('{"__proto__":{"polluted":true}}'));
  assert.equal({}.polluted, undefined);
});

test('Sin datos guardados se puede iniciar, guardar, exportar y recuperar', async () => {
  const { game, records } = await setup();
  assert.equal(await game.saves.continueGame(), false);
  assert.equal(await game.saves.start(), true);
  game.state.current.resources.water = 12;
  await game.saves.save();
  const data = game.saveFormat.parse(game.saves.exportText());
  assert.equal(data.data.resources.water, 12);
  assert.equal(records.get('current').data.resources.water, 12);
});

test('Importación valida antes de confirmar y cancelar conserva mundo y guardado', async () => {
  const { game, window, records } = await setup();
  await game.saves.start();
  const original = game.state.current;
  const before = JSON.stringify(records.get('current'));
  let confirmations = 0;
  window.confirm = () => { confirmations++; return false; };
  assert.equal(await game.saves.importText('{}'), false);
  assert.equal(confirmations, 0);
  const text = game.saves.exportText();
  assert.equal(await game.saves.importText(text), false);
  assert.equal(confirmations, 1);
  assert.equal(game.state.current, original);
  assert.equal(JSON.stringify(records.get('current')), before);
  window.confirm = () => true;
  assert.equal(await game.saves.importText(text), true);
  assert.notEqual(game.state.current, original);
  assert.ok(records.get('backup'));
});

test('Error de escritura no reemplaza mundo; la cola admite reintentar', async () => {
  const { game, records } = await setup();
  await game.saves.start();
  const original = game.state.current;
  const saved = records.get('current');
  const write = game.database.write;
  game.database.write = async () => { throw new Error('Cuota agotada'); };
  assert.equal(await game.saves.importText(game.saves.exportText()), false);
  assert.equal(game.state.current, original);
  assert.equal(records.get('current'), saved);
  await assert.rejects(game.saves.save(), /Cuota/);
  game.database.write = write;
  await game.saves.save();
});

test('Guardados capturan snapshots independientes y respetan el orden', async () => {
  const { game, records } = await setup();
  await game.saves.start();
  const write = game.database.write;
  const writes = [];
  game.database.write = async (e, archive) => {
    writes.push(e.data.resources.money);
    await new Promise(resolve => setTimeout(resolve, 5));
    return write(e, archive);
  };
  game.state.current.resources.money = 1;
  const first = game.saves.save();
  game.state.current.resources.money = 2;
  const second = game.saves.save();
  await Promise.all([first, second]);
  assert.deepEqual(writes, [1, 2]);
  assert.equal(records.get('current').data.resources.money, 2);
});

test('Autoguardado en recogida, descarga, pausa y final de día', async () => {
  const { game, records } = await setup();
  await game.saves.start();
  game.collection.completePickup(game.state.current.items[0]);
  await game.saves.save();
  assert.equal(records.get('previous').data.items[0].status, 'basket');
  game.collection.deposit();
  await game.saves.save();
  assert.equal(records.get('previous').data.items[0].status, 'saved');
  game.screens.pause();
  await game.saves.save();
  assert.equal(records.get('current').data.saved, 1);
  game.calendar.endDay();
  await game.saves.save();
  assert.equal(records.get('previous').data.dayEnded, true);
});

test('Nueva partida necesita confirmación y conserva copia de la anterior', async () => {
  const { game, window, records } = await setup();
  await game.saves.start();
  game.state.current.resources.money = 99;
  window.confirm = () => false;
  assert.equal(await game.saves.start(), false);
  assert.equal(game.state.current.resources.money, 99);
  window.confirm = () => true;
  assert.equal(await game.saves.start(), true);
  assert.equal(game.state.current.resources.money, game.config.laundry.starter.money);
  assert.equal(records.get('backup').data.resources.money, 99);
});

test('No se reanuda la simulación durante un reemplazo asíncrono', async () => {
  const { game } = await setup();
  await game.saves.start();
  const text = game.saves.exportText();
  const replacing = game.saves.importText(text);
  assert.equal(game.saves.replacing, true);
  game.screens.resume();
  assert.equal(game.state.current.mode, 'paused');
  const elapsed = game.state.current.elapsed;
  game.engine.update(2);
  assert.equal(game.state.current.elapsed, elapsed);
  assert.equal(await replacing, true);
  assert.equal(game.state.current.mode, 'playing');
});

test('Una base no disponible permite jugar y exportar sin fingir un guardado', async () => {
  const { game } = await setup();
  game.database.write = async () => { throw new Error('Almacenamiento no disponible'); };
  assert.equal(await game.saves.start(), true);
  assert.equal(game.saves.active, true);
  assert.match(game.saves.message, /no disponible/);
  assert.equal(JSON.parse(game.saves.exportText()).data.day, 1);
  await assert.rejects(game.saves.save(), /no disponible/);
});

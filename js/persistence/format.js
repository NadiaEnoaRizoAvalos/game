/** Formato de intercambio independiente del DOM y de IndexedDB. */
(() => {
  'use strict';
  const Game = window.RainGame;
  const FORMAT = 'antes-de-la-lluvia';
  const VERSION = 7;
  const MAX_BYTES = 5 * 1024 * 1024;
  const fields = ['day', 'daySeconds', 'elapsed', 'points', 'saved', 'nextGarmentId',
    'basketCapacity', 'player', 'rainIntensity', 'rainStarted', 'stormAnnounced',
    'thunderAt', 'weatherProfile', 'resources', 'orders', 'characters', 'constructions',
    'upgrades', 'inventory', 'house', 'skills', 'automations', 'dayStartPoints',
    'dayStartSaved', 'dayEnded'];

  function check(condition, message) {
    if (!condition) throw new Error(`Partida inválida: ${message}.`);
  }
  function number(value, min, max, integer = false) {
    return typeof value === 'number' && Number.isFinite(value) && value >= min &&
      value <= max && (!integer || Number.isSafeInteger(value));
  }
  function object(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }

  /** Solo datos JSON acotados; rechaza claves que puedan alterar prototipos. */
  function safeTree(value, depth = 0) {
    check(depth < 20, 'estructura demasiado profunda');
    if (value === null || typeof value === 'boolean') return;
    if (typeof value === 'number') { check(Number.isFinite(value), 'número no finito'); return; }
    if (typeof value === 'string') { check(value.length <= 10000, 'texto demasiado largo'); return; }
    check(typeof value === 'object', 'dato no serializable');
    check(Object.keys(value).length <= 20000, 'demasiados elementos');
    for (const [key, child] of Object.entries(value)) {
      check(!['__proto__', 'constructor', 'prototype'].includes(key), 'clave no permitida');
      safeTree(child, depth + 1);
    }
  }

  /** Valida también relaciones: ubicación única, volumen, IDs y contadores. */
  function validate(envelope) {
    safeTree(envelope);
    check(object(envelope) && envelope.format === FORMAT, 'archivo de otro juego');
    check([1, 2, 3, 4, 5, 6, VERSION].includes(envelope.version), 'versión incompatible');
    check(typeof envelope.savedAt === 'string' && Number.isFinite(Date.parse(envelope.savedAt)), 'fecha');
    const s = envelope.data;
    check(object(s), 'faltan datos');
    for (const key of fields) check(Object.hasOwn(s, key), `falta ${key}`);
    check(number(s.day, 1, 1000000, true), 'día');
    check(number(s.daySeconds, 30, 86400), 'duración del día');
    check(number(s.elapsed, 0, 1e9), 'reloj');
    check(typeof s.dayEnded === 'boolean' && (s.dayEnded || s.elapsed <= s.daySeconds), 'cierre de día');
    for (const key of ['points', 'dayStartPoints']) check(number(s[key], 0, 1e12), key);
    for (const key of ['saved', 'dayStartSaved']) check(number(s[key], 0, 20000, true), key);
    check(s.dayStartPoints <= s.points && s.dayStartSaved <= s.saved, 'resumen del día');
    check(number(s.nextGarmentId, 1, 1000000000, true), 'secuencia de prendas');
    check(number(s.basketCapacity, .5, 100), 'capacidad');
    check(object(s.player), 'personaje');
    const bounds = Game.config.settings;
    check(number(s.player.x, bounds.minX, bounds.maxX) && number(s.player.y, bounds.minY, bounds.maxY) &&
      (envelope.version >= 5 && s.scene === 'house' ? true : Game.player.canStand(s.player.x, s.player.y, envelope.version >= 2, { scene: 'yard' })), 'posición del personaje');
    check(number(s.player.facingX, -1, 1) && number(s.player.facingY, -1, 1) &&
      typeof s.player.walking === 'boolean', 'orientación');
    check(number(s.rainIntensity, 0, 1), 'lluvia');
    check(typeof s.rainStarted === 'boolean' && typeof s.stormAnnounced === 'boolean', 'estado climático');
    check((s.rainStarted || s.rainIntensity === 0) && (!s.stormAnnounced || s.rainStarted), 'clima contradictorio');
    check(number(s.thunderAt, 0, 1e9), 'próximo trueno');
    check(object(s.weatherProfile), 'perfil climático');
    for (const key of ['delay', 'stormAfter', 'wetRate', 'wind']) {
      check(number(s.weatherProfile[key], key === 'stormAfter' ? .01 : 0, 86400), `clima ${key}`);
    }
    check(typeof s.weatherProfile.name === 'string', 'nombre del clima');
    check(object(s.resources), 'recursos');
    for (const key of ['money', 'water', 'soap']) check(number(s.resources[key], 0, 1e12), `recurso ${key}`);
    for (const key of ['orders', 'characters', 'constructions', 'upgrades', 'inventory', 'automations']) {
      check(Array.isArray(s[key]) && s[key].length <= 10000, key);
    }
    check(object(s.house) && Array.isArray(s.house.rooms) && Array.isArray(s.house.furniture), 'casa');
    check(object(s.skills), 'habilidades');
    check(Array.isArray(s.items) && s.items.length <= 20000, 'prendas');
    const ids = new Set();
    const slots = new Set();
    let volume = 0;
    let saved = 0;
    for (const p of s.items) {
      check(object(p) && typeof p.id === 'string' && /^garment-[1-9]\d*$/.test(p.id), 'identidad de prenda');
      check(!ids.has(p.id) && Number(p.id.slice(8)) < s.nextGarmentId, 'ID duplicado o fuera de secuencia');
      ids.add(p.id);
      check(Object.hasOwn(Game.config.garments, p.type), 'tipo de prenda');
      check(number(p.slot, 0, envelope.version >= 6 ? 2007 : 7, true) || (envelope.version >= 2 && p.orderId && p.slot === null && p.status !== 'hanging'), 'lugar de la soga');
      check((envelope.version === 1 ? ['hanging', 'basket', 'saved'] : ['hanging', 'basket', 'saved', 'stored', 'delivered', ...(envelope.version >= 7 ? ['helper', 'machine'] : [])]).includes(p.status), 'ubicación de prenda');
      check(number(p.wetness, 0, 100), 'humedad');
      if (p.status === 'hanging') {
        check(!slots.has(p.slot), 'dos prendas en el mismo lugar');
        slots.add(p.slot);
      }
      if (p.status === 'basket') volume += Game.config.garments[p.type].size;
      if (p.status === 'saved') saved++;
    }
    check(volume <= s.basketCapacity, 'canasto sobrecargado');
    check(saved === s.saved, 'contador de ropa guardada');
    if (envelope.version >= 2) Game.laundrySchema.validate(s, check, number, object);
    if (envelope.version >= 3) Game.climateSchema.validate(s, check, number, object);
    if (envelope.version >= 4) Game.familySchema.validate(s, check, number, object);
    if (envelope.version >= 7) Game.automationSchema.validate(s, check, number, object);
    if (envelope.version >= 6) {
      Game.yardSchema.validate(s, check, number, object);
      for (const p of s.items) if (p.slot !== null) check(!!Game.yard.position(p.slot, s), 'soga inexistente o retirada');
      if (s.scene !== 'house') check(Game.player.canStand(s.player.x, s.player.y, true, s), 'personaje dentro de una construcción');
    }
    if (envelope.version >= 5) {
      Game.houseSchema.validate(s, check, number, object);
      if (s.scene === 'house') check(Game.house.canStand(s.player.x, s.player.y, s), 'posición interior del personaje');
    }
    return envelope;
  }

  function snapshot(state = Game.state.current) {
    check(state?.campaign, 'no hay una jornada activa');
    const data = {};
    for (const key of fields) data[key] = state[key];
    data.laundry = state.laundry;
    data.climate = state.climate;
    data.reputation = state.reputation;
    data.family = state.family;
    data.scene = state.scene;
    data.yard = state.yard;
    data.workshop = state.workshop;
    data.items = state.items.map(({ id, slot, type, wetness, status, orderId, cleanliness, washProgress, machineId }) => ({ id, slot, type, wetness, status,
      ...(orderId ? { orderId, cleanliness, washProgress } : {}), ...(status === 'machine' ? { machineId } : {}) }));
    const envelope = { format: FORMAT, version: VERSION, savedAt: new Date().toISOString(), data };
    validate(envelope);
    // Desconecta el snapshot del mundo antes de encolarlo para escritura.
    return JSON.parse(JSON.stringify(envelope));
  }

  function restore(envelope) {
    validate(envelope);
    const data = JSON.parse(JSON.stringify(envelope.data));
    const state = Game.calendar.create();
    for (const key of fields) state[key] = data[key];
    if (envelope.version >= 6) state.yard = data.yard;
    else Game.yard.initialize(state);
    state.items = data.items.map(p => ({ ...Game.config.garments[p.type], ...p,
      ...(p.slot === null ? { x: 174, y: 235, ropeId: -1 } : Game.yard.position(p.slot, state)) }));
    state.basket = state.items.filter(p => p.status === 'basket');
    state.player.walking = false;
    state.mode = 'paused';
    if (envelope.version >= 2) state.laundry = data.laundry;
    else Game.orders.initialize(state);
    if (envelope.version >= 3) { state.climate = data.climate; state.reputation = data.reputation; }
    else { Game.climate.initialize(state); Game.reputation.initialize(state); }
    if (envelope.version >= 4) state.family = data.family;
    else Game.family.initialize(state);
    if (envelope.version >= 5) state.scene = data.scene;
    else { delete state.house.layoutVersion; Game.house.initialize(state); }
    if (envelope.version >= 7) state.workshop = data.workshop;
    else Game.automation.initialize(state);
    Game.helper.invalidate();
    if (envelope.version === 1 && !Game.player.canStand(state.player.x, state.player.y, true, { scene: 'yard' })) {
      state.player.x = Game.config.laundry.station.x;
      state.player.y = Game.config.laundry.station.y + 12;
    }
    return state;
  }

  function parse(text) {
    check(typeof text === 'string' && text.length <= MAX_BYTES, 'archivo demasiado grande');
    let envelope;
    try { envelope = JSON.parse(text); } catch { throw new Error('El archivo no contiene JSON válido.'); }
    return validate(envelope);
  }
  Game.saveFormat = { snapshot, restore, validate, parse, MAX_BYTES, VERSION };
})();

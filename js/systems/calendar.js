/** Jornadas continuas. Cambiar de día conserva prendas, canasto y progreso. */
(() => {
  'use strict';
  const Game = window.RainGame;
  const defaults = Game.config.simulation;
  const types = ['sock', 'shirt', 'pants', 'sheet', 'blouse', 'shirt', 'jacket', 'sock'];

  /** Solo ocupa lugares libres; la ropa pendiente nunca se reemplaza. */
  function replenish(state) {
    types.forEach((type, slot) => {
      if (state.items.some(p => p.slot === slot && p.status === 'hanging')) return;
      state.items.push({ id: `garment-${state.nextGarmentId++}`, slot, type,
        ...Game.config.garments[type], ...Game.state.garmentPosition(slot, types.length),
        wetness: 0, status: 'hanging' });
    });
  }

  function profile(seconds) {
    return { name: 'Jornada', delay: seconds * .45, stormAfter: seconds * .25, wetRate: 2, wind: 1 };
  }

  function create() {
    return {
      campaign: true, mode: 'menu', day: 1, daySeconds: defaults.daySeconds,
      elapsed: 0, total: 0, points: 0, saved: 0, nextGarmentId: 1,
      basketCapacity: Game.config.settings.basketCapacity,
      player: { x: 174, y: 270, walking: false, facingX: 0, facingY: 1 },
      items: [], basket: [], progress: 0, target: null,
      rainIntensity: 0, rainStarted: false, stormAnnounced: false,
      thunderAt: defaults.daySeconds * .45 - 4,
      weatherProfile: profile(defaults.daySeconds),
      flights: [], depositAnim: null, collectPulse: 0, flash: 0, particles: [],
      resources: { money: 0, water: 0, soap: 0 },
      orders: [], characters: [], constructions: [], upgrades: [],
      inventory: [], house: { rooms: [], furniture: [] }, skills: {}, automations: [],
      dayStartPoints: 0, dayStartSaved: 0, dayEnded: false
    };
  }

  function newGame() {
    const state = create();
    replenish(state);
    Game.orders.initialize(state);
    Game.climate.initialize(state);
    Game.reputation.initialize(state);
    return state;
  }

  /** El cierre es explícito; no destruye ni reubica el inventario. */
  function endDay() {
    const s = Game.state.current;
    if (!s.campaign || s.dayEnded) return false;
    s.dayEnded = true;
    Game.reputation.closeDay(s);
    Game.screens.daySummary();
    Game.saves?.auto('fin del día');
    return true;
  }

  function advanceDay() {
    const s = Game.state.current;
    if (!s.campaign || !s.dayEnded) return false;
    s.day++;
    s.elapsed = 0;
    s.dayEnded = false;
    s.dayStartPoints = s.points;
    s.dayStartSaved = s.saved;
    s.rainIntensity = 0;
    s.rainStarted = s.stormAnnounced = false;
    s.thunderAt = s.weatherProfile.delay - 4;
    Game.audio.stop();
    if (s.laundry) {
      s.laundry.dayStartMoney = s.resources.money;
      Game.climate.newDay(s);
      Game.reputation.newDay(s);
      Game.orders.generate(s);
    } else replenish(s);
    Game.screens.resume();
    Game.saves?.auto('nuevo día');
    return true;
  }

  function phase(s) {
    const fraction = s.elapsed / s.daySeconds;
    return fraction < .3333 ? 'Mañana' : fraction < .5 ? 'Mediodía' : fraction < .8333 ? 'Tarde' : 'Noche';
  }

  function time(s) {
    const minutes = Math.min(1439, 360 + Math.floor(s.elapsed / s.daySeconds * 1080));
    return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
  }

  Game.calendar = { defaults, create, newGame, profile, endDay, advanceDay, phase, time };
})();

/** Pronóstico persistente y transiciones suaves; no hay eventos ocultos sin aviso. */
(() => {
  'use strict';
  const Game = window.RainGame;
  const patterns = [
    ['sun', 'breeze', 'clouds', 'drizzle'],
    ['sun', 'heat', 'wind', 'rain'],
    ['clouds', 'breeze', 'rain', 'storm'],
    ['sun', 'breeze', 'clouds', 'sun']
  ];
  function plan(day, seconds) {
    return patterns[(day - 1) % patterns.length].map((kind, i) => ({ kind, start: i * seconds / 4 }));
  }
  function initialize(s) {
    if (s.climate) return;
    s.climate = { day: s.day, segments: plan(s.day, s.daySeconds), announced: -1, warned: -1 };
  }
  function newDay(s) { s.climate = null; initialize(s); }
  function index(s = Game.state.current) {
    let i = 0;
    s.climate.segments.forEach((segment, n) => { if (s.elapsed >= segment.start) i = n; });
    return i;
  }
  function conditions(s = Game.state.current) {
    return s.climate ? Game.config.climate[s.climate.segments[index(s)].kind] : null;
  }
  function next(s = Game.state.current) { return s.climate?.segments[index(s) + 1] || null; }
  function shelter(p) {
    // Árboles originales: sombra y menor exposición al polvo, sin mover el patio.
    return [{ x: 45, y: 105 }, { x: 933, y: 88 }, { x: 936, y: 372 }, { x: 60, y: 586 }, { x: 318, y: 593 }]
      .some(t => Math.hypot(p.x - t.x, p.y - t.y) < 95);
  }
  function update(dt) {
    const s = Game.state.current;
    const c = conditions(s);
    const i = index(s);
    const change = next(s);
    if (change && change.start - s.elapsed <= Math.min(15, s.daySeconds / 12) && s.climate.warned !== i + 1) {
      s.climate.warned = i + 1;
      Game.hud.toast(`Se aproxima ${Game.config.climate[change.kind].name.toLowerCase()}. Revisá las sogas.`);
    }
    if (s.climate.announced !== i) {
      s.climate.announced = i;
      Game.hud.toast(`${c.name} · ${c.temperature} °C · Humedad ${c.humidity}%`);
      if (c.rain >= .9) { s.flash = .32; s.thunderAt = s.elapsed + 9; Game.audio.play('thunder'); }
      Game.saves?.auto('cambio de clima');
    }
    const approach = (value, target, speed) => value + Math.sign(target - value) * Math.min(Math.abs(target - value), speed * dt);
    s.rainIntensity = approach(s.rainIntensity, c.rain, .06);
    s.weatherProfile.wind = approach(s.weatherProfile.wind, c.wind, .5);
    s.rainStarted = s.rainIntensity > 0;
    s.stormAnnounced = c.rain >= .9 && s.rainStarted;
    Game.audio.weather(s.rainIntensity);
    for (const p of s.items) {
      if (!['hanging', 'basket'].includes(p.status)) continue;
      if (s.rainIntensity > 0) p.wetness = Game.utils.clamp(p.wetness + dt * 5 * s.rainIntensity / p.resistance, 0, 100);
      if (!p.orderId) continue;
      const qualityBefore = p.cleanliness;
      const cover = shelter(p) ? .35 : 1;
      if (c.dust && p.status === 'hanging' && s.rainIntensity === 0) p.cleanliness = Math.max(0, p.cleanliness - c.dust * cover * dt);
      if (c.temperature >= 35 && p.type === 'blouse' && p.status === 'hanging' && p.wetness < 20 && !shelter(p)) {
        p.cleanliness = Math.max(0, p.cleanliness - .04 * dt);
      }
      const required = s.orders.find(o => o.id === p.orderId).requiredQuality;
      if (qualityBefore >= required && p.cleanliness < required) Game.hud.toast(`${p.name}: necesita otro lavado. Recogela y llevála al lavadero.`);
    }
    if (c.rain >= .9 && s.elapsed > s.thunderAt) {
      Game.audio.play('thunder'); s.flash = .2; s.thunderAt = s.elapsed + 9;
    }
  }
  Game.climate = { plan, initialize, newDay, index, conditions, next, shelter, update };
})();

/** Relaciones entre necesidades familiares y pagos; sin confiar en el JSON importado. */
(() => {
  const Game = window.RainGame;
  function validate(s, check, number, object) {
    const f = s.family;
    check(object(f) && number(f.generatedDay, 1, s.day, true), 'familia');
    for (const key of ['aidDay', 'restedDay']) check(number(f[key], 0, s.day, true), key);
    check(number(f.mate, 0, Game.config.family.mateSeconds), 'descanso');
    check(Array.isArray(f.members) && f.members.length === 2, 'integrantes');
    const members = new Set();
    for (const m of f.members) {
      check(object(m) && Game.config.family.members.some(c => c.id === m.id) && !members.has(m.id), 'identidad familiar');
      members.add(m.id);
      check(number(m.x, 0, 1000) && number(m.y, 0, 640) && [-1, 1].includes(m.direction) && number(m.talkedDay, 0, s.day, true), 'estado familiar');
    }
    check(Array.isArray(f.events) && f.events.length <= 10000, 'eventos familiares');
    const ids = new Set(), pending = new Set();
    for (const e of f.events) {
      check(object(e) && Object.hasOwn(Game.config.family.events, e.kind) && !ids.has(e.id) && e.id === `family-${e.day}-${e.kind}`, 'evento familiar');
      ids.add(e.id);
      check(number(e.day, 1, s.day, true) && typeof e.paid === 'boolean', 'fecha familiar');
      const entry = s.laundry.ledger.find(p => p.id === e.id);
      if (e.paid) check(number(e.paidDay, e.day, s.day, true) && entry?.kind === 'family' && entry.day === e.paidDay && entry.amount === -Game.config.family.events[e.kind].cost, 'pago familiar');
      else { check(e.paidDay === null && !entry && !pending.has(e.kind), 'gasto pendiente'); pending.add(e.kind); }
    }
    for (const e of s.laundry.ledger.filter(e => e.kind === 'family')) check(f.events.some(f => f.id === e.id && f.paid), 'pago sin evento');
  }
  Game.familySchema = { validate };
})();

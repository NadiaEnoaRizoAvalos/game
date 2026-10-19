/** Identidad única entre canastos/máquinas, pagos completos y experiencia acotada. */
(() => {
  const Game = window.RainGame;
  function validate(s, check, number, object) {
    const w = s.workshop, cfg = Game.config.automation;
    check(object(w) && object(w.legacySkills) && Array.isArray(w.legacyAutomations), 'taller y datos anteriores');
    check(Array.isArray(w.owned) && w.owned.length <= 5 && new Set(w.owned).size === w.owned.length && typeof w.sensor === 'boolean', 'mejoras de automatización');
    check(Array.isArray(w.roofs) && w.roofs.length <= cfg.roof.max && new Set(w.roofs).size === w.roofs.length, 'cubiertas automáticas');
    const entries = new Map(s.laundry.ledger.map(e => [e.id, e])), used = new Set();
    const pay = (id, amount) => { const e = entries.get(id); check(e?.kind === 'automation' && e.amount === amount && e.orderId === null, 'pago de automatización'); used.add(id); };
    for (const id of w.owned) { check(Object.hasOwn(cfg.upgrades, id), 'mejora desconocida'); pay(`workshop-buy-${id}`, -cfg.upgrades[id].price); }
    for (const id of w.roofs) {
      check(w.owned.includes('sensor') && s.constructions.some(b => b.id === id && b.type === 'rope'), 'cubierta sin sensor o soga'); pay(`workshop-roof-${id}`, -cfg.roof.price);
    }
    for (const [person, keys] of [['maria', cfg.mariaSkills], ['jaqui', cfg.jaquiSkills]]) {
      check(object(s.skills[person]), 'habilidades');
      for (const key of keys) check(number(s.skills[person][key], 0, 1000000, true), 'experiencia');
    }
    check(Array.isArray(w.machines) && w.machines.length <= Game.config.yard.maxHistory, 'máquinas');
    const machines = new Set(), garmentIds = new Set();
    for (const m of w.machines) {
      check(object(m) && !machines.has(m.id), 'máquina duplicada'); machines.add(m.id);
      const b = s.constructions.find(b => b.id === m.id), spec = b && cfg.machines[b.type];
      check(!!spec, 'máquina sin construcción');
      check(number(m.cycles, 0, 10000, true) && number(m.services, 0, 2000, true) && number(m.wear, 0, spec.life, true) && m.cycles === m.services * spec.life + m.wear, 'ciclos y mantenimiento');
      check(number(m.remaining, 0, spec.seconds) && Array.isArray(m.items) && m.items.length <= 8 && new Set(m.items).size === m.items.length, 'lote');
      check((m.remaining === 0 || m.items.length > 0) && (!b.removed || (m.remaining === 0 && m.items.length === 0)), 'máquina retirada u ocupación');
      let volume = 0;
      for (const id of m.items) {
        const p = s.items.find(p => p.id === id);
        check(p && p.orderId && p.status === 'machine' && p.machineId === m.id && p.washProgress === 0 && !garmentIds.has(id), 'prenda del lote');
        garmentIds.add(id); volume += Game.config.garments[p.type].size;
        if (m.remaining === 0) check(b.type === 'washer' ? p.cleanliness === 100 && p.wetness === 100 : p.wetness === 0, 'resultado del lote');
      }
      check(volume <= spec.capacity && (m.items.length === 0 || m.cycles > 0), 'capacidad de máquina');
      for (let i = 1; i <= m.cycles; i++) pay(`workshop-cycle-${m.id}-${i}`, -spec.energy);
      for (let i = 1; i <= m.services; i++) pay(`workshop-service-${m.id}-${i}`, -spec.service);
    }
    for (const b of s.constructions.filter(b => cfg.machines[b.type])) check(machines.has(b.id), 'falta estado de máquina');
    for (const p of s.items) {
      if (p.status === 'machine') check(garmentIds.has(p.id), 'prenda fuera de un lote');
      else check(!Object.hasOwn(p, 'machineId'), 'prenda asignada a dos ubicaciones');
    }
    for (const e of s.laundry.ledger.filter(e => e.kind === 'automation')) check(used.has(e.id), 'pago de automatización sin operación');
    const h = w.helper;
    check(object(h) && typeof h.active === 'boolean' && ['house', 'yard'].includes(h.scene) && ['idle', 'collect', 'hang', 'transport', 'schedule', 'return'].includes(h.task), 'tarea y escena de Jaqui');
    check((h.active && h.task !== 'idle') || (!h.active && h.task === 'idle' && h.scene === 'house'), 'ayudante inactiva');
    check(h.task !== 'schedule' || w.owned.includes('planner'), 'rutina sin agenda');
    for (const key of ['work', 'decision']) check(number(h[key], 0, 1e9), 'avance de tarea');
    check(number(h.distance, 0, cfg.helper.stepDistance) && number(h.stumble, 0, cfg.helper.stumbleSeconds) && number(h.seed, 0, 4294967295, true), 'camino y tropiezo');
    check(number(h.actions, 0, 1e9, true) && number(h.stumbles, 0, 1e9, true) && typeof h.walking === 'boolean' && typeof h.message === 'string' && h.message.length <= 200, 'estado de Jaqui');
    const held = s.items.filter(p => p.status === 'helper');
    check(held.reduce((n, p) => n + Game.config.garments[p.type].size, 0) <= (w.owned.includes('cart') ? 6 : cfg.helper.capacity) && (!held.length || h.active), 'canasto de Jaqui');
    check(h.target === null || (object(h.target) && ['exit', 'home', 'enterHome', 'handoff', 'deposit', 'load', 'pickup', 'hang'].includes(h.target.kind)), 'objetivo de Jaqui');
    if (h.target?.kind === 'load') check(['wet', 'dirty'].includes(h.target.purpose), 'carga de Jaqui');
    if (['pickup', 'hang'].includes(h.target?.kind)) check(s.items.some(p => p.id === h.target.itemId), 'prenda objetivo');
    if (h.target?.kind === 'hang') check(number(h.target.slot, 0, 2007, true), 'lugar objetivo');
    const m = s.family.members.find(m => m.id === 'jaqui');
    check(Game.player.canStand(m.x, m.y, true, { ...s, scene: h.scene }), 'posición de Jaqui');
  }
  Game.automationSchema = { validate };
})();

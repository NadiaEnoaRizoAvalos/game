/** Máquinas por lote, mantenimiento, agenda y cubiertas de alcance limitado. */
(() => {
  const Game = window.RainGame;
  const cfg = () => Game.config.automation;
  function initialize(s) {
    if (s.workshop) return;
    s.workshop = { owned: [], roofs: [], sensor: true, machines: [], legacySkills: s.skills, legacyAutomations: s.automations,
      helper: { active: false, scene: 'house', task: 'idle', target: null, work: 0, decision: 0, distance: 0, stumble: 0, seed: 1, actions: 0, stumbles: 0, walking: false, message: 'En casa.' } };
    Game.skills.initialize(s);
    for (const b of s.constructions) register(s, b);
  }
  function register(s, b) {
    if (s.workshop && cfg().machines[b.type] && !s.workshop.machines.some(m => m.id === b.id)) s.workshop.machines.push({ id: b.id, items: [], remaining: 0, cycles: 0, services: 0, wear: 0 });
  }
  function machine(id, s = Game.state.current) { return s.workshop?.machines.find(m => m.id === id); }
  function near(b, s = Game.state.current) { return s.scene !== 'house' && Math.hypot(s.player.x - b.x - 30, s.player.y - b.y - 55) < 48; }
  function purchase(id) {
    const s = Game.state.current, item = cfg().upgrades[id];
    if (!Object.hasOwn(cfg().upgrades, id) || s.workshop.owned.includes(id)) return 'Esta mejora ya está comprada o no existe.';
    if (s.resources.wood < item.wood || s.resources.money - item.price < 12) return 'Faltan materiales o saldo; reservamos $12 para insumos.';
    if (!Game.economy.transact(`workshop-buy-${id}`, -item.price, 'automation')) return 'No se pudo registrar la compra.';
    s.resources.wood -= item.wood; s.workshop.owned.push(id); Game.saves?.auto('mejora de automatización'); return null;
  }
  function installRoof(id) {
    const s = Game.state.current, b = Game.yard.active(s).find(b => b.id === id && b.type === 'rope'), item = cfg().roof;
    if (!b || !s.workshop.owned.includes('sensor') || s.workshop.roofs.includes(id) || s.workshop.roofs.length >= item.max) return 'Se requiere sensor y una soga nueva sin cubierta; se pueden equipar dos.';
    if (s.resources.wood < item.wood || s.resources.money - item.price < 12) return 'Faltan madera o saldo para esta cubierta.';
    if (!Game.economy.transact(`workshop-roof-${id}`, -item.price, 'automation')) return 'No se pudo comprar la cubierta.';
    s.resources.wood -= item.wood; s.workshop.roofs.push(id); Game.saves?.auto('cubierta automática'); return null;
  }
  function danger(s = Game.state.current) {
    const next = Game.climate.next(s);
    return s.rainIntensity > 0 || Game.climate.conditions(s)?.rain > 0 || (next && next.start - s.elapsed <= 15 && Game.config.climate[next.kind].rain > 0);
  }
  function roof(b, s = Game.state.current) { return !!(s.workshop?.sensor && s.workshop.owned.includes('sensor') && s.workshop.roofs.includes(b.id) && danger(s)); }
  function blocked(id, s = Game.state.current) { const m = machine(id, s); return !!(m && (m.items.length || m.remaining > 0)); }
  function start(id) {
    const s = Game.state.current, b = Game.yard.active(s).find(b => b.id === id), m = machine(id, s), spec = b && cfg().machines[b.type];
    if (!spec || !m || !near(b, s)) return 'Acercate al frente de la máquina en el patio.';
    if (m.items.length || m.remaining > 0) return 'Descargá primero el lote anterior.';
    if (m.wear >= spec.life) return 'La máquina necesita mantenimiento antes de otro lote.';
    const items = []; let volume = 0;
    for (const p of s.basket) {
      const eligible = p.orderId && p.washProgress === 0 && (b.type === 'washer' ? Game.laundry.needsWash(p) : !Game.laundry.needsWash(p) && p.wetness > Game.config.laundry.dryThreshold);
      if (eligible && volume + p.size <= spec.capacity) { items.push(p); volume += p.size; }
    }
    if (!items.length) return `No hay prendas aptas que quepan en ${spec.capacity} unidades de volumen. Terminá los lavados manuales iniciados.`;
    const water = b.type === 'washer' ? items.length * Game.skills.washCost(s).water : 0;
    const soap = b.type === 'washer' ? Math.ceil(items.length / 2) : 0;
    if (s.resources.water < water || s.resources.soap < soap || s.resources.money < spec.energy) return 'Faltan insumos o dinero para este lote.';
    if (!Game.economy.transact(`workshop-cycle-${id}-${m.cycles + 1}`, -spec.energy, 'automation')) return 'No se pudo registrar el lote.';
    s.resources.water -= water; s.resources.soap -= soap; m.cycles++; m.wear++;
    m.items = items.map(p => p.id); m.remaining = spec.seconds;
    for (const p of items) { p.status = 'machine'; p.machineId = id; }
    s.basket = s.basket.filter(p => !m.items.includes(p.id));
    Game.saves?.auto('lote iniciado'); return null;
  }
  function unload(id) {
    const s = Game.state.current, b = Game.yard.active(s).find(b => b.id === id), m = machine(id, s);
    if (!b || !m || !near(b, s) || m.remaining > 0) return 'Acercate a la máquina y esperá a que termine.';
    let count = 0;
    for (const itemId of [...m.items]) {
      const p = s.items.find(p => p.id === itemId);
      if (Game.collection.usedSpace() + p.size > Game.collection.capacity()) continue;
      p.status = 'basket'; delete p.machineId; s.basket.push(p); m.items = m.items.filter(id => id !== itemId); count++;
    }
    if (!count) return 'No hay un lote listo que quepa en el canasto.';
    Game.saves?.auto('lote descargado'); return null;
  }
  function service(id) {
    const s = Game.state.current, b = Game.yard.active(s).find(b => b.id === id), m = machine(id, s), spec = b && cfg().machines[b.type];
    if (!spec || !near(b, s) || m.items.length || m.remaining > 0 || m.wear !== spec.life) return 'Mantenimiento: acercate con la máquina vacía después de cinco lotes.';
    if (!Game.economy.transact(`workshop-service-${id}-${m.services + 1}`, -spec.service, 'automation')) return 'No alcanza el saldo para el mantenimiento.';
    m.services++; m.wear = 0; Game.saves?.auto('mantenimiento'); return null;
  }
  function update(dt) {
    const s = Game.state.current; if (!s.workshop) return;
    for (const m of s.workshop.machines) {
      if (m.remaining <= 0) continue;
      m.remaining = Math.max(0, m.remaining - dt);
      if (m.remaining > 1e-8) continue;
      m.remaining = 0;
      const b = s.constructions.find(b => b.id === m.id);
      for (const id of m.items) {
        const p = s.items.find(p => p.id === id);
        if (b.type === 'washer') { p.cleanliness = 100; p.wetness = 100; } else p.wetness = 0;
      }
      Game.hud.toast(`${cfg().machines[b.type].name}: lote listo para descargar.`);
      Game.audio.play('machineReady'); Game.saves?.auto('lote terminado');
    }
    Game.helper.update(dt);
  }
  Game.automation = { initialize, register, machine, near, purchase, installRoof, danger, roof, blocked, start, unload, service, update };
})();

/** Jaqui transporta las prendas reales. Las rutas son temporales y se recalculan al cargar. */
(() => {
  const Game = window.RainGame;
  let cache = null;
  const member = s => s.family.members.find(m => m.id === 'jaqui');
  const basket = (s = Game.state.current) => s.items.filter(p => p.status === 'helper');
  const capacity = (s = Game.state.current) => s.workshop?.owned.includes('cart') ? 6 : Game.config.automation.helper.capacity;
  const used = (s = Game.state.current) => basket(s).reduce((n, p) => n + p.size, 0);
  function invalidate() { cache = null; }
  function assign(task) {
    const s = Game.state.current, h = s.workshop.helper;
    if (!['collect', 'hang', 'transport', 'schedule', 'return'].includes(task)) return 'Tarea desconocida.';
    if (task === 'schedule' && !s.workshop.owned.includes('planner')) return 'Comprá la agenda para programar una rutina.';
    h.active = true; h.task = task; h.target = null; h.work = 0; h.decision = 0; h.message = 'Preparando la tarea.';
    invalidate(); Game.saves?.auto('tarea de Jaqui'); return null;
  }
  function ordered(items, s) {
    return [...items].sort((a, b) => (s.orders.find(o => o.id === a.orderId)?.dueDay ?? 1e6) - (s.orders.find(o => o.id === b.orderId)?.dueDay ?? 1e6));
  }
  function freeSlots(s) { return Game.yard.slots(s).filter(pos => !s.items.some(p => p.status === 'hanging' && p.slot === pos.slot)); }
  function clean(p, s) { return p.orderId && p.cleanliness >= s.orders.find(o => o.id === p.orderId).requiredQuality; }
  function choose(s) {
    const h = s.workshop.helper, carry = basket(s), pos = member(s);
    if (h.task === 'return') return h.scene === 'yard' ? { kind: carry.length ? 'deposit' : 'enterHome' } : { kind: 'home' };
    if (h.scene === 'house') return { kind: 'exit' };
    if (carry.length) {
      if (h.task === 'transport') return { kind: 'handoff' };
      if (h.task === 'collect') {
        const next = ordered(s.items.filter(p => p.status === 'hanging' && p.size + used(s) <= capacity(s) && (p.wetness <= 1 || Game.automation.danger(s) || (p.orderId && !clean(p, s)))), s)[0];
        if (next) return { kind: 'pickup', itemId: next.id };
      }
      const item = carry.find(p => clean(p, s) && p.wetness > Game.config.laundry.dryThreshold);
      if (item && ['hang', 'schedule'].includes(h.task)) {
        const slots = freeSlots(s).sort((a, b) => Math.hypot(a.x - pos.x, a.y - pos.y) - Math.hypot(b.x - pos.x, b.y - pos.y));
        if (slots.length) return { kind: 'hang', itemId: item.id, slot: slots[0].slot };
      }
      return { kind: 'deposit' };
    }
    if (['collect', 'schedule'].includes(h.task)) {
      const item = ordered(s.items.filter(p => p.status === 'hanging' && p.size <= capacity(s) &&
        (p.wetness <= Game.config.laundry.dryThreshold || Game.automation.danger(s) || (p.orderId && !clean(p, s)))), s)[0];
      if (item) return { kind: 'pickup', itemId: item.id };
    }
    if (h.task === 'transport' || (['hang', 'schedule'].includes(h.task) && freeSlots(s).length)) {
      const purpose = h.task === 'transport' ? 'dirty' : 'wet';
      if (s.items.some(p => p.orderId && p.status === 'stored' && p.size <= capacity(s) && (purpose === 'dirty' ? !clean(p, s) : clean(p, s) && p.wetness > 1))) return { kind: 'load', purpose };
    }
    return null;
  }
  function destination(target, s) {
    if (['load', 'deposit', 'enterHome'].includes(target.kind)) return { x: 174, y: 270 };
    if (target.kind === 'exit') return Game.config.house.door;
    if (target.kind === 'home') return { x: 290, y: 300 };
    if (target.kind === 'handoff') return { x: 310, y: 270 };
    if (target.kind === 'hang') {
      if (!basket(s).some(p => p.id === target.itemId) || s.items.some(p => p.status === 'hanging' && p.slot === target.slot)) return null;
      return Game.yard.position(target.slot, s);
    }
    const p = s.items.find(p => p.id === target.itemId && p.status === 'hanging');
    return p || null;
  }
  function deposit(s) {
    let count = 0;
    for (const p of basket(s)) {
      if (p.orderId) p.status = 'stored';
      else { p.status = 'saved'; s.saved++; s.points += Game.collection.scoreFor(p); }
      count++;
    }
    if (count) { Game.skills.gain('jaqui', ['transport', 'autonomy'], s); Game.saves?.auto('Jaqui guarda prendas'); }
  }
  function act(target, dt, s) {
    const h = s.workshop.helper, m = member(s);
    if (target.kind === 'exit') { h.scene = 'yard'; Object.assign(m, { x: 174, y: 270 }); }
    if (target.kind === 'enterHome') { h.scene = 'house'; Object.assign(m, { x: 230, y: 465 }); }
    if (target.kind === 'home') { h.active = false; h.task = 'idle'; h.message = 'En casa.'; }
    if (target.kind === 'handoff') { h.message = 'Esperando junto al lavadero: acercate para recibir las prendas.'; return false; }
    if (target.kind === 'deposit') deposit(s);
    if (target.kind === 'load') {
      for (const p of ordered(s.items.filter(p => p.status === 'stored' && p.orderId && (target.purpose === 'dirty' ? !clean(p, s) : clean(p, s) && p.wetness > 1)), s)) {
        if (used(s) + p.size <= capacity(s)) p.status = 'helper';
      }
      Game.saves?.auto('Jaqui carga prendas');
    }
    if (target.kind === 'pickup' || target.kind === 'hang') {
      h.work += dt;
      if (h.work < (target.kind === 'pickup' ? .9 : .5) * (1 - Game.skills.level('jaqui', 'coordination', s) * .04)) return false;
      const p = s.items.find(p => p.id === target.itemId);
      let completed = false;
      if (target.kind === 'pickup' && p?.status === 'hanging' && used(s) + p.size <= capacity(s)) { p.status = 'helper'; if (p.orderId) p.slot = null; completed = true; }
      else if (target.kind === 'hang' && p?.status === 'helper' && clean(p, s)) {
        const place = Game.yard.position(target.slot, s);
        if (place && !s.items.some(p => p.status === 'hanging' && p.slot === target.slot)) { Object.assign(p, place, { slot: target.slot, status: 'hanging' }); completed = true; }
      }
      if (!completed) return true;
      h.actions++; Game.skills.gain('jaqui', ['coordination', 'transport', 'reliability', 'autonomy'], s);
      Game.saves?.auto('tarea de Jaqui completada');
    }
    return true;
  }
  function stumble(distance, s) {
    const h = s.workshop.helper, p = member(s), cfg = Game.config.automation.helper;
    h.distance += distance;
    while (h.distance >= cfg.stepDistance) {
      h.distance -= cfg.stepDistance;
      Game.skills.gain('jaqui', ['speed'], s);
      h.seed = (Math.imul(h.seed, 1664525) + 1013904223) >>> 0;
      const risk = cfg.risk * (s.rainIntensity > .2 ? 1.8 : 1) * (Game.yard.onPath(p.x, p.y, s) ? .2 : 1) *
        (1 - Game.skills.level('jaqui', 'coordination', s) * .1) * (1 - Game.skills.level('jaqui', 'reliability', s) * .07) * (s.workshop.owned.includes('gloves') ? .5 : 1) * (used(s) > 3 ? 1.3 : 1);
      if (h.seed / 4294967296 >= risk || h.scene === 'house') continue;
      h.stumble = cfg.stumbleSeconds; h.stumbles++;
      const item = basket(s)[0];
      if (item?.orderId) item.cleanliness = Math.max(0, item.cleanliness - 5);
      h.message = '¡Uy! Jaqui se repone; la ropa sigue en su canasto.';
      Game.hud.toast(h.message); break;
    }
  }
  function update(dt) {
    const s = Game.state.current, h = s.workshop?.helper;
    if (!h?.active) return;
    const m = member(s); h.walking = false;
    if (h.stumble > 0) { h.stumble = Math.max(0, h.stumble - dt); return; }
    if (h.decision > 0) { h.decision = Math.max(0, h.decision - dt); return; }
    if (!h.target) { h.target = choose(s); h.work = 0; invalidate(); }
    if (!h.target) { h.message = 'Esperando prendas aptas o lugares libres.'; h.decision = .5 * (1 - Game.skills.level('jaqui', 'autonomy', s) * .08); return; }
    const goal = destination(h.target, s);
    if (!goal) { h.target = null; invalidate(); return; }
    if (Math.hypot(goal.x - m.x, goal.y - m.y) < .1) {
      if (act(h.target, dt, s)) { h.target = null; h.work = 0; h.decision = .1; invalidate(); }
      return;
    }
    if (!cache || cache.state !== s || cache.scene !== h.scene) cache = { state: s, scene: h.scene, route: Game.navigation.route(m, goal, h.scene, s) };
    if (!cache.route) { h.message = 'No encuentro camino. Revisá los accesos.'; h.decision = 1; invalidate(); return; }
    let budget = dt * (Game.config.automation.helper.speed + Game.skills.level('jaqui', 'speed', s) * 4) * (used(s) ? 1 + Game.skills.level('jaqui', 'transport', s) * .02 : 1) * (h.scene === 'yard' && Game.yard.onPath(m.x, m.y, s) ? 1.15 : 1);
    h.message = ({ pickup: 'Voy a recoger.', hang: 'Voy a tender.', load: 'Voy a cargar.', deposit: 'Llevo el canasto a casa.', handoff: 'Llevo la ropa al lavadero.', exit: 'Salgo al patio.', home: 'Vuelvo a casa.', enterHome: 'Vuelvo a casa.' })[h.target.kind];
    while (budget > 0 && cache.route.length) {
      const p = cache.route[0], distance = Math.hypot(p.x - m.x, p.y - m.y), amount = Math.min(budget, distance);
      if (!distance) { cache.route.shift(); continue; }
      const next = { x: m.x + (p.x - m.x) * amount / distance, y: m.y + (p.y - m.y) * amount / distance };
      if (!Game.navigation.segment(m, next, h.scene, s)) { invalidate(); h.target = null; h.work = 0; return; }
      Object.assign(m, next); m.direction = p.x < m.x ? -1 : 1; h.walking = true; budget -= amount;
      stumble(amount, s); if (h.stumble > 0) break;
      if (distance <= amount + 1e-9) cache.route.shift();
    }
  }
  function receive() {
    const s = Game.state.current, h = s.workshop.helper, m = member(s);
    if (s.scene !== h.scene || Math.hypot(s.player.x - m.x, s.player.y - m.y) > 43) return 'Acercate a Jaqui para recibir su canasto.';
    let count = 0;
    for (const p of basket(s)) if (Game.collection.usedSpace() + p.size <= Game.collection.capacity()) { p.status = 'basket'; s.basket.push(p); count++; }
    if (!count) return 'No hay prendas que quepan en tu canasto.';
    h.target = null; h.decision = .1; invalidate(); Game.saves?.auto('traspaso de Jaqui'); return null;
  }
  Game.helper = { basket, capacity, used, assign, invalidate, update, receive };
})();

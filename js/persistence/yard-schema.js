/** Rechaza superposiciones, accesos cerrados, compras falsas y capacidades inconsistentes. */
(() => {
  const Game = window.RainGame;
  function validate(s, check, number, object) {
    const y = s.yard, cfg = Game.config.yard;
    check(object(y) && number(y.nextId, 1, cfg.maxHistory + 1, true) && number(y.baseBasketCapacity, .5, 100), 'datos del patio');
    check(Array.isArray(y.legacyConstructions) && Array.isArray(y.tools) && y.tools.length <= 3 && new Set(y.tools).size === y.tools.length, 'herramientas y construcciones anteriores');
    check(s.constructions.length <= cfg.maxHistory && y.nextId === s.constructions.length + 1, 'secuencia de construcción');
    const ids = new Set(), entries = new Map(s.laundry.ledger.map(e => [e.id, e])), used = new Set();
    const payment = (id, amount) => {
      const e = entries.get(id);
      check(e?.kind === 'yard' && e.amount === amount && e.orderId === null, 'pago de construcción o herramienta');
      used.add(id);
    };
    for (const b of s.constructions) {
      check(object(b) && /^build-[1-9]\d*$/.test(b.id) && !ids.has(b.id) && Number(b.id.slice(6)) < y.nextId, 'identidad de construcción');
      ids.add(b.id);
      check(Object.hasOwn(cfg.catalog, b.type) && number(b.x, 40, 960, true) && number(b.y, 60, 600, true) && [0, 1].includes(b.rotation) && typeof b.removed === 'boolean', 'geometría de construcción');
      if (b.removed) check(!Game.yard.geometry(b, []), 'historial de construcción');
      payment(`yard-buy-${b.id}`, -cfg.catalog[b.type].price);
      if (b.removed) payment(`yard-remove-${b.id}`, Math.floor(cfg.catalog[b.type].price / 2));
      else check(!entries.has(`yard-remove-${b.id}`), 'construcción retirada todavía activa');
    }
    const active = Game.yard.active(s);
    check(active.length <= cfg.maxActive, 'límite de construcciones activas');
    for (const b of active) check(!Game.yard.geometry(b, active), 'superposición o zona protegida');
    let capacity = y.baseBasketCapacity;
    for (const id of y.tools) {
      check(Object.hasOwn(cfg.tools, id), 'herramienta desconocida');
      const t = cfg.tools[id];
      check(!t.requires || y.tools.includes(t.requires) || y.baseBasketCapacity >= 8, 'herramienta sin requisito');
      payment(`yard-tool-${id}`, -t.price);
      capacity = Math.max(capacity, t.capacity || 0);
    }
    check(s.basketCapacity === capacity, 'capacidad del canasto y herramientas');
    for (const e of s.laundry.ledger.filter(e => e.kind === 'yard')) check(used.has(e.id), 'pago sin construcción o herramienta');
    check(Game.yard.connected(s), 'accesos bloqueados o personaje encerrado');
  }
  Game.yardSchema = { validate };
})();

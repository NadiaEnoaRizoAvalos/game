/** Patio persistente: geometría, capacidad y operaciones económicas atómicas. */
(() => {
  const Game = window.RainGame;
  const cfg = () => Game.config.yard;
  const current = () => Game.state.current;
  function initialize(s) {
    if (s.yard) return;
    s.yard = { nextId: 1, tools: [], baseBasketCapacity: s.basketCapacity, legacyConstructions: s.constructions };
    s.constructions = [];
  }
  function active(s = current()) { return s.yard ? s.constructions.filter(b => !b.removed) : []; }
  function size(b) { const c = cfg().catalog[b.type]; return b.rotation ? { w: c.h, h: c.w } : { w: c.w, h: c.h }; }
  function box(b) { return { x: b.x, y: b.y, ...size(b) }; }
  function overlap(a, b, margin = 0) { return a.x < b.x + b.w + margin && a.x + a.w > b.x - margin && a.y < b.y + b.h + margin && a.y + a.h > b.y - margin; }
  function inside(x, y, b, margin = 0) { return x > b.x - margin && x < b.x + b.w + margin && y > b.y - margin && y < b.y + b.h + margin; }
  function colliders(b) {
    const c = cfg().catalog[b.type], r = box(b);
    if (c.slots) return [{ x: b.x + 3, y: b.y + 42, w: 14, h: 18 }, { x: b.x + 103, y: b.y + 42, w: 14, h: 18 }];
    if (b.type === 'tree') return [{ x: b.x + 25, y: b.y + 42, w: 10, h: 18 }];
    return c.solid ? [r] : [];
  }
  function blocked(x, y, s = current()) { return active(s).some(b => colliders(b).some(r => inside(x, y, r, 10))); }
  function position(slot, s = current()) {
    if (Number.isInteger(slot) && slot >= 0 && slot < 8) return Game.state.garmentPosition(slot, 8);
    if (!s?.yard || !Number.isInteger(slot) || slot < 8) return null;
    const n = Math.floor((slot - 8) / 2) + 1;
    const b = active(s).find(b => b.id === `build-${n}` && cfg().catalog[b.type].slots);
    return b ? { x: b.x + 40 + (slot - 8) % 2 * 40, y: b.y + 50, ropeId: 3 + n } : null;
  }
  function slots(s = current()) {
    const result = Array.from({ length: 8 }, (_, slot) => ({ slot, ...position(slot, s) }));
    for (const b of active(s).filter(b => cfg().catalog[b.type].slots)) {
      const first = 8 + (Number(b.id.slice(6)) - 1) * 2;
      for (let i = 0; i < 2; i++) result.push({ slot: first + i, ...position(first + i, s) });
    }
    return result;
  }
  function reserved() {
    return [...Game.config.obstacles.map(o => ({ x: o.x - 14, y: o.y - 12, w: o.w + 28, h: o.h + 24 })),
      ...Game.config.ropes.map(r => ({ x: r.x1 - 22, y: r.y - 65, w: r.x2 - r.x1 + 44, h: 88 })),
      { x: 130, y: 205, w: 92, h: 90 }, { x: 280, y: 205, w: 65, h: 70 },
      { x: 310, y: 60, w: 600, h: 55 },
      ...[{ x: 45, y: 105 }, { x: 933, y: 88 }, { x: 936, y: 372 }, { x: 60, y: 586 }, { x: 318, y: 593 }]
        .map(t => ({ x: t.x - 36, y: t.y - 65, w: 72, h: 80 }))];
  }
  function geometry(b, list = active()) {
    const c = cfg().catalog[b.type];
    if (!c || !Number.isInteger(b.x / cfg().grid) || !Number.isInteger(b.y / cfg().grid) || ![0, 1].includes(b.rotation) || (b.rotation && b.type !== 'fence')) return 'Elegí una casilla de la cuadrícula.';
    const r = box(b);
    if (r.x < 40 || r.y < 60 || r.x + r.w > 960 || r.y + r.h > 600) return 'La construcción debe quedar dentro del cerco del patio.';
    if (reserved().some(o => overlap(r, o))) return 'Este espacio pertenece al patio original o a un acceso protegido.';
    if (list.some(o => o.id !== b.id && overlap(r, box(o)))) return 'Ya hay otra construcción en ese espacio.';
    return null;
  }
  /** BFS sobre posiciones libres: comprueba accesos a casa, sogas, lavaderos y depósitos. */
  function connected(s) {
    const items = active(s);
    if (!items.some(b => colliders(b).length)) return true;
    const obstacles = items.flatMap(colliders), bounds = Game.config.settings;
    const free = (x, y) => x >= bounds.minX && x <= bounds.maxX && y >= bounds.minY && y <= bounds.maxY && Game.player.canStand(x, y, true, { scene: 'yard' }) && !obstacles.some(r => inside(x, y, r, 10));
    const queue = [[180, 270]], visited = new Set(['180,270']);
    if (!free(180, 270)) return false;
    for (let head = 0; head < queue.length; head++) {
      const [x, y] = queue[head];
      for (const [dx, dy] of [[10, 0], [-10, 0], [0, 10], [0, -10]]) {
        const nx = x + dx, ny = y + dy, key = `${nx},${ny}`;
        if (!visited.has(key) && free(nx, ny) && free(x + dx / 2, y + dy / 2)) { visited.add(key); queue.push([nx, ny]); }
      }
    }
    const access = (x, y, radius = 25) => queue.some(([a, b]) => Math.hypot(x - a, y - b) <= radius);
    if (s.scene !== 'house' && (!free(s.player.x, s.player.y) || !access(s.player.x, s.player.y, 15))) return false;
    if (s.workshop?.helper.scene === 'yard') {
      const m = s.family.members.find(m => m.id === 'jaqui');
      if (!free(m.x, m.y) || !access(m.x, m.y, 15)) return false;
    }
    if (!access(310, 260)) return false;
    if (!slots(s).every(p => free(p.x, p.y) && access(p.x, p.y, 30))) return false;
    return items.filter(b => ['basin', 'storage'].includes(b.type) || Game.config.automation.machines[b.type]).every(b => {
      const x = b.x + size(b).w / 2, y = b.y + size(b).h + 15;
      return free(x, y) && access(x, y, 15);
    });
  }
  function proposed(b, s, exclude = null) { return { ...s, constructions: [...s.constructions.filter(o => o.id !== exclude), b] }; }
  function canPlace(b, s = current(), moving = null) {
    const list = active(s).filter(o => o.id !== moving);
    const error = geometry(b, list);
    if (error) return error;
    if (moving && Game.automation.blocked(moving, s)) return 'Descargá la máquina antes de moverla.';
    if (moving && s.items.some(p => p.status === 'hanging' && position(p.slot, s)?.ropeId === 3 + Number(moving.slice(6)))) return 'Recogé todas las prendas antes de mover el tendedero.';
    if (!connected(proposed(b, s, moving))) return 'La construcción bloquearía un acceso o encerraría al personaje.';
    return null;
  }
  function place(type, x, y, rotation = 0) {
    const s = current(), c = cfg().catalog[type];
    if (!s.yard || !c) return 'Construcción desconocida.';
    if (active(s).length >= cfg().maxActive || s.constructions.length >= cfg().maxHistory) return 'Se alcanzó el límite de construcciones de esta partida.';
    const b = { id: `build-${s.yard.nextId}`, type, x, y, rotation, removed: false };
    const error = canPlace(b, s); if (error) return error;
    if (s.resources.wood < c.wood) return 'Falta madera. Comprá materiales desde el tablón.';
    if (!Game.economy.transact(`yard-buy-${b.id}`, -c.price, 'yard', null, s, Game.config.family.reserve)) return 'No alcanza el saldo; reservamos $12 para insumos.';
    s.resources.wood -= c.wood; s.constructions.push(b); s.yard.nextId++;
    Game.automation.register(s, b); Game.helper.invalidate();
    Game.saves?.auto('construcción'); return null;
  }
  function move(id, x, y, rotation = 0) {
    const s = current(), b = active(s).find(o => o.id === id);
    if (!b) return 'Esta construcción ya no está disponible.';
    const next = { ...b, x, y, rotation }, error = canPlace(next, s, id);
    if (error) return error;
    Object.assign(b, next); Game.helper.invalidate(); Game.saves?.auto('reubicación'); return null;
  }
  function remove(id) {
    const s = current(), b = active(s).find(o => o.id === id);
    if (!b) return 'Esta construcción ya fue retirada.';
    if (Game.automation.blocked(id, s)) return 'Descargá la máquina antes de retirarla.';
    if (cfg().catalog[b.type].slots && s.items.some(p => p.status === 'hanging' && position(p.slot, s)?.ropeId === 3 + Number(id.slice(6)))) return 'Recogé las prendas antes de retirar el tendedero.';
    const next = { ...s, constructions: s.constructions.map(o => o.id === id ? { ...o, removed: true } : o) };
    if (!connected(next)) return 'No se puede retirar mientras afecte un acceso.';
    if (!Game.economy.transact(`yard-remove-${id}`, Math.floor(cfg().catalog[b.type].price / 2), 'yard')) return 'No se pudo registrar el retiro.';
    b.removed = true; Game.helper.invalidate(); Game.saves?.auto('retiro de construcción'); return null;
  }
  function tool(id) {
    const s = current(), t = cfg().tools[id];
    if (!t || s.yard.tools.includes(id)) return 'Esta herramienta ya está comprada o no existe.';
    if (t.requires && !s.yard.tools.includes(t.requires) && s.yard.baseBasketCapacity < 8) return 'Primero comprá el canasto de 8 unidades de volumen.';
    if (t.capacity && t.capacity <= s.basketCapacity) return 'El canasto actual ya tiene esa capacidad o más.';
    if (s.resources.wood < t.wood || s.resources.money - t.price < Game.config.family.reserve) return 'Faltan materiales o saldo; reservamos $12 para insumos.';
    if (!Game.economy.transact(`yard-tool-${id}`, -t.price, 'yard')) return 'No se pudo registrar la compra.';
    s.resources.wood -= t.wood; s.yard.tools.push(id);
    if (t.capacity) s.basketCapacity = Math.max(s.basketCapacity, t.capacity);
    Game.saves?.auto('herramienta'); return null;
  }
  function cover(p, s = current()) {
    if (!s.yard) return 1;
    const point = p.status === 'basket' ? (s.scene === 'house' ? null : s.player) : p;
    if (!point) return 1;
    if (p.status === 'helper') {
      const h = s.workshop.helper;
      if (h.scene === 'house') return 0;
      const m = s.family.members.find(m => m.id === 'jaqui');
      return active(s).some(b => (b.type === 'covered' || Game.automation.roof(b, s)) && inside(m.x, m.y, box(b))) ? .1 : 1;
    }
    return active(s).some(b => (b.type === 'covered' || Game.automation.roof(b, s)) && inside(point.x, point.y, box(b))) ? .1 : 1;
  }
  function onPath(x, y, s = current()) { return active(s).some(b => b.type === 'path' && inside(x, y, box(b), 1)); }
  function atStorage(s = current()) { return s.scene !== 'house' && active(s).some(b => b.type === 'storage' && Math.hypot(s.player.x - b.x - 30, s.player.y - b.y - 52) < 38); }
  function context() {
    const s = current();
    if (atStorage()) return { kind: 'storage', label: 'PRENDAS' };
    if (s.scene !== 'house' && active(s).some(b => Game.config.automation.machines[b.type] && Game.automation.near(b, s))) return { kind: 'machine', label: 'MÁQUINA' };
    const m = s.family?.members.find(m => m.id === 'jaqui');
    if (m && s.scene !== 'house' && s.workshop?.helper.scene === 'yard' && Math.hypot(m.x - s.player.x, m.y - s.player.y) < 32) return { kind: 'helper', label: 'JAQUI' };
    return null;
  }
  Game.yard = { initialize, active, size, box, overlap, inside, colliders, blocked, position, slots, geometry, connected, canPlace, place, move, remove, tool, cover, onPath, atStorage, context };
})();

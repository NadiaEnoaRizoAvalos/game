/** Rutas por celdas libres; verifica también los segmentos para no atravesar paredes. */
(() => {
  const Game = window.RainGame;
  function free(x, y, scene, s) {
    const bounds = Game.config.settings;
    return x >= bounds.minX && x <= bounds.maxX && y >= bounds.minY && y <= bounds.maxY && Game.player.canStand(x, y, true, { ...s, scene });
  }
  function segment(a, b, scene, s) {
    const count = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 4));
    for (let i = 1; i <= count; i++) if (!free(a.x + (b.x - a.x) * i / count, a.y + (b.y - a.y) * i / count, scene, s)) return false;
    return true;
  }
  function route(start, target, scene, s = Game.state.current) {
    const bounds = Game.config.settings, rooms = scene === 'house' ? Game.house.rooms(s) : null;
    const obstacles = scene === 'house' ? [...Game.house.walls(s), ...Game.house.furniture(s).filter(f => !f.walkable)] : Game.yard.active(s).flatMap(Game.yard.colliders);
    const available = (x, y) => {
      if (x < bounds.minX || x > bounds.maxX || y < bounds.minY || y > bounds.maxY) return false;
      if (scene === 'house') return rooms.some(r => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) && !obstacles.some(r => Game.house.hits(x, y, r));
      return Game.player.canStand(x, y, true, { scene: 'yard' }) && !obstacles.some(r => Game.yard.inside(x, y, r, 10));
    };
    const clear = (a, b) => {
      const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 4));
      for (let i = 1; i <= steps; i++) if (!available(a.x + (b.x - a.x) * i / steps, a.y + (b.y - a.y) * i / steps)) return false;
      return true;
    };
    if (!available(start.x, start.y) || !available(target.x, target.y)) return null;
    const candidates = [];
    const sx = Math.round(start.x / 10) * 10, sy = Math.round(start.y / 10) * 10;
    for (let dx = -20; dx <= 20; dx += 10) for (let dy = -20; dy <= 20; dy += 10) {
      const p = { x: sx + dx, y: sy + dy };
      if (available(p.x, p.y) && clear(start, p)) candidates.push(p);
    }
    candidates.sort((a, b) => Math.hypot(a.x - start.x, a.y - start.y) - Math.hypot(b.x - start.x, b.y - start.y));
    const first = candidates[0]; if (!first) return null;
    const key = p => `${p.x},${p.y}`, queue = [first], parents = new Map([[key(first), null]]);
    for (let head = 0; head < queue.length; head++) {
      const p = queue[head];
      if (Math.hypot(p.x - target.x, p.y - target.y) <= 15 && clear(p, target)) {
        const path = [{ ...target }]; let step = p;
        while (step) { path.push(step); step = parents.get(key(step)); }
        return path.reverse();
      }
      for (const [dx, dy] of [[10, 0], [-10, 0], [0, 10], [0, -10]]) {
        const next = { x: p.x + dx, y: p.y + dy }, id = key(next);
        if (!parents.has(id) && available(next.x, next.y) && clear(p, next)) { parents.set(id, p); queue.push(next); }
      }
    }
    return null;
  }
  Game.navigation = { free, segment, route };
})();

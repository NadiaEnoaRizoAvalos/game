/** La fila se deriva de pedidos vigentes: nunca duplica clientes ni prendas guardadas. */
(() => {
  const Game = window.RainGame;
  function waiting(s = Game.state.current) {
    if (!s.laundry) return [];
    const yard = { ...s, scene: 'yard', constructions: s.constructions.filter(b => Game.config.yard.catalog[b.type]) };
    const places = [];
    // Lateral de la entrada; si una construcción ocupa un lugar, usar otro libre.
    const candidates = [105, 245, 65, 285].flatMap(x => [275, 330, 385].map(y => ({ x, y })));
    // El frente de la puerta ya está protegido por construcción: respaldo en patios muy llenos.
    candidates.push(...[140, 175, 210].map(x => ({ x, y: 285 })));
    for (const { x, y } of candidates) {
      if (Game.player.canStand(x, y, true, yard) && Game.player.canStand(x, y - 20, true, yard)) places.push({ x, y });
    }
    return s.orders.filter(o => o.state === 'available' && o.offeredDay === s.day)
      .map((order, i) => places[i] ? { ...places[i], order, client: Game.orders.customer(order.clientId) } : null).filter(Boolean);
  }
  function nearby(id = null) {
    const s = Game.state.current;
    if (s.scene === 'house' || s.player.x > 320 || s.player.y < 240 || s.player.y > 420) return null;
    return waiting(s).find(v => (!id || v.order.id === id) && Math.hypot(v.x - s.player.x, v.y - s.player.y) < 32) || null;
  }
  function attend(id) {
    const s = Game.state.current;
    const visitor = waiting(s).find(v => !id || v.order.id === id);
    if (id && !visitor) return false;
    if (s.scene !== 'house') {
      if (!visitor || !nearby(visitor.order.id) || !Game.house.transition('house', visitor.order.id)) return false;
    }
    Game.ordersMenu.show(visitor?.order.id || null, visitor ? '' : 'No hay vecinos esperando hoy. Los pedidos aceptados siguen en el tablón.');
    return true;
  }
  Game.customers = { waiting, nearby, attend };
})();

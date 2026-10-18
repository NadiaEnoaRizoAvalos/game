/** Pedidos y clientes. El estado de producción se deriva de las prendas reales. */
(() => {
  'use strict';
  const Game = window.RainGame;
  const cfg = () => Game.config.laundry;
  const current = () => Game.state.current;
  function goods(order, state = current()) { return state.items.filter(p => p.orderId === order.id); }
  function customer(id) { return cfg().clients.find(c => c.id === id); }

  /** La ayuda inicial se concede una sola vez, también al migrar desde Fase 1. */
  function initialize(state) {
    if (state.laundry) return;
    state.laundry = { nextOrderId: 1, generatedDay: 0, leaveDoor: false,
      clients: cfg().clients.map(c => ({ id: c.id, completed: 0, onTime: 0 })),
      ledger: [], dayStartMoney: state.resources.money };
    for (const key of ['money', 'water', 'soap']) state.resources[key] += cfg().starter[key];
    state.laundry.dayStartMoney = state.resources.money;
    // Los contenedores reservados de Fase 1 se conservan sin tratarlos como pedidos jugables.
    state.laundry.legacyOrders = state.orders;
    state.orders = [];
    generate(state);
  }

  function generate(state = current()) {
    if (!state.laundry || state.laundry.generatedDay === state.day) return;
    for (const order of state.orders) {
      if (order.state === 'available' && order.offeredDay < state.day) order.state = 'expired';
    }
    let generated = 0;
    const demand = Game.reputation?.demand(state) ?? 3;
    for (let i = 0; i < cfg().clients.length && generated < demand; i++) {
      if (state.orders.length >= 10000) break;
      const client = cfg().clients[(state.day - 1 + i) % cfg().clients.length];
      if (state.reputation && !Game.reputation.available(client.id, state)) continue;
      const history = state.laundry.clients.find(c => c.id === client.id);
      const habitual = state.reputation ? history.onTime >= 3 && history.trust >= 60 : history.completed >= 3;
      state.orders.push({ id: `order-${state.laundry.nextOrderId++}`, clientId: client.id,
        offeredDay: state.day, dueDay: state.day + client.due, type: client.type,
        count: client.count, price: client.price + (habitual ? 5 : 0),
        requiredQuality: client.quality, urgent: client.due === 0,
        state: 'available', acceptedDay: null, deliveredDay: null, paid: 0 });
      generated++;
    }
    state.laundry.generatedDay = state.day;
  }

  function stage(order, state = current()) {
    if (order.state !== 'accepted') return order.state;
    const items = goods(order, state);
    if (items.length !== order.count) return 'accepted';
    if (items.every(p => p.status === 'stored' && p.cleanliness >= order.requiredQuality && p.wetness <= cfg().dryThreshold)) return 'ready';
    if (items.every(p => p.cleanliness >= order.requiredQuality)) return 'drying';
    if (items.some(p => p.washProgress > 0 || p.cleanliness >= order.requiredQuality)) return 'washing';
    return 'accepted';
  }

  function accept(id) {
    const s = current();
    const order = s.orders.find(o => o.id === id);
    if (!order || order.state !== 'available' || order.offeredDay !== s.day) return 'Este pedido ya no está disponible.';
    if (s.reputation && !Game.reputation.available(order.clientId, s)) return 'Este cliente suspendió los encargos temporalmente.';
    const active = s.orders.filter(o => o.state === 'accepted');
    if (active.length >= cfg().maxActiveOrders || active.reduce((n, o) => n + o.count, 0) + order.count > cfg().maxPendingGarments) {
      return 'Terminá algún pedido: el cupo es de 3 pedidos y 12 prendas pendientes.';
    }
    if (s.items.length + order.count > 20000) return 'Se alcanzó el límite de prendas de esta partida.';
    order.state = 'accepted';
    order.acceptedDay = s.day;
    for (let i = 0; i < order.count; i++) {
      s.items.push({ ...Game.config.garments[order.type], id: `garment-${s.nextGarmentId++}`,
        type: order.type, orderId: order.id, slot: null, x: 174, y: 235, ropeId: -1,
        status: 'stored', wetness: 0, cleanliness: 20, washProgress: 0 });
    }
    Game.saves?.auto('pedido aceptado');
    return null;
  }

  function atDoor() {
    const s = current();
    const door = Game.config.settings.door;
    return Math.hypot(s.player.x - door.x, s.player.y - door.y) < door.radius;
  }

  function deliver(id) {
    const s = current();
    const order = s.orders.find(o => o.id === id);
    if (!order || order.state !== 'accepted') return 'El pedido no está pendiente de entrega.';
    if (!atDoor()) return 'Acercate a la puerta de la casa para entregar.';
    if (stage(order) !== 'ready') return 'Guardá todas las prendas limpias y completamente secas antes de entregar.';
    const paymentId = `delivery-${order.id}`;
    if (s.laundry.ledger.some(e => e.id === paymentId)) return 'Este pedido ya fue cobrado.';
    if (!Game.economy.transact(paymentId, order.price, 'delivery', order.id)) return 'No se pudo registrar el cobro.';
    order.state = 'delivered';
    order.deliveredDay = s.day;
    order.paid = order.price;
    for (const p of goods(order)) p.status = 'delivered';
    const client = s.laundry.clients.find(c => c.id === order.clientId);
    client.completed++;
    if (s.day <= order.dueDay) client.onTime++;
    Game.reputation.review(s, order);
    Game.audio.play('deposit');
    Game.saves?.auto('entrega');
    return null;
  }

  function buySupplies() {
    const s = current();
    const pack = cfg().supplies;
    if (s.resources.money < pack.price) return 'No alcanza el saldo para comprar insumos.';
    if (!Game.economy.transact(`supplies-${s.laundry.ledger.length}`, -pack.price, 'supplies')) return 'No se pudo registrar la compra.';
    s.resources.water += pack.water;
    s.resources.soap += pack.soap;
    Game.saves?.auto('compra de insumos');
    return null;
  }
  Game.orders = { initialize, generate, customer, goods, stage, accept, deliver, atDoor, buySupplies };
})();

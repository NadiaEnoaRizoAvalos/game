/** Invariantes de pedidos, cobros y prendas para el formato 2. */
(() => {
  'use strict';
  const Game = window.RainGame;
  function validate(s, check, number, object) {
    const cfg = Game.config.laundry;
    const data = s.laundry;
    check(object(data), 'datos de lavandería');
    check(number(data.nextOrderId, 1, 1000000000, true), 'secuencia de pedidos');
    check(number(data.generatedDay, 1, s.day, true), 'día de pedidos');
    check(typeof data.leaveDoor === 'boolean' && number(data.dayStartMoney, 0, 1e12), 'transporte y saldo inicial');
    check(Array.isArray(data.legacyOrders) && Array.isArray(data.clients) && data.clients.length === cfg.clients.length, 'clientes');
    const clients = new Set();
    for (const c of data.clients) {
      check(object(c) && cfg.clients.some(x => x.id === c.id) && !clients.has(c.id), 'cliente desconocido o duplicado');
      check(number(c.completed, 0, 10000, true) && number(c.onTime, 0, c.completed, true), 'historial de cliente');
      clients.add(c.id);
    }
    check(Array.isArray(data.ledger) && data.ledger.length <= 20000, 'historial comercial');
    const payments = new Map();
    const entries = new Set();
    for (const entry of data.ledger) {
      check(object(entry) && typeof entry.id === 'string' && !entries.has(entry.id), 'movimiento duplicado');
      entries.add(entry.id);
      check(number(entry.day, 1, s.day, true) && number(entry.amount, -1e9, 1e9), 'movimiento económico');
      check(['delivery', 'supplies', ...(s.family ? ['family'] : [])].includes(entry.kind), 'tipo de movimiento');
      if (entry.kind === 'delivery') {
        check(typeof entry.orderId === 'string' && !payments.has(entry.orderId) && entry.id === `delivery-${entry.orderId}` && entry.amount > 0, 'cobro');
        payments.set(entry.orderId, entry);
      } else if (entry.kind === 'supplies') check(entry.amount === -cfg.supplies.price && entry.orderId === null, 'compra de insumos');
      else check(entry.amount < 0 && entry.orderId === null, 'gasto');
    }
    const ids = new Set();
    let active = 0;
    let pending = 0;
    for (const o of s.orders) {
      check(object(o) && /^order-[1-9]\d*$/.test(o.id) && !ids.has(o.id), 'identidad del pedido');
      ids.add(o.id);
      check(Number(o.id.slice(6)) < data.nextOrderId && clients.has(o.clientId), 'cliente o secuencia del pedido');
      check(number(o.offeredDay, 1, s.day, true) && number(o.dueDay, o.offeredDay, o.offeredDay + 30, true), 'plazo');
      check(Object.hasOwn(Game.config.garments, o.type) && number(o.count, 1, 12, true), 'prendas del pedido');
      check(number(o.price, 1, 1e6, true) && number(o.requiredQuality, 1, 100) && typeof o.urgent === 'boolean', 'precio y calidad');
      check(['available', 'accepted', 'expired', 'delivered'].includes(o.state), 'estado del pedido');
      const items = s.items.filter(p => p.orderId === o.id);
      if (['available', 'expired'].includes(o.state)) {
        check(items.length === 0 && o.acceptedDay === null && o.deliveredDay === null && o.paid === 0, 'pedido no aceptado con prendas o cobros');
      } else {
        check(number(o.acceptedDay, o.offeredDay, s.day, true) && items.length === o.count && items.every(p => p.type === o.type), 'integridad del pedido');
        if (o.state === 'accepted') {
          active++; pending += o.count;
          check(o.deliveredDay === null && o.paid === 0 && !payments.has(o.id) && items.every(p => p.status !== 'delivered'), 'pedido pendiente cobrado');
        } else {
          check(number(o.deliveredDay, o.acceptedDay, s.day, true) && o.paid === o.price && payments.get(o.id)?.amount === o.price, 'entrega sin pago válido');
          check(items.every(p => p.status === 'delivered' && p.cleanliness >= o.requiredQuality && p.wetness <= cfg.dryThreshold), 'entrega incompleta o sucia');
        }
      }
    }
    check(active <= cfg.maxActiveOrders && pending <= cfg.maxPendingGarments, 'cupo de pedidos');
    for (const id of payments.keys()) check(s.orders.some(o => o.id === id && o.state === 'delivered'), 'pago sin entrega');
    for (const c of data.clients) {
      const deliveries = s.orders.filter(o => o.clientId === c.id && o.state === 'delivered');
      check(c.completed === deliveries.length && c.onTime === deliveries.filter(o => o.deliveredDay <= o.dueDay).length, 'historial de cliente inconsistente');
    }
    for (const p of s.items) {
      if (!p.orderId) { check(['hanging', 'basket', 'saved'].includes(p.status), 'ropa familiar'); continue; }
      const order = s.orders.find(o => o.id === p.orderId);
      check(order && ['accepted', 'delivered'].includes(order.state), 'prenda huérfana');
      check(['stored', 'basket', 'hanging', 'delivered'].includes(p.status), 'ubicación de pedido');
      check(number(p.cleanliness, 0, 100) && number(p.washProgress, 0, cfg.wash.seconds + Game.config.garments[p.type].size), 'lavado');
      check(p.washProgress === 0 || (['stored', 'basket'].includes(p.status) && p.cleanliness < order.requiredQuality), 'lavado contradictorio');
      // El polvo puede ensuciar una prenda ya tendida: se conserva para volver a lavarla.
    }
  }
  Game.laundrySchema = { validate };
})();

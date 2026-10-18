/** Valida pronósticos y sanciones, incluidos vínculos con pedidos persistidos. */
(() => {
  const Game = window.RainGame;
  function validate(s, check, number, object) {
    const climate = s.climate;
    check(object(climate) && climate.day === s.day && Array.isArray(climate.segments) && climate.segments.length === 4, 'pronóstico');
    climate.segments.forEach((segment, i) => {
      check(object(segment) && Object.hasOwn(Game.config.climate, segment.kind) && segment.start === i * s.daySeconds / 4, 'tramo climático');
    });
    check(number(climate.announced, -1, 3, true) && number(climate.warned, -1, 3, true), 'avisos climáticos');
    const r = s.reputation;
    check(object(r) && number(r.score, 0, 100) && Array.isArray(r.complaints) && Array.isArray(r.reviews), 'reputación');
    for (const client of s.laundry.clients) {
      check(number(client.trust, 0, 100) && number(client.strikes, 0, 3, true) && number(client.blockedUntil, 0, 1000003, true), 'confianza del cliente');
      check(!client.blockedUntil || client.strikes === 3, 'suspensión sin tres quejas');
    }
    const complaints = new Set();
    for (const complaint of r.complaints) {
      check(object(complaint) && !complaints.has(complaint.orderId), 'queja duplicada');
      const o = s.orders.find(o => o.id === complaint.orderId);
      check(o && ['accepted', 'delivered'].includes(o.state) && complaint.clientId === o.clientId, 'queja sin pedido');
      check(number(complaint.day, o.dueDay + Game.config.service.seriousLateDays, s.day, true) && complaint.reason === 'late' && complaint.severity === 'serious', 'motivo de queja');
      complaints.add(complaint.orderId);
    }
    const reviews = new Set();
    for (const review of r.reviews) {
      check(object(review) && !reviews.has(review.orderId), 'evaluación duplicada');
      const o = s.orders.find(o => o.id === review.orderId);
      check(o && o.state === 'delivered' && review.day === o.deliveredDay && review.lateDays === Math.max(0, review.day - o.dueDay), 'evaluación de entrega');
      reviews.add(review.orderId);
    }
  }
  Game.climateSchema = { validate };
})();

/** Calidad de servicio, confianza y suspensiones temporales sin castigos duplicados. */
(() => {
  'use strict';
  const Game = window.RainGame;
  const rules = () => Game.config.service;
  function initialize(s) {
    if (s.reputation) return;
    s.reputation = { score: rules().initial, complaints: [], reviews: [] };
    for (const client of s.laundry.clients) {
      Object.assign(client, { trust: rules().initial, strikes: 0, blockedUntil: 0 });
    }
  }
  function newDay(s) {
    for (const c of s.laundry.clients) {
      if (c.blockedUntil && s.day >= c.blockedUntil) { c.blockedUntil = 0; c.strikes = 0; }
    }
  }
  function available(clientId, s) {
    const client = s.laundry.clients.find(c => c.id === clientId);
    return !client.blockedUntil || s.day >= client.blockedUntil;
  }
  function demand(s) { return !s.reputation || s.reputation.score >= 60 ? 3 : s.reputation.score >= 30 ? 2 : 1; }
  function change(s, client, score, trust) {
    s.reputation.score = Game.utils.clamp(s.reputation.score + score, 0, 100);
    client.trust = Game.utils.clamp(client.trust + trust, 0, 100);
  }
  /** Una queja grave por pedido; los días siguientes no vuelven a penalizarlo. */
  function complain(s, order) {
    if (s.reputation.complaints.some(c => c.orderId === order.id)) return false;
    const client = s.laundry.clients.find(c => c.id === order.clientId);
    s.reputation.complaints.push({ orderId: order.id, clientId: client.id, day: s.day, reason: 'late', severity: 'serious' });
    change(s, client, -rules().seriousPenalty, -15);
    client.strikes = Math.min(rules().complaintLimit, client.strikes + 1);
    if (client.strikes >= rules().complaintLimit) client.blockedUntil = Math.max(client.blockedUntil, s.day + rules().cooldownDays);
    return true;
  }
  function closeDay(s) {
    if (!s.reputation) return;
    for (const o of s.orders) {
      if (o.state === 'accepted' && s.day - o.dueDay >= rules().seriousLateDays) complain(s, o);
    }
  }
  function review(s, order) {
    if (!s.reputation || s.reputation.reviews.some(r => r.orderId === order.id)) return;
    const client = s.laundry.clients.find(c => c.id === order.clientId);
    const late = Math.max(0, s.day - order.dueDay);
    if (late >= rules().seriousLateDays) {
      complain(s, order);
      // Resolver un pedido pendiente permite empezar a recuperar la confianza.
      change(s, client, 1, 2);
    } else if (late) change(s, client, -rules().minorPenalty, -4);
    else change(s, client, rules().goodReward, 5);
    s.reputation.reviews.push({ orderId: order.id, day: s.day, lateDays: late });
  }
  Game.reputation = { initialize, newDay, available, demand, closeDay, review };
})();

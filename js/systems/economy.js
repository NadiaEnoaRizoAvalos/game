/** Movimientos atómicos con identidad: reintentar una operación nunca duplica dinero. */
(() => {
  const Game = window.RainGame;
  function transact(id, amount, kind, orderId = null, s = Game.state.current, reserve = 0) {
    if (!s.laundry || !Number.isSafeInteger(amount) || amount === 0 || s.laundry.ledger.length >= 20000 ||
        s.laundry.ledger.some(e => e.id === id) || s.resources.money + amount < reserve ||
        s.resources.money + amount > 1e12) return false;
    s.resources.money += amount;
    s.laundry.ledger.push({ id, day: s.day, amount, kind, orderId });
    return true;
  }
  function summary(day = null, s = Game.state.current) {
    const entries = s.laundry.ledger.filter(e => day === null || e.day === day);
    return { income: entries.reduce((n, e) => n + Math.max(0, e.amount), 0),
      expenses: entries.reduce((n, e) => n + Math.max(0, -e.amount), 0),
      receivable: s.orders.filter(o => o.state === 'accepted').reduce((n, o) => n + o.price, 0), entries };
  }
  Game.economy = { transact, summary };
})();

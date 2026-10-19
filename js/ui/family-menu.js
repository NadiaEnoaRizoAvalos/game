/** Tablón familiar y libro de cuentas, con los mismos controles de los demás menús. */
(() => {
  const Game = window.RainGame;
  const button = (a, text) => `<button class="secondary" data-action="${a}">${text}</button>`;
  function show(message = '') {
    const s = Game.state.current, cfg = Game.config.family;
    const report = Game.economy.summary();
    Game.hud.showPanel(`<div class="eyebrow">LA FAMILIA Y EL NEGOCIO</div><h2>La mesa de casa.</h2>
      <p>${message}</p><p>Saldo: $${s.resources.money} · Ingresos: $${report.income} · Egresos: $${report.expenses}<br>Pendiente de cobro: $${report.receivable}</p>
      <p>Los gastos se pueden aplazar sin multas. Al pagarlos reservamos $${cfg.reserve} para insumos. No se descuentan automáticamente.</p>
      ${s.family.events.filter(e => !e.paid).map(e => `<p><b>${cfg.events[e.kind].title} · $${cfg.events[e.kind].cost}</b><br>${cfg.events[e.kind].text}</p>${button(`family:pay:${e.id}`, 'PAGAR')}`).join('')}
      <div class="panel-actions">${cfg.members.map(m => button(`family:talk:${m.id}`, `${m.name.toUpperCase()} · ${Game.family.present(m.id) ? 'CONVERSAR' : 'EN LA ESCUELA'}`)).join('')}
      ${button('family:mate', 'SENTARSE A TOMAR MATES')}${button('family:aid', 'AYUDA VECINAL')}${button('family:ledger', 'HISTORIAL ECONÓMICO')}${button('resume', 'SEGUIR JUGANDO')}</div>`);
  }
  function ledger() {
    const s = Game.state.current;
    const names = { delivery: 'Pedido entregado', supplies: 'Agua y jabón', family: 'Gasto familiar', house: 'Casa y muebles', yard: 'Patio y herramientas' };
    Game.hud.showPanel(`<h2>Libro de cuentas.</h2><p>Saldo: $${s.resources.money}. Últimos 50 movimientos; el historial completo queda guardado.</p>
      ${s.laundry.ledger.slice(-50).reverse().map(e => `<p>Día ${e.day} · ${names[e.kind]} · ${e.amount > 0 ? '+' : ''}$${e.amount}</p>`).join('') || '<p>Todavía no hay movimientos.</p>'}
      ${button('family', 'VOLVER A LA FAMILIA')}${button('resume', 'SEGUIR JUGANDO')}`);
  }
  function action(a) {
    if (a === 'family') show();
    if (!a.startsWith('family:')) return;
    const [, kind, id] = a.split(':');
    if (kind === 'pay') show(Game.family.pay(id) || 'Gasto resuelto. ¡Gracias por cuidar la casa!');
    if (kind === 'talk') show(Game.family.talk(id));
    if (kind === 'aid') show(Game.family.aid() || 'Los vecinos acercaron agua y jabón para retomar el trabajo.');
    if (kind === 'ledger') ledger();
    if (kind === 'mate') { const error = Game.family.rest(); if (error) show(error); }
  }
  Game.familyMenu = { show, action };
})();

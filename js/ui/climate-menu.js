/** Pronóstico y confianza dentro de los tablones originales. */
(() => {
  const Game = window.RainGame;
  function show(reputation = false) {
    const s = Game.state.current;
    if (!s.climate) return;
    if (s.mode === 'playing') Game.screens.pause();
    let body;
    if (reputation) {
      body = `<h2>La confianza del barrio.</h2><p>Reputación: ${Math.round(s.reputation.score)}/100<br>
Entregá limpio, seco y a tiempo para recuperar confianza.</p>
${s.laundry.clients.map(c => `<p><b>${Game.orders.customer(c.id).name}</b> · Confianza ${Math.round(c.trust)}/100<br>
${c.strikes}/3 quejas graves · ${c.blockedUntil > s.day ? `Vuelve a encargar el día ${c.blockedUntil}` : 'Recibe encargos'}<br>
${c.completed} entregas, ${c.onTime} puntuales</p>`).join('')}
<p class="tiny">Un día tarde: falta menor. Dos días o más: una queja grave por pedido.<br>
Tres quejas del mismo cliente: pausa de tres días. Resolver pendientes también ayuda a recuperarse.<br>
La ropa sucia, mojada o incompleta no se puede entregar.</p>`;
    } else {
      const c = Game.climate.conditions();
      body = `<h2>El cielo de hoy.</h2><p>${c.name} · ${c.temperature} °C · Humedad ${c.humidity}%</p>
${s.climate.segments.map((segment, i) => `<p>${Game.calendar.time({ ...s, elapsed: segment.start })} · ${Game.config.climate[segment.kind].name}${i === Game.climate.index() ? ' ← AHORA' : ''}</p>`).join('')}
<p>Mañana: ${Game.climate.plan(s.day + 1, s.daySeconds).map(segment => Game.config.climate[segment.kind].name).join(' → ')}</p>
<p class="tiny">El juego avisa antes de los cambios. El viento fuerte levanta polvo; las camisas delicadas requieren atención con mucho calor.<br>
Los árboles dan sombra y reducen polvo. La ropa guardada en casa está protegida.</p>`;
    }
    Game.hud.showPanel(`<div class="eyebrow">DÍA ${s.day}</div>${body}<div class="panel-actions">
<button class="secondary" data-action="${reputation ? 'forecast' : 'reputation'}">${reputation ? 'PRONÓSTICO' : 'REPUTACIÓN'}</button>
<button class="primary" data-action="resume">VOLVER AL PATIO →</button></div>`);
  }
  function action(name) {
    if (name === 'forecast') show();
    if (name === 'reputation') show(true);
  }
  Game.climateMenu = { show, action };
})();

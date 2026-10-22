/** La guía se puede consultar y ocultar sin reiniciar la partida. */
(() => {
  const Game = window.RainGame;
  let returnToMenu = false;
  function show(remember = true) {
    const s = Game.state.current;
    if (remember) returnToMenu = s.mode === 'menu';
    if (s.mode === 'building') Game.buildMenu.finish();
    if (s.mode === 'playing') Game.screens.pause();
    Game.guide.observe(s);
    Game.hud.showPanel(`<div class="eyebrow">PASO A PASO, SIN APURO</div><h2>Guía del patio.</h2>
      <p>${s.guide.done.length}/${Game.guide.steps.length} pasos recorridos. Podés leerlos en cualquier orden; ninguno bloquea el juego.</p>
      ${Game.guide.steps.map(step => `<p><b>${s.guide.done.includes(step.id) ? '✓' : '○'} ${step.title}</b><br>${step.text}</p>`).join('')}
      <div class="panel-actions"><button class="secondary" data-action="guide:hints">${s.guide.hints ? 'OCULTAR' : 'MOSTRAR'} SUGERENCIAS DEL PATIO</button>
      <button class="primary" data-action="guide:back">VOLVER</button></div>`);
  }
  function action(a) {
    if (a === 'guide') show();
    if (a === 'guide:hints') { const s = Game.state.current; s.guide.hints = !s.guide.hints; Game.saves?.auto('preferencia de guía'); show(false); }
    if (a === 'guide:back') { if (returnToMenu || !Game.saves.active) Game.screens.menu(); else Game.screens.resume(); }
  }
  Game.guideMenu = { show, action };
})();

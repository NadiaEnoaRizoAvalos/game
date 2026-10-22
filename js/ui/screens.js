"use strict";

/** Inicio, pausa, instrucciones, resultados y navegación entre niveles. */
(() => {
  'use strict';

  const Game = window.RainGame;
  /** Inicia o reintenta un nivel; limpia controles y audio pendientes. */
  function loadLevel(index, total = 0) {
    Game.engine.resetTime();
    Game.controls.clearInputs();
    Game.audio.stop();
    Game.state.current = Game.state.createLevel(index, total);
    Game.state.current.mode = 'playing';
    Game.dom.byId('overlay').hidden = true;
    Game.dom.byId('pause').disabled = false;
    Game.dom.byId('pause').textContent = 'Ⅱ';
    Game.hud.update();
    Game.hud.toast('¡A la soga! Mantené Espacio para recoger.');
  }

  /** Construye la escena inicial y muestra el menú principal. */
  function menu() {
    Game.engine.resetTime();
    if (Game.saves?.active) Game.saves.auto('menú');
    Game.audio.stop();
    Game.controls.clearInputs();
    if (!Game.state.current?.campaign) Game.state.current = Game.calendar.newGame();
    Game.state.current.mode = 'menu';
    Game.hud.showPanel(`<div class="eyebrow">EL PATIO TE ESPERA</div>
<h2>Se viene la lluvia.</h2>
<p>Cuidá la ropa del patio y atendé los pedidos del barrio.<br>Lavá, tendé y hacé crecer el hogar de María Carmen.</p>
<div class="panel-actions">
<button class="primary" data-action="start">NUEVA PARTIDA <span>→</span>
</button>
<button class="secondary" data-action="help">INSTRUCCIONES</button>
<button class="secondary" data-action="guide">GUÍA DEL PATIO</button>
<button class="secondary" data-action="continue">CONTINUAR PARTIDA</button>
<button class="secondary" data-action="saves">GUARDAR / IMPORTAR / EXPORTAR</button>
</div>
<p id="save-status" role="status" aria-live="polite"></p>
<p class="tiny">DÍAS EN EL PATIO · UN CANASTO · MUCHAS DECISIONES</p>`);
    Game.dom.byId('pause').disabled = true;
    Game.hud.update();
    if (Game.saves) Game.saves.status(Game.saves.message);
  }

  /** Detiene la partida y presenta el desglose de prendas y puntuación. */
  function finish() {
    Game.controls.clearInputs();
    Game.state.current.mode = 'results';
    Game.audio.stop();
    Game.audio.play('finish');
    Game.dom.byId('pause').disabled = true;
    const gameState = Game.state.current;
    const dry = gameState.items.filter(p => p.status === 'saved' && p.wetness < 30).length;
    const damp = gameState.items.filter(p => p.status === 'saved' && p.wetness >= 30 && p.wetness < 70).length;
    const wet = gameState.items.filter(p => p.wetness >= 70).length;
    const failed = gameState.saved < Game.config.settings.minimumSaved;
    Game.hud.showPanel(`<div class="eyebrow">NIVEL ${gameState.index + 1} ${failed ? '· A INTENTAR DE NUEVO' : 'COMPLETADO'}</div>
<h2>${failed ? '¡Todavía podés mejorar!' : gameState.index === 2 ? 'Después de la lluvia.' : 'Un respiro en casa.'}</h2>
<div class="result-grid">
<div>
<strong>${dry}</strong>Salvadas secas</div>
<div>
<strong>${damp}</strong>Salvadas húmedas</div>
<div>
<strong>${wet}</strong>Empapadas</div>
</div>
<div class="result-score">${gameState.points} <small>puntos</small>
</div>
<p>Total de la partida: <strong>${gameState.total + gameState.points}</strong> · ${gameState.saved}/${gameState.items.length} guardadas</p>
<div class="panel-actions">
<button class="secondary" data-action="retry">JUGAR DE NUEVO</button>${gameState.index < 2 && !failed ? '<button class="primary" data-action="next">SIGUIENTE NIVEL →</button>' : '<button class="primary" data-action="start">NUEVA PARTIDA →</button>'}</div>`);
  }

  /** Pausa la simulación y suelta los controles; si estaba pausada, reanuda. */
  function pause(suppressSave = false) {
    if (Game.state.current.mode === 'building') { Game.buildMenu.finish(); return; }
    if (Game.state.current.mode === 'playing') {
      Game.state.current.mode = 'paused';
      Game.engine.resetTime();
      if (suppressSave !== true) Game.saves?.auto('pausa');
      Game.controls.clearInputs();
      Game.audio.weather(0);
      Game.dom.byId('pause').textContent = '▶';
      Game.hud.showPanel(`<div class="eyebrow">LA TORMENTA PUEDE ESPERAR</div>
<h2>Un pequeño descanso.</h2>
<p>El tiempo está en pausa.</p>
<div class="panel-actions">
<button class="primary" data-action="resume">SEGUIR JUGANDO →</button>
<button class="secondary" data-action="menu">VOLVER AL INICIO</button>
${Game.state.current.campaign ? '<button class="secondary" data-action="saves">PARTIDAS Y RESPALDOS</button>' : ''}
${Game.state.current.campaign ? '<button class="secondary" data-action="endDay">FINALIZAR DÍA</button>' : ''}
${Game.state.current.laundry ? '<button class="secondary" data-action="orders">PEDIDOS E INSUMOS</button>' : ''}
${Game.state.current.laundry ? '<button class="secondary" data-action="customers">ATENDER VECINOS</button>' : ''}
${Game.state.current.climate ? '<button class="secondary" data-action="forecast">PRONÓSTICO Y REPUTACIÓN</button>' : ''}
${Game.state.current.family ? '<button class="secondary" data-action="family">FAMILIA Y ECONOMÍA</button>' : ''}
${Game.state.current.house?.layoutVersion ? '<button class="secondary" data-action="house">CASA Y MUEBLES</button>' : ''}
${Game.state.current.yard ? '<button class="secondary" data-action="build">CONSTRUIR PATIO Y HERRAMIENTAS</button>' : ''}
${Game.state.current.workshop ? '<button class="secondary" data-action="work">AYUDA, MÁQUINAS Y HABILIDADES</button>' : ''}
${Game.state.current.guide ? '<button class="secondary" data-action="guide">GUÍA Y PROGRESO</button>' : ''}
</div>`);
    } else if (Game.state.current.mode === 'paused') {
      Game.screens.resume();
    }
  }

  /** Reanuda la partida y oculta el tablón de pausa. */
  function resume(force = false) {
    if (Game.saves?.replacing && !force) return;
    Game.engine.resetTime();
    Game.state.current.mode = 'playing';
    Game.dom.byId('overlay').hidden = true;
    Game.dom.byId('pause').textContent = 'Ⅱ';
    Game.controls.clearInputs();
    Game.dom.byId('pause').disabled = false;
  }

  function startCampaign() {
    Game.state.current = Game.calendar.newGame();
    Game.runtime.clock = 0;
    Game.audio.stop();
    Game.screens.resume();
    Game.hud.update();
    Game.saves?.auto('nueva partida');
  }

  /** Resumen sin reiniciar el mundo; seguir jugando permite recoger pendientes. */
  function daySummary() {
    const s = Game.state.current;
    Game.engine.resetTime();
    Game.controls.clearInputs();
    Game.audio.stop();
    s.mode = 'paused';
    Game.dom.byId('pause').textContent = '▶';
    Game.hud.showPanel(`<div class="eyebrow">DÍA ${s.day}</div>
<h2>Un respiro en casa.</h2>
<p>Hoy: ${s.points - s.dayStartPoints} puntos · ${s.saved - s.dayStartSaved} prendas guardadas.<br>
Total: ${s.points} puntos · ${s.items.filter(p => !['saved', 'delivered'].includes(p.status)).length} prendas pendientes.</p>
${s.laundry ? `<p>Saldo: $${s.resources.money} · Variación del día: $${s.resources.money - s.laundry.dayStartMoney}<br>Pedidos pendientes: ${s.orders.filter(o => o.state === 'accepted').length}</p>` : ''}
${s.reputation ? `<p>Reputación: ${Math.round(s.reputation.score)}/100 · Quejas graves: ${s.reputation.complaints.length}</p>` : ''}
${s.family ? `<p>Ingresos de hoy: $${Game.economy.summary(s.day).income} · Gastos: $${Game.economy.summary(s.day).expenses}<br>Pedidos entregados hoy: ${s.orders.filter(o => o.deliveredDay === s.day).length}<br>Mañana: ${Game.climate.plan(s.day + 1, s.daySeconds).map(p => Game.config.climate[p.kind].name).join(' → ')}</p>` : ''}
<div class="panel-actions"><button class="primary" data-action="nextDay">DÍA SIGUIENTE →</button>
<button class="secondary" data-action="resume">SEGUIR EN EL PATIO</button></div>`);
    Game.hud.update();
  }

  /** Muestra instrucciones y recuerda si debe volver a una partida activa. */
  function help() {
    if (Game.state.current.mode === 'building') Game.buildMenu.finish();
    Game.runtime.helpWasPlaying = Game.state.current.mode === 'playing';
    if (Game.runtime.helpWasPlaying) {
      Game.engine.resetTime();
      Game.state.current.mode = 'paused';
      Game.audio.weather(0);
      Game.controls.clearInputs();
    }
    Game.hud.showPanel(`<div class="eyebrow">CÓMO JUGAR</div>
<h2>Elegí. Recogé. Guardá.</h2>
<p>
<b>1.</b> Movete en 8 direcciones con WASD, flechas o el joystick circular.<br>
<b>2.</b> Acercate a una prenda desde cualquier lado y mantené Espacio o Recoger. Si soltás, el progreso se reinicia.<br>
<b>3.</b> Llevá el canasto a la puerta de la casa, arriba a la izquierda.<br>Seca: 100% · Húmeda: 50% · Empapada: 0%.<br>★ Cuero seco: ¡puntos dobles! La ropa del canasto también se moja: guardala en casa.<br>
<b>4.</b> El canasto tiene 6 unidades de volumen: una sábana ocupa 3.<br>
<b>5.</b> Al terminar el día, elegí seguir en el patio o avanzar. La ropa pendiente y los puntos se conservan. También podés finalizar desde Pausa.<br>
<b>6.</b> En Partidas y respaldos podés guardar o descargar una copia JSON. El juego guarda automáticamente mientras jugás.</p>
<p><b>Vecinos:</b> esperan al costado de la entrada. Acercate y presioná Espacio/acción para atenderlos en casa.
El cartel muestra su retrato, prendas, precio, plazo y calidad: podés aceptar o rechazar.
Dentro de la casa también podés usar Pausa → Atender vecinos.</p>
<p><b>Lavandería:</b> abrí Pausa → Pedidos e insumos. Aceptá un encargo, acercate a la puerta y cargá sus prendas.
Caminá al lavadero a la derecha de la casa y mantené Espacio/acción para lavar. Cada prenda usa 2 de agua y 1 de jabón.
Llevá la ropa limpia a un lugar libre de las sogas y presioná acción para tender; soltá entre prendas.
Esperá humedad 0%, recogé y guardá en casa. Entregá desde Pedidos para cobrar.<br>
La ropa familiar que ya estaba colgada conserva los puntos del juego original; recogela para liberar sogas.</p>
<p><b>Casa:</b> junto a la puerta, presioná acción para entrar. Caminá hasta los muebles y José o Jaqui para interactuar.
El estante permite guardar y cargar prendas. Para entregar pedidos volvé a la puerta exterior. En Pausa → Casa y muebles podés comprar materiales, habitaciones y muebles.</p>
<p><b>Familia:</b> en Pausa → Familia y economía revisá gastos aplazables y cuentas. Si resolviste los encargos que vencen hoy, podés sentarte a tomar mates y consultar el resumen; los pedidos futuros pueden esperar.</p>
<p><b>Construcción:</b> en Pausa → Construir patio y herramientas elegí un objeto. Ubicalo con el mouse, tocando una casilla o con las flechas; confirmá para comprar. El tiempo está detenido mientras elegís. Los accesos y el patio original están protegidos. Podés mover o retirar construcciones nuevas cuando no tengan ropa tendida.</p>
<button class="primary" data-action="closeHelp">¡ENTENDIDO!</button>`);
  }
  function soundLabels() {
    Game.dom.byId('sound').innerHTML = `♫ <span>Sonido ${Game.audio.enabled ? 'activado' : 'apagado'}</span>`;
    Game.dom.byId('sound').setAttribute('aria-pressed', String(Game.audio.enabled));
    Game.dom.byId('sound').setAttribute('aria-label', Game.audio.enabled ? 'Desactivar sonido' : 'Activar sonido');
  }
  /** Conecta los eventos de este módulo; se llama una sola vez desde main.js. */
  function init() {
    Game.dom.byId('sound').addEventListener('click', () => {
      Game.audio.init();
      Game.audio.enabled = !Game.audio.enabled;
      Game.audio.rememberPreference(); soundLabels();
      if (!Game.audio.enabled) {
        Game.audio.stop();
      } else {
        Game.audio.tone(600);
      }
    });
    Game.dom.byId('pause').addEventListener('click', Game.screens.pause);
    Game.dom.byId('help').addEventListener('click', Game.screens.help);
    Game.dom.byId('panel').addEventListener('click', e => {
      const a = e.target.closest('[data-action]')?.dataset.action;
      if (!a) {
        return;
      }
      Game.audio.init();
      if (Game.saves.busy) return;
      Game.saveMenu.action(a);
      Game.ordersMenu.action(a);
      Game.climateMenu.action(a);
      Game.familyMenu.action(a);
      Game.houseMenu.action(a);
      Game.buildMenu.action(a);
      Game.automationMenu.action(a);
      Game.guideMenu.action(a);
      if (a === 'start') Game.saves.start();
      if (a === 'continue') Game.saves.continueGame();
      if (a === 'nextDay') Game.calendar.advanceDay();
      if (a === 'endDay') {
        if (Game.state.current.dayEnded) Game.screens.daySummary();
        else Game.calendar.endDay();
      }
      if (a === 'retry') {
        Game.screens.loadLevel(Game.state.current.index, Game.state.current.total);
      }
      if (a === 'next') {
        Game.screens.loadLevel(Game.state.current.index + 1, Game.state.current.total + Game.state.current.points);
      }
      if (a === 'resume') {
        Game.screens.resume();
      }
      if (a === 'menu') {
        Game.screens.menu();
      }
      if (a === 'help') {
        Game.screens.help();
      }
      if (a === 'closeHelp') {
        if (Game.runtime.helpWasPlaying) {
          Game.screens.resume();
        } else if (Game.state.current.mode === 'menu') {
          Game.screens.menu();
        } else if (Game.state.current.mode === 'results') {
          Game.screens.finish();
        } else {
          Game.state.current.mode = 'playing';
          Game.screens.pause();
        }
      }
    });
  }
  Game.screens = {
    soundLabels,
    startCampaign, daySummary,
    loadLevel: loadLevel,
    menu: menu,
    finish: finish,
    pause: pause,
    resume: resume,
    help: help,
    init
  };
})();

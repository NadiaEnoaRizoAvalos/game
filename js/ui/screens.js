"use strict";

/** Inicio, pausa, instrucciones, resultados y navegación entre niveles. */
(() => {
  'use strict';

  const Game = window.RainGame;
  /** Inicia o reintenta un nivel; limpia controles y audio pendientes. */
  function loadLevel(index, total = 0) {
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
    Game.audio.stop();
    Game.controls.clearInputs();
    Game.state.current = Game.state.createLevel(0);
    Game.hud.showPanel(`<div class="eyebrow">EL PATIO TE ESPERA</div>
<h2>Se viene la lluvia.</h2>
<p>Recogé la ropa, llená el canasto y volvé a casa.<br>Algunas prendas valen más. ¡Elegí bien!</p>
<div class="panel-actions">
<button class="primary" data-action="start">JUGAR <span>→</span>
</button>
<button class="secondary" data-action="help">INSTRUCCIONES</button>
</div>
<p class="tiny">TRES TORMENTAS · UN CANASTO · MUCHAS DECISIONES</p>`);
    Game.dom.byId('pause').disabled = true;
    Game.hud.update();
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
  function pause() {
    if (Game.state.current.mode === 'playing') {
      Game.state.current.mode = 'paused';
      Game.controls.clearInputs();
      Game.audio.weather(0);
      Game.dom.byId('pause').textContent = '▶';
      Game.hud.showPanel(`<div class="eyebrow">LA TORMENTA PUEDE ESPERAR</div>
<h2>Un pequeño descanso.</h2>
<p>El tiempo está en pausa.</p>
<div class="panel-actions">
<button class="primary" data-action="resume">SEGUIR JUGANDO →</button>
<button class="secondary" data-action="menu">VOLVER AL INICIO</button>
</div>`);
    } else if (Game.state.current.mode === 'paused') {
      Game.screens.resume();
    }
  }

  /** Reanuda la partida y oculta el tablón de pausa. */
  function resume() {
    Game.state.current.mode = 'playing';
    Game.dom.byId('overlay').hidden = true;
    Game.dom.byId('pause').textContent = 'Ⅱ';
    Game.controls.clearInputs();
  }

  /** Muestra instrucciones y recuerda si debe volver a una partida activa. */
  function help() {
    Game.runtime.helpWasPlaying = Game.state.current.mode === 'playing';
    if (Game.runtime.helpWasPlaying) {
      Game.state.current.mode = 'paused';
      Game.audio.weather(0);
      Game.controls.clearInputs();
    }
    Game.hud.showPanel(`<div class="eyebrow">CÓMO JUGAR</div>
<h2>Elegí. Recogé. Guardá.</h2>
<p>
<b>1.</b> Movete en 8 direcciones con WASD, flechas o el joystick circular.<br>
<b>2.</b> Acercate a una prenda desde cualquier lado y mantené Espacio o Recoger. Si soltás, el progreso se reinicia.<br>
<b>3.</b> Llevá el canasto a la puerta de la casa, arriba a la izquierda.<br>Seca: 100% · Húmeda: 50% · Empapada: 0%.<br>★ Cuero seco: ¡puntos dobles! La ropa del canasto también se moja: guardala en casa.</p>
<button class="primary" data-action="closeHelp">¡ENTENDIDO!</button>`);
  }
  /** Conecta los eventos de este módulo; se llama una sola vez desde main.js. */
  function init() {
    Game.dom.byId('sound').addEventListener('click', () => {
      Game.audio.init();
      Game.audio.enabled = !Game.audio.enabled;
      Game.dom.byId('sound').innerHTML = `♫ <span>Sonido ${Game.audio.enabled ? 'activado' : 'apagado'}</span>`;
      Game.dom.byId('sound').setAttribute('aria-pressed', String(Game.audio.enabled));
      Game.dom.byId('sound').setAttribute('aria-label', Game.audio.enabled ? 'Desactivar sonido' : 'Activar sonido');
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
      if (a === 'start') {
        Game.screens.loadLevel(0);
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
    loadLevel: loadLevel,
    menu: menu,
    finish: finish,
    pause: pause,
    resume: resume,
    help: help,
    init
  };
})();

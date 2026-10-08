"use strict";

/** Conecta los datos de la partida con los indicadores HTML. */
(() => {
  'use strict';

  const Game = window.RainGame;
  /** Muestra el tablón de menú con el HTML recibido. */
  function showPanel(html) {
    Game.dom.byId('panel').innerHTML = html;
    Game.dom.byId('overlay').hidden = false;
  }

  /** Presenta un aviso temporal durante 2,8 segundos. */
  function toast(message) {
    Game.dom.byId('toast').textContent = message;
    Game.dom.byId('toast').classList.add('visible');
    Game.runtime.toastTime = 2.8;
  }

  /** Oculta el aviso cuando vence su duración. */
  function updateToast(deltaSeconds) {
    if (Game.runtime.toastTime <= 0) {
      return;
    }
    Game.runtime.toastTime -= deltaSeconds;
    if (Game.runtime.toastTime <= 0) {
      Game.dom.byId('toast').classList.remove('visible');
    }
  }

  /** Actualiza tiempo, puntos, canasto y mensaje contextual. */
  function updateHUD() {
    const gameState = Game.state.current;
    Game.dom.byId('weather-veil').style.opacity = Game.utils.clamp(gameState.elapsed / (gameState.level.delay + 14), 0, 1) * .32;
    Game.dom.byId('level-label').textContent = `NIVEL 0${gameState.index + 1} / 03`;
    Game.dom.byId('level-name').textContent = gameState.level.name;
    Game.dom.byId('timer').textContent = gameState.rainStarted ? '☂' : Math.max(0, Math.ceil(gameState.level.delay - gameState.elapsed));
    Game.dom.byId('timer-unit').textContent = gameState.rainStarted ? '' : ' s';
    Game.dom.byId('weather-label').textContent = gameState.rainStarted ? gameState.rainIntensity >= .99 ? 'TORMENTA' : gameState.rainIntensity < .35 ? 'LLOVIZNA' : 'LLUVIA' : 'LLUVIA EN';
    Game.dom.byId('score').textContent = String(gameState.total + gameState.points).padStart(3, '0');
    Game.dom.byId('capacity').textContent = Game.collection.usedSpace();
    Game.dom.byId('capacity-bar').style.width = Game.collection.usedSpace() / Game.config.settings.basketCapacity * 100 + '%';
    Game.dom.byId('hint').textContent = contextualHint(gameState);
  }

  /** Elige la ayuda según el menú, la prenda cercana o el estado del clima. */
  function contextualHint(gameState) {
    if (gameState.mode === 'menu') {
      return '● Un cielo tranquilo… por ahora.';
    }
    const garment = gameState.target;
    if (garment) {
      return [
        `${garment.special ? '★ ' : ''}${garment.name}`,
        `${Game.collection.scoreFor(garment)} pts`,
        `${garment.time} s`,
        `${garment.size} espacios`,
        `${Math.round(garment.wetness)}% humedad`
      ].join(' · ');
    }
    if (gameState.stormAnnounced) {
      return '⛈ Tormenta en todo el patio. ¡A casa!';
    }
    if (gameState.rainStarted) {
      return '☂ Llueve en todo el patio. La tormenta se acerca.';
    }
    return '↖ Casa: guardá la ropa. Podés recorrer las tres sogas.';
  }
  Game.hud = {
    showPanel: showPanel,
    toast: toast,
    updateToast: updateToast,
    update: updateHUD
  };
})();

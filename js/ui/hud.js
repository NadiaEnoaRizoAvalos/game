"use strict";

/** Conecta los datos de la partida con los indicadores HTML. */
(() => {
  'use strict';

  const Game = window.RainGame;
  /** Muestra el tablón de menú con el HTML recibido. */
  function showPanel(html) {
    Game.dom.byId('panel').innerHTML = `<div class="panel-scroll">${html}</div>`;
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
    Game.dom.byId('weather-veil').style.opacity = Game.utils.clamp(gameState.elapsed / (Game.state.weather().delay + 14), 0, 1) * .32;
    Game.dom.byId('level-label').textContent = `NIVEL 0${gameState.index + 1} / 03`;
    Game.dom.byId('level-name').textContent = gameState.campaign ? Game.calendar.phase(gameState) + '\n' + Game.calendar.time(gameState) : Game.state.weather().name;
    if (gameState.campaign) Game.dom.byId('level-label').textContent = `DÍA ${gameState.day}`;
    Game.dom.byId('capacity-max').textContent = Game.collection.capacity();
    Game.dom.byId('timer').textContent = gameState.rainStarted ? '☂' : Math.max(0, Math.ceil(Game.state.weather().delay - gameState.elapsed));
    Game.dom.byId('timer-unit').textContent = gameState.rainStarted ? '' : ' s';
    Game.dom.byId('weather-label').textContent = gameState.rainStarted ? gameState.rainIntensity >= .99 ? 'TORMENTA' : gameState.rainIntensity < .35 ? 'LLOVIZNA' : 'LLUVIA' : 'LLUVIA EN';
    if (gameState.climate) {
      const c = Game.climate.conditions();
      const next = Game.climate.next();
      Game.dom.byId('weather-label').textContent = c.name.toUpperCase();
      Game.dom.byId('timer').textContent = next ? Math.max(0, Math.ceil(next.start - gameState.elapsed)) : c.temperature;
      Game.dom.byId('timer-unit').textContent = next ? ' s' : ' °C';
      Game.dom.byId('weather-veil').style.opacity = c.cloud * .32;
    }
    Game.dom.byId('score').textContent = String(gameState.total + gameState.points).padStart(3, '0');
    Game.dom.byId('capacity').textContent = Game.collection.usedSpace();
    Game.dom.byId('capacity-bar').style.width = Game.collection.usedSpace() / Game.collection.capacity() * 100 + '%';
    Game.dom.byId('hint').textContent = contextualHint(gameState);
    const action = Game.laundry.context();
    const touch = document.querySelectorAll('[data-key="collect"]')[0];
    if (touch) {
      const name = action?.kind === 'wash' ? 'LAVAR' : action?.kind === 'hang' ? 'TENDER' : 'RECOGER';
      if (touch.dataset.label !== name) {
        touch.dataset.label = name;
        touch.innerHTML = `<span class="collect-icon" aria-hidden="true">▧</span>${name}`;
        touch.setAttribute('aria-label', name);
      }
    }
  }

  /** Elige la ayuda según el menú, la prenda cercana o el estado del clima. */
  function contextualHint(gameState) {
    if (gameState.mode === 'menu') {
      return '● Un cielo tranquilo… por ahora.';
    }
    const action = Game.laundry.context();
    if (action?.kind === 'wash') return action.item ? `Mantené acción para lavar ${action.item.name} · Agua ${gameState.resources.water} · Jabón ${gameState.resources.soap}` : 'Lavadero: traé prendas sucias en el canasto. Pedidos está en Pausa.';
    if (action?.kind === 'hang') return `Acción: tender ${action.item.name} en este lugar libre.`;
    const garment = gameState.target;
    if (garment) {
      if (garment.orderId) return `${garment.name} · Humedad ${Math.round(garment.wetness)}% · Limpieza ${Math.floor(garment.cleanliness)}% · ${garment.size} espacios`;
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
    return gameState.laundry ? '↖ Casa: cargar y guardar · Lavadero a la derecha · Pausa: pedidos' : '↖ Casa: guardá la ropa. Podés recorrer las tres sogas.';
  }
  Game.hud = {
    showPanel: showPanel,
    toast: toast,
    updateToast: updateToast,
    update: updateHUD
  };
})();

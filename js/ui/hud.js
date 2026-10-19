"use strict";

/** Conecta los datos de la partida con los indicadores HTML. */
(() => {
  'use strict';

  const Game = window.RainGame;
  function text(id, value) { const el = Game.dom.byId(id), next = String(value); if (el.textContent !== next) el.textContent = next; }
  function style(id, name, value) { const el = Game.dom.byId(id); if (el.style[name] !== value) el.style[name] = value; }
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
    text('level-label', gameState.campaign ? `DÍA ${gameState.day}` : `NIVEL 0${gameState.index + 1} / 03`);
    text('level-name', gameState.campaign ? Game.calendar.phase(gameState) + '\n' + Game.calendar.time(gameState) : Game.state.weather().name);
    text('capacity-max', Game.collection.capacity());
    if (gameState.climate) {
      const c = Game.climate.conditions();
      const next = Game.climate.next();
      const seconds = next ? Math.max(0, Math.ceil(next.start - gameState.elapsed)) : 0;
      text('weather-label', c.name.toUpperCase());
      text('timer', next ? seconds >= 1000 ? Math.ceil(seconds / 60) : seconds : c.temperature);
      text('timer-unit', next ? seconds >= 1000 ? ' m' : ' s' : ' °C');
      style('weather-veil', 'opacity', String(c.cloud * .32));
    } else {
      style('weather-veil', 'opacity', String(Game.utils.clamp(gameState.elapsed / (Game.state.weather().delay + 14), 0, 1) * .32));
      text('timer', gameState.rainStarted ? '☂' : Math.max(0, Math.ceil(Game.state.weather().delay - gameState.elapsed)));
      text('timer-unit', gameState.rainStarted ? '' : ' s');
      text('weather-label', gameState.rainStarted ? gameState.rainIntensity >= .99 ? 'TORMENTA' : gameState.rainIntensity < .35 ? 'LLOVIZNA' : 'LLUVIA' : 'LLUVIA EN');
    }
    text('score', String(gameState.total + gameState.points).padStart(3, '0'));
    text('capacity', Game.collection.usedSpace());
    style('capacity-bar', 'width', Game.collection.usedSpace() / Game.collection.capacity() * 100 + '%');
    const homeAction = Game.house.context();
    const action = Game.laundry.context();
    text('hint', contextualHint(gameState, homeAction, action));
    const touch = document.querySelectorAll('[data-key="collect"]')[0];
    if (touch) {
      const name = homeAction?.label || (action?.kind === 'wash' ? 'LAVAR' : action?.kind === 'hang' ? 'TENDER' : 'RECOGER');
      if (touch.dataset.label !== name) {
        touch.dataset.label = name;
        touch.innerHTML = `<span class="collect-icon" aria-hidden="true">▧</span>${name}`;
        touch.setAttribute('aria-label', name);
      }
    }
  }

  /** Elige la ayuda según el menú, la prenda cercana o el estado del clima. */
  function contextualHint(gameState, homeAction, action) {
    if (gameState.mode === 'menu') {
      return '● Un cielo tranquilo… por ahora.';
    }
    if (homeAction && homeAction.kind !== 'wash') return `Acción: ${homeAction.label.toLowerCase()}${homeAction.furniture ? ' · ' + homeAction.furniture.name : ''}`;
    if (gameState.scene === 'house' && homeAction?.kind !== 'wash') return 'Casa: acercate a muebles o familiares para interactuar. Pausa: casa y muebles.';
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
    const step = Game.guide.next(gameState);
    if (step) return `Guía: ${step.title.toLowerCase()} · Pausa → Guía y progreso`;
    return gameState.laundry ? '↖ Casa: cargar y guardar · Lavadero a la derecha · Pausa: pedidos' : '↖ Casa: guardá la ropa. Podés recorrer las tres sogas.';
  }
  Game.hud = {
    showPanel: showPanel,
    toast: toast,
    updateToast: updateToast,
    update: updateHUD
  };
})();

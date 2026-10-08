"use strict";

/** Orquesta una actualización de la simulación y el bucle de animación. */
(() => {
  'use strict';

  const Game = window.RainGame;
  /** Indica si el nivel puede terminar sin interrumpir una animación pendiente. */
  function shouldFinish() {
    if (Game.state.current.depositAnim || Game.state.current.flights.length) {
      return false;
    }
    const canStillGetWet = Game.state.current.items.some(item => item.status !== 'saved' && item.wetness < 100);
    return Game.state.current.stormAnnounced && !canStillGetWet || Game.state.current.items.every(item => item.status === 'saved');
  }

  /** Ejecuta las mecánicas durante deltaSeconds segundos; ignora la simulación en pausa. */
  function update(deltaSeconds) {
    if (Game.state.current.mode === 'playing' || Game.state.current.mode === 'menu') {
      Game.runtime.clock += deltaSeconds;
    }
    Game.hud.updateToast(deltaSeconds);
    if (Game.state.current.mode !== 'playing') {
      return;
    }
    Game.state.current.elapsed += deltaSeconds;
    Game.effects.updateAnimations(deltaSeconds);
    const dx = Number(Game.controls.keys.has('right')) - Number(Game.controls.keys.has('left')) || Game.controls.joystick.x;
    const dy = Number(Game.controls.keys.has('down')) - Number(Game.controls.keys.has('up')) || Game.controls.joystick.y;
    Game.player.move(dx, dy, deltaSeconds);
    Game.collection.update(deltaSeconds);
    Game.weather.update(deltaSeconds);
    Game.effects.updateParticles(deltaSeconds);
    if (Game.engine.shouldFinish()) {
      Game.screens.finish();
    }
    Game.hud.update();
  }

  /** Calcula el tiempo entre fotogramas, actualiza, dibuja y solicita el siguiente. */
  function frame(time) {
    const deltaSeconds = Math.min((time - Game.runtime.lastTime) / 1000 || 0, .05);
    Game.runtime.lastTime = time;
    Game.engine.update(deltaSeconds);
    Game.renderer.render();
    requestAnimationFrame(Game.engine.frame);
  }
  Game.engine = {
    shouldFinish: shouldFinish,
    update: update,
    frame: frame
  };
})();

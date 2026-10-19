"use strict";

/** Orquesta una actualización de la simulación y el bucle de animación. */
(() => {
  'use strict';

  const Game = window.RainGame;
  let lastTime = null;
  let accumulator = 0;
  /** Descarta exclusivamente tiempo de menús/pausas, nunca tiempo jugado. */
  function resetTime() { lastTime = null; accumulator = 0; }
  /** Indica si el nivel puede terminar sin interrumpir una animación pendiente. */
  function shouldFinish() {
    if (Game.state.current.depositAnim || Game.state.current.flights.length) {
      return false;
    }
    const canStillGetWet = Game.state.current.items.some(item => item.status !== 'saved' && item.wetness < 100);
    return Game.state.current.stormAnnounced && !canStillGetWet || Game.state.current.items.every(item => item.status === 'saved');
  }

  /** Ejecuta las mecánicas durante deltaSeconds segundos; ignora la simulación en pausa. */
  function update(deltaSeconds, updateHud = true) {
    if (!Number.isFinite(deltaSeconds) || deltaSeconds < 0) return;
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
    if (!Game.state.current.family?.mate) {
      Game.player.move(dx, dy, deltaSeconds);
      Game.collection.update(deltaSeconds);
    } else Game.state.current.player.walking = false;
    Game.weather.update(deltaSeconds);
    Game.laundry.update(deltaSeconds);
    Game.automation.update(deltaSeconds);
    Game.family.update(deltaSeconds);
    Game.guide.tick(deltaSeconds);
    Game.effects.updateParticles(deltaSeconds);
    if (Game.state.current.campaign) {
      if (Game.state.current.elapsed >= Game.state.current.daySeconds && !Game.state.current.dayEnded) {
        Game.state.current.elapsed = Game.state.current.daySeconds;
        Game.calendar.endDay();
      }
      Game.saves?.tick(deltaSeconds);
    } else if (Game.engine.shouldFinish()) {
      Game.screens.finish();
    }
    if (updateHud) Game.hud.update();
  }

  /** Calcula el tiempo entre fotogramas, actualiza, dibuja y solicita el siguiente. */
  function frame(time) {
    const deltaSeconds = lastTime === null ? 0 : Math.max(0, (time - lastTime) / 1000);
    lastTime = time;
    accumulator += deltaSeconds;
    const step = Game.calendar.defaults.stepSeconds;
    // Preserva el remanente. Un frame lento se integra con los mismos pasos que uno rápido.
    while (accumulator + 1e-9 >= step) {
      accumulator = Math.max(0, accumulator - step);
      Game.engine.update(step, false);
      if (lastTime === null) break;
    }
    if (Game.state.current.mode === 'playing') Game.hud.update();
    Game.renderer.render();
    requestAnimationFrame(Game.engine.frame);
  }
  Game.engine = {
    resetTime,
    shouldFinish: shouldFinish,
    update: update,
    frame: frame
  };
})();

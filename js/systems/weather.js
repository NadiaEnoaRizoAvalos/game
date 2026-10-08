"use strict";

/** Lluvia gradual en todo el mapa, humedad, tormenta y truenos. */
(() => {
  'use strict';

  const Game = window.RainGame;
  /** Avanza lluvia y humedad usando dt en segundos; solo la ropa guardada queda protegida. */
  function updateWeather(deltaSeconds) {
    const gameState = Game.state.current;
    if (gameState.elapsed >= gameState.level.delay) {
      const rainTime = gameState.elapsed - gameState.level.delay;
      if (!gameState.rainStarted) {
        gameState.rainStarted = true;
        Game.audio.play('rain');
        Game.hud.toast('Empiezan las primeras gotas en todo el patio.');
      }
      const transition = Game.utils.clamp(rainTime / gameState.level.stormAfter, 0, 1);
      // Smoothstep suaviza el paso de las primeras gotas a la tormenta.
      gameState.rainIntensity = 0.08 + 0.92 * transition * transition * (3 - 2 * transition);
      Game.audio.weather(gameState.rainIntensity);
      for (const garment of gameState.items) {
        if (garment.status === 'hanging' || garment.status === 'basket') {
          garment.wetness = Game.utils.clamp(garment.wetness + deltaSeconds * gameState.level.wetRate * (0.12 + 1.35 * gameState.rainIntensity) / garment.resistance, 0, 100);
        }
      }
      if (transition >= 1 && !gameState.stormAnnounced) {
        gameState.stormAnnounced = true;
        gameState.flash = 0.32;
        Game.audio.play('thunder');
        Game.hud.toast('¡Se largó la tormenta! Guardá lo que puedas.');
      }
    }
    if (gameState.elapsed > gameState.thunderAt) {
      if (gameState.rainIntensity > 0.55) {
        Game.audio.play('thunder');
        gameState.flash = 0.15 + gameState.rainIntensity * 0.2;
        Game.audio.play('lightning');
      }
      gameState.thunderAt = gameState.elapsed + (gameState.rainIntensity > 0.9 ? 5 : 9) + Math.random() * 4;
    }
  }
  Game.weather = {
    update: updateWeather
  };
})();

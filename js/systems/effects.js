"use strict";

/** Actualiza tiempos de animaciones y partículas; no dibuja. */
(() => {
  'use strict';

  const Game = window.RainGame;
  /** Crea partículas de feedback en una posición del mapa. */
  function burst(x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
      Game.state.current.particles.push({
        x,
        y,
        vx: (Math.random() - .5) * 95,
        vy: -Math.random() * 90 - 20,
        life: 1,
        color
      });
    }
  }

  /** Avanza los relojes del relámpago y de las animaciones de recogida y descarga. */
  function updateAnimations(deltaSeconds) {
    const gameState = Game.state.current;
    gameState.flash = Math.max(0, gameState.flash - deltaSeconds * 2.5);
    gameState.collectPulse = Math.max(0, gameState.collectPulse - deltaSeconds);
    for (const flight of gameState.flights) {
      flight.time += deltaSeconds;
    }
    gameState.flights = gameState.flights.filter(flight => flight.time < flight.duration);
    if (gameState.depositAnim) {
      gameState.depositAnim.time += deltaSeconds;
      if (gameState.depositAnim.time >= gameState.depositAnim.duration) {
        gameState.depositAnim = null;
      }
    }
  }

  /** Integra posición, gravedad y vida; elimina partículas terminadas. */
  function updateParticles(deltaSeconds) {
    for (const particle of Game.state.current.particles) {
      particle.x += particle.vx * deltaSeconds;
      particle.y += particle.vy * deltaSeconds;
      particle.vy += 140 * deltaSeconds;
      particle.life -= deltaSeconds;
    }
    Game.state.current.particles = Game.state.current.particles.filter(particle => particle.life > 0);
  }
  Game.effects = {
    burst: burst,
    updateAnimations: updateAnimations,
    updateParticles: updateParticles
  };
})();

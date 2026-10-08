"use strict";

/** Construye una partida nueva sin modificar los datos de configuración. */
(() => {
  'use strict';

  const Game = window.RainGame;
  /** Distribuye una prenda por índice entre las tres sogas; devuelve su posición lógica. */
  function garmentPosition(i, count) {
    const ropeId = i % Game.config.ropes.length;
    const r = Game.config.ropes[ropeId];
    const slot = Math.floor(i / Game.config.ropes.length);
    const n = Math.ceil((count - ropeId) / Game.config.ropes.length);
    return {
      x: r.x1 + 48 + slot * (r.x2 - r.x1 - 96) / Math.max(1, n - 1),
      y: r.y,
      ropeId
    };
  }

  /** Crea todo el estado de un nivel. El total recibido corresponde a niveles anteriores. */
  function makeLevel(index, total = 0) {
    const level = Game.config.levels[index];
    return {
      mode: 'menu',
      index,
      total,
      elapsed: 0,
      points: 0,
      level,
      player: {
        x: 174,
        y: 270,
        walking: false,
        facingX: 0,
        facingY: 1
      },
      basket: [],
      items: level.types.map((type, i) => i >= level.types.length - level.specialCount ? 'leather' : type === 'leather' ? 'jacket' : type).map((type, i) => ({
        type,
        ...Game.config.garments[type],
        ...Game.state.garmentPosition(i, level.types.length),
        wetness: 0,
        status: 'hanging'
      })),
      progress: 0,
      target: null,
      rainIntensity: 0,
      rainStarted: false,
      stormAnnounced: false,
      flights: [],
      depositAnim: null,
      collectPulse: 0,
      flash: 0,
      thunderAt: level.delay - 4,
      particles: [],
      saved: 0
    };
  }
  Game.state = {
    current: null,
    garmentPosition: garmentPosition,
    createLevel: makeLevel
  };
})();

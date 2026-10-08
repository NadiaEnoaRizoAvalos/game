"use strict";

/** Funciones matemáticas puras, sin estado ni acceso a la pantalla. */
(() => {
  'use strict';

  const Game = window.RainGame;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  Game.utils = {
    clamp: clamp
  };
})();

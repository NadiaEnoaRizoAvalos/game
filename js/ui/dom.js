/** Referencias HTML y Canvas. Se cachean los elementos para no buscarlos en cada fotograma. */
(() => {
  'use strict';
  const Game = window.RainGame;
  const elements = new Map();
  /** Busca un elemento por ID una sola vez y reutiliza la referencia. */
  function byId(id) {
    if (!elements.has(id)) elements.set(id, document.getElementById(id));
    return elements.get(id);
  }
  const canvas = byId('game');
  Game.dom = { byId, canvas, context: canvas.getContext('2d') };
})();

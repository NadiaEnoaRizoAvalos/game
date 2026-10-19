/** Entrada de la aplicación. index.html carga antes todos los módulos con defer. */
(() => {
  'use strict';
  const Game = window.RainGame;
  /** Prepara la vista, conecta eventos y arranca un único bucle de animación. */
  function start() {
    Game.audio.loadPreferences(); Game.screens.soundLabels();
    Game.camera.configureViewport();
    Game.screens.menu();
    Game.controls.init();
    Game.camera.init();
    Game.screens.init();
    Game.buildMenu.init();
    Game.integration.init();
    Game.saveMenu.init();
    Game.saves.init();
    requestAnimationFrame(Game.engine.frame);
  }
  start();
})();

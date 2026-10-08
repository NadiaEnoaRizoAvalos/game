"use strict";

/** Cámara móvil y resolución del Canvas al girar o redimensionar. */
(() => {
  'use strict';

  const Game = window.RainGame;
  const context = Game.dom.context;
  const viewport = {
    mobile: false,
    width: 1000,
    height: 640,
    dpr: 1
  };
  let viewportResizePending = false;

  /** Calcula escala y posición de una cámara que cubre la pantalla y sigue al personaje. */
  function cameraFor(width, height, player) {
    const scale = Math.max(width / 1000, height / 640, width > height ? height / 420 : Math.min(width, height) / 540);
    const visibleW = width / scale;
    const visibleH = height / scale;
    return {
      scale,
      x: Game.utils.clamp(player.x - visibleW * .5, 0, 1000 - visibleW),
      y: Game.utils.clamp(player.y - visibleH * .48, 0, 640 - visibleH),
      visibleW,
      visibleH
    };
  }

  /** Sincroniza el tamaño real y la resolución del Canvas, incluyendo pantallas de alta densidad. */
  function configureViewport() {
    Game.camera.viewport.mobile = !!window.matchMedia?.('(any-pointer:coarse), (max-width:700px)').matches;
    let width = 1000;
    let height = 640;
    let dpr = 1;
    if (Game.camera.viewport.mobile) {
      const box = Game.dom.canvas.getBoundingClientRect();
      width = Math.max(1, box.width);
      height = Math.max(1, box.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
    }
    Game.camera.viewport.width = width;
    Game.camera.viewport.height = height;
    Game.camera.viewport.dpr = dpr;
    // Reinicia el buffer de dibujo solamente si las dimensiones cambiaron.
    const rasterW = Math.round(width * dpr);
    const rasterH = Math.round(height * dpr);
    if (Game.dom.canvas.width !== rasterW || Game.dom.canvas.height !== rasterH) {
      Game.dom.canvas.width = rasterW;
      Game.dom.canvas.height = rasterH;
    }
    context.imageSmoothingEnabled = false;
  }

  /** Agrupa eventos de tamaño en un solo ajuste por fotograma. */
  function scheduleViewportResize() {
    if (Game.camera.viewportResizePending) {
      return;
    }
    Game.camera.viewportResizePending = true;
    requestAnimationFrame(() => {
      Game.camera.viewportResizePending = false;
      Game.camera.configureViewport();
    });
  }
  /** Conecta los eventos de este módulo; se llama una sola vez desde main.js. */
  function init() {
    window.addEventListener('resize', Game.camera.scheduleViewportResize);
    window.visualViewport?.addEventListener('resize', Game.camera.scheduleViewportResize);
    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(Game.camera.scheduleViewportResize).observe(Game.dom.canvas);
    }
    window.addEventListener('orientationchange', () => {
      Game.controls.clearInputs();
      Game.camera.scheduleViewportResize();
      if (Game.state.current.mode === 'playing') {
        Game.screens.pause();
      }
    });
  }
  Game.camera = {
    viewport: viewport,
    viewportResizePending: viewportResizePending,
    cameraFor: cameraFor,
    configureViewport: configureViewport,
    scheduleViewportResize: scheduleViewportResize,
    init
  };
})();

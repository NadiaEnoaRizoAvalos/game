"use strict";

/** Compone las capas del mapa, aplica la cámara y dibuja el clima. */
(() => {
  'use strict';

  const Game = window.RainGame;
  const context = Game.dom.context;
  const {
    rect,
    label,
    cloud
  } = Game.drawing;
  /** Compone un fotograma por profundidad, aplica cámara y efectos climáticos. */
  function render() {
    const gameState = Game.state.current;
    const w = Game.config.settings.width;
    const h = Game.config.settings.height;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, Game.dom.canvas.width, Game.dom.canvas.height);
    context.save();
    const camera = Game.camera.viewport.mobile ? Game.camera.cameraFor(Game.camera.viewport.width, Game.camera.viewport.height, gameState.player) : {
      scale: 1,
      x: 0,
      y: 0
    };
    context.setTransform(Game.camera.viewport.dpr * camera.scale, 0, 0, Game.camera.viewport.dpr * camera.scale, -camera.x * Game.camera.viewport.dpr * camera.scale, -camera.y * Game.camera.viewport.dpr * camera.scale);
    rect(0, 0, w, h, '#b2c88c');
    // Grass texture and wide paths keep all three clotheslines connected.
    for (let i = 0; i < 470; i++) {
      const x = (i * 137 + 19) % 1000;
      const y = (i * 83 + 7) % 640;
      rect(x, y, 3, 3, i % 3 ? '#9fb97b' : '#c5d697');
      if (i % 5 === 0) {
        rect(x + 4, y - 2, 2, 5, '#94af72');
      }
    }
    rect(145, 210, 60, 148, '#d4c79c');
    rect(145, 300, 695, 60, '#d4c79c');
    rect(805, 192, 54, 362, '#d4c79c');
    rect(230, 450, 600, 54, '#d4c79c');
    rect(230, 330, 53, 170, '#d4c79c');
    for (let i = 0; i < 75; i++) {
      const x = 157 + i * 97 % 682;
      const y = 310 + i * 31 % 40;
      rect(x, y, 5, 2, '#c0b68c');
    }
    for (let i = 0; i < 5; i++) {
      rect(157, 238 + i * 22, 35, 12, '#e5d6ad');
      rect(161, 250 + i * 22, 29, 2, '#baaf86');
    }
    // Low boundary fences and flower patches establish the overhead map.
    for (let x = 25; x < 1000; x += 24) {
      rect(x, 24, 6, 23, '#b9a477');
      rect(x, 615, 6, 18, '#b9a477');
    }
    rect(24, 29, 950, 5, '#d1bb89');
    rect(24, 620, 950, 4, '#d1bb89');
    for (let y = 34; y < 620; y += 24) {
      rect(24, y, 6, 14, '#b9a477');
      rect(970, y, 6, 14, '#b9a477');
    }
    for (let i = 0; i < 34; i++) {
      const x = 310 + i * 37 % 600;
      const y = 68 + i * 17 % 44;
      rect(x, y, 3, 6, '#789654');
      rect(x - 2, y - 2, 7, 4, i % 3 ? '#f0d494' : '#e7b3a0');
      rect(x, y - 2, 2, 2, '#bb995b');
    }
    rect(70, 401, 140, 113, '#987951');
    rect(76, 407, 128, 101, '#b08e5e');
    for (let row = 0; row < 3; row++) {
      rect(82, 418 + row * 30, 113, 4, '#8c704c');
      for (let col = 0; col < 5; col++) {
        const x = 91 + col * 22;
        const y = 419 + row * 30;
        rect(x - 6, y - 6, 13, 10, '#7e9a5a');
        rect(x - 3, y - 10, 6, 14, '#a0b66c');
        rect(x - 1, y + 3, 4, 3, '#d8a565');
      }
    }
    // Ground markers make the collection radius readable from either side.
    const target = gameState.mode === 'playing' ? Game.collection.nearest() : null;
    if (target) {
      context.strokeStyle = '#f7e9b8';
      context.lineWidth = 3;
      context.setLineDash([5, 4]);
      context.beginPath();
      context.ellipse(target.x, target.y, 27, 14, 0, 0, Math.PI * 2);
      context.stroke();
      context.setLineDash([]);
    }
    const layers = [{
      y: 210,
      draw: Game.world.drawHouse
    }, ...Game.config.ropes.map((r, i) => ({
      y: r.y,
      draw: () => Game.world.drawRope(r, i)
    })), {
      y: gameState.player.y,
      draw: Game.sprites.drawPlayer
    }, ...[{
      x: 45,
      y: 105,
      z: 1
    }, {
      x: 933,
      y: 88,
      z: 1.1
    }, {
      x: 936,
      y: 372,
      z: .85
    }, {
      x: 60,
      y: 586,
      z: 1.1
    }, {
      x: 318,
      y: 593,
      z: .8
    }].map(t => ({
      y: t.y,
      draw: () => Game.world.tree(t.x, t.y, t.z)
    }))];
    layers.sort((a, b) => a.y - b.y).forEach(l => l.draw());
    if (target) {
      const x = target.x;
      const y = target.y + 27;
      rect(x - 30, y, 60, 6, '#697956');
      rect(x - 29, y + 1, 58 * Math.min(1, gameState.progress / target.time), 4, '#f2d48b');
      label(gameState.progress > 0 ? 'RECOGIENDO' : 'ESPACIO', x, y + 20, 9, '#3c513e');
    }
    Game.sprites.drawActionAnimations();
    for (const p of gameState.particles) {
      context.globalAlpha = p.life;
      rect(p.x, p.y, 4, 4, p.color);
    }
    context.globalAlpha = 1;
    // Clouds are moving shadows seen on the ground, rather than a side-view sky.
    const dark = Game.utils.clamp(gameState.elapsed / (gameState.level.delay + 14), 0, 1);
    context.fillStyle = `rgba(45,66,84,${dark * .32})`;
    context.fillRect(0, 0, w, h);
    context.globalAlpha = .035 + dark * .06;
    for (let i = 0; i < 4; i++) {
      cloud((i * 330 + Game.runtime.clock * (7 + gameState.level.wind)) % 1450 - 250, 90 + i % 3 * 175, 2.4, '#435e68');
    }
    context.globalAlpha = 1;
    Game.renderer.drawRain();
    if (gameState.flash > 0) {
      context.fillStyle = `rgba(255,255,228,${gameState.flash})`;
      context.fillRect(0, 0, w, h);
    }
    context.restore();
    if (Game.camera.viewport.mobile) {
      Game.renderer.drawHomeDirection(camera);
    }
  }

  /** Muestra una indicación cuando la puerta queda fuera de la cámara móvil. */
  function drawHomeDirection(camera) {
    const d = Game.config.settings.door;
    if (d.x >= camera.x + 25 && d.x <= camera.x + camera.visibleW - 25 && d.y >= camera.y + 45 && d.y <= camera.y + camera.visibleH - 25) {
      return;
    }
    const x = Game.utils.clamp((d.x - camera.x) * camera.scale, 48, Game.camera.viewport.width - 48);
    const y = Game.utils.clamp((d.y - camera.y) * camera.scale, 88, Game.camera.viewport.height - 140);
    context.save();
    context.scale(Game.camera.viewport.dpr, Game.camera.viewport.dpr);
    rect(x - 35, y - 14, 70, 25, '#324931a6');
    label((d.x < camera.x ? '← ' : d.x > camera.x + camera.visibleW ? '→ ' : '↑ ') + 'CASA', x, y + 2, 11, '#fff0c8');
    context.restore();
  }

  /** Dibuja gotas, impactos y charcos a partir de la intensidad actual. */
  function drawRain() {
    const gameState = Game.state.current;
    if (!gameState.rainStarted) {
      return;
    }
    const intensity = gameState.rainIntensity;
    const count = Math.floor(18 + intensity * 340);
    const speed = 240 + intensity * 390;
    context.strokeStyle = `rgba(204,221,224,${.3 + intensity * .27})`;
    context.lineWidth = intensity > .7 ? 1.4 : 1;
    context.beginPath();
    for (let i = 0; i < count; i++) {
      const seedX = Math.sin(i * 127.1 + 8) * 43758.5453;
      const seedY = Math.sin(i * 311.7 + 3) * 19642.349;
      const x = ((seedX - Math.floor(seedX)) * 1040 + Game.runtime.clock * (10 + intensity * 42)) % 1040 - 20;
      const y = ((seedY - Math.floor(seedY)) * 680 + Game.runtime.clock * speed) % 680 - 20;
      context.moveTo(x, y);
      context.lineTo(x - intensity * 6, y + 5 + intensity * 16);
    }
    context.stroke();
    // Ground impacts and puddles become visible as the storm settles in.
    for (let i = 0; i < Math.floor(8 + intensity * 38); i++) {
      const x = 38 + i * 173 % 920;
      const y = 60 + i * 113 % 540;
      const phase = (Game.runtime.clock * 2 + i * .137) % 1;
      if (y < 212 && x < 290) {
        continue;
      }
      context.strokeStyle = `rgba(205,221,215,${(1 - phase) * intensity * .6})`;
      context.lineWidth = 1;
      context.beginPath();
      context.ellipse(x, y, 1 + phase * 5, 1 + phase * 2, 0, 0, Math.PI * 2);
      context.stroke();
    }
    if (intensity > .6) {
      context.globalAlpha = (intensity - .6) * .7;
      for (let i = 0; i < 9; i++) {
        const x = 315 + i * 59;
        const y = 318 + i % 3 * 74;
        rect(x, y, 23 + i % 3 * 9, 4, '#9fb4b2');
        rect(x + 5, y - 2, 14, 7, '#a9bfc0');
      }
      context.globalAlpha = 1;
    }
  }
  Game.renderer = {
    render: render,
    drawHomeDirection: drawHomeDirection,
    drawRain: drawRain
  };
})();

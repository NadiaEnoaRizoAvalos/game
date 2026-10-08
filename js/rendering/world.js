"use strict";

/** Elementos del patio: árboles, casa y sogas. */
(() => {
  'use strict';

  const Game = window.RainGame;
  const context = Game.dom.context;
  const {
    rect,
    line,
    poly,
    label,
    shrub
  } = Game.drawing;
  /** Dibuja un árbol con sombra y tamaño ajustable. */
  function tree(x, y, size = 1) {
    context.save();
    context.translate(x, y);
    context.scale(size, size);
    context.fillStyle = '#52734835';
    context.beginPath();
    context.ellipse(9, 6, 37, 16, 0, 0, Math.PI * 2);
    context.fill();
    rect(-7, -32, 15, 38, '#92714c');
    rect(-2, -23, 5, 24, '#b18b5a');
    shrub(0, -29, 1.35);
    shrub(-13, -46, .9);
    shrub(13, -55, .8);
    rect(-18, -62, 9, 5, '#aac27c');
    rect(15, -44, 7, 5, '#a7bc74');
    context.restore();
  }

  /** Dibuja casa, techo y puerta; abre la puerta durante una descarga. */
  function drawHouse() {
    rect(64, 71, 223, 149, '#53694325');
    rect(69, 79, 206, 123, '#e7c797');
    rect(68, 163, 210, 40, '#dfbb86');
    rect(78, 188, 190, 14, '#cbaa78');
    rect(149, 159, 51, 49, '#876e4b');
    rect(156, 166, 37, 40, '#667750');
    rect(181, 184, 4, 4, '#e6c982');
    if (Game.state.current.depositAnim) {
      const a = Math.sin(Math.PI * Game.state.current.depositAnim.time / Game.state.current.depositAnim.duration);
      rect(156, 166, 37, 40, '#514e39');
      rect(160, 170, 28, 35, '#f0cd87');
      rect(156, 166, Math.max(5, 32 * (1 - a)), 40, '#667750');
      context.globalAlpha = a * .3;
      poly([[156, 205], [193, 205], [214, 247], [139, 247]], '#ffe5a3');
      context.globalAlpha = 1;
    }
    rect(140, 207, 71, 11, '#d2c09a');
    rect(134, 218, 84, 9, '#e0d0aa');
    poly([[52, 90], [83, 40], [259, 40], [288, 90], [288, 155], [52, 155]], '#b28058');
    rect(52, 94, 236, 61, '#c89a65');
    rect(57, 94, 226, 5, '#dfb578');
    for (let y = 51; y < 150; y += 13) {
      const left = y < 90 ? 80 - (y - 45) * .57 : 58;
      const right = y < 90 ? 261 + (y - 45) * .57 : 280;
      line(left, y, right, y, '#deaf73', 3);
      for (let x = left + 15; x < right; x += 31) {
        rect(x + y % 2 * 10, y + 3, 3, 7, '#ae8055');
      }
    }
    rect(48, 151, 245, 7, '#947047');
    rect(226, 40, 22, 40, '#b19374');
    rect(222, 36, 30, 8, '#d0b190');
    rect(227, 39, 19, 3, '#806b56');
    rect(92, 168, 30, 22, '#7b9a8b');
    rect(105, 168, 4, 22, '#f5dfaf');
    rect(90, 189, 34, 5, '#b08c62');
    rect(219, 170, 31, 21, '#7b9a8b');
    rect(232, 170, 4, 21, '#f5dfaf');
    rect(146, 238, 58, 17, '#f5e5b7');
    label('↑ CASA', 175, 250, 10, '#68764c');
  }

  /** Dibuja postes, soga y prendas de una fila. */
  function drawRope(rope, index) {
    for (const x of [rope.x1, rope.x2]) {
      rect(x + 2, rope.y + 3, 18, 5, '#59754a25');
      rect(x - 3, rope.y - 57, 7, 60, '#9a8055');
      rect(x - 6, rope.y - 58, 13, 5, '#bc9c65');
    }
    context.strokeStyle = '#726c46';
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(rope.x1, rope.y - 53);
    context.quadraticCurveTo((rope.x1 + rope.x2) / 2, rope.y - 45, rope.x2, rope.y - 53);
    context.stroke();
    for (const p of Game.state.current.items) {
      if (p.status === 'hanging' && p.ropeId === index) {
        Game.sprites.drawGarment(p);
      }
    }
  }
  Game.world = {
    tree: tree,
    drawHouse: drawHouse,
    drawRope: drawRope
  };
})();

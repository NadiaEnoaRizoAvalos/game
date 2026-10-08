"use strict";

/** Primitivas de Canvas y transformaciones de color compartidas. */
(() => {
  'use strict';

  const Game = window.RainGame;
  const context = Game.dom.context;
  /** Dibuja un rectángulo con posición redondeada para el estilo pixelado. */
  function rect(x, y, w, h, c) {
    context.fillStyle = c;
    context.fillRect(Math.round(x), Math.round(y), w, h);
  }

  /** Dibuja un segmento con color y grosor configurables. */
  function line(x1, y1, x2, y2, c, width = 2) {
    context.strokeStyle = c;
    context.lineWidth = width;
    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
  }

  /** Rellena un polígono definido por pares [x, y]. */
  function poly(points, c) {
    context.fillStyle = c;
    context.beginPath();
    points.forEach(([x, y], i) => i ? context.lineTo(x, y) : context.moveTo(x, y));
    context.closePath();
    context.fill();
  }

  /** Dibuja texto dentro del Canvas con tamaño, color y alineación. */
  function label(text, x, y, size = 11, color = '#4d6347', align = 'center') {
    context.fillStyle = color;
    context.font = `${size}px monospace`;
    context.textAlign = align;
    context.fillText(text, x, y);
  }

  /** Dibuja una nube pixelada; se usa también como sombra sobre el suelo. */
  function cloud(x, y, scale, color) {
    context.save();
    context.translate(x, y);
    context.scale(scale, scale);
    Game.drawing.rect(0, 16, 96, 21, color);
    Game.drawing.rect(14, 4, 59, 32, color);
    Game.drawing.rect(30, 0, 28, 10, color);
    Game.drawing.rect(-12, 24, 119, 10, color);
    context.restore();
  }

  /** Dibuja un arbusto reutilizable con escala opcional. */
  function shrub(x, y, scale = 1) {
    context.save();
    context.translate(x, y);
    context.scale(scale, scale);
    Game.drawing.rect(-30, -15, 63, 26, '#6c8855');
    Game.drawing.rect(-21, -27, 43, 34, '#78965e');
    Game.drawing.rect(-11, -36, 21, 23, '#859f65');
    Game.drawing.rect(-27, -10, 10, 11, '#91a96b');
    Game.drawing.rect(15, -20, 13, 13, '#66804e');
    context.restore();
  }

  /** Desatura y oscurece un color hexadecimal según la humedad de 0 a 100. */
  function wetColor(hex, wetness) {
    const w = Game.utils.clamp(wetness / 100, 0, 1);
    const rgb = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
    const gray = rgb[0] * .3 + rgb[1] * .59 + rgb[2] * .11;
    return '#' + rgb.map(v => Math.round((v * (1 - w * .6) + gray * w * .6) * (1 - w * .28)).toString(16).padStart(2, '0')).join('');
  }
  Game.drawing = {
    rect: rect,
    line: line,
    poly: poly,
    label: label,
    cloud: cloud,
    shrub: shrub,
    wetColor: wetColor
  };
})();

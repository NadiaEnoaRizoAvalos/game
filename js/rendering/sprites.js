"use strict";

/** Dibuja prendas, personaje, canasto y animaciones de recogida/descarga. */
(() => {
  'use strict';

  const Game = window.RainGame;
  const context = Game.dom.context;
  const {
    rect,
    line,
    poly,
    label,
    wetColor
  } = Game.drawing;
  /** Dibuja una prenda y sus broches; pose permite animarla fuera de la soga. */
  function drawGarment(garment, pose = null) {
    const picking = !pose && Game.state.current.target === garment && Game.state.current.progress > 0;
    const q = picking ? Game.utils.clamp(Game.state.current.progress / garment.time, 0, 1) : 0;
    const sway = Math.sin(Game.runtime.clock * 2 + garment.x) * Game.state.current.level.wind * (1 + Game.state.current.rainIntensity * .6);
    const x = pose ? pose.x : garment.x + sway;
    const y = pose ? pose.y : garment.y - 52 + Math.sin(q * Math.PI) * 4;
    context.save();
    context.translate(x, y);
    const scale = pose ? pose.scale : .72;
    context.scale(scale, scale);
    context.rotate(pose ? pose.angle : Math.sin(Game.runtime.clock * 2 + garment.x) * Game.state.current.level.wind * .009 + (picking ? Math.sin(q * Math.PI * 6) * .06 : 0));
    const c = wetColor(garment.color, garment.wetness);
    const clothRect = (x, y, w, h, color) => rect(x, y, w, h, wetColor(color, garment.wetness));
    const clothLine = (x, y, x2, y2, color, width) => line(x, y, x2, y2, wetColor(color, garment.wetness), width);
    context.shadowColor = '#49643c15';
    context.shadowOffsetY = 4;
    switch (garment.type) {
      case 'sock':
        poly([[-10, 2], [4, 2], [4, 24], [15, 24], [15, 35], [-10, 35]], c);
        clothRect(-10, 4, 14, 4, '#faf1d0');
        break;
      case 'pants':
        poly([[-20, 2], [20, 2], [24, 61], [4, 61], [0, 25], [-4, 61], [-24, 61]], c);
        clothLine(-18, 10, 18, 10, '#526c7c');
        break;
      case 'sheet':
        clothRect(-29, 2, 58, 73, c);
        clothRect(-23, 5, 3, 67, '#dcd9ba');
        clothRect(17, 5, 3, 65, '#dcd9ba');
        clothLine(-27, 67, 27, 67, '#cacba9', 2);
        break;
      default:
        poly([[-13, 2], [-26, 9], [-35, 28], [-21, 33], [-16, 24], [-16, 53], [17, 53], [17, 24], [23, 33], [35, 27], [27, 8], [12, 2], [7, 9], [-7, 9]], c);
        if (garment.type === 'leather' || garment.type === 'jacket' || garment.type === 'blouse') {
          clothLine(0, 10, 0, 52, '#586444', 2);
          clothRect(-11, 25, 7, 2, '#e0c193');
          clothRect(6, 25, 7, 2, '#e0c193');
        } else {
          clothRect(-8, 19, 16, 3, '#f0d7b2');
        }
    }
    context.shadowOffsetY = 0;
    if (!pose) {
      if (q < .45) {
        rect(-14, -4, 4, 10, '#b28656');
      }
      if (garment.type !== 'sock' && q < .85) {
        rect(11, -4, 4, 10, '#b28656');
      }
      if (garment.special) {
        rect(-20, -29, 40, 17, '#f2d89c');
        label('★ ×2', 0, -17, 10, '#855c35');
      }
      if (garment.wetness >= 30) {
        const bottom = garment.type === 'sheet' ? 76 : garment.type === 'pants' ? 64 : garment.type === 'sock' ? 38 : 56;
        for (let i = 0; i < (garment.wetness >= 70 ? 3 : 1); i++) {
          const d = (Game.runtime.clock * 22 + i * 11) % 20;
          rect(-9 + i * 9, bottom + d, 2, 4, '#7f9ca9');
        }
      }
    }
    context.restore();
  }

  /** Dibuja a la señora según dirección, caminata, recogida y descarga. */
  function drawPlayer() {
    const player = Game.state.current.player;
    const x = Math.round(player.x);
    const y = Math.round(player.y);
    const step = player.walking ? Math.sin(Game.runtime.clock * 17) * 4 : 0;
    const reach = Game.state.current.progress > 0 || Game.state.current.collectPulse > 0;
    const reachWave = reach ? Math.sin(Game.runtime.clock * 15) * 5 : 0;
    const storing = Game.state.current.depositAnim && Math.hypot(player.x - Game.state.current.depositAnim.x, player.y - Game.state.current.depositAnim.y) < 12;
    const bend = storing ? Math.sin(Game.state.current.depositAnim.time / Game.state.current.depositAnim.duration * Math.PI) * 6 : 0;
    context.save();
    context.translate(x, y + bend);
    context.scale(.72, .72);
    context.rotate(storing ? Math.sin(Game.state.current.depositAnim.time / Game.state.current.depositAnim.duration * Math.PI) * .12 : 0);
    if (player.facingX < 0) {
      context.scale(-1, 1);
    }
    context.fillStyle = '#354c3930';
    context.beginPath();
    context.ellipse(0, 3, 22, 7, 0, 0, Math.PI * 2);
    context.fill();
    rect(-12, -12, 8, 16 + step, '#69604b');
    rect(6, -12, 8, 16 - step, '#69604b');
    rect(-15, 0 + step, 11, 6, '#4a503b');
    rect(6, -step, 12, 6, '#4a503b');
    poly([[-13, -52], [13, -52], [22, -13], [-22, -13]], '#9b655b');
    if (player.facingY >= 0) {
      rect(-12, -44, 24, 27, '#e8d7ae');
      rect(-8, -22, 16, 4, '#cfbc93');
    } else {
      rect(-13, -42, 26, 4, '#e8d7ae');
      rect(-2, -42, 4, 24, '#e8d7ae');
    }
    rect(-21, reach ? -65 + reachWave : -46, 8, reach ? 30 : 23, '#dba985');
    rect(14, reach ? -70 - reachWave : storing ? -53 : -44, 8, reach ? 30 : 22, '#dfb38f');
    rect(-11, -76, 24, 26, '#e7bd95');
    rect(-15, -79, 29, 9, '#ddd6c1');
    rect(-17, -73, 7, 14, '#ded9c7');
    rect(10, -74, 8, 12, '#c9c6b5');
    rect(-18, -88, 13, 14, '#d7d2c0');
    rect(-9, -83, 22, 7, '#ebe6d1');
    if (player.facingY < 0) {
      rect(-11, -75, 25, 22, '#d7d2c0');
      rect(-6, -65, 14, 11, '#c3bfae');
    } else if (player.facingX) {
      rect(8, -64, 3, 3, '#4b4b3b');
      rect(13, -61, 5, 5, '#e7bd95');
      rect(9, -55, 4, 2, '#b87769');
    } else {
      rect(-6, -64, 3, 3, '#4b4b3b');
      rect(6, -64, 3, 3, '#4b4b3b');
      rect(0, -55, 5, 2, '#b87769');
      line(-6, -62, 8, -62, '#8b876f', 1);
    }
    Game.sprites.basket(29, storing ? -21 : -13 - Game.state.current.collectPulse * 8, Game.collection.usedSpace() / 6);
    context.restore();
  }

  /** Dibuja el canasto con una proporción de llenado entre 0 y 1. */
  function basket(x, y, fill = 0) {
    context.save();
    context.translate(x, y);
    if (fill > 0) {
      rect(-12, -16, 12, 9, '#b5bd8a');
      rect(0, -18, 10, 12, '#e8c2a0');
      rect(-4, -20, 9, 11, '#d9d9b5');
    }
    context.strokeStyle = '#987044';
    context.lineWidth = 3;
    context.beginPath();
    context.arc(0, -10, 13, Math.PI, 0);
    context.stroke();
    poly([[-18, -11], [18, -11], [14, 10], [-13, 10]], '#b88b52');
    for (let i = -10; i <= 12; i += 6) {
      line(i, -8, i, 8, '#d6b37a', 2);
    }
    line(-15, -3, 16, -3, '#e0bd7f', 2);
    line(-14, 4, 14, 4, '#8f6c41', 2);
    context.restore();
  }

  /** Dibuja los viajes de la ropa al canasto y hacia la puerta. */
  function drawActionAnimations() {
    const gameState = Game.state.current;
    for (const f of gameState.flights) {
      const t = Game.utils.clamp(f.time / f.duration, 0, 1);
      const e = t * t * (3 - 2 * t);
      const toX = gameState.player.x + (gameState.player.facingX < 0 ? -20 : 20);
      const toY = gameState.player.y - 13;
      Game.sprites.drawGarment(f.item, {
        x: f.x + (toX - f.x) * e,
        y: f.y + (toY - f.y) * e - Math.sin(t * Math.PI) * 27,
        scale: .72 * (1 - t * .68),
        angle: t * .4
      });
    }
    const a = gameState.depositAnim;
    if (a) {
      for (let i = 0; i < a.items.length; i++) {
        const t = Game.utils.clamp((a.time - i * .07) / .6, 0, 1);
        if (t >= 1) {
          continue;
        }
        context.globalAlpha = 1 - t * .6;
        Game.sprites.drawGarment(a.items[i], {
          x: a.x + 18 + (174 - a.x - 18) * t,
          y: a.y - 18 + (179 - a.y + 18) * t - Math.sin(t * Math.PI) * 19,
          scale: .4 * (1 - t * .7),
          angle: -t * .25
        });
        context.globalAlpha = 1;
      }
      label('+' + a.points + ' puntos', 174, 157 - a.time * 20, 13, '#fcdf9b');
    }
  }
  Game.sprites = {
    drawGarment: drawGarment,
    drawPlayer: drawPlayer,
    basket: basket,
    drawActionAnimations: drawActionAnimations
  };
})();

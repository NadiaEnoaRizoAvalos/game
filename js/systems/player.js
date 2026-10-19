"use strict";

/** Movimiento en ocho direcciones, límites y colisiones. */
(() => {
  'use strict';

  const Game = window.RainGame;
  /** Indica si la posición de los pies está libre de casa, huerta y postes. */
  function canStand(x, y, includeLaundry = !!Game.state.current?.laundry, state = Game.state.current) {
    if (state?.scene === 'house') return Game.house.canStand(x, y, state);
    if (state?.yard && Game.yard.blocked(x, y, state)) return false;
    if (includeLaundry) {
      const station = Game.config.laundry.station;
      if (x > station.x - 27 && x < station.x + 27 && y > station.y - 40 && y < station.y - 7) return false;
    }
    return !Game.config.obstacles.some(o => x > o.x - 12 && x < o.x + o.w + 12 && y > o.y - 9 && y < o.y + o.h + 9) && !Game.config.ropes.some(r => [r.x1, r.x2].some(px => Math.hypot(x - px, y - r.y) < 17));
  }

  /** Mueve al personaje durante dt segundos y resuelve colisiones por pasos pequeños. */
  function movePlayer(dx, dy, deltaSeconds) {
    const player = Game.state.current.player;
    const norm = Math.max(1, Math.hypot(dx, dy));
    const speed = Game.config.settings.speed * (1 + Game.skills.level('maria', 'speed') * .01) * (Game.state.current.scene !== 'house' && Game.yard.onPath(player.x, player.y) ? 1.15 : 1);
    player.walking = !!(dx || dy);
    if (player.walking) {
      player.facingX = dx;
      player.facingY = dy;
    } // Normalizar evita velocidad extra en diagonal.
    const steps = Math.max(1, Math.ceil(speed * deltaSeconds / 8));
    for (let i = 0; i < steps; i++) {
      const x = Game.utils.clamp(player.x + dx / norm * speed * deltaSeconds / steps, Game.config.settings.minX, Game.config.settings.maxX);
      if (Game.player.canStand(x, player.y)) {
        player.x = x;
      }
      const y = Game.utils.clamp(player.y + dy / norm * speed * deltaSeconds / steps, Game.config.settings.minY, Game.config.settings.maxY);
      if (Game.player.canStand(player.x, y)) {
        player.y = y;
      }
    }
  }
  Game.player = {
    canStand: canStand,
    move: movePlayer
  };
})();

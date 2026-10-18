"use strict";

/** Recoger ropa, medir capacidad y asegurar puntos al guardarla. */
(() => {
  'use strict';

  const Game = window.RainGame;
  function capacity() { return Game.state.current.basketCapacity ?? Game.config.settings.basketCapacity; }
  /** Suma los espacios ocupados por las prendas del canasto. */
  function usedSpace() {
    return Game.state.current.basket.reduce((s, p) => s + p.size, 0);
  }

  /** Calcula puntos según humedad y bonus. No modifica la prenda. */
  function valueOf(item) {
    return item.wetness < 30 ? item.value * (item.dryMultiplier || 1) : item.wetness < 70 ? item.value * .5 : 0;
  }

  /** Busca la prenda colgada más cercana dentro del alcance de recogida. */
  function nearest() {
    let best = null;
    let dist = Infinity;
    for (const p of Game.state.current.items) {
      if (p.status !== 'hanging') {
        continue;
      }
      const d = Math.hypot(p.x - Game.state.current.player.x, p.y - Game.state.current.player.y);
      if (d < Game.config.settings.pickRadius && d < dist) {
        best = p;
        dist = d;
      }
    }
    return best;
  }

  /** Guarda el canasto, suma puntos una vez e inicia la animación de la puerta. */
  function deposit() {
    if (!Game.state.current.basket.length) {
      return;
    }
    const family = Game.state.current.basket.filter(p => !p.orderId);
    const points = family.reduce((s, p) => s + Game.collection.scoreFor(p), 0);
    Game.state.current.depositAnim = {
      time: 0,
      duration: 1.1,
      points,
      items: Game.state.current.basket.map(p => ({
        ...p
      })),
      x: Game.state.current.player.x,
      y: Game.state.current.player.y
    };
    Game.state.current.basket.forEach(p => p.status = p.orderId ? 'stored' : 'saved');
    Game.state.current.saved += family.length;
    Game.state.current.basket = [];
    Game.state.current.points += points;
    Game.audio.play('deposit');
    Game.effects.burst(Game.config.settings.door.x, Game.config.settings.door.y - 20, '#f0d486', 14);
    Game.hud.toast(`¡A salvo! +${points} puntos guardados`);
    Game.saves?.auto('descarga');
  }

  /** Retira la prenda de la soga e inicia su viaje animado al canasto. */
  function completePickup(target) {
    if (!Game.state.current.items.includes(target) || target.status !== 'hanging' ||
        usedSpace() + target.size > capacity()) return;
    target.status = 'basket';
    if (target.orderId) target.slot = null;
    Game.state.current.basket.push(target);
    Game.state.current.flights.push({
      item: {
        ...target
      },
      x: target.x,
      y: target.y - 52,
      time: 0,
      duration: 0.55
    });
    Game.state.current.collectPulse = 0.55;
    Game.effects.burst(target.x, target.y - 30, target.color);
    Game.audio.play('collect');
    Game.state.current.progress = 0;
    Game.state.current.target = null;
    Game.saves?.auto('recogida');
    if (Game.collection.usedSpace() >= capacity()) {
      Game.audio.play('full');
      Game.hud.toast('Canasto lleno. ¡Volvé a la puerta!');
    }
  }

  /** Procesa descarga, objetivo y progreso de recogida; soltar cancela el progreso. */
  function updateCollection(deltaSeconds) {
    const gameState = Game.state.current;
    const atDoor = Math.hypot(gameState.player.x - Game.config.settings.door.x, gameState.player.y - Game.config.settings.door.y) < Game.config.settings.door.radius;
    if (gameState.laundry && !atDoor) gameState.laundry.leaveDoor = false;
    if (atDoor && !gameState.laundry?.leaveDoor) {
      Game.collection.deposit();
    }
    if (Game.laundry?.interact(deltaSeconds)) return;
    const target = Game.collection.nearest();
    if (target !== gameState.target) {
      gameState.target = target;
      gameState.progress = 0;
    }
    if (!Game.controls.keys.has('collect') || !target) {
      gameState.progress = 0;
      return;
    }
    if (Game.collection.usedSpace() + target.size > capacity()) {
      gameState.progress = 0;
      if (Game.runtime.toastTime <= 0) {
        Game.hud.toast('No hay espacio para esta prenda. Descargá en casa.');
      }
      return;
    }
    gameState.progress += deltaSeconds;
    if (gameState.progress >= target.time) {
      Game.collection.completePickup(target);
    }
  }
  Game.collection = {
    capacity,
    usedSpace: usedSpace,
    scoreFor: valueOf,
    nearest: nearest,
    deposit: deposit,
    completePickup: completePickup,
    update: updateCollection
  };
})();

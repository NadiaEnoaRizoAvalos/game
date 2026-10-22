/** Transporte, lavado manual y secado. Una prenda mantiene su ID durante todo el ciclo. */
(() => {
  'use strict';
  const Game = window.RainGame;
  const cfg = () => Game.config.laundry;
  const current = () => Game.state.current;
  function duration(item) { return (cfg().wash.seconds + item.size) * (current().yard?.tools.includes('washboard') ? .8 : 1) * (1 - Game.skills.level('maria', 'washing') * .04); }
  function needsWash(item) {
    const order = current().orders.find(o => o.id === item.orderId);
    return order && item.cleanliness < order.requiredQuality;
  }
  function nearStation() {
    if (current().scene === 'house') {
      const a = Game.house.context();
      return a?.kind === 'wash';
    }
    const p = current().player;
    if (Game.yard.active().some(b => b.type === 'basin' && Math.hypot(p.x - b.x - 30, p.y - b.y - 40) <= 43)) return true;
    const station = cfg().station;
    return Math.hypot(p.x - station.x, p.y - station.y) <= station.radius;
  }

  /** Carga solo lo que cabe; el resto queda a resguardo en la casa. */
  function load(orderId) {
    const s = current();
    if (!Game.orders.atDoor() && !Game.house.atStorage()) return 'Acercate a la puerta o al estante interior para cargar las prendas.';
    const order = s.orders.find(o => o.id === orderId && o.state === 'accepted');
    if (!order) return 'El pedido no está aceptado.';
    let loaded = 0;
    for (const p of Game.orders.goods(order)) {
      if (p.status !== 'stored' || (p.cleanliness >= order.requiredQuality && p.wetness <= cfg().dryThreshold)) continue;
      if (Game.collection.usedSpace() + p.size > Game.collection.capacity()) continue;
      p.status = 'basket';
      s.basket.push(p);
      loaded++;
    }
    if (!loaded) return 'No hay prendas pendientes que quepan en el canasto. Descargá primero o revisá el pedido.';
    s.laundry.leaveDoor = true;
    Game.saves?.auto('carga de pedido');
    return null;
  }

  /** Paga agua y jabón al iniciar cada lavado, nunca otra vez al reanudarlo. */
  function wash(item, dt) {
    const s = current();
    if (!Number.isFinite(dt) || dt <= 0 || !nearStation() || !s.basket.includes(item) || !needsWash(item)) return false;
    if (item.washProgress === 0) {
      const cost = Game.skills.washCost(s);
      if (s.resources.water < cost.water || s.resources.soap < cost.soap) return false;
      s.resources.water -= cost.water;
      s.resources.soap -= cost.soap;
      item.washProgress = Number.EPSILON;
      Game.saves?.auto('inicio de lavado');
    }
    item.washProgress = Math.min(duration(item), item.washProgress + dt);
    s.progress = item.washProgress;
    if (item.washProgress >= duration(item)) {
      item.cleanliness = 100;
      item.wetness = 100;
      item.washProgress = 0;
      Game.skills.gain('maria', ['washing', 'efficiency', 'speed'], s);
      s.progress = 0;
      s.collectPulse = .55;
      Game.audio.play('collect');
      Game.hud.toast(`${item.name} lavada. Llevála a un lugar libre de las sogas.`);
      Game.saves?.auto('lavado terminado');
    }
    return true;
  }

  function freeSlot() {
    if (current().scene === 'house') return null;
    const s = current();
    let nearest = null;
    for (const position of Game.yard.slots(s)) {
      const slot = position.slot;
      if (s.items.some(p => p.status === 'hanging' && p.slot === slot)) continue;
      const distance = Math.hypot(position.x - s.player.x, position.y - s.player.y);
      if (distance < Game.config.settings.pickRadius && (!nearest || distance < nearest.distance)) nearest = { slot, ...position, distance };
    }
    return nearest;
  }

  function hang(item, slot) {
    const s = current();
    if (s.scene === 'house') return false;
    if (!s.basket.includes(item) || !item.orderId || needsWash(item)) return false;
    if (s.items.some(p => p.status === 'hanging' && p.slot === slot)) return false;
    const position = Game.yard.position(slot, s);
    if (!position) return false;
    if (Math.hypot(position.x - s.player.x, position.y - s.player.y) >= Game.config.settings.pickRadius) return false;
    s.basket = s.basket.filter(p => p !== item);
    Object.assign(item, position, { slot, status: 'hanging' });
    Game.audio.play('collect');
    Game.hud.toast('Prenda tendida. Soltá el botón antes de otra acción.');
    Game.saves?.auto('tendido');
    return true;
  }

  function context() {
    const s = current();
    if (!s.laundry) return null;
    const dirty = s.basket.find(p => p.orderId && needsWash(p));
    if (nearStation()) return { kind: 'wash', item: dirty };
    const item = s.basket.find(p => p.orderId && !needsWash(p) && p.wetness > cfg().dryThreshold);
    const slot = item && freeSlot();
    const target = Game.collection.nearest();
    if (slot && (!target || slot.distance < Math.hypot(target.x - s.player.x, target.y - s.player.y))) return { kind: 'hang', item, slot: slot.slot };
    return null;
  }

  /** Devuelve true si esta interacción utiliza el botón contextual. */
  function interact(dt) {
    if (!current().laundry) return false;
    const held = Game.controls.keys.has('collect');
    if (!held) Game.runtime.laundryLatch = false;
    if (Game.runtime.laundryLatch) return true;
    const action = context();
    if (!action) return false;
    current().target = null;
    if (!held) { current().progress = 0; return true; }
    if (action.kind === 'wash' && action.item) {
      if (!wash(action.item, dt) && Game.runtime.toastTime <= 0) Game.hud.toast('Faltan agua o jabón. Comprá insumos en Pedidos.');
    }
    if (action.kind === 'hang' && hang(action.item, action.slot)) Game.runtime.laundryLatch = true;
    return true;
  }

  /** El secado solo ocurre en sogas: tela y viento modifican la evaporación. */
  function update(dt) {
    const s = current();
    if (!s.laundry) return;
    for (const p of s.items) {
      if (!p.orderId || p.status !== 'hanging' || (s.rainIntensity > 0 && Game.yard.cover(p, s) === 1)) continue;
      const c = Game.climate.conditions();
      const environment = c ? c.temperature / 28 * (1 - c.humidity / 100 * .7) * (.4 + .6 * c.sun) * (Game.climate.shelter(p) ? .65 : 1) : 1;
      const rate = cfg().fabrics[p.type] * (1 + Game.state.weather().wind * .08) * environment * (Game.yard.cover(p, s) < 1 ? .8 : 1) * (s.rainIntensity > 0 ? .5 : 1);
      p.wetness = Math.max(0, p.wetness - rate * dt);
    }
  }
  Game.laundry = { load, wash, hang, freeSlot, context, interact, update, duration, nearStation, needsWash };
})();

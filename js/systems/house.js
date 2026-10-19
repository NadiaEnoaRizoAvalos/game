/** Escenas, plano conectado y compras en posiciones que no bloquean los accesos. */
(() => {
  const Game = window.RainGame;
  const cfg = () => Game.config.house;
  const current = () => Game.state.current;
  function initialize(s) {
    if (s.house.layoutVersion === 1) return;
    s.house = { layoutVersion: 1, rooms: cfg().rooms.filter(r => !r.price).map(r => ({ id: r.id })),
      furniture: cfg().furniture.filter(f => !f.price).map(f => ({ id: f.id })), legacy: s.house };
    s.scene = 'yard'; s.resources.wood = 0;
    for (const m of s.family.members) Object.assign(m, m.id === 'jose' ? { x: 510, y: 240 } : { x: 290, y: 300 });
  }
  function rooms(s = current()) { return cfg().rooms.filter(r => s.house.rooms.some(v => v.id === r.id)); }
  function furniture(s = current()) { return cfg().furniture.filter(f => s.house.furniture.some(v => v.id === f.id)); }
  function near(p, x, y, radius) { return Math.hypot(p.x - x, p.y - y) < radius; }
  /** Deriva paredes y puertas del plano: solo abre huecos entre habitaciones compradas. */
  function walls(s = current()) {
    const active = rooms(s), result = [];
    for (const r of active) {
      for (const side of ['left', 'right', 'top', 'bottom']) {
        const vertical = side === 'left' || side === 'right';
        const fixed = vertical ? r.x + (side === 'right' ? r.w : 0) : r.y + (side === 'bottom' ? r.h : 0);
        const start = vertical ? r.y : r.x, end = start + (vertical ? r.h : r.w);
        const gaps = [];
        for (const other of active) {
          if (other === r) continue;
          const edge = vertical ? other.x + (side === 'left' ? other.w : 0) : other.y + (side === 'top' ? other.h : 0);
          if (fixed !== edge) continue;
          const from = Math.max(start, vertical ? other.y : other.x);
          const to = Math.min(end, vertical ? other.y + other.h : other.x + other.w);
          if (to - from >= 72) gaps.push([(from + to) / 2 - 36, (from + to) / 2 + 36]);
        }
        let cursor = start;
        const add = (a, b) => { if (b > a) result.push(vertical ? { x: fixed - 4, y: a, w: 8, h: b - a } : { x: a, y: fixed - 4, w: b - a, h: 8 }); };
        gaps.sort((a, b) => a[0] - b[0]).forEach(([a, b]) => { add(cursor, a); cursor = b; });
        add(cursor, end);
      }
    }
    return result;
  }
  function hits(x, y, box, margin = 10) { return x > box.x - margin && x < box.x + box.w + margin && y > box.y - margin && y < box.y + box.h + margin; }
  function canStand(x, y, s = current()) {
    return rooms(s).some(r => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) &&
      !walls(s).some(w => hits(x, y, w)) && !furniture(s).some(f => !f.walkable && hits(x, y, f));
  }
  function atStorage(s = current()) {
    return s.scene === 'house' && furniture(s).some(f => f.action === 'storage' && near(s.player, f.x + f.w / 2, f.y + f.h + 12, 50));
  }
  function context() {
    const s = current();
    if (!s.house?.layoutVersion) return null;
    if (s.scene !== 'house') return Game.orders.atDoor() ? { kind: 'enter', label: 'ENTRAR' } : null;
    if (near(s.player, cfg().door.x, cfg().door.y, cfg().door.radius)) return { kind: 'exit', label: 'SALIR' };
    const f = furniture(s).filter(f => near(s.player, f.x + f.w / 2, f.y + f.h + 12, 45))
      .sort((a, b) => Math.hypot(s.player.x - a.x - a.w / 2, s.player.y - a.y - a.h) - Math.hypot(s.player.x - b.x - b.w / 2, s.player.y - b.y - b.h))[0];
    if (f) return { kind: f.action, label: { mate: 'MATES', rest: 'DESCANSAR', storage: 'PRENDAS', family: 'FAMILIA', wash: 'LAVAR', look: 'MIRAR' }[f.action], furniture: f };
    const member = s.family.members.find(m => Game.family.present(m.id) && near(s.player, m.x, m.y, 32));
    return member ? { kind: 'talk', label: 'HABLAR', member } : null;
  }
  function transition(scene) {
    const s = current();
    if (!['house', 'yard'].includes(scene)) return false;
    if (scene === 'house' && (s.scene === 'house' || !Game.orders.atDoor())) return false;
    if (scene === 'yard' && (s.scene !== 'house' || !near(s.player, cfg().door.x, cfg().door.y, cfg().door.radius))) return false;
    s.scene = scene;
    Object.assign(s.player, scene === 'house' ? { x: cfg().door.x, y: cfg().door.y - 35 } : { x: 174, y: 270 });
    s.player.walking = false; s.target = null; s.progress = 0;
    s.flights = []; s.depositAnim = null;
    Game.controls.clearInputs(); Game.runtime.houseLatch = true; Game.runtime.laundryLatch = false;
    Game.saves?.auto('cambio de escena');
    Game.hud.update();
    return true;
  }
  /** Conserva un toque breve hasta el siguiente paso de simulación. */
  function queueAction() {
    const a = context();
    if (a && a.kind !== 'wash') Game.runtime.houseTap = true;
  }
  function interact() {
    const s = current(), held = Game.controls.keys.has('collect'), tapped = Game.runtime.houseTap;
    Game.runtime.houseTap = false;
    if (!held) Game.runtime.houseLatch = false;
    const a = context();
    if (!a || a.kind === 'wash') return s.scene === 'house' && !a;
    s.target = null; s.progress = 0;
    if ((!held && !tapped) || Game.runtime.houseLatch) return true;
    Game.runtime.houseLatch = true;
    if (a.kind === 'enter' || a.kind === 'exit') transition(a.kind === 'enter' ? 'house' : 'yard');
    else {
      Game.screens.pause();
      if (a.kind === 'storage') Game.houseMenu.storage();
      else if (a.kind === 'mate' || a.kind === 'rest') Game.houseMenu.rest();
      else if (a.kind === 'talk') Game.familyMenu.show(Game.family.talk(a.member.id));
      else if (a.kind === 'family') Game.familyMenu.show();
      else Game.houseMenu.show('Un detalle para hacer de esta casa nuestro hogar.');
    }
    return true;
  }
  function buy(kind, id) {
    if (!['room', 'furniture'].includes(kind)) return 'Tipo de mejora desconocido.';
    const s = current(), room = kind === 'room';
    const item = (room ? cfg().rooms : cfg().furniture).find(i => i.id === id);
    const owned = room ? s.house.rooms : s.house.furniture;
    if (!item || !item.price || owned.some(i => i.id === id)) return 'Esta mejora ya está instalada o no está disponible.';
    const required = room ? item.parent : item.room;
    if (required && !s.house.rooms.some(r => r.id === required)) return 'Primero construí la habitación necesaria.';
    if (s.resources.wood < item.wood) return 'Falta madera. Podés comprar un paquete de materiales.';
    if (!room && s.scene === 'house' && (hits(s.player.x, s.player.y, item) || s.family.members.some(m => hits(m.x, m.y, item)))) return 'Dejá libre el lugar del mueble antes de instalarlo.';
    if (!Game.economy.transact(`house-${kind}-${id}`, -item.price, 'house', null, s, Game.config.family.reserve)) return 'No alcanza el saldo; reservamos $12 para insumos.';
    s.resources.wood -= item.wood; owned.push({ id });
    Game.saves?.auto('mejora de la casa');
    return null;
  }
  function materials() {
    const s = current(), pack = cfg().woodPack;
    if (!Game.economy.transact(`wood-${s.laundry.ledger.length}`, -pack.price, 'house', null, s, Game.config.family.reserve)) return 'No alcanza el saldo; reservamos $12 para insumos.';
    s.resources.wood += pack.wood;
    Game.saves?.auto('materiales'); return null;
  }
  Game.house = { initialize, rooms, furniture, walls, canStand, atStorage, context, transition, queueAction, interact, buy, materials, hits };
})();

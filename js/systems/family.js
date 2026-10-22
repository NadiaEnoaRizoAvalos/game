/** Familia, gastos aplazables y descanso. No asigna tareas automáticas de lavandería. */
(() => {
  const Game = window.RainGame;
  const cfg = () => Game.config.family;
  function initialize(s) {
    if (s.family) return;
    s.family = { generatedDay: 0, events: [], aidDay: 0, mate: 0, restedDay: 0,
      members: cfg().members.map(c => ({ id: c.id, x: c.x, y: c.y, direction: 1, talkedDay: 0 })) };
    newDay(s);
  }
  function newDay(s) {
    if (s.family.generatedDay === s.day) return;
    // Una necesidad de cada tipo pendiente como máximo: aplazar no crea una deuda infinita.
    const kinds = ['food'];
    if (s.day % 3 === 0) kinds.push(['school', 'transport', 'repair'][Math.floor(s.day / 3 - 1) % 3]);
    for (const kind of kinds) {
      if (s.family.events.length >= 10000 || s.family.events.some(e => e.kind === kind && !e.paid)) continue;
      s.family.events.push({ id: `family-${s.day}-${kind}`, kind, day: s.day, paid: false, paidDay: null });
    }
    s.family.generatedDay = s.day;
  }
  function pay(id) {
    const s = Game.state.current;
    const e = s.family.events.find(e => e.id === id);
    if (!e || e.paid) return 'Este gasto ya está resuelto o no existe.';
    if (!Game.economy.transact(e.id, -cfg().events[e.kind].cost, 'family', null, s, cfg().reserve)) {
      return 'Podés aplazarlo sin penalización. Reservamos $12 para los insumos del negocio.';
    }
    e.paid = true; e.paidDay = s.day;
    Game.saves?.auto('gasto familiar');
    return null;
  }
  function aid() {
    const s = Game.state.current;
    if (s.family.aidDay === s.day || s.resources.money >= 12 || (s.resources.water >= 2 && s.resources.soap >= 1)) {
      return 'La ayuda vecinal es para cuando faltan dinero e insumos; se puede pedir una vez por día.';
    }
    // Ayuda en especie, sin deuda ni dinero revendible. Permite retomar un pedido.
    s.resources.water += 12; s.resources.soap += 6; s.family.aidDay = s.day;
    Game.saves?.auto('ayuda vecinal');
    return null;
  }
  function present(id, s = Game.state.current) {
    return id !== 'jose' || s.elapsed / s.daySeconds >= .4 || s.day % 7 >= 6 || s.day % 7 === 0;
  }
  function talk(id) {
    const s = Game.state.current;
    const member = s.family.members.find(m => m.id === id);
    if (!member) return '';
    if (!present(id)) return 'José está en la escuela. Vuelve después del mediodía.';
    member.talkedDay = s.day;
    Game.saves?.auto('conversación familiar');
    if (id === 'jose') return ['¡Hoy aprendimos a medir la lluvia, má!', 'Cuando termine la tarea te cuento cómo nos fue.', 'Estoy cuidando mis útiles para que duren más.'][s.day % 3];
    return ['¡Casi se me cae el mate! Esta vez lo agarré a tiempo.', 'Podemos ordenar los pedidos antes de que cambie el cielo.', 'Estoy practicando para ayudarte con los canastos.'][s.day % 3];
  }
  function canRest(s = Game.state.current) {
    return !s.orders.some(o => o.state === 'accepted' && o.dueDay <= s.day);
  }
  function rest() {
    const s = Game.state.current;
    if (!canRest(s)) return 'Quedan pedidos que vencen hoy. Podés seguir trabajando o cerrar la jornada desde Pausa.';
    if (s.family.restedDay === s.day || s.dayEnded) { Game.screens.daySummary(); return null; }
    s.family.mate = cfg().mateSeconds;
    Game.screens.resume();
    Game.saves?.auto('descanso con mates');
    return null;
  }
  function update(dt) {
    const s = Game.state.current;
    if (!s.family) return;
    if (s.family.mate > 0) {
      s.family.mate = Math.max(0, s.family.mate - dt);
      if (s.family.mate === 0) { s.family.restedDay = s.day; Game.calendar.endDay(); }
    }
    for (const m of s.family.members) {
      if (m.id === 'jaqui' && s.workshop?.helper.active) continue;
      if (!present(m.id, s)) continue;
      const home = s.house.layoutVersion ? (m.id === 'jose' ? { x: 510, y: 240 } : { x: 290, y: 300 }) : Game.config.family.members.find(c => c.id === m.id);
      const x = m.x + m.direction * dt * 12;
      if (Math.abs(x - home.x) > 24 || !(s.house.layoutVersion ? Game.house.canStand(x, m.y, s) : Game.player.canStand(x, m.y, true))) m.direction *= -1;
      else m.x = x;
    }
  }
  Game.family = { initialize, newDay, pay, aid, present, talk, canRest, rest, update };
})();

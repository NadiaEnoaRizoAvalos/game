/** Plano conocido, compras únicas, muebles instalados y posiciones sin colisiones. */
(() => {
  const Game = window.RainGame;
  function validate(s, check, number, object) {
    check(['yard', 'house'].includes(s.scene) && s.house.layoutVersion === 1, 'escena y plano');
    check(number(s.resources.wood, 0, 1e12, true) && object(s.house.legacy), 'materiales y casa anterior');
    for (const [kind, list, catalog] of [['room', s.house.rooms, Game.config.house.rooms], ['furniture', s.house.furniture, Game.config.house.furniture]]) {
      const ids = new Set();
      for (const value of list) {
        check(object(value), 'habitación o mueble');
        const item = catalog.find(c => c.id === value.id);
        check(object(value) && item && !ids.has(value.id), 'habitación o mueble desconocido/duplicado'); ids.add(value.id);
        const required = kind === 'room' ? item.parent : item.room;
        if (required) check(s.house.rooms.some(r => r.id === required), 'habitación necesaria');
        if (item.price) check(s.laundry.ledger.some(e => e.id === `house-${kind}-${item.id}` && e.kind === 'house' && e.amount === -item.price), 'mejora sin compra');
      }
      for (const item of catalog.filter(c => !c.price)) check(ids.has(item.id), 'equipamiento inicial ausente');
    }
    for (const e of s.laundry.ledger.filter(e => e.kind === 'house')) {
      if (e.id.startsWith('wood-')) check(e.amount === -Game.config.house.woodPack.price && /^wood-\d+$/.test(e.id), 'compra de materiales');
      else {
        const [, kind, ...parts] = e.id.split('-'), id = parts.join('-');
        const list = kind === 'room' ? s.house.rooms : kind === 'furniture' ? s.house.furniture : [];
        check(list.some(i => i.id === id), 'pago sin mejora');
      }
    }
    const woodBought = s.laundry.ledger.filter(e => e.kind === 'house' && e.id.startsWith('wood-')).length * Game.config.house.woodPack.wood;
    const woodUsed = Game.house.rooms(s).reduce((n, r) => n + r.wood, 0) + Game.house.furniture(s).reduce((n, f) => n + f.wood, 0);
    const yardWood = s.yard ? s.constructions.reduce((n, b) => n + Game.config.yard.catalog[b.type].wood, 0) + s.yard.tools.reduce((n, id) => n + Game.config.yard.tools[id].wood, 0) : 0;
    const workshopWood = s.workshop ? s.workshop.owned.reduce((n, id) => n + Game.config.automation.upgrades[id].wood, 0) + s.workshop.roofs.length * Game.config.automation.roof.wood : 0;
    check(s.resources.wood === woodBought - woodUsed - yardWood - workshopWood, 'balance de materiales');
    for (const m of s.family.members) if (!(m.id === 'jaqui' && s.workshop?.helper.scene === 'yard')) check(Game.house.canStand(m.x, m.y, s), 'posición familiar interior');
  }
  Game.houseSchema = { validate };
})();

/** Compra de ampliaciones y muebles, almacenamiento y descanso desde el interior. */
(() => {
  const Game = window.RainGame;
  const button = (a, text) => `<button class="secondary" data-action="${a}">${text}</button>`;
  function show(message = '') {
    const s = Game.state.current;
    if (s.mode === 'playing') Game.screens.pause();
    Game.hud.showPanel(`<div class="eyebrow">UN HOGAR QUE CRECE</div><h2>Casa y muebles.</h2><p>${message}</p>
      <p>Saldo: $${s.resources.money} · Madera: ${s.resources.wood}. Se reservan $12 para insumos.<br>Los muebles tienen lugares preparados para mantener libres puertas y pasillos.</p>
      ${button('house:materials', 'MATERIALES: 6 MADERAS POR $18')}
      <h3>Ampliaciones</h3>${Game.config.house.rooms.filter(r => r.price).map(r => s.house.rooms.some(v => v.id === r.id) ? `<p>${r.name}: construida.</p>` : button(`house:room:${r.id}`, `${r.name} · $${r.price} + ${r.wood} maderas`)).join('')}
      <h3>Muebles</h3>${Game.config.house.furniture.filter(f => f.price).map(f => s.house.furniture.some(v => v.id === f.id) ? `<p>${f.name}: instalado.</p>` : button(`house:furniture:${f.id}`, `${f.name} · $${f.price} + ${f.wood} maderas`)).join('')}
      <p>Acercate a la puerta y presioná acción para entrar o salir. Dentro, la acción cambia cerca de muebles y familiares.</p>${button('resume', 'SEGUIR JUGANDO')}`);
  }
  function storage(message = '') {
    const s = Game.state.current;
    Game.hud.showPanel(`<h2>Prendas a resguardo.</h2><p>${message}</p><p>En casa: ${s.items.filter(p => ['saved', 'stored'].includes(p.status)).length} prendas.<br>Canasto: ${Game.collection.usedSpace()}/${Game.collection.capacity()} unidades de volumen.</p>
      ${button('house:unload', 'GUARDAR CANASTO')}${s.orders.filter(o => o.state === 'accepted').map(o => button(`house:load:${o.id}`, `CARGAR: ${Game.orders.customer(o.clientId).name}`)).join('')}
      ${button('orders', 'REVISAR PEDIDOS')}${button('resume', 'SEGUIR JUGANDO')}`);
  }
  function rest() {
    Game.hud.showPanel(`<h2>Un ratito en casa.</h2><p>Podés tomar mates si ya resolviste los pedidos que vencen hoy. Los encargos futuros pueden esperar.</p>${button('family:mate', 'TOMAR MATES Y VER EL RESUMEN')}${button('family', 'FAMILIA Y CUENTAS')}${button('resume', 'SEGUIR JUGANDO')}`);
  }
  function action(a) {
    if (a === 'house') show();
    if (!a.startsWith('house:')) return;
    const [, kind, id] = a.split(':');
    if (kind === 'room' || kind === 'furniture') show(Game.house.buy(kind, id) || 'Mejora instalada. Podés recorrerla en el interior.');
    if (kind === 'materials') show(Game.house.materials() || 'Materiales guardados.');
    if (kind === 'load') storage(Game.laundry.load(id) || 'Prendas cargadas en el canasto.');
    if (kind === 'unload') {
      if (!Game.house.atStorage()) storage('Acercate al estante o armario para guardar.');
      else { Game.collection.deposit(); storage('Canasto guardado bajo techo.'); }
    }
  }
  Game.houseMenu = { show, storage, rest, action };
})();

/** Tablón de encargos. Las operaciones económicas permanecen en los sistemas. */
(() => {
  'use strict';
  const Game = window.RainGame;
  const labels = { available: 'Disponible', accepted: 'Aceptado', washing: 'En lavado', drying: 'En secado', ready: 'Listo', delivered: 'Entregado', expired: 'No aceptado', rejected: 'Rechazado' };
  const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function show(id = null, message = '') {
    const s = Game.state.current;
    if (!s.laundry) return;
    if (s.mode === 'playing') Game.screens.pause();
    const order = s.orders.find(o => o.id === id);
    let body;
    if (order) {
      const client = Game.orders.customer(order.clientId);
      const stage = Game.orders.stage(order);
      const items = Game.orders.goods(order);
      body = `${s.scene === 'house' ? '<div class="eyebrow">ATENCIÓN EN CASA</div>' : ''}<canvas id="customer-portrait" width="120" height="120" role="img" aria-label="Retrato de ${escape(client.name)}"></canvas><h2>${escape(client.name)}</h2><p>${escape(client.story)}</p>
<p>${order.count} × ${escape(Game.config.garments[order.type].name)} · $${order.price} · Entrega: día ${order.dueDay}${order.urgent ? ' · URGENTE' : ''}<br>
${labels[stage]} · Limpieza requerida: ${order.requiredQuality}%${s.day > order.dueDay && order.state === 'accepted' ? ' · ATRASADO' : ''}</p>
${items.length ? `<p>${items.map(p => `${escape(p.name)}: ${{ stored: 'en casa', basket: 'en canasto', hanging: 'en soga', delivered: 'entregada' }[p.status]} · limpieza ${Math.floor(p.cleanliness)}% · humedad ${Math.round(p.wetness)}%${p.washProgress ? ' · lavado iniciado' : ''}`).join('<br>')}</p>` : ''}
<div class="panel-actions">
${order.state === 'available' ? `<button class="primary" data-action="order:accept:${order.id}">ACEPTAR PEDIDO</button><button class="secondary" data-action="order:reject:${order.id}">RECHAZAR PEDIDO</button>` : ''}
${order.state === 'accepted' ? `<button class="secondary" data-action="order:load:${order.id}">CARGAR PRENDAS EN CASA</button><button class="primary" data-action="order:deliver:${order.id}">ENTREGAR PEDIDO</button>` : ''}
${s.scene === 'house' && order.state !== 'available' && Game.customers.waiting().length ? '<button class="secondary" data-action="customers">ATENDER SIGUIENTE VECINO</button>' : ''}
<button class="secondary" data-action="orders">VOLVER A PEDIDOS</button></div>`;
    } else {
      const visible = s.orders.filter(o => ['available', 'accepted'].includes(o.state));
      body = `<h2>Encargos del barrio.</h2>
<p>Saldo: $${s.resources.money} · Agua: ${s.resources.water} · Jabón: ${s.resources.soap}<br>
${s.orders.filter(o => o.state === 'accepted').length}/3 pedidos activos · Canasto ${Game.collection.usedSpace()}/${Game.collection.capacity()}${s.reputation ? ` · Reputación ${Math.round(s.reputation.score)}/100` : ''}<br>
${Game.orders.atDoor() ? 'Estás en casa: podés cargar o entregar.' : 'Para cargar y entregar, acercate a la puerta de la casa.'}</p>
<div class="panel-actions">${visible.map(o => `<button class="secondary" data-action="order:view:${o.id}">${escape(Game.orders.customer(o.clientId).name)} · ${labels[Game.orders.stage(o)]} · $${o.price}</button>`).join('')}
<button class="secondary" data-action="order:supplies">INSUMOS $12 · 12 AGUA + 6 JABÓN</button>
<button class="secondary" data-action="order:unload">DESCARGAR CANASTO EN CASA</button></div>
<p class="tiny">Se lava junto a la casa, se tiende en lugares libres y se entrega limpio y seco.<br>
Entregados: ${s.orders.filter(o => o.state === 'delivered').length}. Tres entregas puntuales y confianza de 60 convierten al cliente en habitual (+$5).</p>`;
    }
    Game.hud.showPanel(`<div class="eyebrow">LA LAVANDERÍA DE MARÍA CARMEN</div>${body}
<p id="order-message" role="status"></p><div class="panel-actions"><button class="primary" data-action="resume">VOLVER AL PATIO →</button></div>`);
    document.getElementById('order-message').textContent = message;
    if (order) Game.customerDrawing.portrait(Game.orders.customer(order.clientId));
  }
  function action(name) {
    if (name === 'orders') { show(); return; }
    if (name === 'customers') {
      if (Game.state.current.scene === 'house') Game.customers.attend();
      else { show(null, 'Acercate a un vecino y presioná acción para atenderlo en casa.'); }
      return;
    }
    if (!name.startsWith('order:')) return;
    const [, command, id] = name.split(':');
    let message = '';
    if (command === 'accept') message = Game.orders.accept(id) || 'Pedido aceptado. Cargá las prendas desde la puerta.';
    if (command === 'reject') message = Game.orders.reject(id) || 'Pedido rechazado. El vecino se retira sin cargos ni prendas pendientes.';
    if (command === 'load') message = Game.laundry.load(id) || 'Canasto cargado. Salí de la puerta y caminá al lavadero de la derecha.';
    if (command === 'deliver') message = Game.orders.deliver(id) || 'Pedido entregado y cobrado. ¡Gracias por el trabajo!';
    if (command === 'supplies') message = Game.orders.buySupplies() || 'Agua y jabón repuestos.';
    if (command === 'unload') {
      if (!Game.orders.atDoor()) message = 'Acercate a la puerta para descargar.';
      else { Game.collection.deposit(); message = 'La ropa está guardada bajo techo.'; }
    }
    show(id, message);
  }
  Game.ordersMenu = { show, action };
})();

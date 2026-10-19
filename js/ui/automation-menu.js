/** Asignar trabajo y cargar lotes no reemplaza las decisiones comerciales. */
(() => {
  const Game = window.RainGame;
  const button = (a, text) => `<button class="secondary" data-action="${a}">${text}</button>`;
  const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function show(message = '') {
    const s = Game.state.current, cfg = Game.config.automation, h = s.workshop.helper;
    if (s.mode === 'playing') Game.screens.pause();
    Game.hud.showPanel(`<div class="eyebrow">TRABAJAR EN FAMILIA</div><h2>Ayuda y máquinas.</h2><p>${escape(message)}</p>
      <p>Saldo: $${s.resources.money} · Madera: ${s.resources.wood} · Agua: ${s.resources.water} · Jabón: ${s.resources.soap}</p>
      <h3>Jaqui</h3><p>${escape(h.message)}<br>Canasto: ${Game.helper.used()}/${Game.helper.capacity()} unidades de volumen · Tropiezos: ${h.stumbles}.</p>
      ${button('work:task:collect', 'RECOGER Y GUARDAR')}${button('work:task:hang', 'CARGAR ROPA LIMPIA Y TENDER')}${button('work:task:transport', 'ACERCAR ROPA SUCIA AL LAVADERO')}${button('work:task:schedule', 'RUTINA: RECOGER Y TENDER')}${button('work:task:return', 'VOLVER A CASA')}${button('work:receive', 'RECIBIR SU CANASTO')}
      <p>Jaqui respeta obstáculos y capacidad. Puede ensuciar levemente una prenda al tropezar; se recupera con otro lavado. Los caminos, los guantes y la práctica reducen el riesgo.</p>
      <h3>Mejoras</h3>${Object.entries(cfg.upgrades).map(([id, c]) => s.workshop.owned.includes(id) ? `<p>${c.name}: comprada.</p>` : button(`work:buy:${id}`, `${c.name} · $${c.price}${c.wood ? ` + ${c.wood} madera` : ''}`)).join('')}
      <h3>Máquinas del patio</h3><p>Construí lavarropas o secadora desde Construir patio. Acercate al frente con las prendas en tu canasto. El lote se paga al iniciar; después de cinco usos necesita mantenimiento de $6.</p>
      ${Game.yard.active(s).filter(b => cfg.machines[b.type]).map(b => { const m = Game.automation.machine(b.id), c = cfg.machines[b.type]; return `<p><b>${c.name} · ${b.id}</b><br>${c.capacity} unidades de volumen · Lote: ${c.seconds}s · Energía: $${c.energy}<br>${m.remaining > 0 ? `Trabajando: ${Math.ceil(m.remaining)}s` : m.items.length ? 'Lote listo' : 'Vacía'} · Usos: ${m.wear}/5</p>${button(`work:start:${b.id}`, 'CARGAR E INICIAR LOTE')}${button(`work:unload:${b.id}`, 'DESCARGAR LOTE')}${button(`work:service:${b.id}`, 'MANTENIMIENTO $6')}`; }).join('')}
      <h3>Cubiertas automáticas</h3><p>Con sensor podés equipar dos sogas nuevas: se cubren con lluvia o aviso de lluvia próximo. La ropa debe seguir revisándose.</p>
      ${s.workshop.owned.includes('sensor') ? button('work:sensor', s.workshop.sensor ? 'SENSOR ACTIVADO · DESACTIVAR' : 'SENSOR DESACTIVADO · ACTIVAR') : ''}
      ${Game.yard.active(s).filter(b => b.type === 'rope').map(b => s.workshop.roofs.includes(b.id) ? `<p>${b.id}: cubierta ${Game.automation.roof(b) ? 'desplegada' : 'recogida'}.</p>` : button(`work:roof:${b.id}`, `EQUIPAR ${b.id}: $30 + 1 MADERA`)).join('')}
      ${button('work:skills', 'HABILIDADES')}${button('build', 'CONSTRUIR PATIO')}${button('resume', 'SEGUIR JUGANDO')}`);
  }
  function skills() {
    const s = Game.state.current;
    const names = { washing: 'Lavado', organization: 'Organización', speed: 'Velocidad', efficiency: 'Insumos', management: 'Gestión', coordination: 'Coordinación', transport: 'Transporte', reliability: 'Confiabilidad', autonomy: 'Autonomía' };
    Game.hud.showPanel(`<h2>La práctica ayuda.</h2><p>Cada diez prácticas se gana un nivel, hasta cinco. Los beneficios son graduales y el canasto siempre conserva su límite por volumen.</p>
      ${['maria', 'jaqui'].map(person => `<h3>${person === 'maria' ? 'María Carmen' : 'Jaqui'}</h3>${Object.entries(s.skills[person]).map(([id, xp]) => `<p>${names[id]}: nivel ${Game.skills.level(person, id)} · ${xp} prácticas</p>`).join('')}`).join('')}
      <p>María lava y recoge más rápido, mejora eficiencia y recibe mejores ofertas. Jaqui gana velocidad, coordinación, capacidad de rutina y confiabilidad. Los tropiezos no hacen desaparecer prendas.</p>${button('work', 'VOLVER')}${button('resume', 'SEGUIR JUGANDO')}`);
  }
  function action(a) {
    if (a === 'work') show();
    if (!a.startsWith('work:')) return;
    const [, kind, id] = a.split(':');
    if (kind === 'task') show(Game.helper.assign(id) || 'Tarea asignada. Reanudá para que Jaqui empiece.');
    if (kind === 'receive') show(Game.helper.receive() || 'Prendas recibidas sin duplicación.');
    if (kind === 'buy') show(Game.automation.purchase(id) || 'Mejora comprada.');
    if (kind === 'roof') show(Game.automation.installRoof(id) || 'Cubierta instalada.');
    if (kind === 'start') show(Game.automation.start(id) || 'Lote iniciado. Reanudá para que avance.');
    if (kind === 'unload') show(Game.automation.unload(id) || 'Prendas descargadas.');
    if (kind === 'service') show(Game.automation.service(id) || 'Máquina lista para otros cinco lotes.');
    if (kind === 'sensor') { Game.state.current.workshop.sensor = !Game.state.current.workshop.sensor; Game.saves?.auto('sensor'); show(); }
    if (kind === 'skills') skills();
  }
  Game.automationMenu = { show, action, skills };
})();

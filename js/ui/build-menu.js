/** Tablón y previsualización: elegir una casilla nunca cobra; confirmar sí. */
(() => {
  const Game = window.RainGame;
  const button = (a, text) => `<button class="secondary" data-action="${a}">${text}</button>`;
  let preview = null, cached = null;
  function hide() { Game.dom.byId('build-toolbar').hidden = true; document.querySelectorAll('.touch-controls').forEach(e => e.hidden = false); preview = null; cached = null; }
  function show(message = '') {
    hide();
    if (Game.state.current.mode === 'playing') Game.screens.pause();
    Game.state.current.mode = 'paused';
    const s = Game.state.current, cfg = Game.config.yard;
    Game.hud.update();
    Game.hud.showPanel(`<div class="eyebrow">EL PATIO CRECE</div><h2>Construir y cuidar.</h2><p>${message}</p>
      <p>Saldo: $${s.resources.money} · Madera: ${s.resources.wood} · ${Game.yard.active().length}/${cfg.maxActive} construcciones.<br>Se reservan $12 para insumos. La simulación se pausa durante la construcción.</p>
      ${button('build:materials', 'MATERIALES: 6 MADERAS POR $18')}<h3>Patio</h3>
      ${Object.entries(cfg.catalog).map(([id, c]) => button(`build:select:${id}`, `${c.name} · $${c.price}${c.wood ? ` + ${c.wood} maderas` : ''}`)).join('')}
      <p>Las sogas agregan dos lugares; la protección reduce lluvia y polvo. Los caminos mejoran la velocidad. Los árboles dan sombra y reducen polvo.</p>
      <h3>Herramientas</h3>${Object.entries(cfg.tools).map(([id, t]) => s.yard.tools.includes(id) ? `<p>${t.name}: comprada.</p>` : button(`build:tool:${id}`, `${t.name} · $${t.price}${t.wood ? ` + ${t.wood} madera` : ''}`)).join('')}
      <h3>Reorganizar</h3>${Game.yard.active().map(b => `<p>${cfg.catalog[b.type].name} · ${b.id} · (${b.x}, ${b.y})</p>${button(`build:move:${b.id}`, 'MOVER')}${button(`build:remove:${b.id}`, `RETIRAR: RECUPERAR $${Math.floor(cfg.catalog[b.type].price / 2)}`)}`).join('') || '<p>Todavía no hay construcciones nuevas.</p>'}
      <p>Solo se reorganizan objetos nuevos. Retirar devuelve la mitad del precio en dinero; la madera no se recupera. Antes de mover o retirar una soga, recogé sus prendas.</p>
      ${button('resume', 'SEGUIR JUGANDO')}`);
  }
  function camera() {
    if (!preview || !Game.camera.viewport.mobile) return { scale: 1, x: 0, y: 0 };
    const size = Game.yard.size(preview);
    const v = Game.camera.viewport, top = v.width > v.height ? 80 : 130;
    const toolbar = Game.dom.byId('build-toolbar').getBoundingClientRect().height;
    const camera = Game.camera.cameraFor(v.width, Math.max(120, v.height - top - toolbar - 16), { x: preview.x + size.w / 2, y: preview.y + size.h / 2 });
    // El área jugable queda entre el HUD y el tablón inferior, incluso junto al cerco.
    camera.y -= top / camera.scale;
    return camera;
  }
  function error() {
    if (!preview) return '';
    const s = Game.state.current, key = `${preview.type}:${preview.x}:${preview.y}:${preview.rotation}:${preview.moving}:${s.laundry.ledger.length}`;
    if (cached?.key === key) return cached.error;
    let reason = Game.yard.canPlace(preview, s, preview.moving);
    const cfg = Game.config.yard.catalog[preview.type];
    if (!reason && !preview.moving && (s.resources.money - cfg.price < 12 || s.resources.wood < cfg.wood)) reason = 'Faltan saldo o madera; se reservan $12 para insumos.';
    cached = { key, error: reason };
    return reason;
  }
  function update() {
    if (!preview) return;
    const reason = error();
    Game.dom.byId('build-status').textContent = `${Game.config.yard.catalog[preview.type].name} (${preview.x}, ${preview.y}) · ${reason || 'Lugar válido. Confirmá para instalar.'}`;
    Game.dom.byId('build-confirm').disabled = !!reason;
  }
  function select(type, moving = null) {
    const s = Game.state.current;
    if (s.scene === 'house') { show('Salí al patio para elegir un lugar de construcción. Las herramientas se pueden comprar desde aquí.'); return; }
    const original = moving && Game.yard.active().find(b => b.id === moving);
    if (!Object.hasOwn(Game.config.yard.catalog, type) || (moving && !original)) return;
    preview = { id: moving || `build-${s.yard.nextId}`, type, x: original?.x ?? 500, y: original?.y ?? 240, rotation: original?.rotation || 0, removed: false, moving };
    cached = null; s.mode = 'building'; s.target = null; s.progress = 0;
    Game.engine.resetTime(); Game.controls.clearInputs(); Game.audio.weather(0);
    Game.dom.byId('overlay').hidden = true; Game.dom.byId('build-toolbar').hidden = false;
    document.querySelectorAll('.touch-controls').forEach(e => e.hidden = true);
    Game.dom.byId('hint').textContent = 'Construcción en pausa · Tocá una casilla o usá las flechas. Confirmá para instalar.';
    Game.dom.byId('pause').textContent = '×'; update();
  }
  function move(dx, dy) {
    if (!preview) return;
    preview.x = Game.utils.clamp(preview.x + dx * 20, 40, 940);
    preview.y = Game.utils.clamp(preview.y + dy * 20, 60, 580); update();
  }
  function finish() { hide(); Game.screens.resume(); Game.hud.update(); }
  function confirm() {
    if (!preview || error()) return;
    const p = preview;
    const message = p.moving ? Game.yard.move(p.moving, p.x, p.y, p.rotation) : Game.yard.place(p.type, p.x, p.y, p.rotation);
    if (message) { cached = null; Game.dom.byId('build-status').textContent = message; return; }
    show(p.moving ? 'Objeto reubicado sin costo.' : 'Construcción instalada y guardada.');
  }
  function key(e) {
    const k = e.key.toLowerCase();
    if ((k === 'enter' || k === ' ') && e.target?.closest?.('button')) return;
    if (['arrowleft', 'a'].includes(k)) move(-1, 0);
    if (['arrowright', 'd'].includes(k)) move(1, 0);
    if (['arrowup', 'w'].includes(k)) move(0, -1);
    if (['arrowdown', 's'].includes(k)) move(0, 1);
    if (!e.repeat && (k === 'enter' || k === ' ')) confirm();
    if (!e.repeat && k === 'r') rotate();
    if (!e.repeat && (k === 'escape' || k === 'p')) finish();
    e.preventDefault();
  }
  function rotate() { if (preview?.type === 'fence') { preview.rotation = 1 - preview.rotation; update(); } }
  function action(a) {
    if (a === 'build') show();
    if (!a.startsWith('build:')) return;
    const [, kind, id] = a.split(':');
    if (kind === 'select') select(id);
    if (kind === 'move') { const b = Game.yard.active().find(b => b.id === id); if (b) select(b.type, id); }
    if (kind === 'remove') {
      if (window.confirm('¿Retirar esta construcción? Recuperarás la mitad del precio; la madera no se devuelve.')) show(Game.yard.remove(id) || 'Construcción retirada.');
    }
    if (kind === 'materials') show(Game.house.materials() || 'Materiales guardados.');
    if (kind === 'tool') show(Game.yard.tool(id) || 'Herramienta comprada.');
  }
  function init() {
    Game.dom.byId('build-toolbar').addEventListener('click', e => {
      if (Game.state.current.mode !== 'building') return;
      const a = e.target.closest('[data-build]')?.dataset.build;
      if (a === 'left') move(-1, 0); if (a === 'right') move(1, 0);
      if (a === 'up') move(0, -1); if (a === 'down') move(0, 1);
      if (a === 'rotate') rotate(); if (a === 'confirm') confirm();
      if (a === 'catalog') show(); if (a === 'close') finish();
    });
    function point(e) {
      if (!preview || Game.state.current.mode !== 'building') return;
      const bounds = Game.dom.canvas.getBoundingClientRect(), c = camera();
      preview.x = Math.round((c.x + (e.clientX - bounds.left) * Game.camera.viewport.width / bounds.width / c.scale) / 20) * 20;
      preview.y = Math.round((c.y + (e.clientY - bounds.top) * Game.camera.viewport.height / bounds.height / c.scale) / 20) * 20;
      preview.x = Game.utils.clamp(preview.x, 40, 940); preview.y = Game.utils.clamp(preview.y, 60, 580); update();
    }
    Game.dom.canvas.addEventListener('pointermove', e => { if (e.pointerType === 'mouse' && !Game.camera.viewport.mobile) point(e); });
    Game.dom.canvas.addEventListener('pointerdown', e => { if (Game.state.current.mode === 'building') { e.preventDefault(); point(e); } });
  }
  Game.buildMenu = { show, select, move, finish, hide, camera, error, confirm, key, action, init, get preview() { return preview; } };
})();

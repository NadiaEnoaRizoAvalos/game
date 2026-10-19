/** Construcciones nuevas con las mismas primitivas, telas y madera del patio. */
(() => {
  const Game = window.RainGame, ctx = Game.dom.context;
  const { rect, line, label, shrub } = Game.drawing;
  function object(b, ghost = false) {
    const { x, y } = b, size = Game.yard.size(b);
    if (b.type === 'path') {
      rect(x, y, 20, 20, '#d4c79c'); rect(x + 4, y + 6, 4, 2, '#c0b68c'); rect(x + 12, y + 14, 4, 2, '#c0b68c');
    } else if (b.type === 'flowers') {
      for (let i = 0; i < 3; i++) { rect(x + 4 + i * 5, y + 9, 2, 9, '#789654'); rect(x + 2 + i * 5, y + 5 + i % 2 * 3, 6, 5, i % 2 ? '#e7b3a0' : '#f0d494'); }
    } else if (b.type === 'tree') Game.world.tree(x + 30, y + 55, .75);
    else if (b.type === 'shrub') shrub(x + 20, y + 30, .55);
    else if (b.type === 'fence') {
      if (b.rotation) {
        for (let i = 0; i < 60; i += 20) rect(x + 7, y + i, 6, 18, '#b9a477');
        rect(x + 3, y + 4, 5, 52, '#d1bb89'); rect(x + 13, y + 4, 3, 52, '#b9a477');
      } else {
        for (let i = 0; i < 60; i += 20) rect(x + i + 3, y - 8, 6, 28, '#b9a477');
        rect(x + 3, y, 52, 5, '#d1bb89'); rect(x + 3, y + 12, 52, 4, '#b9a477');
      }
    } else if (b.type === 'rope' || b.type === 'covered') {
      const n = Number(b.id.slice(6));
      if (b.type === 'covered') {
        rect(x + 2, y - 8, 116, 37, '#e8d7ae');
        for (let i = 4; i < 112; i += 18) rect(x + i, y - 5, 8, 30, '#b5bd8a');
        line(x + 2, y + 29, x + 118, y + 29, '#92714c', 3);
      }
      // La soga dibuja las prendas reales solo para construcciones instaladas.
      Game.world.drawRope({ x1: x + 10, x2: x + 110, y: y + 50 }, ghost ? -999 : 3 + n);
    } else if (b.type === 'basin') {
      rect(x + 5, y + 8, 50, 26, '#92714c'); rect(x + 9, y + 11, 42, 18, '#e7c797');
      rect(x + 13, y + 14, 34, 11, '#7b9a8b'); rect(x + 7, y + 34, 6, 6, '#876e4b'); rect(x + 47, y + 34, 6, 6, '#876e4b');
      rect(x + 45, y + 1, 4, 14, '#b19374'); rect(x + 36, y + 1, 13, 4, '#d0b190');
    } else if (b.type === 'storage') {
      rect(x + 3, y + 4, 54, 36, '#92714c'); rect(x + 7, y + 7, 46, 26, '#b88b52');
      for (let i = 0; i < 2; i++) { rect(x + 11, y + 11 + i * 12, 15, 7, '#e8d7ae'); rect(x + 31, y + 11 + i * 12, 16, 7, '#829bab'); }
      line(x + 6, y + 23, x + 54, y + 23, '#69604b', 3);
    }
    if (ghost) { ctx.strokeStyle = Game.buildMenu.error() ? '#9b655b' : '#7e9a5a'; ctx.lineWidth = 3; ctx.strokeRect(x, y, size.w, size.h); }
  }
  function ground() { Game.yard.active().filter(b => ['path', 'flowers'].includes(b.type)).forEach(b => object(b)); }
  function layers() { return Game.yard.active().filter(b => !['path', 'flowers'].includes(b.type)).map(b => ({ y: b.y + Game.yard.size(b).h, draw: () => object(b) })); }
  function preview() {
    const b = Game.buildMenu.preview;
    if (Game.state.current.mode !== 'building' || !b) return;
    ctx.globalAlpha = .45;
    for (let x = 40; x <= 960; x += 20) line(x, 60, x, 600, '#f7e9b8', 1);
    for (let y = 60; y <= 600; y += 20) line(40, y, 960, y, '#f7e9b8', 1);
    ctx.globalAlpha = .8; object(b, true); ctx.globalAlpha = 1;
    label(Game.buildMenu.error() ? 'NO DISPONIBLE' : 'CONFIRMAR PARA CONSTRUIR', b.x + Game.yard.size(b).w / 2, b.y - 15, 10, '#f7e9b8');
  }
  Game.yardDrawing = { object, ground, layers, preview };
})();

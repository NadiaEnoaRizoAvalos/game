/** Interior cenital aditivo: madera, telas y muebles con la paleta del mundo original. */
(() => {
  const Game = window.RainGame, ctx = Game.dom.context;
  const { rect, label } = Game.drawing;
  function furniture(f) {
    const { x, y, w, h } = f;
    if (f.type === 'rug') {
      rect(x, y, w, h, '#9b655b'); rect(x + 5, y + 5, w - 10, h - 10, '#e8d7ae');
      for (let i = 10; i < w - 10; i += 12) rect(x + i, y + 12, 6, h - 24, '#9b655b');
      return;
    }
    rect(x + 3, y + h - 3, w, 8, '#69604b');
    rect(x, y, w, h, '#987951'); rect(x + 4, y + 4, w - 8, h - 8, '#b88b52');
    if (f.type === 'bed') {
      rect(x + 5, y + 5, w - 10, h - 10, '#b5bd8a'); rect(x + 8, y + 7, w - 16, 10, '#e8d7ae');
      rect(x + 5, y + h - 13, w - 10, 4, '#7e9a5a');
    } else if (f.type === 'table') {
      rect(x + 8, y + 8, w - 16, h - 16, '#e8d7ae');
      rect(x + 20, y + 12, 8, 8, '#987044'); rect(x + 23, y + 7, 2, 8, '#ddd6c1');
      rect(x - 12, y + 10, 8, 20, '#987951'); rect(x + w + 4, y + 10, 8, 20, '#987951');
    } else if (f.type === 'shelf' || f.type === 'wardrobe') {
      rect(x + 4, y + h / 2, w - 8, 3, '#69604b');
      for (let i = 8; i < w - 12; i += 18) { rect(x + i, y + 6, 12, 6, '#e8d7ae'); rect(x + i, y + h / 2 + 5, 12, 6, '#829bab'); }
    } else if (f.type === 'stove') {
      rect(x + 4, y + 4, w - 8, h - 8, '#c9c6b5'); rect(x + 12, y + 10, 14, 14, '#69604b'); rect(x + 42, y + 10, 14, 14, '#69604b');
    } else if (f.type === 'basin') {
      rect(x + 4, y + 4, w - 8, h - 8, '#c9c6b5'); rect(x + 8, y + 8, w - 16, h - 16, '#829bab');
    } else if (f.type === 'window') {
      rect(x + 4, y + 3, w - 8, h - 6, '#829bab'); rect(x + w / 2, y + 3, 3, h - 6, '#e8d7ae');
      rect(x + 8, y + h - 2, 8, 5, '#7e9a5a'); rect(x + 9, y + h - 5, 6, 4, '#e7b3a0');
    }
  }
  function draw() {
    const s = Game.state.current;
    rect(0, 0, 1000, 640, '#69604b');
    for (const r of Game.house.rooms()) {
      rect(r.x, r.y, r.w, r.h, '#d4c79c');
      for (let y = r.y + 16; y < r.y + r.h; y += 24) {
        rect(r.x, y, r.w, 2, '#c0b68c');
        for (let x = r.x + (y % 48 ? 30 : 70); x < r.x + r.w; x += 80) rect(x, y - 22, 2, 22, '#c0b68c');
      }
      label(r.name, r.x + r.w / 2, r.id === 'kitchen' ? r.y + 75 : r.y + r.h - 34, 10, '#69604b');
    }
    for (const w of Game.house.walls()) { rect(w.x, w.y - 14, w.w, w.h + 14, '#987951'); rect(w.x, w.y - 14, w.w, 5, '#d1bb89'); }
    const d = Game.config.house.door;
    rect(d.x - 24, d.y - 4, 48, 24, '#987951'); label('SALIDA', d.x, d.y + 13, 9, '#f0d494');
    const layers = Game.house.furniture().filter(f => !f.walkable).map(f => ({ y: f.y + f.h, draw: () => furniture(f) }));
    Game.house.furniture().filter(f => f.walkable).forEach(furniture);
    layers.push({ y: s.player.y, draw: Game.sprites.drawPlayer });
    for (const m of s.family.members) layers.push({ y: m.y, draw: () => Game.familyDrawing.member(m) });
    layers.sort((a, b) => a.y - b.y).forEach(l => l.draw());
    Game.familyDrawing.mate();
    const a = Game.house.context();
    if (a) label(a.label, s.player.x, s.player.y + 27, 10, '#3c513e');
    // Las animaciones de prendas tienen su destino interior, nunca la puerta del patio.
    Game.sprites.drawActionAnimations();
  }
  Game.houseDrawing = { draw, furniture };
})();

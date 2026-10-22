/** Vecinos hechos con los mismos bloques, escala y tonos del patio original. */
(() => {
  const Game = window.RainGame;
  const colors = { rosa: '#9b655b', profesor: '#829bab', olga: '#7e9a5a', familia: '#b88b52' };
  function person(client, x, y, scale = .72, ctx = Game.dom.context) {
    const r = (x, y, w, h, color) => { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); };
    ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.scale(scale, scale);
    r(-15, 1, 32, 4, '#697956');
    r(-9, -18, 7, 19, '#69604b'); r(3, -18, 7, 19, '#69604b');
    r(-11, 0, 10, 5, '#4a503b'); r(2, 0, 11, 5, '#4a503b');
    r(-14, -48, 28, 32, colors[client.id]);
    r(-19, -45, 5, 25, '#dba985'); r(14, -45, 5, 25, '#dfb38f');
    r(-12, -72, 24, 24, '#e7bd95'); r(-14, -76, 28, 10, '#69604b');
    if (client.id === 'rosa' || client.id === 'olga') {
      r(-15, -68, 5, 20, '#a69c87'); r(11, -68, 5, 20, '#a69c87'); r(-12, -77, 24, 9, '#a69c87');
      r(-17, -24, 34, 11, '#d4c79c');
    }
    r(-7, -61, 3, 3, '#4b4b3b'); r(5, -61, 3, 3, '#4b4b3b'); r(-3, -53, 7, 2, '#b87769');
    if (client.id === 'profesor') { r(-10, -63, 10, 2, '#4b4b3b'); r(2, -63, 10, 2, '#4b4b3b'); r(0, -61, 2, 2, '#4b4b3b'); }
    // Bolsa de ropa: distingue al visitante de los miembros de la familia.
    r(17, -18, 18, 20, '#bb754c'); r(20, -23, 12, 5, '#987951'); r(20, -15, 12, 3, '#f0d7b2');
    ctx.restore();
  }
  function draw(v) {
    person(v.client, v.x, v.y);
    Game.drawing.label(v.client.name, v.x, v.y + 16, 9, '#3c513e');
    const player = Game.state.current.player;
    if (Math.hypot(player.x - v.x, player.y - v.y) < 32) Game.drawing.label('ATENDER', v.x, v.y - 64, 10, '#3c513e');
  }
  function ground() {
    const visitors = Game.customers.waiting();
    for (const v of visitors) Game.drawing.rect(v.x - 18, v.y - 4, 36, 10, '#d4c79c');
    if (visitors.length) Game.drawing.label(`ESPERA · ${visitors.length}`, 105, 218, 8, '#3c513e');
  }
  function portrait(client) {
    const canvas = document.getElementById('customer-portrait');
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false; ctx.clearRect(0, 0, 120, 120);
    person(client, 50, 109, 1.25, ctx);
  }
  Game.customerDrawing = { person, draw, ground, portrait };
})();

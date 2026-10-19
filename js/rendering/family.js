/** Personajes y mate dibujados con rectángulos, proporciones y paleta del patio. */
(() => {
  const Game = window.RainGame, ctx = Game.dom.context;
  const { rect, label } = Game.drawing;
  function member(m) {
    if (!Game.family.present(m.id)) return;
    const helper = m.id === 'jaqui' ? Game.state.current.workshop?.helper : null;
    if (helper && helper.scene !== Game.state.current.scene) return;
    const cfg = Game.config.family.members.find(c => c.id === m.id);
    const step = Game.state.current.mode === 'playing' && (!helper?.active || helper.walking) ? Math.sin(Game.runtime.clock * 8) * 2 : 0;
    ctx.save(); ctx.translate(Math.round(m.x), Math.round(m.y)); ctx.scale(.72, .72);
    if (helper?.stumble > 0) ctx.rotate(Math.sin(Game.runtime.clock * 16) * .18);
    rect(-8, -11, 6, 13 + step, '#69604b'); rect(3, -11, 6, 13 - step, '#69604b');
    rect(-10, 1 + step, 8, 4, '#4a503b'); rect(3, 1 - step, 8, 4, '#4a503b');
    rect(-12, -37, 24, 27, cfg.color);
    rect(-17, -35, 5, 19, '#dba985'); rect(12, -35, 5, 19, '#dfb38f');
    rect(-10, -57, 20, 20, '#e7bd95'); rect(-12, -60, 24, 8, '#69604b');
    if (m.id === 'jaqui') { rect(-15, -55, 5, 25, '#69604b'); rect(11, -55, 5, 25, '#69604b'); }
    rect(-6, -48, 2, 2, '#4b4b3b'); rect(4, -48, 2, 2, '#4b4b3b'); rect(-2, -41, 5, 2, '#b87769');
    if (helper && Game.helper.used() > 0) Game.sprites.basket(24, -10, Game.helper.used() / Game.helper.capacity());
    ctx.restore(); label(helper?.stumble > 0 ? '¡Uy, Jaqui!' : cfg.name, m.x, m.y + 18, 10, '#3c513e');
  }
  function mate() {
    const s = Game.state.current;
    if (!s.family?.mate) return;
    const p = s.player;
    rect(p.x - 16, p.y - 17, 32, 8, '#987951');
    rect(p.x - 14, p.y - 9, 5, 17, '#69604b'); rect(p.x + 10, p.y - 9, 5, 17, '#69604b');
    const sip = Math.sin((Game.config.family.mateSeconds - s.family.mate) * 3) > 0 ? 10 : 0;
    rect(p.x + 9, p.y - 25 - sip, 10, 9, '#b88b52');
    rect(p.x + 12, p.y - 33 - sip, 2, 10, '#ddd6c1');
    rect(p.x + 5, p.y - 20 - sip, 7, 4, '#dfb38f');
    label('Unos mates, un respiro…', p.x, p.y + 30, 11, '#3c513e');
  }
  Game.familyDrawing = { member, mate };
})();

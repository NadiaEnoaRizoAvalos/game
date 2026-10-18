/** Lavadero aditivo dibujado con las primitivas y la paleta del patio. */
(() => {
  'use strict';
  const Game = window.RainGame;
  function draw() {
    if (!Game.state.current.laundry) return;
    const { rect, label } = Game.drawing;
    const { x, y } = Game.config.laundry.station;
    rect(x - 21, y - 31, 42, 22, '#92714c');
    rect(x - 18, y - 28, 36, 16, '#e7c797');
    rect(x - 14, y - 25, 28, 10, '#7b9a8b');
    rect(x - 17, y - 9, 6, 9, '#876e4b');
    rect(x + 11, y - 9, 6, 9, '#876e4b');
    rect(x + 15, y - 37, 4, 12, '#b19374');
    rect(x + 8, y - 37, 11, 4, '#d0b190');
    rect(x - 23, y + 6, 46, 14, '#f5e5b7');
    label('LAVAR', x, y + 16, 9, '#68764c');
    const action = Game.laundry.context();
    if (action?.kind === 'wash' && action.item) {
      const p = action.item;
      rect(x - 22, y - 45, 44, 5, '#697956');
      rect(x - 21, y - 44, 42 * p.washProgress / Game.laundry.duration(p), 3, '#f2d48b');
    }
    if (action?.kind === 'hang') {
      const position = Game.state.garmentPosition(action.slot, 8);
      label('TENDER', position.x, position.y + 22, 9, '#3c513e');
    }
  }
  Game.laundryDrawing = { draw };
})();

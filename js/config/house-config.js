/** Plano interior y ubicaciones seguras de muebles; no altera la distribución del patio. */
(() => {
  const Game = window.RainGame;
  Game.config.house = {
    door: { x: 230, y: 500, radius: 30 }, woodPack: { price: 18, wood: 6 },
    rooms: [
      { id: 'kitchen', name: 'Cocina y comedor', x: 80, y: 90, w: 300, h: 440, price: 0, wood: 0 },
      { id: 'bedroom', name: 'Dormitorio familiar', x: 380, y: 90, w: 230, h: 220, price: 0, wood: 0 },
      { id: 'storage', name: 'Depósito', x: 380, y: 310, w: 230, h: 220, price: 0, wood: 0 },
      { id: 'maria', name: 'Cuarto de María', x: 610, y: 90, w: 150, h: 220, parent: 'bedroom', price: 45, wood: 4 },
      { id: 'jose', name: 'Cuarto de José', x: 760, y: 90, w: 160, h: 220, parent: 'maria', price: 55, wood: 5 },
      { id: 'jaqui', name: 'Cuarto de Jaqui', x: 610, y: 310, w: 150, h: 220, parent: 'storage', price: 45, wood: 4 },
      { id: 'washroom', name: 'Lavadero cubierto', x: 760, y: 310, w: 160, h: 220, parent: 'jaqui', price: 65, wood: 6 }
    ],
    furniture: [
      { id: 'table', room: 'kitchen', name: 'Mesa y mates', type: 'table', x: 160, y: 240, w: 80, h: 44, action: 'mate', price: 0, wood: 0 },
      { id: 'stove', room: 'kitchen', name: 'Cocina', type: 'stove', x: 110, y: 110, w: 70, h: 38, action: 'family', price: 0, wood: 0 },
      { id: 'family-bed', room: 'bedroom', name: 'Cama familiar', type: 'bed', x: 420, y: 115, w: 64, h: 48, action: 'rest', price: 0, wood: 0 },
      { id: 'shelf', room: 'storage', name: 'Estante de prendas', type: 'shelf', x: 420, y: 350, w: 80, h: 30, action: 'storage', price: 0, wood: 0 },
      { id: 'wardrobe', room: 'bedroom', name: 'Armario', type: 'wardrobe', x: 535, y: 115, w: 42, h: 42, action: 'storage', price: 20, wood: 2 },
      { id: 'window', room: 'kitchen', name: 'Ventana con flores', type: 'window', x: 290, y: 100, w: 48, h: 20, action: 'look', price: 12, wood: 1 },
      { id: 'rug', room: 'kitchen', name: 'Alfombra tejida', type: 'rug', x: 270, y: 355, w: 64, h: 50, action: 'look', price: 10, wood: 0, walkable: true },
      { id: 'maria-bed', room: 'maria', name: 'Cama de María', type: 'bed', x: 643, y: 120, w: 64, h: 48, action: 'rest', price: 18, wood: 2 },
      { id: 'jose-bed', room: 'jose', name: 'Cama de José', type: 'bed', x: 795, y: 120, w: 64, h: 48, action: 'rest', price: 18, wood: 2 },
      { id: 'desk', room: 'jose', name: 'Escritorio escolar', type: 'table', x: 795, y: 248, w: 64, h: 30, action: 'family', price: 16, wood: 2 },
      { id: 'jaqui-bed', room: 'jaqui', name: 'Cama de Jaqui', type: 'bed', x: 643, y: 345, w: 64, h: 48, action: 'rest', price: 18, wood: 2 },
      { id: 'basin', room: 'washroom', name: 'Pileta interior', type: 'basin', x: 803, y: 350, w: 54, h: 30, action: 'wash', price: 24, wood: 2 }
    ]
  };
})();

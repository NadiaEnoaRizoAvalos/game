/** Construcciones de patio y herramientas; precios en moneda ficticia. */
(() => {
  const Game = window.RainGame;
  Game.config.yard = {
    grid: 20, maxActive: 64, maxHistory: 1000,
    catalog: {
      path: { name: 'Camino', w: 20, h: 20, price: 2, wood: 0, speed: 1.15 },
      flowers: { name: 'Flores', w: 20, h: 20, price: 3, wood: 0 },
      shrub: { name: 'Arbusto', w: 40, h: 40, price: 8, wood: 0, solid: true },
      tree: { name: 'Árbol', w: 60, h: 60, price: 18, wood: 0 },
      fence: { name: 'Cerco', w: 60, h: 20, price: 8, wood: 1, solid: true },
      rope: { name: 'Soga de dos lugares', w: 120, h: 60, price: 28, wood: 2, slots: 2 },
      covered: { name: 'Tendedero protegido', w: 120, h: 60, price: 52, wood: 4, slots: 2, rain: .1 },
      basin: { name: 'Lavadero', w: 60, h: 40, price: 30, wood: 2, solid: true },
      storage: { name: 'Depósito de prendas', w: 60, h: 40, price: 35, wood: 3, solid: true }
    },
    tools: {
      basket8: { name: 'Canasto de 8 unidades de volumen', price: 24, wood: 0, capacity: 8 },
      basket12: { name: 'Canasto de 12 unidades de volumen', price: 48, wood: 0, capacity: 12, requires: 'basket8' },
      washboard: { name: 'Tabla de lavado: 20% menos tiempo', price: 32, wood: 1 }
    }
  };
})();

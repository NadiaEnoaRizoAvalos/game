/** Automatización limitada; los pedidos y entregas siguen siendo decisiones del jugador. */
(() => {
  const Game = window.RainGame;
  Game.config.automation = {
    machines: {
      washer: { name: 'Lavarropas', capacity: 4, seconds: 12, energy: 2, service: 6, life: 5 },
      dryer: { name: 'Secadora', capacity: 3, seconds: 10, energy: 3, service: 6, life: 5 }
    },
    upgrades: {
      cart: { name: 'Carrito de Jaqui: 6 unidades de volumen', price: 30, wood: 1 },
      gloves: { name: 'Guantes: menos tropiezos de Jaqui', price: 22, wood: 0 },
      filter: { name: 'Filtro: 1 de agua por prenda', price: 40, wood: 1 },
      planner: { name: 'Agenda: rutina de recoger y tender por plazo', price: 28, wood: 0 },
      sensor: { name: 'Sensor para cubiertas automáticas', price: 45, wood: 1 }
    },
    roof: { price: 30, wood: 1, max: 2 },
    helper: { capacity: 4, speed: 80, stepDistance: 80, risk: .035, stumbleSeconds: 1.2 },
    mariaSkills: ['washing', 'organization', 'speed', 'efficiency', 'management'],
    jaquiSkills: ['coordination', 'transport', 'speed', 'reliability', 'autonomy']
  };
  Object.assign(Game.config.yard.catalog, {
    washer: { name: 'Lavarropas', w: 60, h: 40, price: 80, wood: 3, solid: true, machine: true },
    dryer: { name: 'Secadora', w: 60, h: 40, price: 100, wood: 3, solid: true, machine: true }
  });
})();

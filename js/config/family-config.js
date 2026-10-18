/** Valores ficticios de la economía familiar, ajustables sin tocar la simulación. */
(() => {
  const Game = window.RainGame;
  Game.config.family = {
    reserve: 12, mateSeconds: 4,
    events: {
      food: { title: 'Compras para la mesa', cost: 6, text: 'José y Jaqui preparan la lista del almacén.' },
      school: { title: 'Útiles para José', cost: 9, text: 'José necesita un cuaderno para compartir sus tareas de la escuela.' },
      transport: { title: 'Viaje escolar', cost: 8, text: 'La escuela organiza una visita. Podemos reservar el pasaje cuando alcance.' },
      repair: { title: 'Arreglos de casa', cost: 7, text: 'Jaqui propone reparar el mantel y cuidar lo que ya tenemos.' }
    },
    members: [
      { id: 'jose', name: 'José', x: 376, y: 155, color: '#829bab' },
      { id: 'jaqui', name: 'Jaqui', x: 450, y: 155, color: '#9b655b' }
    ]
  };
})();

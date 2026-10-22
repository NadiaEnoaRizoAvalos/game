/** Balance de la lavandería: moneda ficticia, volumen y tiempos en segundos. */
(() => {
  'use strict';
  const Game = window.RainGame;
  Game.config.laundry = {
    maxActiveOrders: 3, maxPendingGarments: 12, slots: 8,
    station: { x: 310, y: 255, radius: 43 },
    starter: { money: 30, water: 12, soap: 6 },
    supplies: { price: 12, water: 12, soap: 6 },
    wash: { water: 2, soap: 1, seconds: 2 },
    dryThreshold: 1,
    fabrics: { sock: 7, shirt: 4, blouse: 5, pants: 2.8, jacket: 2, sheet: 3, leather: 1.5 },
    clients: [
      { id: 'rosa', name: 'Doña Rosa', type: 'shirt', count: 3, due: 1, price: 36, quality: 90,
        story: 'Las remeras de sus nietos tienen que estar listas para la visita del domingo.' },
      { id: 'profesor', name: 'Profesor Daniel', type: 'blouse', count: 2, due: 0, price: 38, quality: 100,
        story: 'Necesita sus camisas hoy para una reunión en la escuela. Paga un extra por la urgencia.' },
      { id: 'olga', name: 'Doña Olga', type: 'sheet', count: 2, due: 2, price: 42, quality: 85,
        story: 'Prepara la casa para recibir a su hermana. Sus sábanas ocupan bastante lugar.' },
      { id: 'familia', name: 'Familia Suárez', type: 'pants', count: 3, due: 2, price: 48, quality: 95,
        story: 'Están armando las valijas para visitar a la familia en el sur de Tucumán.' }
    ]
  };
})();

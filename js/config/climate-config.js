/** Condiciones y reglas de servicio centralizadas para balancear el clima tucumano. */
(() => {
  const Game = window.RainGame;
  Game.config.climate = {
    sun: { name: 'Sol', temperature: 28, humidity: 50, sun: 1, wind: 1, rain: 0, cloud: .05, dust: 0 },
    heat: { name: 'Mucho calor', temperature: 38, humidity: 30, sun: 1, wind: 1, rain: 0, cloud: 0, dust: 0 },
    clouds: { name: 'Nublado', temperature: 24, humidity: 75, sun: .25, wind: 1, rain: 0, cloud: .55, dust: 0 },
    breeze: { name: 'Viento suave', temperature: 27, humidity: 50, sun: .8, wind: 3, rain: 0, cloud: .15, dust: 0 },
    wind: { name: 'Viento fuerte', temperature: 29, humidity: 40, sun: .7, wind: 6, rain: 0, cloud: .3, dust: .15 },
    drizzle: { name: 'Llovizna', temperature: 23, humidity: 85, sun: .1, wind: 2, rain: .18, cloud: .6, dust: 0 },
    rain: { name: 'Lluvia', temperature: 21, humidity: 95, sun: 0, wind: 3, rain: .65, cloud: .8, dust: 0 },
    storm: { name: 'Tormenta', temperature: 20, humidity: 98, sun: 0, wind: 5, rain: 1, cloud: 1, dust: 0 }
  };
  Game.config.service = { initial: 60, seriousLateDays: 2, complaintLimit: 3, cooldownDays: 3,
    goodReward: 3, minorPenalty: 2, seriousPenalty: 8 };
})();

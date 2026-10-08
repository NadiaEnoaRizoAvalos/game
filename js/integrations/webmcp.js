"use strict";

/** Integración opcional: permite consultar el estado; no es necesaria para jugar. */
(() => {
  const Game = window.RainGame;
  /** Registra la consulta solo si el navegador ofrece WebMCP. */
  function init() {
    if (document.modelContext?.registerTool) {
      try {
        Promise.resolve(document.modelContext.registerTool({
          name: 'read_game_status',
          description: 'Read the current level, saved points, basket and weather in Antes de la lluvia.',
          inputSchema: {
            type: 'object',
            properties: {},
            additionalProperties: false
          },
          annotations: {
            readOnlyHint: true
          },
          execute(input) {
            if (!input || typeof input !== 'object' || Object.keys(input).length) {
              throw new Error('Expected an empty object.');
            }
            return {
              mode: Game.state.current.mode,
              level: Game.state.current.index + 1,
              points: Game.state.current.total + Game.state.current.points,
              basket: Game.collection.usedSpace(),
              rainIntensity: Game.state.current.rainIntensity,
              weather: Game.state.current.stormAnnounced ? 'storm' : Game.state.current.rainStarted ? 'rain' : 'dry'
            };
          }
        })).catch(() => {});
      } catch {}
    }
  }
  Game.integration = {
    init
  };
})();

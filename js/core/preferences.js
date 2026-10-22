/** Preferencias pequeñas; nunca se almacena una partida en localStorage. */
(() => {
  const Game = window.RainGame;
  const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  Game.preferences = { reducedMotion: !!media?.matches };
  media?.addEventListener?.('change', e => { Game.preferences.reducedMotion = e.matches; });
})();

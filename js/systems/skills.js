/** La práctica se mide con contadores enteros; los beneficios están acotados a cinco niveles. */
(() => {
  const Game = window.RainGame;
  function initialize(s) {
    const cfg = Game.config.automation;
    s.skills = { maria: Object.fromEntries(cfg.mariaSkills.map(k => [k, 0])), jaqui: Object.fromEntries(cfg.jaquiSkills.map(k => [k, 0])) };
  }
  function level(person, skill, s = Game.state.current) { return Math.min(5, Math.floor((s.skills?.[person]?.[skill] || 0) / 10)); }
  function gain(person, keys, s = Game.state.current) {
    if (!s.workshop) return;
    for (const key of keys) s.skills[person][key] = Math.min(1000000, s.skills[person][key] + 1);
  }
  function washCost(s = Game.state.current) {
    const water = s.workshop?.owned.includes('filter') || level('maria', 'efficiency', s) >= 3 ? 1 : 2;
    const soap = level('maria', 'efficiency', s) >= 2 && (s.skills.maria.washing + 1) % 5 === 0 ? 0 : 1;
    return { water, soap };
  }
  Game.skills = { initialize, level, gain, washCost };
})();

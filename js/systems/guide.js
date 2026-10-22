/** Guía opcional: observa logros reales y conserva lo aprendido sin interrumpir el juego. */
(() => {
  const Game = window.RainGame;
  const steps = [
    { id: 'family', title: 'Liberar las sogas', text: 'Recogé ropa familiar y guardala al acercarte a la puerta. El canasto se mide por volumen.' },
    { id: 'accept', title: 'Aceptar un pedido', text: 'En Pausa → Pedidos e insumos, revisá precio, prendas y plazo antes de aceptar.' },
    { id: 'load', title: 'Cargar las prendas', text: 'Junto a la puerta o un estante/depósito, cargá las prendas del pedido en tu canasto.' },
    { id: 'wash', title: 'Lavar', text: 'Acercate al lavadero y mantené acción. Si faltan agua o jabón, comprá insumos desde Pedidos.' },
    { id: 'hang', title: 'Tender y vigilar el cielo', text: 'Presioná acción junto a un lugar libre y soltá entre prendas. Consultá el pronóstico.' },
    { id: 'store', title: 'Guardar el pedido listo', text: 'Recogé la ropa seca y guardala en casa o un depósito. Si se ensució, volvé a lavarla.' },
    { id: 'deliver', title: 'Entregar y cobrar', text: 'En la puerta exterior, abrí Pedidos y entregá el encargo limpio, seco y completo.' },
    { id: 'home', title: 'Recorrer la casa', text: 'En la puerta presioná Entrar; caminá hasta muebles y familiares para interactuar.' },
    { id: 'build', title: 'Mejorar el patio', text: 'En Pausa → Construir patio, elegí una casilla permitida y confirmá la compra.' },
    { id: 'help', title: 'Trabajar con Jaqui', text: 'En Ayuda, máquinas y habilidades, asigná una tarea y reanudá. Ella respeta su canasto y los caminos.' },
    { id: 'rest', title: 'Descansar con mates', text: 'Cuando estén resueltos los pedidos que vencen hoy, elegí mates y revisá el resumen. Los futuros pueden esperar.' },
    { id: 'backup', title: 'Conservar una copia JSON', text: 'En Partidas y respaldos, exportá tu partida y conservá el archivo fuera del navegador.' }
  ];
  let lastState = null, elapsed = 0;
  function initialize(s) { if (!s.guide) s.guide = { hints: true, visitedHouse: s.scene === 'house', exported: false, done: [] }; observe(s); }
  function observe(s = Game.state.current) {
    if (!s?.guide) return;
    const delivered = s.orders.some(o => o.state === 'delivered');
    const orderItems = s.items.filter(p => p.orderId);
    if (s.scene === 'house') s.guide.visitedHouse = true;
    const washed = delivered || s.skills.maria.washing > 0 || orderItems.some(p => p.cleanliness === 100);
    const progress = {
      family: s.saved > 0, accept: s.orders.some(o => o.acceptedDay !== null),
      load: washed || orderItems.some(p => ['basket', 'helper', 'machine', 'hanging'].includes(p.status)), wash: washed,
      hang: delivered || orderItems.some(p => p.status === 'hanging'),
      store: delivered || s.orders.some(o => Game.orders.stage(o, s) === 'ready'), deliver: delivered,
      home: s.guide.visitedHouse, build: s.constructions.length > 0, help: s.workshop.helper.actions > 0,
      rest: s.family.restedDay > 0, backup: s.guide.exported
    };
    for (const step of steps) if (progress[step.id] && !s.guide.done.includes(step.id)) s.guide.done.push(step.id);
  }
  function tick(dt) {
    const s = Game.state.current;
    if (lastState !== s) { lastState = s; elapsed = 0; }
    elapsed += dt;
    if (elapsed >= .5) { elapsed %= .5; observe(s); }
  }
  function next(s = Game.state.current) { return s?.guide?.hints ? steps.find(step => !s.guide.done.includes(step.id)) : null; }
  function exported() {
    const s = Game.state.current;
    if (s?.guide && Game.saves.active) { s.guide.exported = true; observe(s); Game.saves.auto('copia JSON preparada'); }
  }
  function validate(s, check, number, object) {
    const g = s.guide;
    check(object(g) && typeof g.hints === 'boolean' && typeof g.visitedHouse === 'boolean' && typeof g.exported === 'boolean', 'guía');
    check(Array.isArray(g.done) && g.done.length <= steps.length && new Set(g.done).size === g.done.length && g.done.every(id => steps.some(step => step.id === id)), 'progreso de guía');
  }
  Game.guide = { steps, initialize, observe, tick, next, exported, validate };
})();

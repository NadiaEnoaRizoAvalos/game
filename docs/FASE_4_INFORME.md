# Fase 4 — Familia y economía

Completada en `feature/lavanderia-maria-carmen-v2`. Main y producción permanecen intactas.

Commit funcional subido y verificado en GitHub: `aaa462f` (`feat: incorporar familia gastos y descanso con mates`).

## Implementación

- Movimientos económicos atómicos e identificados; entregas, insumos y gastos comparten el libro de cuentas. Saldo, ingresos, egresos, cobros pendientes y últimos 50 movimientos consultables; historial completo en el JSON.
- Necesidades de alimentos ($6), útiles ($9), transporte escolar ($8) y arreglos ($7). Alimentos desde el primer día; eventos adicionales cada tres días, rotando. Como máximo una necesidad pendiente por tipo.
- Pago voluntario, sin multas ni descuentos automáticos. Reserva de $12 al pagar gastos familiares. Ayuda vecinal en especie una vez al día si no alcanza para insumos y faltan agua o jabón; no crea deuda.
- José y Jaqui como personajes dibujados con la paleta y primitivas originales, pequeñas caminatas y conversaciones. José asiste a la escuela hasta después del mediodía, salvo fines de semana. Jaqui todavía no automatiza tareas (Fase 7).
- Descanso opcional con silla y mate animado durante cuatro segundos. Requiere resolver pedidos que vencen hoy, permite dejar pendientes los futuros. Pausa detiene la animación. Resumen de ingresos, gastos, entregas, reputación, pendientes y pronóstico; permite continuar o avanzar.
- Formato de partida 4: migración de versiones 1–3, familia persistente, pagos validados contra eventos y protección frente a duplicados.

## Archivos

Nuevos: `js/config/family-config.js`, `js/systems/economy.js`, `js/systems/family.js`, `js/persistence/family-schema.js`, `js/ui/family-menu.js`, `js/rendering/family.js`, `tests/family.test.cjs` y este informe.

Integración: `index.html`, `js/core/engine.js`, `js/systems/calendar.js`, `js/systems/orders.js`, `js/persistence/format.js`, `js/persistence/laundry-schema.js`, `js/ui/screens.js`, `js/rendering/renderer.js`, `js/rendering/sprites.js`, `tests/browser.cjs`.

## Validación antes de Fase 5

- `node --test tests/*.test.cjs`: **46 aprobadas, 0 fallos**, incluidas las seis originales y seis nuevas de familia.
- `node --test tests/browser.cjs`: **1 escenario integral aprobado en Chrome**. Incluye pago por menú, conversación, mate, cierre de jornada y persistencia de pagos/descanso al recargar, además de las regresiones de IndexedDB, importación/exportación, lavandería y controles táctiles.
- Capturas de mates en escritorio y tablón familiar horizontal revisadas. Las pruebas incluyen resoluciones 390×844, 844×390 y 320×568.
- `git diff --check`: sin errores. Sin fallos pendientes detectados. No se probaron celulares físicos ni escucha humana de audio.

La condición autorizada para continuar a Fase 5 se cumplió. Para probar: Pausa → Familia y economía; pagar un gasto, conversar y elegir mates sin pedidos vencidos pendientes. Los valores y los tiempos se ajustan en la configuración familiar.

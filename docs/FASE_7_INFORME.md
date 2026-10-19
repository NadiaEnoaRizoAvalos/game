# Fase 7 — Automatización y habilidades

Completada en `feature/lavanderia-maria-carmen-v2`. Main y producción permanecen intactas. La usuaria autorizó Fase 8 después de aprobar todas las pruebas de esta fase; se verificó esa condición antes de comenzar el pulido.

## Implementado

- Lavarropas y secadora construibles en el patio con precios, madera, colisiones y accesos. Capacidades de 4 y 3 unidades de volumen; ciclos de 12 y 10 segundos. Energía ficticia de $2/$3 por lote.
- Carga voluntaria desde el canasto, junto a la máquina. El lavarropas usa agua y jabón al iniciar, sin duplicar consumo al recuperar un guardado; no toma prendas con lavado manual parcial. La secadora solo recibe ropa limpia y húmeda.
- Las máquinas retienen prendas identificadas, protegidas del clima, hasta que el jugador descarga lo que cabe. Las máquinas ocupadas no se mueven ni se retiran. Después de cinco lotes requieren mantenimiento de $6, con máquina vacía.
- Jaqui independiente: sale por la puerta interior, busca rutas libres y recoge/guarda, carga ropa limpia para tender o acerca ropa sucia al lavadero. El jugador recibe su canasto cerca de ella. Cancelar ordena volver a casa conservando y guardando lo transportado.
- Canasto de Jaqui de 4 unidades de volumen, ampliable a 6 con carrito. No comparte referencias duplicadas con el de María. Se revalidan objetivos si María recoge una prenda o ocupa un lugar antes que Jaqui.
- Tropiezos ocasionales mediante una secuencia determinista: influyen experiencia, caminos, lluvia y carga. Pausa breve y posible pérdida de cinco puntos de limpieza; la ropa no desaparece y puede lavarse otra vez. Guantes y práctica reducen el riesgo. Animación aditiva de tropiezo y canasto.
- Agenda comprable para rutina de recoger/tender con prioridad de plazos; no acepta pedidos ni cobra automáticamente. El jugador sigue decidiendo encargos, lavado, máquinas, inversiones y entregas.
- Filtro para reducir agua. Sensor y dos kits de cubierta como máximo para sogas nuevas elegidas; se despliegan con lluvia o pronóstico próximo. El sensor puede desactivarse. No protege todo el patio.
- Habilidades de María: lavado, organización, velocidad, eficiencia y gestión. Habilidades de Jaqui: coordinación, transporte, velocidad, confiabilidad y autonomía. Cada diez prácticas suman un nivel, hasta cinco. Beneficios acotados; la capacidad física siempre depende del canasto/carrito.
- Tablón Pausa → Ayuda, máquinas y habilidades. También se abre por acción cerca de máquinas o Jaqui en el patio. Historial económico incluye compras, ciclos y mantenimiento.
- Formato de partida **7**, con migración de 1–6. Guarda lotes, desgaste, pagos, objetivos de Jaqui, escena, canasto, tropiezos y experiencia. Las rutas se recalculan al cargar; los datos antiguos de habilidades/automatizaciones se conservan como legado.

## Archivos

Nuevos: `js/config/automation-config.js`, `js/systems/skills.js`, `js/systems/navigation.js`, `js/systems/helper.js`, `js/systems/automation.js`, `js/persistence/automation-schema.js`, `js/ui/automation-menu.js`, `tests/automation.test.cjs` y este informe.

Integración: `index.html`, motor, calendario, familia, casa, patio, lavado, recolección, pedidos, jugador, renderizado de familia/máquinas/prendas, pantallas, libro económico y esquemas de guardado, casa y lavandería. Se ampliaron las pruebas de navegador y se adaptó la prueba de datos reservados de persistencia.

## Validación para pasar a Fase 8

- `node --test tests/*.test.cjs`: **81 aprobadas, 0 fallos**, incluidas las seis originales y catorce nuevas de automatización.
- Lotes persistentes, capacidad por volumen, pausa, mantenimiento único, falta de insumos, lavados parciales, habilidades, sensores, Jaqui entre escenas, traslado, tendido, carreras por prendas, tropiezos recuperables, reanudación y archivos inválidos.
- Comparación de simulación a 5 y 60 FPS: mismo reloj, lote y posición de Jaqui.
- `node --test tests/browser.cjs`: **un escenario integral aprobado en Chrome**. Construye una máquina, inicia un lote desde el menú, asigna Jaqui, cierra y reabre el perfil, termina y descarga sin nuevo consumo. Conserva todas las regresiones anteriores y agrega menús de automatización/habilidades en móvil.
- Capturas revisadas de máquina/Jaqui en escritorio y tablón de automatización a 320×568. Prueba responsive también en 390×844 y 844×390.
- `git diff --check`: sin errores. No se detectaron fallos pendientes en las pruebas ejecutadas.

No se probaron celulares físicos, Safari/Firefox ni escucha humana del audio. La integración acelera esperas y modifica presupuesto/duración del día únicamente en su escenario de prueba. No hay progreso con la página oculta, pausada o cerrada.

## Cómo probar

1. En Pausa → Construir patio, instalar lavarropas/secadora con dinero y madera del juego.
2. Cargar un pedido, acercarse al frente de la máquina y abrir Ayuda, máquinas y habilidades para iniciar un lote.
3. Reanudar, esperar y descargar; guardar en medio del proceso y continuar para comprobar que no se paga de nuevo.
4. Asignar a Jaqui recoger/guardar o transportar; consultar su estado y recibir su canasto cerca de ella.
5. Comprar agenda, filtro, carrito o sensor cuando alcance el saldo; consultar Habilidades para ver la práctica acumulada.

El commit funcional se identifica en el historial y en la entrega. Fase 8 autorizada únicamente tras la validación anterior.

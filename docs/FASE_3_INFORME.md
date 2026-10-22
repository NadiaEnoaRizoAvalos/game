# Fase 3 — Clima, calidad y reputación

Implementada exclusivamente en `feature/lavanderia-maria-carmen-v2`, después de aprobar las 31 pruebas de lógica y el escenario integral de navegador de Fase 2. No se modificó main ni se realizó merge o despliegue. La Fase 4 queda pendiente de aprobación.

## Funcionalidades

- Ocho condiciones climáticas: sol, calor, nubes, brisa, viento, llovizna, lluvia y tormenta. Cuatro tramos por jornada, avisos anticipados y transiciones graduales de lluvia y viento.
- Pronóstico consultable desde Pausa, con horarios del día y tendencia del siguiente. El HUD indica el próximo cambio; se mantienen los efectos y sonidos originales.
- Secado según tela, temperatura, humedad, sol, sombra y viento. La lluvia humedece ropa expuesta; las prendas almacenadas están protegidas.
- El viento fuerte ensucia ropa tendida, con protección parcial cerca de árboles. El calor intenso afecta la limpieza de prendas delicadas casi secas. Volver a lavar permite recuperar la calidad.
- Entregas incompletas, húmedas o por debajo de la calidad solicitada se bloquean. El tablón muestra limpieza y humedad por prenda.
- Reputación inicial 60 y confianza por cliente. Entrega puntual: +3 reputación; retraso de un día: -2. Desde dos días de retraso se registra una queja grave y -8, una sola vez por pedido. Resolverlo permite recuperar parte de la relación.
- Tres quejas graves del mismo cliente suspenden sus ofertas durante tres días. Al cumplirse el plazo vuelve a ofrecer pedidos; no hay expulsión definitiva.
- Demanda diaria de una, dos o tres ofertas según reputación. Los clientes habituales requieren tres entregas puntuales y confianza mínima 60, y pagan $5 adicionales en futuras ofertas.
- Guardado formato 3 con validación de pronósticos, reseñas, quejas y sus vínculos. Migración desde formatos 1 y 2, manteniendo pedidos y progreso. Si una partida antigua sitúa al personaje donde aparece el nuevo lavadero, se lo reubica fuera de la colisión.
- Los tablones extensos desplazan su contenido manteniendo el fondo original de madera, incluso en pantallas pequeñas.

## Archivos modificados

Nuevos: `js/config/climate-config.js`, `js/systems/climate.js`, `js/systems/reputation.js`, `js/persistence/climate-schema.js`, `js/ui/climate-menu.js` y `tests/climate.test.cjs`.

Integración: `index.html`, `style.css`, `js/persistence/format.js`, `js/persistence/laundry-schema.js`, `js/rendering/renderer.js`, `js/systems/calendar.js`, `js/systems/laundry.js`, `js/systems/orders.js`, `js/systems/player.js`, `js/systems/weather.js`, `js/ui/hud.js`, `js/ui/orders-menu.js`, `js/ui/screens.js`, `tests/browser.cjs` y `tests/laundry.test.cjs`.

Documentación de cierre: README, este informe e identificación del commit de interfaz en el informe de Fase 2.

## Pruebas realizadas

- `node --test tests/*.test.cjs`: **40 aprobadas, 0 fallos**, incluidas las seis originales. Cubren reloj, continuidad, persistencia, ciclo comercial, clima, calidad, reputación, suspensiones, recuperación y migraciones.
- `node --test tests/browser.cjs`: **un escenario integral aprobado con Chrome real**. IndexedDB persiste al cerrar y abrir el perfil; exportación/importación, confirmación/cancelación, rechazo de JSON inválido, recuperación y fallo de transacción verificados.
- Ciclo completo mediante tablón y tecla Espacio: aceptar, cargar, lavar, tender, recoger, guardar y entregar sin doble cobro. El escenario acelera esperas y reposiciona al personaje para ejercitar las interacciones.
- Reputación conservada después de recargar y continuar. Menús de pronóstico y clientes revisados en capturas.
- Controles multitáctiles emulados y pantallas 390×844, 844×390 y 320×568. Se revisaron desplazamiento de tablones, botones y posición del HUD con distintos climas.
- `git diff --check`: sin errores. Capturas y perfiles de prueba están en `.test-artifacts/`, excluida de Git.

## Límites y alcance

No se probaron celulares físicos, Safari o Firefox ni se realizó escucha humana del audio. Edge no pudo iniciarse en la automatización; se utilizó Chrome. La emulación no certifica todos los dispositivos.

El clima utiliza un ciclo determinista de cuatro días; no consulta servicios meteorológicos. Las quejas graves corresponden a retrasos porque el juego impide entregar prendas defectuosas. No se incorporaron deudas, quiebra, gastos familiares, construcciones ni nuevos personajes dibujados. No se avanzó a Fase 4.

## Commit funcional

- `d642226`: pronósticos, clima dinámico, calidad recuperable, reputación, migraciones y pruebas.

## Revisión manual sugerida

1. Iniciar el servidor indicado en README y continuar una partida existente o crear una nueva.
2. Abrir Pausa → Pronóstico y reputación; consultar el próximo cambio.
3. Completar un pedido antes del plazo y comprobar dinero, confianza y reputación.
4. Guardar, cerrar el navegador y continuar; verificar prendas y relación con el cliente.
5. Exportar el JSON, avanzar y volver a importarlo confirmando el reemplazo.

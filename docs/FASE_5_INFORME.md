# Fase 5 — Casa explorable

Completada en `feature/lavanderia-maria-carmen-v2`, tras pasar las 46 pruebas de lógica y la integración de navegador de Fase 4. No se avanzó a Fase 6. Main, producción y el despliegue original permanecen intactos.

## Implementación

- Entrada física con Espacio o el mismo botón táctil en la puerta exterior; salida por la puerta interior. Cámara, sprite original, joystick y movimiento en ocho direcciones reutilizados.
- Cocina/comedor, dormitorio familiar y depósito iniciales, con paredes, puertas y muebles que participan en las colisiones. José y Jaqui caminan y conversan dentro, respetando el horario escolar de José.
- Mesa para mates, cama para descanso, cocina para asuntos familiares y estante para guardar/cargar pedidos. La entrega al cliente sigue requiriendo la puerta exterior.
- Ampliaciones comprables para María Carmen, José y Jaqui, y lavadero cubierto. Requieren dinero ficticio, madera y la habitación que les da acceso. Las puertas se abren al adquirir las habitaciones contiguas.
- Compra de armario, ventana con flores, alfombra, camas individuales, escritorio escolar y pileta interior. Los muebles se instalan en posiciones preparadas para preservar pasillos y accesos. La colocación libre del patio corresponde a Fase 6.
- Materiales: $18 por 6 unidades de madera. Precios y consumos centralizados en `js/config/house-config.js`; las compras reservan $12 para insumos y registran un movimiento único. No hay compras duplicadas ni consumo de materiales inexistentes.
- La pileta interior usa la misma lógica de lavado y consumo de agua/jabón. La ropa se tiende en el patio. El canasto dentro queda protegido de lluvia y polvo; el clima, las sogas y los pedidos exteriores continúan su simulación.
- Guardado formato 5 con escena, posición interior, plano, muebles y materiales. Migraciones desde formatos 1–4 preservan los datos anteriores de casa en `house.legacy` y los restantes progresos. Posiciones de José y Jaqui se adaptan al plano al migrar.
- Validación de compras contra mejoras instaladas, balance de madera y posiciones transitables. Los toques breves de interacción se conservan hasta el siguiente paso de simulación; pausar los descarta.
- Interior dibujado con primitivas y paleta del juego; fachada y distribución exterior originales conservadas. Las ampliaciones se representan en el plano interior, sin ocupar nuevas zonas del patio.

## Archivos

Nuevos: `js/config/house-config.js`, `js/systems/house.js`, `js/persistence/house-schema.js`, `js/ui/house-menu.js`, `js/rendering/house.js`, `tests/house.test.cjs` y este informe.

Integración: `index.html`, `js/persistence/format.js`, `js/persistence/laundry-schema.js`, `js/rendering/renderer.js`, `js/rendering/sprites.js`, `js/systems/calendar.js`, `js/systems/climate.js`, `js/systems/collection.js`, `js/systems/family.js`, `js/systems/laundry.js`, `js/systems/orders.js`, `js/systems/player.js`, `js/ui/hud.js`, `js/ui/screens.js`, `js/input/controls.js`, `tests/browser.cjs` y `tests/persistence.test.cjs`. README actualizado.

## Pruebas

- `node --test tests/*.test.cjs`: **55 aprobadas, 0 fallos**, incluidas las seis originales. Nueve nuevas pruebas de casa, seis de familia y regresiones de las fases anteriores.
- Recorrido mediante búsqueda de caminos por cuadrícula de 5 unidades en el plano completamente ampliado y amueblado: todas las habitaciones y puntos de interacción alcanzables desde la entrada.
- Colisiones con paredes y muebles; cruce de puertas; compras únicas, reserva comercial, materiales y dependencias; almacenamiento sin duplicación; lavado interior; protección de canasto y simulación exterior; pausa; JSON interior; migración v4 y rechazo de datos inválidos.
- `node --test tests/browser.cjs`: **1 escenario integral aprobado en Chrome**. Incluye entrada/salida por teclado y táctil, caminar dentro, abrir estante, comprar materiales/habitación/cama mediante el menú, cerrar/reabrir el contexto persistente dentro de una habitación e importar/exportar una partida interior. También conserva las pruebas de IndexedDB, recuperación, abortos de transacción, lavandería, reputación y familia.
- Capturas revisadas de interior en escritorio y celular vertical, y menú de muebles horizontal. Resoluciones de integración: 390×844, 844×390 y 320×568.
- La integración detectó una pulsación demasiado breve para el muestreo por fotogramas; se corrigió con una entrada pendiente y se añadió una regresión. El escenario final pasó sin errores de página.
- `git diff --check`: sin errores. Capturas y perfiles permanecen fuera de Git en `.test-artifacts/`.

## Límites

No se probaron dispositivos Android/iPhone físicos, Safari o Firefox ni se realizó escucha humana del audio. La integración usa Chrome y multitáctil emulado. Algunas esperas y recorridos se aceleran o reposicionan por API para ejercitar las interacciones; el presupuesto para las compras se amplía solo en el escenario de prueba.

Los familiares todavía no transportan ni procesan ropa automáticamente; corresponde a Fase 7. No se implementaron construcción libre del patio ni máquinas. No hay deudas ni quiebra automática: los gastos familiares se pueden aplazar y existe ayuda para recuperar insumos.

## Cómo revisar

1. Iniciar `python -m http.server 8000` en la carpeta del juego y abrir `http://localhost:8000`.
2. Continuar una partida o crear una nueva. Junto a la puerta, presionar Espacio/Entrar.
3. Caminar por los pasillos del interior; acercarse al estante para guardar/cargar prendas y a muebles o familiares para interactuar.
4. En Pausa → Casa y muebles, comprar materiales y mejoras cuando alcance el saldo.
5. Guardar dentro, cerrar el navegador y continuar. Exportar un JSON e importarlo confirmando el reemplazo.
6. Volver a la puerta interior y presionar Salir. Comprobar que el patio conserva la ropa y el progreso.

Commit funcional subido y verificado en GitHub: `5ccad55` (`feat: incorporar casa explorable habitaciones y muebles persistentes`). El cierre documental queda en un commit separado, identificado en el historial y en la entrega.

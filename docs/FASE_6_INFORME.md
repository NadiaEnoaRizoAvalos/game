# Fase 6 — Construcción del patio y herramientas

Implementada exclusivamente en `feature/lavanderia-maria-carmen-v2`. Se conserva el patio original y se agregan objetos en las zonas permitidas. No se avanzó a Fase 7.

## Funcionalidades

- Pausa → Construir patio y herramientas: catálogo con precios y materiales. Cuadrícula de 20 unidades, previsualización, indicación de lugar válido/inválido y confirmación explícita antes de comprar.
- Selección mediante mouse, toque o flechas/WASD. Enter/Espacio confirman; R gira cercos; Escape/P o Salir cancelan la selección. En celulares hay flechas y botones propios; el joystick vuelve al terminar.
- La simulación se detiene durante la construcción. La cámara de edición deja espacio para el HUD y la barra inferior, manteniendo visible el objeto seleccionado.
- Caminos (+15% de velocidad al caminar sobre ellos), flores decorativas, árboles, arbustos, cercos horizontales/verticales, sogas, tendederos protegidos, lavaderos y depósitos.
- Cada soga nueva agrega dos lugares reales con identidad estable, sin cambiar los ocho originales. Las prendas conservan sus IDs, pedido, humedad y limpieza al guardar y recuperar.
- Los techos reducen un 90% la humectación por lluvia y reducen el polvo, con secado más lento bajo cubierta. No garantizan protección absoluta. Los árboles agregados producen sombra y reducen polvo igual que los originales.
- Los lavaderos nuevos usan el lavado existente; los depósitos permiten cargar y guardar en el inventario protegido compartido con la casa. Las entregas a clientes siguen requiriendo la puerta exterior.
- Canastos de 8 y 12 **unidades de volumen**, y tabla que reduce 20% el tiempo de lavado sin modificar el consumo de agua/jabón. Se respeta la capacidad previa al migrar partidas antiguas.
- Mover objetos nuevos sin costo. Retirar pide confirmación en la interfaz y devuelve la mitad del precio en dinero, redondeada hacia abajo; no devuelve madera. Sogas ocupadas no se pueden mover ni retirar. La ropa almacenada no se elimina al retirar un depósito.
- Cada compra/reintegro tiene un movimiento económico único. Se reservan $12 para insumos. Los materiales usan la misma madera que las ampliaciones de casa, con balance validado incluso después de retirar construcciones.

## Geometría y persistencia

No se permite superponer objetos, salir del cerco, ocupar el patio original ni bloquear sus accesos protegidos. Las posiciones se ajustan a la cuadrícula. Los árboles tienen colisión de tronco; sogas, de postes; flores y caminos son transitables.

Antes de instalar o mover se recorre una malla de navegación de 10 unidades desde la casa. Se comprueba que María no quede encerrada y que las sogas y las zonas de uso de lavaderos/depósitos sigan libres y alcanzables. La comprobación es conservadora y puede rechazar pasillos demasiado estrechos. José y Jaqui continúan dentro de la vivienda; no se agregó su automatización de patio.

El formato de partida es **6**. Acepta y migra versiones 1–5; los antiguos contenedores de construcción se conservan en `yard.legacyConstructions`. Se guardan objetos, ubicaciones, orientación, retiros, herramientas, secuencias y prendas de sogas nuevas. La previsualización no se guarda como una compra. Se mantienen IndexedDB, respaldos y JSON sin cambiar los almacenes de la base.

Límites de esta etapa: 64 construcciones activas y 1000 registros de construcción por partida, incluidos retiros. Los objetos retirados conservan su historial para comprobar compras y evitar reintegros duplicados.

## Archivos

Nuevos: `js/config/yard-config.js`, `js/systems/yard.js`, `js/persistence/yard-schema.js`, `js/ui/build-menu.js`, `js/rendering/yard.js`, `tests/yard.test.cjs` y este informe.

Integración: `index.html`, `style.css`, `js/main.js`, `js/input/controls.js`, `js/persistence/format.js`, `js/persistence/house-schema.js`, `js/persistence/laundry-schema.js`, `js/rendering/laundry.js`, `js/rendering/renderer.js`, `js/systems/calendar.js`, `js/systems/climate.js`, `js/systems/house.js`, `js/systems/laundry.js`, `js/systems/player.js`, `js/ui/screens.js`, `js/ui/family-menu.js`, `tests/browser.cjs`, `tests/persistence.test.cjs` y README.

## Pruebas y resultados

- `node --test tests/*.test.cjs`: **67 aprobadas, 0 fallos**, incluidas las seis originales y doce nuevas de patio.
- Compras, materiales compartidos, reintegros únicos, cupos de herramientas, respeto de la cuadrícula y zonas protegidas, superposición, colisiones, cerco que intenta encerrar a María, frente de depósito bloqueado, capacidad por volumen y migración de un canasto antiguo.
- Nuevas sogas con prendas reales, capacidad y posiciones después de JSON; impedir mover/retirar sogas ocupadas; reubicación y retiro posterior sin perder prendas; lluvia, polvo, sombra, caminos, lavadero y depósito adicionales.
- Días continuos, pausa de construcción, previsualizar/cancelar sin cobro, compras falsas, madera alterada y formatos antiguos.
- `node --test tests/browser.cjs`: **un escenario integral aprobado en Chrome**. Incluye selección y confirmación por menú/teclado/táctil, lugar inválido, reubicación, cancelación y confirmación de retiro, herramientas y materiales, ropa tendida en la soga nueva, cierre/reapertura del perfil de navegador, exportación/importación del patio y los controles de las fases anteriores.
- Capturas revisadas: escritorio, celular vertical, horizontal y 320×568. Comprobación de que la barra permanece dentro de la pantalla y no tapa la previsualización seleccionada. Los botones usan los estilos originales de madera.
- `git diff --check`: sin errores. No se detectaron fallos pendientes en estas pruebas.

Limitaciones: no se probaron celulares físicos, Safari ni Firefox, ni se escuchó el audio con una persona. Se usó Chrome y multitáctil emulado. El escenario amplía el dinero y acelera/reubica partes de la simulación para comprobar las funciones; esto no modifica las partidas normales. Las capturas y perfiles están en `.test-artifacts/`, excluida de Git.

## Cómo probar

1. Ejecutar el servidor local descrito en README y continuar una partida o crear una nueva.
2. Abrir Pausa → Construir patio y herramientas. Comprar materiales cuando alcancen las ganancias.
3. Elegir una soga o decoración, mover su previsualización a una zona libre y confirmar. Comprobar que un lugar ocupado no permite confirmar.
4. Lavar y tender prendas en la nueva soga. Intentar moverla con ropa y después recogerla para poder reorganizarla.
5. Probar una compra de canasto: el límite sigue siendo por volumen.
6. Guardar, cerrar y reabrir; exportar/importar el JSON y revisar el patio.

Commit funcional subido y verificado en GitHub: `779c005` (`feat: agregar construccion de patio y herramientas persistentes`). El cierre documental queda en un commit separado, identificado en el historial y en la entrega. La siguiente fase, automatización, requiere aprobación.

# Cierre de Antes de la lluvia 2.0

Fecha: 21 de octubre de 2026.

## Estado antes de incorporar a main

La mejora final se implementó y validó en `feature/lavanderia-maria-carmen-v2`.
El commit funcional `b505036` se publicó correctamente en esa misma rama.
La incorporación a `main` está autorizada por el pedido de cierre y se ejecutará
después de publicar esta documentación y comunicar los resultados. Este registro
previo no afirma que el merge o el push de main ya hayan ocurrido.

## Juego incorporado

- Fase 1: reloj independiente de FPS, días continuos, canasto por volumen,
  IndexedDB, autoguardado, guardado manual, JSON validado y respaldos.
- Fases 2 y 3: pedidos, lavado, tendido, secado y cobro; pronóstico, ocho climas,
  calidad, reputación, quejas y recuperación de clientes.
- Fases 4 y 5: economía familiar, necesidades aplazables, conversaciones,
  descanso, casa transitable, habitaciones, muebles y materiales.
- Fase 6: construcciones movibles, sogas, protecciones, caminos, depósitos,
  herramientas, ampliación del canasto y protección de accesos.
- Fases 7 y 8: máquinas por lote, mantenimiento, tareas de Jaqui, habilidades,
  automatizaciones limitadas, guía persistente, sonido y rendimiento.
- Cierre: los vecinos tienen presencia física en el patio y retratos en la
  atención dentro de la casa. Se conserva el arte original y los controles.

Los informes de cada fase permanecen como registros históricos de su entrega.
`PR_BORRADOR.md` es una propuesta histórica: no se creó ese PR. El cierre actual
autoriza una integración mediante Git sin necesidad de crear un PR.

## Clientes y atención

Los pedidos disponibles del día producen una fila de hasta tres vecinos junto
al lateral de la entrada. Se marca ESPERA y se dibuja cada personaje con
rectángulos, colores y proporciones coherentes con el juego. Doña Rosa, Profesor
Daniel, Doña Olga y un representante de Familia Suárez usan variantes propias.
No se agregaron paquetes de sprites ni dependencias.

Los visitantes no agregan obstáculos. Si una construcción ocupa un lugar,
se escoge otro libre; el frente ya protegido de la entrada sirve como respaldo.
Los clientes aparecen al generarse las ofertas diarias, sin simular un recorrido
desde fuera del mapa. Su presencia depende del pedido, no de otra copia del estado.

Acercarse y presionar Espacio o la acción táctil lleva a María a la casa y abre
el tablón de atención con retrato, nombre, historia, tipo y cantidad de prendas,
precio, día de entrega, urgencia y limpieza requerida. Desde dentro también se
accede mediante Pausa → Atender vecinos. La simulación se pausa durante la atención.

Aceptar usa el sistema existente: genera una sola vez las prendas del encargo.
Rechazar registra `rejected` y `rejectedDay`, sin prendas, cobros, consumos ni
penalización de reputación. En ambos casos el vecino se retira de la fila.
El botón Atender siguiente vecino continúa la atención dentro de la casa.
El tablón original permanece disponible y las entregas se cobran en la puerta exterior.

El formato 9 guarda las decisiones y admite migraciones de formatos 1–8.
Las ofertas restauradas reconstruyen la fila sin duplicar clientes ni prendas.
Aceptar y rechazar autoguardan, además del guardado manual y los puntos de
autoguardado existentes. No se requiere que haya un guardado previo para jugar.

## Archivos de la mejora y el cierre

| Archivos | Cambio |
| --- | --- |
| `js/systems/customers.js` (nuevo) | Fila, selección de lugares libres, proximidad y atención en casa. |
| `js/rendering/customers.js` (nuevo) | Pixel art de vecinos, zona de espera y retratos reutilizados en el tablón. |
| `js/systems/orders.js` | Rechazo idempotente y autoguardado. |
| `js/systems/house.js` | Interacción exterior y entrada validada para atender al vecino cercano. |
| `js/ui/orders-menu.js` | Retrato, condiciones, aceptar/rechazar y atender al siguiente. |
| `js/ui/screens.js` | Acceso desde pausa e instrucciones. |
| `js/rendering/renderer.js`, `index.html` | Composición por profundidad y carga de los módulos. |
| `js/persistence/format.js`, `js/persistence/laundry-schema.js` | Formato 9, compatibilidad y validación de rechazos. |
| `style.css` | Estilos del canvas de juego limitados a `#game`; retrato de 90×90 sin superposición móvil. |
| `tests/customers.test.cjs` (nuevo) | Cinco pruebas de lógica del sistema. |
| `tests/browser.cjs` | Recorrido real de atención, decisiones, persistencia y tamaños móviles. |
| `README.md`, `docs/CIERRE_FINAL.md`, `docs/PR_BORRADOR.md` | Uso, alcance, resultados e integración. |

## Pruebas ejecutadas

- `node --test tests/*.test.cjs`: **96 aprobadas, 0 fallidas**, incluidas las seis
  originales. Reloj a 5, 10, 20, 30 y 60 FPS, continuidad, integridad de prendas,
  migraciones, importaciones inválidas, recursos, familia, casa, construcciones,
  máquinas, tareas, guía y balance de treinta jornadas con noventa pedidos.
- Cinco pruebas nuevas: correspondencia fila/ofertas y movimiento libre;
  interacción en casa y contenido del panel; aceptación/rechazo idempotentes y
  continuidad diaria; recuperación de formato 8 y rechazo de datos adulterados;
  espera compatible con construcciones existentes.
- `node --test tests/browser.cjs`: **un escenario integral aprobado** en Chrome
  con Playwright, HTTP local, perfiles separados e IndexedDB real. Cierre completo
  y reapertura, descarga JSON, importación con confirmar/cancelar, archivos inválidos,
  fallos de almacenamiento, respaldos y funcionalidades de las fases anteriores.
- La ampliación comprueba tres vecinos exteriores, atención con teclado y toque,
  retrato con píxeles visibles, aceptar y rechazar desde los botones, reapertura
  con un pedido aceptado, otro rechazado y un visitante disponible, y atención
  desde el interior restaurado.
- Móvil emulado: **390×844, 844×390 y 320×568**, controles simultáneos, atención,
  botones accesibles y rechazo persistente en la sesión. El retrato debe medir
  como máximo 100×100 y terminar antes del título, sin tapar el texto.
- Se revisaron capturas del patio, atención de escritorio, retrato en móvil
  pequeño y decisiones en horizontal. Se detectó y corrigió una regla global
  de canvas que agrandaba el retrato; el escenario se repitió con éxito.
- `git diff --check`: sin errores de espacios. Las capturas y perfiles quedan
  en `.test-artifacts/`, excluida de Git.

Las pruebas no sustituyen una sesión física en Android/iPhone. No se probaron
Safari ni Firefox, ni se hizo una revisión auditiva humana. El balance acelerado
comprueba coherencia con buen servicio, no la dificultad para una persona.

## Commits y estrategia de integración

Commit funcional de este cierre: `b505036` — vecinos visibles, atención,
decisiones persistentes, estilos y pruebas. Publicado en la rama feature.
La documentación del cierre se publica en un segundo commit antes del merge.

Commits previos relevantes: `ee5b627` (pedidos), `d642226` (clima y reputación),
`aaa462f` (familia), `5ccad55` (interior), `779c005` (patio), `fe32498` (automatización)
y `b8117be` (guía y pulido). La integración conservará todo el historial.

Estrategia prevista: actualizar referencias remotas, comprobar limpieza y
ascendencia, actualizar main sin sobrescribir cambios y realizar
`git merge --no-ff feature/lavanderia-maria-carmen-v2`. Repetir pruebas en el árbol
integrado, publicar main y comparar el hash remoto. Sin force push, rebase,
reescritura del historial ni eliminación de ramas.

## Cómo probar

Desde la carpeta del repositorio, ejecutar `python -m http.server 8000` y abrir
[http://localhost:8000](http://localhost:8000). No hay compilación ni dependencias
de ejecución. Usar siempre el mismo navegador, dirección y puerto para recuperar
la partida. En celular, usar la dirección LAN del equipo servidor y el mismo
puerto; sus datos pertenecen al origen de ese dispositivo y se trasladan por JSON.

Iniciar una partida, acercarse a un vecino de la fila y presionar acción.
Aceptar uno, rechazar otro, guardar y cerrar el navegador; al abrir la misma
dirección, Continuar debe recuperar los pedidos y el visitante restante.
En Pausa → Partidas y respaldos se guarda manualmente, exporta e importa JSON
con confirmación antes de reemplazar.

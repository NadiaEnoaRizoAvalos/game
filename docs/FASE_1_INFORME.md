# Fase 1 — Reloj, jornadas y persistencia

Fecha: 18 de octubre de 2026. Rama: `feature/lavanderia-maria-carmen-v2`.

## Implementado

- Reloj con acumulador y pasos de simulación de 1/60 s: ya no descarta el exceso
  de tiempo de frames lentos. Pausa, cambio de foco y orientación conservan el
  comportamiento de los controles y no generan progreso fuera de la partida.
- Jornadas continuas de 240 segundos por defecto, configurables para nuevas
  partidas en `js/config/game-config.js`. El HUD muestra día, franja y hora.
- Al llegar a la noche se presenta un resumen. Se puede continuar en el patio,
  cerrar la jornada antes desde Pausa o avanzar al día siguiente.
- No se recrea el estado al cambiar de día: persisten identidad y humedad de las
  prendas, canasto, puntos, recursos y contenedores de progreso futuro.
- Los lugares libres de las sogas reciben prendas al comenzar otra jornada.
  Es una regla provisional para que la recolección original siga siendo jugable;
  no implementa pedidos ni lavado de la Fase 2.
- Canasto de 6 unidades de volumen, con capacidad propia por partida. La
  validación y el dibujo de llenado usan esa capacidad; no se agregan compras aún.
- Estado preparado para recursos, pedidos, inventario, personajes, casa,
  construcciones, mejoras, habilidades y automatizaciones. Los sistemas futuros
  no están implementados y no se presentan como disponibles.
- IndexedDB con versión de base 1 y formato JSON 1. Cada prenda se guarda una vez
  y el canasto se reconstruye con referencias a esos mismos objetos.
- Guardado manual, autoguardado por eventos y cada 30 segundos jugados. Cola de
  escrituras ordenada, snapshots independientes y confirmación tras commit real.
- Exportación JSON descargable, validación de estructura/versión/rangos/IDs/
  ubicaciones/volumen y confirmación de importación antes de reemplazar.
- Copia anterior y archivo de respaldos de reemplazos, recuperables desde el menú.
  Un fallo de escritura no reemplaza silenciosamente la partida actual.
- Sin IndexedDB disponible se permite iniciar una partida en memoria y exportar,
  mostrando el error. No se usa localStorage para partidas ni se agrega backend.
- Menús ampliados con los mismos tablones, botones y colores. Se corrigió una
  etiqueta duplicada de puntos en horizontal y se dividió franja/hora en dos
  líneas solo en pantallas muy pequeñas para mantener visible el botón de pausa.

## Archivos

Nuevos:

- `js/systems/calendar.js`: jornadas y generación en lugares libres.
- `js/persistence/format.js`: snapshots, validación y reconstrucción.
- `js/persistence/database.js`: transacciones IndexedDB y respaldos.
- `js/persistence/saves.js`: cola, autoguardado, recuperación y reemplazos.
- `js/ui/save-menu.js`: guardado, selector de archivos, descarga y respaldos.
- `tests/helpers.cjs`: cargador compartido del juego en DOM simulado.
- `tests/calendar.test.cjs`, `tests/persistence.test.cjs`, `tests/browser.cjs`.
- `.gitignore` y este informe.

Modificados:

- `index.html`, `js/main.js`: módulos nuevos, selector JSON e inicialización.
- `js/core/state.js`, `js/core/engine.js`: perfil climático, reloj y jornadas.
- `js/config/game-config.js`: duración y paso configurables.
- `js/systems/collection.js`: capacidad por partida, validación y autoguardado.
- `js/systems/weather.js`: usa perfil de jornada o adaptador original.
- `js/rendering/renderer.js`, `js/rendering/sprites.js`: solo lectura del perfil
  climático y capacidad; no se cambian dibujos, geometría, colores ni animaciones.
- `js/ui/hud.js`, `js/ui/screens.js`: día/hora y navegación de jornadas/partidas.
- `js/integrations/webmcp.js`: consulta de día y hora.
- `style.css`: dos ajustes de legibilidad responsive, sin rediseño.
- `tests/game.test.cjs`: comparte el cargador; conserva las seis pruebas originales.
- `README.md`: ejecución, controles, guardados y desarrollo.

## Pruebas ejecutadas

`node --test tests/*.test.cjs`: **22 pruebas aprobadas, 0 fallos**.

- Las seis regresiones originales: arranque, colisiones/acceso a sogas,
  movimiento diagonal, pausa, recogida/descarga sin doble puntuación, clima,
  joystick y cámara en distintas orientaciones.
- Reloj a 5, 10, 20, 30 y 60 FPS; frame de seis segundos y remanentes
  fraccionarios; equivalencia de humedad; pausa/reanudación sin salto temporal.
- Cambio de día conservando referencias, canasto y progreso; duración configurable
  e inicio/renderizado de jornadas incluso con el catálogo de niveles vacío.
- Capacidad por volumen, recogida duplicada, round-trip JSON y descarga después
  de restaurar sin duplicar puntos.
- Rechazo de JSON malformado, versiones incompatibles, campos incompletos, claves
  peligrosas, IDs duplicados, humedad inválida, recursos negativos, posiciones
  bloqueadas, ubicación contradictoria y sobrecarga.
- Confirmaciones canceladas, errores de escritura, reintentos, orden de snapshots,
  puntos de autoguardado, respaldo previo y bloqueo de reanudación al importar.
- Inicio sin datos y exportación cuando el almacenamiento no está disponible.

`node --test tests/browser.cjs`, con Playwright y Chrome instalado:
**1 escenario integral aprobado** que verifica:

- Base IndexedDB real y lectura después de cerrar el navegador completo y abrir
  de nuevo su perfil de prueba.
- Descarga JSON mediante el botón, selección de archivo, importación cancelada,
  confirmada e inválida, y recuperación de un respaldo tras autoguardados posteriores.
- Aborto real de una transacción IndexedDB conservando los datos previos.
- Avance de jornada desde la interfaz y ausencia de errores JavaScript de página.
- Capturas de escritorio (1280×900) y móvil (390×844, 844×390 y 320×568).
- Eventos táctiles emulados con dos contactos simultáneos: joystick y Recoger,
  liberación de entradas y botones dentro del viewport.

También se revisaron capturas de los menús y el patio. Los artefactos locales están
en `.test-artifacts/` y no se suben al repositorio. `git diff --check` sin errores.

## Límites y pendientes

- Edge se cerró al iniciar el proceso de prueba incluso con permisos; la
  integración se verificó con Chrome. No se certifica Edge, Firefox o Safari.
- No se probó un dispositivo físico, teclado virtual móvil ni se escuchó audio.
  El código de controles y audio original se conserva.
- No hay simulación offline: cerrar el navegador recupera el último guardado
  confirmado. Una interrupción abrupta puede perder el intervalo desde ese guardado.
- Las animaciones transitorias y el progreso parcial de recoger no se guardan;
  la identidad, ubicación y humedad de las prendas sí.
- El esquema admite hasta 20.000 prendas y 5 MB por archivo importado. Todavía no
  se agrega archivado de historial de prendas para campañas extremadamente largas.
- Los respaldos están en el mismo navegador. Exportar JSON sigue siendo necesario
  para conservarlos fuera de los datos del sitio o trasladarlos a otro dispositivo.
- La aplicación no coordina edición simultánea de la misma partida en varias
  pestañas; conviene jugar en una sola. No hay sincronización entre dispositivos.
- El adaptador de niveles original queda disponible para regresiones internas;
  la interfaz de nueva partida y la simulación continua no dependen de él.

## Cómo revisar la fase

1. En la carpeta del proyecto, ejecutar `python -m http.server 8000`.
2. Abrir `http://localhost:8000` y elegir Nueva partida.
3. Recoger con Espacio o Recoger; descargar en la puerta y comprobar puntos.
4. Pausar y abrir Partidas y respaldos; guardar y exportar el JSON.
5. Cerrar y reabrir el navegador en la misma dirección; elegir Continuar partida.
6. Importar el JSON; probar tanto cancelar como confirmar.
7. Finalizar día desde Pausa y avanzar; comprobar que se conserva el canasto y
   las prendas pendientes. También se puede esperar la noche automáticamente.
8. Probar Recuperar copia anterior y Respaldos de reemplazos.

## Historial y siguiente fase

- `76b9cc3`: jornadas continuas y reloj independiente de FPS; publicado y verificado.
- `bd7987e`: IndexedDB, importación/exportación y pruebas; publicado y verificado.
- `3773647`: recuperación protegida, respaldos accesibles, configuración y HUD móvil; publicado y verificado.
- El hash del commit de documentación se reporta en la entrega.

Main permanece en `3fb830ebd8702adfa472b5d4209c68e70174f343`.
No se hace merge, no se modifica despliegue y no se abre un PR de versión final
todavía: el proyecto continúa por fases.

**Fase 2 pendiente de aprobación:** clientes, pedidos, lavado, secado y entregas.
No comenzar hasta que la usuaria revise y apruebe esta fase.

# Fase 0 — Diagnóstico de Antes de la lluvia 2.0

Fecha: 18 de octubre de 2026.

## Preparación y alcance

- Entorno Windows con acceso real a `G:\WINDOWS\Desktop\Proyectos\antes de la lluvia`.
- Carpeta inspeccionada y vacía antes de clonar; no había cambios locales que proteger.
- Git 2.37.0.windows.1 y Node.js v24.14.0 disponibles.
- Repositorio clonado desde `https://github.com/NadiaEnoaRizoAvalos/game.git`.
- Base de main: `3fb830ebd8702adfa472b5d4209c68e70174f343`.
- La rama de desarrollo no existía localmente ni en la consulta remota inicial.
- Se creó y publicó `feature/lavanderia-maria-carmen-v2`, con seguimiento remoto.
- No se modifican código jugable, estilos, despliegue ni main en esta fase.
- No hay AGENTS.md, package.json, dependencias instalables ni workflows de CI en el árbol clonado.

## Arquitectura comprobada

El HTML carga 21 scripts clásicos con `defer`, en orden explícito. Los módulos
usan IIFE y comparten `window.RainGame`; no son módulos ES. No hay compilación.

| Archivos | Implementación actual y reutilización |
| --- | --- |
| `js/core/namespace.js`, `math.js`, `main.js` | Espacio de nombres, clamp y arranque único. Conservar como base. |
| `js/config/game-config.js` | Mundo 1000 × 640, tres sogas, dos obstáculos rectangulares, siete tipos de prendas y tres niveles. Ampliar configuraciones sin reemplazar el patio. |
| `js/core/state.js` | `createLevel` recrea todo el estado. Mezcla datos de juego, referencias y efectos temporales. Separar estado persistente y presentación. |
| `js/core/engine.js` | Actualización por delta en segundos, pausa y requestAnimationFrame. `shouldFinish` termina niveles; necesita una ruta distinta para jornadas continuas. |
| `js/systems/player.js` | Movimiento diagonal normalizado y colisiones por subpasos. Reutilizar; parametrizar obstáculos y límites por escena. |
| `js/systems/collection.js` | Selección cercana, recogida al mantener acción, canasto, descarga automática en puerta y puntos. Reutilizar interacción y animaciones. |
| `js/systems/weather.js` | Lluvia gradual y tormenta vinculadas al nivel; moja prendas colgadas y transportadas. No implementa secado. |
| `js/rendering/drawing.js`, `world.js`, `sprites.js`, `renderer.js` | Arte procedural Canvas, casa, vegetación, sogas, prendas, protagonista, profundidad y efectos. Preservar estas funciones y su paleta como referencia visual. |
| `js/rendering/camera.js` | Seguimiento móvil, DPR limitado a 2, ajuste de viewport y pausa al girar. Dimensiones del mundo actualmente fijas. |
| `js/input/controls.js` | WASD/flechas, Espacio, P/Escape, joystick circular y multitáctil. Limpieza al perder foco, pausa al ocultar y Pointer Events. |
| `js/ui/` y `style.css` | HUD, tablones, inicio, ayuda, pausa y resultados. CSS con reglas móviles, safe areas y horizontal. Ampliar con el mismo lenguaje visual. |
| `js/audio/audio.js`, `js/systems/effects.js` | Audio sintetizado WebAudio, lluvia, partículas y animaciones. Reutilizables. |
| `js/integrations/webmcp.js` | Consulta opcional de estado, solo lectura. Actualizar su contrato al introducir días. No es backend. |

## Hallazgos y riesgos de evolución

1. **Canasto:** las 6 unidades actuales representan volumen (`sum(size)`), no
   seis prendas. Medias: 0,5; sábanas: 3. El README original simplifica esta regla.
   La nueva simulación deberá cumplir el límite pedido por cantidad sin cambiar
   silenciosamente el balance del juego clásico.
2. **Tiempo:** el motor usa delta, pero limita cada frame a 0,05 segundos y descarta
   el exceso. Por debajo de 20 FPS el reloj se ralentiza. Proponer acumulador y
   pasos de simulación controlados, con pruebas a distintas tasas de frames.
3. **Identidad:** `basket` contiene referencias a objetos de `items`; `target`
   también es una referencia. Serializar directamente y cargar JSON rompe esa
   identidad compartida. Usar IDs estables, una ubicación única y reconstrucción
   validada al cargar. Las copias de animaciones deben quedar fuera del inventario.
4. **Persistencia:** no existen IndexedDB, guardado, importación ni exportación.
   Menú, reintento y carga de nivel recrean el estado; no deben reutilizarse para
   avanzar días o cambiar escenas de la nueva partida.
5. **Acoplamiento:** clima, HUD, sprites y renderer consultan `state.level`.
   La transición requiere adaptadores y pruebas; quitar niveles de golpe rompería
   varias capas. Conservar una ruta clásica mientras se introduce el simulador.
6. **Mundo:** caminos y árboles se dibujan con coordenadas fijas; no son entidades
   construibles. Las colisiones cubren casa, huerta y postes, no navegación de IA.
7. **Estados:** hoy solo hay `hanging`, `basket` y `saved`, con humedad creciente.
   No hay lavado, pedidos, clientes, economía, reputación, familia ni interior.
8. **Validación:** `completePickup` asume que el llamador ya comprobó capacidad y
   estado. Los futuros comandos de jugador, IA y máquinas deben validar invariantes
   en un único lugar para evitar duplicación.
9. **Pruebas:** el cargador exige exactamente 21 scripts; habrá que actualizarlo
   deliberadamente al agregar módulos. El DOM simulado no verifica CSS, sonido,
   IndexedDB real ni interacción física multitáctil.

No se corrigieron estos puntos en Fase 0: son diagnóstico y trabajo futuro.

## Verificación ejecutada

Comando: `node --test tests/game.test.cjs` con Node.js v24.14.0.
Resultado: **6 pruebas aprobadas, 0 fallos**.

- Arranque, tres niveles, acceso a sogas y selección cercana.
- Movimiento diagonal y pausa sin avanzar el tiempo de juego.
- Recogida, cancelación, animación y descarga sin duplicar puntos.
- Lluvia gradual, humedad, tormenta, resultados y llamada al renderizador.
- Vectores de joystick, contactos simultáneos y limpieza de entradas.
- Cámara en 390×844, 844×390, 844×330 y 320×568, DPR y pausa por orientación.

No se ejecutaron pruebas visuales en navegador, escucha de audio ni pruebas en
un celular real. No se puede certificar esa compatibilidad solo con esta suite.

## Plan incremental y criterios de cierre

Cada fase requiere aprobación previa, juego funcional, pruebas, documentación,
commits por unidad coherente y push verificado a la rama de desarrollo.

| Fase | Alcance | Criterio principal |
| --- | --- | --- |
| 0 | Clonado, rama publicada, pruebas y diagnóstico | Sin cambios de comportamiento ni de producción. |
| 1 | Reloj configurable, jornadas, estado versionado, IndexedDB, menús de guardado e importación/exportación | Pausa efectiva, progreso entre días y restauración equivalente; errores de almacenamiento visibles y respaldo antes de reemplazar. |
| 2 | Clientes, pedidos, lavado, transporte, secado y entrega | Identidad única, insumos y capacidades válidas; entrega y cobro únicos. |
| 3 | Pronóstico, clima, calidad y reputación | Recuperación ante lluvia, quejas y confianza coherentes. |
| 4 | Economía familiar, José, Jaqui inicial y mate | Gastos equilibrados, resumen y descanso sin exigir pedidos futuros. |
| 5 | Interior caminable, mobiliario y ampliaciones | Colisiones y cambios de escena sin reiniciar el mundo. |
| 6 | Construcción y decoración del patio | Previsualización, ocupación y accesos válidos, persistencia. |
| 7 | IA de Jaqui, máquinas, habilidades y automatización | Rutas válidas, capacidades y costos limitados, errores recuperables. |
| 8 | Tutorial, balance, sonido, animación y móvil | Regresión funcional y revisión visual en PC y móvil. |

### Diseño propuesto para Fase 1, todavía no implementado

- Mantener el modo clásico accesible para preservar el juego anterior.
- Crear un modelo serializable separado de controles, DOM, audio y partículas.
- Desacoplar reloj/jornadas del final de nivel, sin agregar todavía lavandería.
- Definir repositorio de guardados IndexedDB y formato JSON versionado compartido.
- Validar tipos, rangos, referencias e integridad antes de restaurar; rechazar
  versiones incompatibles y conservar la partida actual si falla la carga.
- Confirmar reemplazos y respaldar partidas; nunca ejecutar contenido importado.
- Autoguardar en puntos seguros y con operaciones ordenadas, no en cada frame.
- Probar round-trip, pausa, cambio de día, fallos de almacenamiento y protección
  del guardado anterior. Mantener la suite clásica y agregar pruebas de navegador
  para IndexedDB cuando se implemente.
- No agregar backend ni pagos reales. Futuras compras deberán validarse en un
  servicio seguro, nunca con datos locales como comprobante.

## Cómo probar el estado actual

En la carpeta del proyecto, comprobar la rama con `git branch --show-current`.
Abrir `index.html` en el navegador; esta versión no requiere instalación.
Alternativamente, si Python está disponible, ejecutar `python -m http.server 8000`
y abrir `http://localhost:8000` (la disponibilidad de Python no se verificó).

Jugar con WASD/flechas y Espacio; descargar acercándose a la puerta. Pausar con
P/Escape o el botón. En celular, comprobar joystick y Recoger simultáneos, giro,
legibilidad del HUD y acceso a los menús. Estas comprobaciones manuales quedan
pendientes. El juego sigue siendo el original de tres niveles.

## Entrega

Archivos de esta fase: `README.md` y `docs/FASE_0_DIAGNOSTICO.md`.
Commit previsto: `docs: documentar auditoria y plan de la fase 0`.
La rama fue publicada correctamente; el hash del commit documental y su
verificación remota se informan al entregar para no autorreferenciar el commit.

**Detenerse aquí y solicitar aprobación para Fase 1**, según el pedido original.
No realizar merge, push a main ni despliegue sobre la web original.

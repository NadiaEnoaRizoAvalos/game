# Fase 8 — Guía, balance, rendimiento y validación final

Implementada en `feature/lavanderia-maria-carmen-v2`, después de aprobar las 81 pruebas de lógica y la integración de Chrome de Fase 7. Main y el despliegue original permanecen intactos. Se prepara un PR en borrador para revisión, sin merge ni publicación.

## Pulido realizado

- Guía opcional de doce pasos, consultable desde Inicio o Pausa. Registra avances reales de lavandería, casa, construcción, ayuda, descanso y respaldo. Las sugerencias se pueden ocultar; no bloquea decisiones ni reinicia el juego.
- Guía y preferencia de sugerencias persistentes en formato **8**, migrando versiones 1–7. Preparar un JSON incluye el paso de respaldo en el archivo; el progreso de la partida se marca después de solicitar la descarga, sin afirmar que el dispositivo ya escribió el archivo.
- Accesos directos por sección en el tablón de automatización y foco de teclado al navegar. Botones de carga, descarga y mantenimiento reflejan si la operación está disponible. Se explican consumos y capacidades antes de operar.
- El HUD se actualiza una vez por fotograma, aunque la simulación deba integrar varios pasos; los textos y estilos que no cambian no se reescriben. El reloj sigue integrando todo el tiempo jugado. Conteos climáticos de 1000 segundos o más se muestran en minutos para evitar desbordamientos.
- Audio de lluvia sin programar repetidamente el mismo volumen. Avisos breves distintos para lote listo y tropiezo. La preferencia de sonido se guarda en localStorage y tolera almacenamiento bloqueado; las partidas permanecen en IndexedDB.
- Las animaciones nuevas de Jaqui y máquinas respetan la preferencia del sistema de reducir movimiento, conservando sus estados y simulación. El patio y los sprites originales mantienen su presentación habitual.
- Revisión adicional de rutas al cambiar construcciones, protección de Jaqui cuando María está dentro y rechazo de lotes/importaciones incoherentes.

## Balance comprobado

Se conservan los precios centralizados y la reserva para insumos. El escenario automático de treinta jornadas entrega noventa pedidos y paga todos los gastos familiares generados, usando las APIs de lavado, secado, almacenamiento, compras y entregas. Comienza con los $30 reales de una partida nueva y termina con **$3781**, sin deuda ni recursos negativos. El saldo coincide con el libro de cuentas.

Este escenario elimina la presión de plazo usando jornadas largas y acelera acciones; verifica coherencia y viabilidad económica con servicio ideal. No mide dificultad humana ni demuestra que toda estrategia sea rentable. Las compras de equipo y las condiciones de tormenta siguen requiriendo decisiones del jugador.

Ejemplo nominal para tres remeras de $36, sin habilidades ni filtro, antes de gastos familiares y amortización de compra del equipo:

| Proceso | Costo operativo orientativo | Margen antes de gastos familiares |
|---|---:|---:|
| Lavado manual y secado al aire | $6 en insumos prorrateados | $30 |
| Lavarropas y secado al aire | $6 insumos + $2 energía + $1,20 mantenimiento prorrateado | $26,80 |
| Lavarropas y secadora | Anterior + $3 energía + $1,20 mantenimiento | $22,60 |

Los paquetes se compran enteros y sus sobrantes permanecen en inventario. Las máquinas liberan tiempo de María a cambio de inversión, energía y mantenimiento; las prendas grandes ocupan más capacidad. La familia puede aplazar gastos sin multas, y la ayuda vecinal permite recuperar insumos. No se agregó deuda ni quiebra automática.

## Archivos

Nuevos: `js/core/preferences.js`, `js/systems/guide.js`, `js/ui/guide-menu.js`, `tests/polish.test.cjs` y este informe.

Integración: `index.html`, `js/audio/audio.js`, `js/core/engine.js`, `js/main.js`, `js/persistence/format.js`, `js/persistence/saves.js`, `js/rendering/family.js`, `js/rendering/yard.js`, `js/systems/automation.js`, `js/systems/calendar.js`, `js/systems/helper.js`, `js/ui/automation-menu.js`, `js/ui/hud.js`, `js/ui/save-menu.js`, `js/ui/screens.js`, `tests/browser.cjs`, README e identificación del commit de Fase 7.

## Validación final

- `node --test tests/*.test.cjs`: **91 aprobadas, 0 fallos**, incluidas las seis originales, catorce nuevas de Fase 7 y diez nuevas de pulido.
- Guía persistente y migración v7, exportación sin efectos previos a descargar, HUD sin escrituras redundantes, audio estable, preferencias bloqueadas y movimiento reducido.
- Jaqui recalcula rutas al construir un cerco en su paso, no atraviesa obstáculos y no puede quedar encerrada aunque María esté dentro. Se mantienen las pruebas de capacidad, tareas, tropiezos recuperables, carreras por prendas y recuperación a mitad de camino.
- Lotes con ID falso/duplicado, cambio de ubicación indebido, desgaste o cobros inconsistentes se rechazan al importar. Se mantienen todas las regresiones de IndexedDB y JSON.
- `node --test tests/browser.cjs`: **un escenario integral aprobado en Chrome**. Partida real en IndexedDB, cierre/reapertura del perfil, abortos de transacción, reemplazos confirmados, respaldos, lavandería, interior, construcción, máquinas, Jaqui, guía, preferencias y acceso directo por teclado.
- WebAudio llega al estado `running` después del gesto; preferencia de sonido conservada al recargar. Preferencia de movimiento reducido emulada y observada por el juego.
- Controles multitáctiles y capturas en 390×844, 844×390 y 320×568. Guía y tablones largos revisados visualmente; fondo de madera y botones originales conservados. Sin errores de página en la integración.
- Prueba de reloj, máquina y posición de Jaqui a 5/60 FPS. Un fotograma de 200 ms integra doce pasos y realiza una actualización de HUD. Lluvia estable durante seiscientas llamadas programa un solo objetivo de volumen.
- El escenario de balance tarda aproximadamente medio segundo en Node en este entorno, sin renderizado real. Es una referencia de prueba, no una certificación de FPS en celulares.
- `git diff --check`: sin errores.

## Limitaciones y revisión pendiente

No se probaron dispositivos Android/iPhone físicos ni Safari/Firefox; no se realizó escucha humana del audio. La automatización de navegador usa Chrome con multitáctil emulado y acelera/reubica partes del escenario. Se requiere revisión manual para valorar comodidad táctil, sonido y dificultad real. Las capturas y perfiles están en `.test-artifacts/`, fuera de Git.

Se mantienen los límites de prendas, pedidos, historial y construcciones documentados en fases anteriores. Los depósitos comparten inventario, los muebles tienen ubicaciones preparadas y las ampliaciones se representan en el interior. Jaqui es la ayudante implementada; no se añadieron otros empleados, cuentas, pagos reales ni sincronización entre dispositivos.

## Cómo revisar la entrega

1. Ejecutar el servidor local del README y abrir una nueva partida o continuar la guardada.
2. Abrir Guía del patio y recorrer el ciclo de un pedido. Ocultar/mostrar sugerencias sin reiniciar.
3. Probar casa, gastos familiares, mates, construcciones y un pedido de varios días.
4. Asignar a Jaqui, operar una máquina y guardar durante un lote o traslado. Cerrar/reabrir y revisar identidad, insumos y avances.
5. Exportar el JSON y volver a importarlo confirmando el reemplazo.
6. Revisar el PR en borrador antes de cualquier merge o despliegue. No se cambió la versión publicada desde main.

Commit funcional subido y verificado en GitHub: `b8117be` (`feat: agregar guia persistente y pulir rendimiento audio y accesibilidad`). El cierre documental queda en un commit separado, identificado en el historial y en la entrega final.

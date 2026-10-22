# Convertir Antes de la lluvia en una lavandería familiar persistente

Base: `main` · Rama propuesta: `feature/lavanderia-maria-carmen-v2` · Estado previsto: borrador.

Registro histórico de Fase 8: no se creó el PR porque la herramienta de GitHub devolvió `user rejected MCP tool call`. Esa entrega quedó sin merge ni despliegue. El pedido posterior de cierre autoriza integrar directamente mediante Git; el estado actual se registra en [CIERRE_FINAL.md](CIERRE_FINAL.md).

## Descripción preparada

El juego conserva el patio y los controles originales y pasa de niveles aislados a una lavandería familiar con días continuos y progreso recuperable.

Incluye:

- Reloj independiente de FPS, IndexedDB, respaldos y JSON validado con migraciones de formatos 1–7 a 8.
- Pedidos, lavado, secado, entregas, clima, calidad, reputación y economía familiar.
- Casa transitable, José y Jaqui, descanso con mates, muebles y ampliaciones.
- Construcción del patio con previsualización, colisiones y accesos protegidos.
- Máquinas por lote, mantenimiento, tareas de Jaqui, habilidades y cubiertas automáticas.
- Guía opcional persistente, preferencias de sonido y mejoras de rendimiento y accesibilidad.

Validación:

- `node --test tests/*.test.cjs`: 91 aprobadas, incluidas las seis originales.
- `node --test tests/browser.cjs`: un escenario integral aprobado en Chrome con IndexedDB real, cierre/reapertura, importación/exportación, controles multitáctiles y tres resoluciones móviles.
- Prueba de balance de 30 jornadas y 90 pedidos, con tiempos amplios y acciones aceleradas.
- `git diff --check` sin errores.

Falta revisión en dispositivos físicos, Safari/Firefox y escucha humana del audio. El escenario de balance no mide dificultad real. No se modifica el despliegue publicado ni se realiza merge.

Instrucciones y límites: [README](../README.md) e [informe final](FASE_8_INFORME.md).

# Fase 2 — Lavandería

Implementada en `feature/lavanderia-maria-carmen-v2`. Main y el despliegue original no se modifican.

## Funcionalidades

- Cuatro vecinos con historias, tipos de prendas, calidad, precios y plazos diferentes.
- Tres ofertas diarias; máximo tres pedidos aceptados y doce prendas pendientes.
- Aceptación voluntaria, ofertas no aceptadas que vencen al otro día y pedidos aceptados que sobreviven entre jornadas.
- Estados derivados de prendas: disponible → aceptado → en lavado → en secado → listo → entregado.
- Prendas con ID y pedido asociado; transporte por volumen. Cargar desde la puerta no provoca una descarga automática inmediata.
- Lavadero al lado derecho de la casa, con la paleta y primitivas originales. Mantener Espacio/acción lava cada prenda usando dos unidades de agua y una de jabón.
- Un lavado interrumpido conserva su progreso y no vuelve a consumir insumos al cargar una partida.
- Tendido en ocho lugares originales con capacidad limitada; secado por tela y viento. Lluvia vuelve a humedecer ropa expuesta, nunca ropa almacenada.
- Entrega únicamente en la puerta, con todas las prendas limpias, secas y guardadas. Cobro único e historial de ingresos y compras.
- Kit inicial concedido una sola vez: $30 ficticios, 12 de agua y 6 de jabón. Reposición: $12 por 12 de agua y 6 de jabón.
- Clientes habituales después de tres entregas, con $5 adicionales en ofertas futuras.
- Tablón desde Pausa → Pedidos e insumos. El mismo botón táctil cambia a Lavar, Tender o Recoger según el contexto.
- Formato de partida 2; migración desde formato 1 conservando el progreso y respaldando la copia anterior.

La ropa familiar que ya estaba en las sogas conserva la puntuación original. Se recoge para liberar espacio; a partir de ahora las nuevas prendas llegan mediante pedidos, sin rellenar automáticamente las sogas cada mañana.

## Archivos principales

Nuevos: `js/config/laundry-config.js`, `js/systems/orders.js`, `js/systems/laundry.js`, `js/persistence/laundry-schema.js`, `js/ui/orders-menu.js`, `js/rendering/laundry.js`, `tests/laundry.test.cjs`.

Integración: `index.html`, motor, calendario, recolección, colisiones del jugador, HUD, pantallas, renderer, texto de descarga en sprites y persistencia. Se actualizaron pruebas de guardado y navegador para el formato 2 y el saldo inicial.

## Validación antes de pasar a Fase 3

- `node --test tests/*.test.cjs`: **31 aprobadas, 0 fallos**, incluidas las seis originales.
- `node --test tests/browser.cjs`: **1 escenario integral aprobado en Chrome**; incluye ciclo completo de lavandería mediante menús y Espacio, IndexedDB, JSON, recuperación y controles multitáctiles emulados.
- Capturas revisadas: pedido listo en escritorio y tablón en móvil vertical, horizontal y 320×568. Los tablones extensos permiten desplazamiento vertical.
- `git diff --check`: sin errores.
- Sin errores pendientes detectados por las pruebas. No se probó un celular físico ni audio con escucha humana.

## Cómo probar

1. Iniciar el servidor local indicado en README y abrir una partida nueva o continuar la anterior.
2. Recoger la ropa familiar y descargarla en la puerta para liberar sogas.
3. En Pausa → Pedidos e insumos, aceptar un pedido.
4. Acercarse a la puerta, abrir el pedido y cargar las prendas.
5. Ir al lavadero a la derecha de la casa y mantener acción para lavar.
6. Acercarse a los lugares libres de las sogas y presionar acción para tender, soltando entre prendas.
7. Esperar a que estén secas, recogerlas y guardarlas en casa.
8. Desde la puerta, abrir el pedido y entregar. Verificar saldo y que no se pueda cobrar otra vez.

## Historial y alcance

- `ee5b627`: ciclo de pedidos, lavado, secado, transporte y esquema/migración.
- El commit de interfaz y cierre de fase se informa en la entrega.
- La usuaria autorizó continuar con Fase 3 **solo si las pruebas de Fase 2 no presentan errores**. Esa condición se verificó antes de comenzar pronósticos, calidad y reputación.
- Las quejas, sanciones por retraso y reputación pertenecen a Fase 3; no se declaran implementadas en este cierre de Fase 2.

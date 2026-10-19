# Antes de la lluvia

> La ropa espera. El cielo no.

**Antes de la lluvia** es un juego web de patio, visto desde arriba, en el que hay que descolgar la ropa de las sogas y ponerla a salvo en casa antes de que llegue la tormenta.

Lo desarrollé como **proyecto práctico para aprender y afianzar HTML, CSS y JavaScript**, aplicando los conceptos en algo concreto y jugable en lugar de ejercicios sueltos.

##  Sobre el proyecto

La idea inicial era simple: un juego donde hay que **juntar la ropa antes de que llueva**. A partir de esa base fui sumando mecánicas hasta convertirlo en un juego completo:

- **Días continuos** con mañana, mediodía, tarde y noche, conservando el progreso.
- **Sistema de puntuación**: cada prenda tiene su propio valor.
- **Canasto con capacidad limitada**, que obliga a decidir cuándo volver a casa a guardar la ropa.
- **Cuenta regresiva** hasta que empieza la lluvia.
- **Efectos de clima y sonido** para ambientar la partida.
- **Adaptación a celulares**, con controles táctiles y soporte para orientación vertical y horizontal.

##  Cómo se juega

1. Recorré el patio y descolgá las prendas de las sogas.
2. Tu canasto tiene **6 unidades de volumen**: una media ocupa 0,5 y una sábana, 3. Cuando se llena, volvé a casa.
3. Guardá la ropa en casa para sumar puntos.
4. Hacelo antes de que termine el tiempo y empiece la lluvia.
5. Al finalizar la jornada elegí **Día siguiente** o **Seguir en el patio**. También podés finalizar el día desde Pausa.
6. Las prendas pendientes, la ropa guardada, el canasto y los puntos permanecen entre días. Las nuevas prendas llegan mediante pedidos.

### La lavandería de María Carmen

Desde **Pausa → Pedidos e insumos**, aceptá pedidos de los vecinos. En la puerta,
cargá sus prendas; llevalas al lavadero a la derecha de la casa y mantené la acción
para lavar. Acercate a una soga libre y presioná acción para tender, soltando entre
prendas. Cuando estén secas, recogelas y guardalas en casa. Desde la puerta, abrí
el tablón y entregá el pedido para cobrar. Primero podés guardar la ropa familiar
original para liberar las sogas.

El canasto conserva sus 6 unidades de volumen. Hay ocho lugares de tendido y un
máximo de tres pedidos activos y doce prendas pendientes. El kit inicial se recibe
una sola vez: $30, 12 de agua y 6 de jabón. Cada lavado consume 2 de agua y 1 de
jabón; el paquete de reposición cuesta $12 y contiene 12 de agua y 6 de jabón.

En **Pausa → Pronóstico y reputación** consultá el clima y la relación con los
clientes. Sol, calor, nubes, brisa, viento, llovizna, lluvia y tormenta afectan el
secado. El viento fuerte puede ensuciar y el calor afectar prendas delicadas;
podés volver a lavarlas. La ropa guardada queda protegida. El HUD cuenta el tiempo
hasta el próximo cambio climático.

Las entregas puntuales mejoran la reputación; los retrasos la reducen. Tres quejas
graves del mismo cliente suspenden sus pedidos durante tres días, con posibilidad
de recuperar la relación. Los clientes con tres entregas puntuales y confianza
suficiente ofrecen un adicional de $5. La cantidad de ofertas depende de la
reputación; siempre existe una vía para recuperarse.

### Familia y casa

En **Pausa → Familia y economía** consultá el saldo, ingresos, gastos y cobros
pendientes. Podés pagar compras familiares y eventos escolares, o aplazarlos sin
multas. Se reservan $12 para insumos. Si faltan dinero y agua o jabón, la ayuda
vecinal entrega insumos una vez por día para retomar el trabajo.

Acercate a la puerta y presioná **Espacio / Entrar** para recorrer la casa.
José y Jaqui están dentro; José vuelve de la escuela después del mediodía.
Caminá hasta los muebles y familiares para interactuar. El estante permite guardar
y cargar prendas; los clientes reciben sus pedidos en la puerta exterior.
El clima y el secado del patio continúan mientras estás dentro y el canasto queda
protegido bajo techo. Para salir, acercate a la puerta interior y presioná acción.

La mesa y la cama permiten descansar con mates cuando están resueltos los pedidos
que vencen hoy; los futuros pueden seguir pendientes. El resumen muestra cuentas,
entregas, reputación y pronóstico. Siempre podés seguir jugando después del resumen.

En **Pausa → Casa y muebles** comprá madera, habitaciones y muebles con dinero
del juego. Hay cuartos para María, José y Jaqui, y un lavadero cubierto con pileta
comprable. El plano interior crece con las compras. Los muebles tienen posiciones
preparadas para mantener libres las puertas; no hay colocación libre todavía.

### Construir el patio

Desde **Pausa → Construir patio y herramientas**, comprá caminos, flores, árboles,
arbustos, cercos, sogas, tendederos protegidos, lavaderos y depósitos. Elegí una
casilla con el mouse, un toque o las flechas/WASD; **Confirmar** instala y cobra.
El tiempo se pausa mientras elegís. R gira los cercos y Escape/P o Salir cancelan.
En celulares hay flechas y botones de construcción.

Los objetos originales mantienen su lugar. Las construcciones nuevas pueden
moverse gratis o retirarse con confirmación y reintegro de la mitad del precio;
la madera no se devuelve. Primero hay que recoger la ropa de las sogas ocupadas.
El juego rechaza superposiciones y construcciones que cierren accesos o encierren
al personaje. Hay un máximo de 64 objetos activos y 1000 registros por partida.

Cada soga agrega dos lugares. Las cubiertas reducen la lluvia y el polvo; los
árboles dan sombra, los caminos mejoran la velocidad y los depósitos permiten
cargar/guardar prendas. Los depósitos comparten el almacenamiento de la casa.
También podés comprar canastos de **8 o 12 unidades de volumen** y una tabla de
lavado más rápida. Todas las compras usan dinero ficticio y quedan guardadas.

### Ayuda y máquinas

En **Pausa → Ayuda, máquinas y habilidades** asigná tareas a Jaqui y consultá su
canasto y experiencia. Puede recoger/guardar, tender ropa limpia o acercar ropa
sucia al lavadero. La agenda permite programar una rutina. El carrito amplía su
capacidad de 4 a 6 unidades de volumen. Caminos, guantes y práctica reducen los
tropiezos; la ropa sigue siendo recuperable.

Los lavarropas y secadoras se construyen en el patio. Acercate con las prendas en
tu canasto e iniciá un lote desde el tablón. Tienen capacidad y consumo limitados,
retienen las prendas hasta descargarlas y requieren mantenimiento cada cinco
lotes. Las habilidades mejoran con la práctica. Un sensor puede desplegar
cubiertas en dos sogas elegidas; las entregas siguen siendo manuales.

##  Controles

| Acción | Computadora | Celular |
|---|---|---|
| Moverse | `W A S D` / flechas | Joystick en pantalla |
| Acción contextual | `Espacio`: recoger, lavar, tender, entrar, salir o interactuar | Botón de acción con el texto correspondiente |
| Guardar ropa | Volver a casa | Volver a casa |
| Pausar | `P`, `Escape` o botón de pausa | Botón de pausa |

##  Diseño adaptable

El juego se puede jugar tanto en computadora como en celular:

- Interfaz responsive que se ajusta a distintos tamaños de pantalla.
- Controles táctiles: joystick virtual y botón de recolección.
- Funciona en **modo vertical y horizontal**.

## Tecnologías

- **HTML5**: estructura de la interfaz y el HUD.
- **CSS3**: estilos, diseño responsive y animaciones.
- **JavaScript (vanilla)**: lógica del juego, sin frameworks ni librerías.
- **Canvas 2D**: renderizado del patio, personajes y efectos.
- **IndexedDB**: partidas y respaldos locales, sin backend.

## Arquitectura

El código está organizado en módulos separados por responsabilidad:

```
game/
├── index.html
├── style.css
├── js/
│   ├── core/         # Estado, motor del juego y utilidades
│   ├── config/       # Configuración y parámetros
│   ├── systems/      # Jugador, recolección, clima y efectos
│   ├── persistence/  # Formato validado, IndexedDB y coordinación de guardados
│   ├── rendering/    # Dibujo, sprites, mundo y cámara
│   ├── input/        # Teclado y controles táctiles
│   ├── ui/           # HUD, pantallas e interfaz
│   ├── audio/        # Sonido
│   ├── integrations/
│   └── main.js       # Punto de entrada
└── tests/            # Pruebas
```

## Cómo ejecutarlo

El juego no requiere compilación ni dependencias. En la carpeta ya clonada:

```powershell
Set-Location 'G:\WINDOWS\Desktop\Proyectos\antes de la lluvia'
git switch feature/lavanderia-maria-carmen-v2
python -m http.server 8000
```

Después abrí [http://localhost:8000](http://localhost:8000) en el navegador.
Usá siempre el mismo navegador, dirección y puerto para recuperar IndexedDB.
Abrir `index.html` directamente puede permitir jugar, pero el almacenamiento de
orígenes `file:` depende del navegador; para probar persistencia utilizá HTTP.

## Guardar, continuar y trasladar partidas

- **Nueva partida** inicia el día 1. Si ya hay una partida, pide confirmación y conserva un respaldo antes de reemplazarla.
- **Continuar partida** recupera el progreso del navegador. Si no hay datos, informa sin fallar.
- Desde **Partidas y respaldos** podés **Guardar partida** manualmente.
- Se autoguarda al recoger, descargar, pausar, volver al inicio, finalizar o avanzar el día y cada 30 segundos de juego.
- **Exportar partida** descarga un JSON versionado con día y fecha en el nombre.
- **Importar partida** abre el selector, valida el archivo (máximo 5 MB) y pide confirmación antes de reemplazar. Cancelar o un archivo inválido conserva la partida actual.
- **Recuperar copia anterior** restaura el guardado previo; **Respaldos de reemplazos** permite recuperar partidas anteriores a una importación o nueva partida, aunque hayan ocurrido más autoguardados.

El guardado se confirma cuando IndexedDB termina la transacción. Ante falta de
espacio o permisos aparece un aviso; si no había una partida previa se puede jugar
y exportar sin almacenamiento. No se informa un guardado exitoso si falló.
No hay progreso mientras la página está oculta, pausada o cerrada. Las animaciones
temporales y una recogida incompleta no se restauran; las prendas ya recogidas sí.
Los datos pertenecen al navegador: borrar datos del sitio o usar navegación privada
puede perderlos. El JSON sirve como respaldo externo y traslado manual entre dispositivos.

## Desarrollo de la versión 2.0

La evolución hacia **La lavandería de María Carmen** se prepara en la rama
`feature/lavanderia-maria-carmen-v2`. Las **Fases 1 a 7** incorporan tiempo,
jornadas, persistencia, lavandería, pedidos, pronósticos y reputación, conservando
el patio, el arte, las animaciones y los controles originales. También incorporan
familia, gastos, descanso, interior transitable, ampliaciones y muebles.

Consultá el [diagnóstico inicial](docs/FASE_0_DIAGNOSTICO.md) y el
[informe de Fase 1](docs/FASE_1_INFORME.md), el [informe de Fase 2](docs/FASE_2_INFORME.md)
y el [informe de Fase 3](docs/FASE_3_INFORME.md), además de los informes de
[Fase 4](docs/FASE_4_INFORME.md), [Fase 5](docs/FASE_5_INFORME.md) y
[Fase 6](docs/FASE_6_INFORME.md) y [Fase 7](docs/FASE_7_INFORME.md).
La Fase 8 continúa tras aprobar las pruebas de Fase 7.
Los clientes aparecen en el tablón; José y Jaqui tienen sprites
propios dentro de la casa, dibujados con la paleta y las primitivas originales.
El dinero comercial y los puntos de la ropa familiar se mantienen separados.

El formato de guardado actual es **7**. Las partidas de formatos 1 a 6 se migran
conservando el progreso; los nuevos datos comerciales se inicializan una sola vez.
Pedidos, lavado parcial, clima, reputación, transacciones, familia, escena, posición,
habitaciones, muebles, materiales, construcciones y herramientas se guardan en IndexedDB
y se incluyen en la exportación JSON. Los eventos comerciales también autoguardan.

La duración de una jornada nueva se configura en `Game.config.simulation.daySeconds`
en `js/config/game-config.js` (240 segundos por defecto; formato válido: 30–86400).
Cada partida conserva su duración. La simulación integra pasos de 1/60 de segundo
y conserva el tiempo entre frames, incluso por debajo de 20 FPS.
El adaptador de niveles original permanece para regresiones; las nuevas partidas
no usan ni dependen de `config.levels`.

## Pruebas y desarrollo

Pruebas de lógica con Node.js, sin instalar dependencias:

```bash
node --test tests/*.test.cjs
```

Para integración de navegador, usar una instalación de Playwright disponible para
Node y definir `BROWSER_EXECUTABLE` con la ruta de Chrome/Chromium o Edge:

```powershell
$env:BROWSER_EXECUTABLE='C:\Program Files\Google\Chrome\Application\chrome.exe'
node --test tests/browser.cjs
```

Si Playwright está instalado fuera del proyecto, indicar su carpeta `node_modules`
mediante `NODE_PATH`. No es una dependencia del juego. La prueba sirve HTTP local,
crea perfiles separados y guarda capturas/JSON en `.test-artifacts/`, excluida de Git.
Resultado de cierre de Fase 7: **81 pruebas de lógica aprobadas**, incluidas las
seis originales, y **un escenario integral de navegador aprobado**.
Se probó con Chrome, persistencia real y gestos multitáctiles emulados. Esto no
sustituye una prueba física en Android/iPhone ni una revisión auditiva.

Para ampliar el estado, actualizar el esquema en `persistence/format.js`, su
versión/migración y las pruebas de integridad. No serializar referencias duplicadas:
cada prenda tiene un ID y una única ubicación. Mantener separados simulación,
persistencia y presentación. Trabajar solo en la rama de desarrollo, con pruebas,
commits y push por funcionalidad; no fusionar ni publicar sobre main.

## Aprendizajes del proyecto original

- Estructurar un proyecto de JavaScript en módulos y sistemas.
- Programar un bucle de juego y manejar estado.
- Dibujar y animar con Canvas.
- Implementar controles de teclado y táctiles.
- Diseñar interfaces responsive para distintos dispositivos y orientaciones.

## Autora

**Nadia Enoa**
[GitHub: @NadiaEnoaRizoAvalos](https://github.com/NadiaEnoaRizoAvalos)

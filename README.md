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
6. Al comenzar otro día se ocupan los lugares libres de las sogas. Las prendas pendientes, la ropa guardada, el canasto y los puntos permanecen.

##  Controles

| Acción | Computadora | Celular |
|---|---|---|
| Moverse | `W A S D` / flechas | Joystick en pantalla |
| Descolgar ropa | Mantener `Espacio` | Botón **RECOGER** |
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
`feature/lavanderia-maria-carmen-v2`. La **Fase 1** incorpora tiempo, jornadas y
persistencia conservando el patio, el arte, las animaciones y los controles originales.

Consultá el [diagnóstico inicial](docs/FASE_0_DIAGNOSTICO.md) y el
[informe de Fase 1](docs/FASE_1_INFORME.md). La Fase 2 necesita aprobación.
Todavía no hay pedidos jugables, lavado, economía comercial, personajes nuevos,
interiores ni construcciones; sus contenedores de datos están preparados y guardados.
Los recursos empiezan en cero y los puntos mantienen su función original.

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

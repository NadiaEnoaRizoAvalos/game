# Antes de la lluvia

> La ropa espera. El cielo no.

**Antes de la lluvia** es un juego web de patio, visto desde arriba, en el que hay que descolgar la ropa de las sogas y ponerla a salvo en casa antes de que llegue la tormenta.

Lo desarrollé como **proyecto práctico para aprender y afianzar HTML, CSS y JavaScript**, aplicando los conceptos en algo concreto y jugable en lugar de ejercicios sueltos.

##  Sobre el proyecto

La idea inicial era simple: un juego donde hay que **juntar la ropa antes de que llueva**. A partir de esa base fui sumando mecánicas hasta convertirlo en un juego completo:

- **Niveles** con dificultad creciente.
- **Sistema de puntuación**: cada prenda tiene su propio valor.
- **Canasto con capacidad limitada**, que obliga a decidir cuándo volver a casa a guardar la ropa.
- **Cuenta regresiva** hasta que empieza la lluvia.
- **Efectos de clima y sonido** para ambientar la partida.
- **Adaptación a celulares**, con controles táctiles y soporte para orientación vertical y horizontal.

##  Cómo se juega

1. Recorré el patio y descolgá las prendas de las sogas.
2. Tu canasto tiene espacio limitado (6 prendas): cuando se llena, volvé a casa.
3. Guardá la ropa en casa para sumar puntos.
4. Hacelo antes de que termine el tiempo y empiece la lluvia.
5. Superá los niveles y conseguí la mejor puntuación.

##  Controles

| Acción | Computadora | Celular |
|---|---|---|
| Moverse | `W A S D` / flechas | Joystick en pantalla |
| Descolgar ropa | Mantener `Espacio` | Botón **RECOGER** |
| Guardar ropa | Volver a casa | Volver a casa |
| Pausar | Botón de pausa | Botón de pausa |

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
│   ├── rendering/    # Dibujo, sprites, mundo y cámara
│   ├── input/        # Teclado y controles táctiles
│   ├── ui/           # HUD, pantallas e interfaz
│   ├── audio/        # Sonido
│   ├── integrations/
│   └── main.js       # Punto de entrada
└── tests/            # Pruebas
```

## Cómo ejecutarlo

No requiere instalación ni dependencias.

```bash
git clone https://github.com/NadiaEnoaRizoAvalos/game.git
cd game
python -m http.server 8000
```

Después abrí `http://localhost:8000` en el navegador. También podés abrir `index.html` directamente.

## Qué aprendí

- Estructurar un proyecto de JavaScript en módulos y sistemas.
- Programar un bucle de juego y manejar estado.
- Dibujar y animar con Canvas.
- Implementar controles de teclado y táctiles.
- Diseñar interfaces responsive para distintos dispositivos y orientaciones.

## Autora

**Nadia Enoa**
[GitHub: @NadiaEnoaRizoAvalos](https://github.com/NadiaEnoaRizoAvalos)

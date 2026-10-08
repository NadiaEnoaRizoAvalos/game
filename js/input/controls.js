"use strict";

/** Teclado, joystick y botón táctil; conserva entradas simultáneas. */
(() => {
  'use strict';

  const Game = window.RainGame;
  const keys = new Set();
  const keyboardHeld = new Set();
  const touchHeld = new Map();
  const joystick = {
    x: 0,
    y: 0,
    pointer: null
  };
  const keyMap = {
    a: 'left',
    ArrowLeft: 'left',
    d: 'right',
    ArrowRight: 'right',
    w: 'up',
    ArrowUp: 'up',
    s: 'down',
    ArrowDown: 'down',
    ' ': 'collect'
  };

  /** Combina teclado y contactos táctiles sin cancelar el otro dispositivo. */
  function refreshTouchKeys() {
    Game.controls.keys.clear();
    for (const k of Game.controls.keyboardHeld) {
      Game.controls.keys.add(k);
    }
    for (const entry of Game.controls.touchHeld.values()) {
      for (const k of entry.directions) {
        Game.controls.keys.add(k);
      }
    }
  }

  /** Suelta teclas y contactos y centra el joystick para evitar movimiento trabado. */
  function clearInputs() {
    Game.controls.joystick.x = 0;
    Game.controls.joystick.y = 0;
    Game.controls.joystick.pointer = null;
    Game.dom.byId('joystick-knob').style.transform = 'translate(0px,0px)';
    Game.controls.keyboardHeld.clear();
    Game.controls.touchHeld.clear();
    Game.controls.keys.clear();
    for (const b of document.querySelectorAll('[data-key]')) {
      b.classList.remove('pressed');
    }
  }

  /** Convierte el desplazamiento del dedo en un vector limitado, con zona muerta central. */
  function joystickVector(x, y, radius) {
    const length = Math.hypot(x, y);
    if (length < radius * .16) {
      return {
        x: 0,
        y: 0,
        knobX: x,
        knobY: y
      };
    }
    const limited = Math.min(length, radius);
    const strength = Math.min(1, (length / radius - .16) / .84);
    return {
      x: x / length * strength,
      y: y / length * strength,
      knobX: x / length * limited,
      knobY: y / length * limited
    };
  }

  /** Lee el dedo respecto del círculo y mueve su indicador visual. */
  function setJoystick(e) {
    const box = Game.dom.byId('joystick').getBoundingClientRect();
    const v = Game.controls.joystickVector(e.clientX - box.left - box.width / 2, e.clientY - box.top - box.height / 2, box.width * .32);
    Game.controls.joystick.x = v.x;
    Game.controls.joystick.y = v.y;
    Game.dom.byId('joystick-knob').style.transform = `translate(${v.knobX}px,${v.knobY}px)`;
  }
  /** Conecta los eventos de este módulo; se llama una sola vez desde main.js. */
  function init() {
    window.addEventListener('keydown', e => {
      const k = Game.controls.keyMap[e.key] || Game.controls.keyMap[e.key.toLowerCase()];
      if (k && Game.state.current.mode === 'playing') {
        e.preventDefault();
        Game.controls.keyboardHeld.add(k);
        Game.controls.refreshTouchKeys();
      }
      if ((e.key === 'Escape' || e.key === 'p') && !e.repeat) {
        Game.screens.pause();
      }
    });
    window.addEventListener('keyup', e => {
      const k = Game.controls.keyMap[e.key] || Game.controls.keyMap[e.key.toLowerCase()];
      if (k) {
        Game.controls.keyboardHeld.delete(k);
        Game.controls.refreshTouchKeys();
      }
    });
    window.addEventListener('blur', () => {
      Game.controls.clearInputs();
      if (Game.state.current.mode === 'playing') {
        Game.screens.pause();
      }
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && Game.state.current.mode === 'playing') {
        Game.screens.pause();
      }
    });
    Game.dom.byId('joystick').addEventListener('pointerdown', e => {
      e.preventDefault();
      if (Game.state.current.mode !== 'playing' || Game.controls.joystick.pointer !== null) {
        return;
      }
      Game.audio.init();
      Game.controls.joystick.pointer = e.pointerId;
      Game.dom.byId('joystick').setPointerCapture(e.pointerId);
      Game.controls.setJoystick(e);
    });
    Game.dom.byId('joystick').addEventListener('pointermove', e => {
      if (e.pointerId !== Game.controls.joystick.pointer) {
        return;
      }
      e.preventDefault();
      Game.controls.setJoystick(e);
    });
    for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      Game.dom.byId('joystick').addEventListener(event, e => {
        if (e.pointerId !== Game.controls.joystick.pointer) {
          return;
        }
        Game.controls.joystick.pointer = null;
        Game.controls.joystick.x = Game.controls.joystick.y = 0;
        Game.dom.byId('joystick-knob').style.transform = 'translate(0px,0px)';
      });
    }
    Game.dom.byId('joystick').addEventListener('contextmenu', e => e.preventDefault());
    for (const b of document.querySelectorAll('[data-key]')) {
      b.addEventListener('contextmenu', e => e.preventDefault());
      b.addEventListener('pointerdown', e => {
        e.preventDefault();
        Game.audio.init();
        if (Game.state.current.mode !== 'playing') {
          return;
        }
        b.setPointerCapture(e.pointerId);
        Game.controls.touchHeld.set(e.pointerId, {
          button: b,
          directions: [b.dataset.key]
        });
        Game.controls.refreshTouchKeys();
        b.classList.add('pressed');
      });
      for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) {
        b.addEventListener(event, e => {
          Game.controls.touchHeld.delete(e.pointerId);
          Game.controls.refreshTouchKeys();
          b.classList.remove('pressed');
        });
      }
    }
  }
  Game.controls = {
    keys: keys,
    keyboardHeld: keyboardHeld,
    touchHeld: touchHeld,
    joystick: joystick,
    keyMap: keyMap,
    refreshTouchKeys: refreshTouchKeys,
    clearInputs: clearInputs,
    joystickVector: joystickVector,
    setJoystick: setJoystick,
    init
  };
})();

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const root = path.join(__dirname, '..');

/** Carga los mismos scripts y en el mismo orden que index.html. */
function createGame() {
  const elements = new Map();
  const context = new Proxy({}, {
    get: (object, key) => object[key] ?? (() => {}),
    set: (object, key, value) => { object[key] = value; return true; }
  });
  function element() {
    const events = {};
    return {
      events, style: {}, dataset: {}, classList: { add() {}, remove() {} },
      addEventListener(name, callback) { events[name] = callback; },
      setAttribute() {}, getContext: () => context,
      getBoundingClientRect: () => ({ width: 1000, height: 640 }),
      setPointerCapture() {}, releasePointerCapture() {}
    };
  }
  const document = {
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, element());
      return elements.get(id);
    },
    querySelectorAll: () => [], addEventListener() {}
  };
  const window = element();
  const sandbox = { document, window, console, Math, setTimeout: () => 0,
    requestAnimationFrame: () => 0 };
  vm.createContext(sandbox);
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const scripts = [...html.matchAll(/<script[^>]*src="([^"]+)"[^>]*>/g)];
  assert.equal(new Set(scripts.map(s => s[1])).size, scripts.length, 'Sin scripts duplicados');
  for (const [, filename] of scripts) {
    vm.runInContext(fs.readFileSync(path.join(root, filename), 'utf8'), sandbox, { filename });
  }
  return { game: window.RainGame, window, elements };
}


module.exports = { createGame };

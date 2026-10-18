/** Coordina guardados ordenados, recuperación y reemplazos sin tocar el renderizado. */
(() => {
  'use strict';
  const Game = window.RainGame;
  let queue = Promise.resolve();
  let active = false;
  let elapsed = 0;
  let stored = null;
  let ready = false;
  let busy = false;
  let message = 'Consultando partidas guardadas…';

  function status(text) {
    message = text;
    const element = document.getElementById('save-status');
    if (element) element.textContent = text;
  }
  function failure(error) {
    const text = error.message || 'No se pudo guardar. Exportá una copia.';
    if (message !== text) Game.hud.toast(text);
    status(text);
  }

  /** Serializa operaciones y continúa la cola incluso si una escritura falla. */
  function enqueue(envelope, archive = false) {
    const task = queue.then(() => Game.database.write(envelope, archive));
    queue = task.catch(() => {});
    return task.then(() => { stored = envelope; status(`Partida guardada · día ${envelope.data.day}.`); return envelope; });
  }

  async function init() {
    try {
      stored = await Game.database.read();
      if (stored) Game.saveFormat.validate(stored);
      status(stored ? `Hay una partida del día ${stored.data.day}.` : 'Todavía no hay una partida guardada.');
    } catch (error) { failure(error); }
    finally { ready = true; }
  }

  function save() {
    if (!active) return Promise.reject(new Error('Primero iniciá o continuá una partida.'));
    try { return enqueue(Game.saveFormat.snapshot()); }
    catch (error) { return Promise.reject(error); }
  }
  function auto() {
    if (!active || !Game.state.current.campaign) return;
    save().catch(failure);
  }
  function tick(dt) {
    if (!active) return;
    elapsed += dt;
    if (elapsed >= 30) { elapsed %= 30; auto(); }
  }

  function activate(state) {
    Game.audio.stop();
    Game.controls.clearInputs();
    Game.state.current = state;
    active = true;
    elapsed = 0;
    Game.engine.resetTime();
    Game.runtime.clock = 0;
    Game.screens.resume();
    if (state.dayEnded) Game.screens.daySummary();
    Game.hud.update();
  }

  /** Toda acción que reemplaza una partida pasa por este bloqueo. */
  async function exclusive(action) {
    if (!ready || busy) { status('Esperá a que termine la operación actual.'); return false; }
    busy = true;
    try { return await action(); }
    catch (error) { failure(error); return false; }
    finally { busy = false; }
  }

  function start() {
    return exclusive(async () => {
      if ((stored || active) && !window.confirm('¿Comenzar una nueva partida? La anterior quedará respaldada en este navegador.')) return false;
      await queue;
      if (active) await save();
      const state = Game.calendar.newGame();
      const envelope = Game.saveFormat.snapshot(state);
      // Sin una partida previa se permite jugar incluso si el navegador bloquea IndexedDB.
      try { await enqueue(envelope, true); }
      catch (error) { if (stored || active) throw error; failure(error); }
      activate(state);
      return true;
    });
  }

  function continueGame() {
    return exclusive(async () => {
      if (active) { Game.screens.resume(); return true; }
      await queue;
      const envelope = await Game.database.read();
      if (!envelope) { status('No hay partida guardada. Elegí Nueva partida.'); return false; }
      activate(Game.saveFormat.restore(envelope));
      return true;
    });
  }

  function importText(text) {
    return exclusive(async () => {
      const envelope = Game.saveFormat.parse(text);
      const state = Game.saveFormat.restore(envelope);
      if (!window.confirm(`¿Importar el día ${state.day} y reemplazar la partida actual? Se conservará un respaldo en este navegador.`)) return false;
      await queue;
      if (active) await save();
      await enqueue(envelope, true);
      activate(state);
      return true;
    });
  }

  function recover() {
    return exclusive(async () => {
      await queue;
      const envelope = await Game.database.read('previous');
      if (!envelope) { status('No hay copia anterior disponible. Podés importar un archivo JSON.'); return false; }
      const state = Game.saveFormat.restore(envelope);
      if (!window.confirm(`¿Recuperar la copia anterior del día ${state.day}? Se respaldará la partida reemplazada.`)) return false;
      await enqueue(envelope, true);
      activate(state);
      return true;
    });
  }

  function exportText() {
    const envelope = active ? Game.saveFormat.snapshot() : stored;
    if (!envelope) throw new Error('No hay partida para exportar.');
    Game.saveFormat.validate(envelope);
    return JSON.stringify(envelope, null, 2);
  }
  Game.saves = { init, save, auto, tick, start, continueGame, importText, recover,
    exportText, failure, status, get message() { return message; },
    get active() { return active; }, get busy() { return busy || !ready; } };
})();

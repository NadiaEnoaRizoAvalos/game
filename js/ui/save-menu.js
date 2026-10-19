/** Menú de partidas con los mismos tablones y botones del juego original. */
(() => {
  'use strict';
  const Game = window.RainGame;
  let backups = [];
  function panel() {
    Game.hud.showPanel(`<div class="eyebrow">LA LAVANDERÍA DE MARÍA CARMEN</div>
<h2>Tus partidas.</h2><p id="save-status" role="status" aria-live="polite"></p>
<div class="panel-actions">
<button class="primary" data-action="save">GUARDAR PARTIDA</button>
<button class="secondary" data-action="export">EXPORTAR PARTIDA</button>
<button class="secondary" data-action="import">IMPORTAR PARTIDA</button>
<button class="secondary" data-action="recover">RECUPERAR COPIA ANTERIOR</button>
<button class="secondary" data-action="backups">RESPALDOS DE REEMPLAZOS</button>
<button class="secondary" data-action="menu">VOLVER AL INICIO</button>
</div><p class="tiny">El archivo JSON permite trasladar tu partida a otro dispositivo.</p>`);
    Game.saves.status(Game.saves.message);
  }

  /** Las partidas reemplazadas siguen accesibles aunque avance el autoguardado. */
  async function history() {
    try {
      backups = await Game.database.backups();
      Game.hud.showPanel(`<div class="eyebrow">COPIAS CONSERVADAS</div><h2>Respaldos.</h2>
<p id="save-status" role="status"></p><div class="panel-actions">
${backups.map((key, i) => `<button class="secondary" data-action="backup-${i}">RECUPERAR ${new Date(Number(key.split('-')[1])).toLocaleString('es-AR')}</button>`).join('')}
<button class="secondary" data-action="saves">VOLVER</button></div>`);
      Game.saves.status(backups.length ? 'Elegí una copia. Se pedirá confirmación antes de reemplazar.' : 'Todavía no se reemplazó ninguna partida.');
    } catch (error) { Game.saves.failure(error); }
  }

  function download() {
    try {
      const text = Game.saves.exportText(true);
      const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url;
      const date = new Date();
      const stamp = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      link.download = `antes-de-la-lluvia-dia-${JSON.parse(text).data.day}-${stamp}.json`;
      document.body.appendChild(link);
      link.click();
      Game.guide.exported();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      Game.saves.status('Copia preparada para descargar. Conservá el archivo JSON.');
    } catch (error) { Game.saves.failure(error); }
  }

  function init() {
    Game.dom.byId('import-file').addEventListener('change', async event => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file) return;
      if (file.size > Game.saveFormat.MAX_BYTES) {
        Game.saves.failure(new Error('El archivo supera el límite de 5 MB.')); return;
      }
      try { await Game.saves.importText(await file.text()); }
      catch (error) { Game.saves.failure(error); }
    });
  }
  function action(name) {
    if (name === 'saves') panel();
    if (name === 'save') Game.saves.save().catch(Game.saves.failure);
    if (name === 'export') download();
    if (name === 'import') Game.dom.byId('import-file').click();
    if (name === 'recover') Game.saves.recover();
    if (name === 'backups') history();
    if (/^backup-\d+$/.test(name) && backups[Number(name.slice(7))]) Game.saves.recover(backups[Number(name.slice(7))]);
  }
  Game.saveMenu = { init, panel, action };
})();

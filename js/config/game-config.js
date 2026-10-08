"use strict";

/** Datos editables: mundo, prendas y dificultad de los tres niveles. */
(() => {
  'use strict';

  const Game = window.RainGame;
  const CONFIG = {
    width: 1000,
    height: 640,
    basketCapacity: 6,
    speed: 225,
    pickRadius: 48,
    minX: 42,
    maxX: 958,
    minY: 58,
    maxY: 602,
    door: {
      x: 174,
      y: 235,
      radius: 37
    },
    minimumSaved: 0
  };
  const ROPES = [{
    x1: 395,
    x2: 910,
    y: 190
  }, {
    x1: 285,
    x2: 750,
    y: 365
  }, {
    x1: 430,
    x2: 920,
    y: 545
  }];
  const OBSTACLES = [{
    x: 63,
    y: 56,
    w: 216,
    h: 153
  }, {
    x: 70,
    y: 401,
    w: 140,
    h: 113
  }];
  const GARMENTS = {
    sock: {
      name: 'Media',
      value: 1,
      time: .4,
      size: .5,
      priority: 1,
      resistance: 1.2,
      color: '#e9ce86'
    },
    shirt: {
      name: 'Remera',
      value: 4,
      time: .7,
      size: 1,
      priority: 2,
      resistance: 1,
      color: '#e4a183'
    },
    pants: {
      name: 'Pantalón',
      value: 6,
      time: 1.2,
      size: 1.5,
      priority: 2,
      resistance: 1.25,
      color: '#708f9b'
    },
    blouse: {
      name: 'Camisa',
      value: 5,
      time: .9,
      size: 1,
      priority: 2,
      resistance: .9,
      color: '#ece7c6'
    },
    jacket: {
      name: 'Campera',
      value: 8,
      time: 1.8,
      size: 2,
      priority: 3,
      resistance: 1.4,
      color: '#81996b'
    },
    sheet: {
      name: 'Sábana',
      value: 12,
      time: 2.5,
      size: 3,
      priority: 3,
      resistance: .8,
      color: '#eee9d0'
    },
    leather: {
      name: 'Cuero',
      value: 16,
      time: 2.1,
      size: 2.5,
      priority: 4,
      resistance: .75,
      color: '#aa704b',
      special: true,
      dryMultiplier: 2
    }
  };
  const LEVELS = [{
    name: 'Tranquilo',
    delay: 20,
    stormAfter: 18,
    wetRate: 9,
    wind: 1,
    specialCount: 0,
    types: ['sock', 'shirt', 'pants', 'sheet', 'blouse', 'shirt', 'jacket', 'sock']
  }, {
    name: 'Tormenta',
    delay: 17,
    stormAfter: 14,
    wetRate: 12,
    wind: 3,
    specialCount: 1,
    types: ['shirt', 'pants', 'sock', 'sheet', 'blouse', 'jacket', 'shirt', 'pants', 'sock', 'leather']
  }, {
    name: 'Tormenta fuerte',
    delay: 14,
    stormAfter: 10,
    wetRate: 15,
    wind: 5,
    specialCount: 2,
    types: ['sheet', 'shirt', 'pants', 'jacket', 'sock', 'blouse', 'sheet', 'pants', 'jacket', 'shirt', 'leather', 'leather']
  }];
  Game.config = {
    settings: CONFIG,
    ropes: ROPES,
    obstacles: OBSTACLES,
    garments: GARMENTS,
    levels: LEVELS
  };
})();

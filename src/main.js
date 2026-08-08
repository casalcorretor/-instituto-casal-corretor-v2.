import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from './config/GameConfig.js';
import BootScene from './scenes/BootScene.js';
import PreloadScene from './scenes/PreloadScene.js';
import MenuScene from './scenes/MenuScene.js';
import MatchScene from './scenes/MatchScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'app',
  backgroundColor: COLORS.background,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    orientation: Phaser.Scale.LANDSCAPE
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  input: {
    activePointers: 4
  },
  scene: [BootScene, PreloadScene, MenuScene, MatchScene]
};

const game = new Phaser.Game(config);

if (import.meta.env.DEV) {
  window.__CAR_SOCCER_GAME__ = game;
}

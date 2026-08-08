import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from './config/GameConfig.js';
import BootScene from './scenes/BootScene.js';
import PreloadScene from './scenes/PreloadScene.js';
import MenuScene from './scenes/MenuScene.js';
import RaceScene from './scenes/RaceScene.js';
import ResultScene from './scenes/ResultScene.js';
import SettingsScene from './scenes/SettingsScene.js';
import GarageScene from './scenes/GarageScene.js';
import TrackSelectScene from './scenes/TrackSelectScene.js';

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
  scene: [BootScene, PreloadScene, MenuScene, RaceScene, ResultScene, SettingsScene, GarageScene, TrackSelectScene]
};

const game = new Phaser.Game(config);

if (import.meta.env.DEV) {
  window.__RUSH_DRIVE_GAME__ = game;
}

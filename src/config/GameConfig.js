// Configurações globais do jogo RUSH DRIVE

export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

export const COLORS = {
  background: 0x0b0f1a,
  primary: 0x00e5ff,
  secondary: 0xff2d78,
  accent: 0xffd400,
  white: 0xffffff,
  danger: 0xff3b3b,
  success: 0x2bd576,
  panel: 0x141a2a,
  panelBorder: 0x2a3550
};

export const STORAGE_KEY = 'rushdrive_save_v1';

export const SCENE_KEYS = {
  BOOT: 'BootScene',
  PRELOAD: 'PreloadScene',
  MENU: 'MenuScene',
  GARAGE: 'GarageScene',
  TRACK_SELECT: 'TrackSelectScene',
  SETTINGS: 'SettingsScene',
  RACE: 'RaceScene',
  RESULT: 'ResultScene'
};

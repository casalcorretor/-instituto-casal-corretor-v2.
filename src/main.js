import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from './config/GameConfig.js';
import BootScene from './scenes/BootScene.js';
import PreloadScene from './scenes/PreloadScene.js';
import MenuScene from './scenes/MenuScene.js';
import MatchScene from './scenes/MatchScene.js';
import MatchResultScene from './scenes/MatchResultScene.js';
import GarageScene from './scenes/GarageScene.js';
import ShopScene from './scenes/ShopScene.js';
import ArenaSelectScene from './scenes/ArenaSelectScene.js';
import SettingsScene from './scenes/SettingsScene.js';
import PlayerProfile from './systems/PlayerProfile.js';
import { CARS } from './data/CarsData.js';
import { unlockAudio, setVolumes } from './systems/AudioManager.js';

// Carrega o progresso salvo (Etapa 19), antes de qualquer cena existir
// — assim menu/garagem/loja ja mostram os dados certos desde o
// primeiro frame, sem "piscar" o estado padrao antes de carregar.
PlayerProfile.load();

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
    activePointers: 6
  },
  scene: [
    BootScene,
    PreloadScene,
    MenuScene,
    MatchScene,
    MatchResultScene,
    GarageScene,
    ShopScene,
    ArenaSelectScene,
    SettingsScene
  ]
};

const game = new Phaser.Game(config);

if (import.meta.env.DEV) {
  window.__CAR_SOCCER_GAME__ = game;
  // Expõe os mesmos objetos que o jogo usa internamente (nao copias
  // via re-import) — testes automatizados devem mutar/ler estado por
  // aqui, nunca via import() direto de um caminho de arquivo dentro de
  // page.evaluate. O Vite as vezes versiona internamente um import com
  // "?t=timestamp" apos um arquivo ser editado (HMR); um import()
  // "cru" digitado a mao no teste bate na URL sem versao, criando uma
  // SEGUNDA instancia do modulo (estado duplicado, dessincronizado do
  // jogo de verdade) — foi exatamente isso que causou um falso "bug"
  // na Etapa 14 (o carro parecia nao desbloquear na garagem porque o
  // teste escrevia num PlayerProfile "fantasma" diferente do real).
  window.__CAR_SOCCER_DEBUG__ = { playerProfile: PlayerProfile, cars: CARS };
}

// Navegadores exigem um gesto do usuario antes de tocar audio; o
// primeiro toque/clique/tecla na pagina destrava o AudioContext e
// aplica os volumes salvos no perfil.
function unlockAudioOnce() {
  unlockAudio();
  setVolumes({ musicVolume: PlayerProfile.getMusicVolume(), sfxVolume: PlayerProfile.getSfxVolume() });
  window.removeEventListener('pointerdown', unlockAudioOnce);
  window.removeEventListener('keydown', unlockAudioOnce);
}
window.addEventListener('pointerdown', unlockAudioOnce);
window.addEventListener('keydown', unlockAudioOnce);

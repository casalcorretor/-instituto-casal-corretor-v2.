import Phaser from 'phaser';
import { SCENE_KEYS, COLORS, GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig.js';
import { CARS } from '../data/CarsData.js';
import PlayerProfile from '../systems/PlayerProfile.js';

const MENU_ITEMS = [
  { label: 'JOGAR', action: 'play', highlight: true },
  { label: 'GARAGEM', key: SCENE_KEYS.GARAGE },
  { label: 'LOJA', key: SCENE_KEYS.SHOP },
  { label: 'ARENAS', key: SCENE_KEYS.ARENA_SELECT },
  { label: 'CONFIGURACOES', key: SCENE_KEYS.SETTINGS }
];

// Menu principal de verdade (Etapa 17), substituindo o botao de teste
// usado desde a Etapa 2. "JOGAR" comeca uma partida direto, usando a
// ultima arena escolhida (PlayerProfile.lastArenaId) e o carro
// equipado; os outros itens levam pras respectivas telas.
export default class MenuScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.MENU);
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.background);

    this.add
      .text(GAME_WIDTH / 2, 60, 'CAR SOCCER', {
        fontFamily: 'Arial Black, Arial',
        fontSize: '56px',
        color: '#21e6c1'
      })
      .setOrigin(0.5);

    this.statsText = this.add
      .text(GAME_WIDTH / 2, 106, '', {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: '#8fb3c9'
      })
      .setOrigin(0.5);

    const startY = 175;
    const gapY = 46;

    this.menuButtons = MENU_ITEMS.map((item, i) => {
      const y = startY + i * gapY;
      const button = this.add
        .text(GAME_WIDTH / 2, y, `[ ${item.label} ]`, {
          fontFamily: 'Arial Black, Arial',
          fontSize: '20px',
          color: item.highlight ? '#ffc93c' : '#ffffff'
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

      button.on('pointerdown', () => {
        if (item.action === 'play') {
          this.scene.start(SCENE_KEYS.MATCH, { arenaId: PlayerProfile.getLastArenaId() });
        } else {
          this.scene.start(item.key);
        }
      });

      return button;
    });

    this._refreshStats();
  }

  update() {
    this._refreshStats();
  }

  _refreshStats() {
    const equippedDef = CARS[PlayerProfile.getEquippedCarId()];
    this.statsText.setText(
      `moedas: ${PlayerProfile.getCoins()}  |  nivel ${PlayerProfile.getLevel()}  |  carro: ${equippedDef.name}`
    );
  }
}

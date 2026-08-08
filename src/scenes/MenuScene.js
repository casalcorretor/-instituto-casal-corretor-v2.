import Phaser from 'phaser';
import { SCENE_KEYS, COLORS, GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig.js';
import PlayerProfile from '../systems/PlayerProfile.js';

// Placeholder das primeiras etapas: prova que o pipeline Boot -> Preload
// -> Menu funciona, e por enquanto oferece um botao de teste pra entrar
// na arena. O menu real (JOGAR/GARAGEM/LOJA/ARENAS/CONFIGURACOES) e
// construido na Etapa 17, substituindo este botao de teste.
export default class MenuScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.MENU);
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.background);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, 'CAR SOCCER', {
        fontFamily: 'Arial Black, Arial',
        fontSize: '64px',
        color: '#21e6c1'
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 10, 'Etapa 2: arena', {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#8fb3c9'
      })
      .setOrigin(0.5);

    const testButton = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50, '[ VER ARENA DE TESTE ]', {
        fontFamily: 'Arial',
        fontSize: '20px',
        color: '#ffc93c'
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    testButton.on('pointerdown', () => {
      this.scene.start(SCENE_KEYS.MATCH);
    });

    const garageButton = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 90, '[ GARAGEM ]', {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#8fb3c9'
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    garageButton.on('pointerdown', () => {
      this.scene.start(SCENE_KEYS.GARAGE);
    });

    const shopButton = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 120, '[ LOJA ]', {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#8fb3c9'
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    shopButton.on('pointerdown', () => {
      this.scene.start(SCENE_KEYS.SHOP);
    });

    // Exibicao provisoria de saldo, so pra confirmar visualmente que a
    // economia (Etapa 10) esta funcionando. O menu real com HUD de
    // moedas/nivel/carro equipado entra na Etapa 17.
    this.coinsText = this.add
      .text(GAME_WIDTH - 16, 16, `moedas: ${PlayerProfile.getCoins()}`, {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#ffc93c'
      })
      .setOrigin(1, 0);

    // Nivel/XP (Etapa 16) — mesmo tipo de exibicao provisoria que as
    // moedas ja tinham, so pra confirmar visualmente; o HUD real do
    // menu entra na Etapa 17.
    this.levelText = this.add
      .text(GAME_WIDTH - 16, 38, '', {
        fontFamily: 'Arial',
        fontSize: '13px',
        color: '#8fb3c9'
      })
      .setOrigin(1, 0);
  }

  update() {
    this.coinsText.setText(`moedas: ${PlayerProfile.getCoins()}`);
    this.levelText.setText(`nivel ${PlayerProfile.getLevel()} (${PlayerProfile.getXp()}/${PlayerProfile.getXpToNextLevel()} XP)`);
  }
}

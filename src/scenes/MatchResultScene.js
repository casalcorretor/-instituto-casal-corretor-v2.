import Phaser from 'phaser';
import { SCENE_KEYS, COLORS, GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig.js';
import PlayerProfile from '../systems/PlayerProfile.js';
import { playSfx } from '../systems/AudioManager.js';

// Tela de fim de partida: mostra quem ganhou, o placar final e as
// moedas ganhas (calculadas pela MatchManager em getCoinRewards()).
// Por enquanto o time do jogador e sempre "blue" (definido na
// MatchScene) — quando houver selecao de time isso vira um dado
// passado por init().
export default class MatchResultScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.RESULT);
  }

  init(data) {
    this.score = data?.score || { blue: 0, red: 0 };
    this.winner = data?.winner || 'draw';
    this.coinRewards = data?.coinRewards || { blue: 0, red: 0 };
    this.xpRewards = data?.xpRewards || { blue: 0, red: 0 };
    this.arenaId = data?.arenaId;
    this.carId = data?.carId;
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.background);

    // o jogador e sempre o time azul por enquanto (times/selecao entram
    // quando 2v2/3v3 forem implementados). Credita a recompensa dessa
    // partida no saldo total e no XP (Etapa 16) uma unica vez, ao criar
    // a tela.
    PlayerProfile.addCoins(this.coinRewards.blue);
    const xpResult = PlayerProfile.addXp(this.xpRewards.blue);

    const playerWon = this.winner === 'blue';
    const label = playerWon ? 'VITORIA!' : this.winner === 'red' ? 'DERROTA' : 'EMPATE';
    const color = playerWon ? '#21e6c1' : this.winner === 'red' ? '#ff4d6d' : '#ffc93c';
    playSfx(this, playerWon ? 'victory' : 'defeat');

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 130, label, {
        fontFamily: 'Arial Black, Arial',
        fontSize: '56px',
        color
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 70, `AZUL ${this.score.blue}  x  ${this.score.red} VERMELHO`, {
        fontFamily: 'Arial Black, Arial',
        fontSize: '28px',
        color: '#ffffff'
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 32, `+${this.coinRewards.blue} moedas   +${this.xpRewards.blue} XP`, {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#ffc93c'
      })
      .setOrigin(0.5);

    this.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2 - 8,
        `saldo: ${PlayerProfile.getCoins()} moedas | nivel ${PlayerProfile.getLevel()} (${PlayerProfile.getXp()}/${PlayerProfile.getXpToNextLevel()} XP)`,
        {
          fontFamily: 'Arial',
          fontSize: '13px',
          color: '#8fb3c9'
        }
      )
      .setOrigin(0.5);

    if (xpResult.leveledUp) {
      this.add
        .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 16, `SUBIU DE NIVEL! Agora e nivel ${xpResult.level}`, {
          fontFamily: 'Arial Black, Arial',
          fontSize: '14px',
          color: '#2bd576'
        })
        .setOrigin(0.5);
    }

    const playAgainButton = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60, '[ JOGAR NOVAMENTE ]', {
        fontFamily: 'Arial',
        fontSize: '22px',
        color: '#21e6c1'
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    playAgainButton.on('pointerdown', () => {
      playSfx(this, 'click');
      this.scene.start(SCENE_KEYS.MATCH, { arenaId: this.arenaId, carId: this.carId });
    });

    const menuButton = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 105, '[ MENU ]', {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#8fb3c9'
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    menuButton.on('pointerdown', () => {
      playSfx(this, 'click');
      this.scene.start(SCENE_KEYS.MENU);
    });
  }
}

import Phaser from 'phaser';
import { SCENE_KEYS, COLORS, GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig.js';
import PlayerProfile from '../systems/PlayerProfile.js';
import { playSfx, setVolumes } from '../systems/AudioManager.js';

const VOLUME_STEPS = [0, 0.25, 0.5, 0.75, 1];
const DIFFICULTIES = ['easy', 'normal', 'hard'];
const DIFFICULTY_LABELS = { easy: 'FACIL', normal: 'NORMAL', hard: 'DIFICIL' };

// Tela de configuracoes: volume de musica/efeitos (guardados no
// PlayerProfile e aplicados na hora via AudioManager.setVolumes — a
// Etapa 18 implementou o audio de verdade) e dificuldade do bot (ja
// consumida pelo AIController desde a Etapa 8, so faltava expor a
// escolha pro jogador).
export default class SettingsScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.SETTINGS);
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.background);

    this.add
      .text(GAME_WIDTH / 2, 44, 'CONFIGURACOES', {
        fontFamily: 'Arial Black, Arial',
        fontSize: '30px',
        color: '#21e6c1'
      })
      .setOrigin(0.5);

    this._createVolumeRow(
      'Musica',
      140,
      () => PlayerProfile.getMusicVolume(),
      (v) => PlayerProfile.setMusicVolume(v)
    );
    this._createVolumeRow(
      'Efeitos sonoros',
      200,
      () => PlayerProfile.getSfxVolume(),
      (v) => PlayerProfile.setSfxVolume(v)
    );
    this._createDifficultyRow(280);
    this._createResetRow(360);

    const backButton = this.add
      .text(20, GAME_HEIGHT - 30, '[ VOLTAR ]', {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#ffc93c'
      })
      .setInteractive({ useHandCursor: true });
    backButton.on('pointerdown', () => {
      playSfx(this, 'click');
      this.scene.start(SCENE_KEYS.MENU);
    });
  }

  _createVolumeRow(label, y, getValue, setValue) {
    this.add
      .text(GAME_WIDTH / 2 - 260, y, label, {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#8fb3c9'
      })
      .setOrigin(0, 0.5);

    const valueText = this.add
      .text(GAME_WIDTH / 2 + 260, y, '', {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#ffffff'
      })
      .setOrigin(1, 0.5);

    const buttons = VOLUME_STEPS.map((step, i) => {
      const x = GAME_WIDTH / 2 - 20 + i * 38;
      const circle = this.add
        .circle(x, y, 8, 0x333344)
        .setStrokeStyle(2, COLORS.panelBorder, 1)
        .setInteractive({ useHandCursor: true });
      circle.stepValue = step;
      circle.on('pointerdown', () => {
        setValue(step);
        setVolumes({ musicVolume: PlayerProfile.getMusicVolume(), sfxVolume: PlayerProfile.getSfxVolume() });
        playSfx(this, 'click');
        refresh();
      });
      return circle;
    });

    const refresh = () => {
      const current = getValue();
      valueText.setText(`${Math.round(current * 100)}%`);
      buttons.forEach((b) => {
        const active = Math.abs(b.stepValue - current) < 0.001;
        b.setFillStyle(active ? 0x21e6c1 : 0x333344);
      });
    };
    refresh();
  }

  _createDifficultyRow(y) {
    this.add
      .text(GAME_WIDTH / 2 - 260, y, 'Dificuldade do bot', {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#8fb3c9'
      })
      .setOrigin(0, 0.5);

    const buttons = DIFFICULTIES.map((diff, i) => {
      const x = GAME_WIDTH / 2 + 60 + i * 90;
      const text = this.add
        .text(x, y, DIFFICULTY_LABELS[diff], {
          fontFamily: 'Arial',
          fontSize: '14px',
          color: '#ffffff'
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      text.diffValue = diff;
      text.on('pointerdown', () => {
        PlayerProfile.setBotDifficulty(diff);
        playSfx(this, 'click');
        refresh();
      });
      return text;
    });

    const refresh = () => {
      const current = PlayerProfile.getBotDifficulty();
      buttons.forEach((b) => {
        b.setColor(b.diffValue === current ? '#21e6c1' : '#8fb3c9');
      });
    };
    refresh();
  }

  // Apaga o progresso salvo (Etapa 19). Exige clicar duas vezes (a
  // segunda dentro de 3s) pra confirmar, pra nao apagar tudo com um
  // toque sem querer — nao ha sistema de dialogo de confirmacao no
  // jogo ainda, entao esse "clique duplo" faz esse papel.
  _createResetRow(y) {
    const resetButton = this.add
      .text(GAME_WIDTH / 2, y, '[ APAGAR PROGRESSO ]', {
        fontFamily: 'Arial',
        fontSize: '13px',
        color: '#ff4d6d'
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    let armed = false;
    let armTimer = null;

    resetButton.on('pointerdown', () => {
      if (!armed) {
        armed = true;
        resetButton.setText('[ TEM CERTEZA? CLIQUE DE NOVO ]');
        playSfx(this, 'click');
        armTimer = this.time.delayedCall(3000, () => {
          armed = false;
          resetButton.setText('[ APAGAR PROGRESSO ]');
        });
        return;
      }

      if (armTimer) armTimer.remove();
      PlayerProfile.resetSave();
      playSfx(this, 'collision');
      this.scene.restart();
    });
  }
}

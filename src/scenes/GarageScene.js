import Phaser from 'phaser';
import { SCENE_KEYS, COLORS, GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig.js';
import { CARS } from '../data/CarsData.js';
import { generateCarTexture } from '../entities/Car.js';
import { getProfile, isCarUnlocked, unlockCar } from '../systems/PlayerProfile.js';

// Normaliza cada atributo pra caber numa barra 0..1 comparavel entre
// carros (os maximos aqui sao só um pouco acima do maior valor real
// entre os 3 carros, pra nenhuma barra ficar sempre cheia).
const ATTRIBUTE_SCALE = {
  maxSpeed: 700,
  acceleration: 350,
  braking: 500,
  control: 3.6,
  nitroCapacity: 120
};

const ATTRIBUTES = [
  ['maxSpeed', 'Velocidade'],
  ['acceleration', 'Aceleração'],
  ['braking', 'Frenagem'],
  ['control', 'Controle'],
  ['nitroCapacity', 'Nitro']
];

const CARD_WIDTH = 280;
const CARD_HEIGHT = 400;
const CARD_GAP = 24;

// Garagem: visualizar os 3 carros, comparar atributos, selecionar um
// carro desbloqueado, e desbloquear os outros gastando moedas do
// PlayerProfile (compartilhado com Menu/Resultado desde a Etapa 9).
export default class GarageScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.GARAGE);
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.background);
    this.profile = getProfile();

    this.add
      .text(GAME_WIDTH / 2, 34, 'GARAGEM', {
        fontFamily: 'Arial Black, Arial',
        fontSize: '32px',
        color: '#00e5ff'
      })
      .setOrigin(0.5);

    this.coinsText = this.add
      .text(GAME_WIDTH - 16, 16, '', {
        fontFamily: 'Arial Black, Arial',
        fontSize: '18px',
        color: '#ffd400'
      })
      .setOrigin(1, 0);

    this.cardRefs = [];
    const carIds = Object.keys(CARS);
    const totalWidth = carIds.length * CARD_WIDTH + (carIds.length - 1) * CARD_GAP;
    const startX = GAME_WIDTH / 2 - totalWidth / 2 + CARD_WIDTH / 2;

    carIds.forEach((carId, index) => {
      const x = startX + index * (CARD_WIDTH + CARD_GAP);
      this._createCarCard(x, 90, CARS[carId]);
    });

    this._createBackButton();
    this._refresh();
  }

  _createCarCard(x, y, carDef) {
    const textureKey = `garage_${carDef.id}`;
    generateCarTexture(this, textureKey, carDef.bodyColor, carDef.accentColor);

    const container = { carDef };

    container.border = this.add
      .rectangle(x, y + CARD_HEIGHT / 2, CARD_WIDTH, CARD_HEIGHT, 0x0b1220, 0.55)
      .setStrokeStyle(2, 0x2a3550, 1);

    container.nameText = this.add
      .text(x, y + 20, carDef.name, {
        fontFamily: 'Arial Black, Arial',
        fontSize: '22px',
        color: '#ffffff'
      })
      .setOrigin(0.5, 0);

    // Rotacionado -90 (carro "de nariz pra cima"): isso troca a largura
    // pela altura visual do sprite, entao o espaco reservado abaixo
    // considera a maior dimensao (34px de comprimento do carro).
    container.preview = this.add.image(x, y + 95, textureKey).setScale(2.6).setRotation(-Math.PI / 2);

    container.descText = this.add
      .text(x, y + 150, carDef.description, {
        fontFamily: 'Arial',
        fontSize: '12px',
        color: '#8ea0c8',
        align: 'center',
        wordWrap: { width: CARD_WIDTH - 30 }
      })
      .setOrigin(0.5, 0);

    let barY = y + 195;
    container.bars = ATTRIBUTES.map(([key, label]) => {
      const bar = this._createAttributeBar(x, barY, label, carDef[key] / ATTRIBUTE_SCALE[key]);
      barY += 30;
      return bar;
    });

    container.actionBox = this.add
      .rectangle(x, y + CARD_HEIGHT - 34, CARD_WIDTH - 40, 42, 0x0b1220, 0.8)
      .setStrokeStyle(2, 0xffffff, 1)
      .setInteractive({ useHandCursor: true });
    container.actionText = this.add
      .text(x, y + CARD_HEIGHT - 34, '', {
        fontFamily: 'Arial Black, Arial',
        fontSize: '15px',
        color: '#ffffff'
      })
      .setOrigin(0.5);

    container.actionBox.on('pointerdown', () => this._onCardAction(carDef));

    this.cardRefs.push(container);
  }

  _createAttributeBar(x, y, label, fraction) {
    const width = 220;
    this.add.text(x - width / 2, y - 12, label, {
      fontFamily: 'Arial',
      fontSize: '11px',
      color: '#ffffff'
    });

    const bg = this.add
      .rectangle(x - width / 2, y + 4, width, 8, 0x0b1220, 0.9)
      .setOrigin(0, 0.5)
      .setStrokeStyle(1, 0x2a3550, 1);
    const fill = this.add
      .rectangle(x - width / 2 + 1, y + 4, Math.max(0, width - 2) * Phaser.Math.Clamp(fraction, 0, 1), 6, 0x00e5ff, 1)
      .setOrigin(0, 0.5);

    return { bg, fill };
  }

  _onCardAction(carDef) {
    const unlocked = isCarUnlocked(carDef.id);

    if (unlocked) {
      this.profile.selectedCarId = carDef.id;
      this._refresh();
      return;
    }

    if (this.profile.coins >= carDef.unlockCost) {
      this.profile.coins -= carDef.unlockCost;
      unlockCar(carDef.id);
      this.profile.selectedCarId = carDef.id;
      this._refresh();
    } else {
      this._showToast('Moedas insuficientes para desbloquear este carro');
    }
  }

  _refresh() {
    this.coinsText.setText(`🪙 ${this.profile.coins}`);

    this.cardRefs.forEach(({ carDef, border, actionBox, actionText }) => {
      const unlocked = isCarUnlocked(carDef.id);
      const selected = this.profile.selectedCarId === carDef.id;

      border.setStrokeStyle(selected ? 3 : 2, selected ? 0x2bd576 : 0x2a3550, 1);

      if (selected) {
        actionBox.setStrokeStyle(2, 0x2bd576, 1);
        actionText.setText('SELECIONADO').setColor('#2bd576');
      } else if (unlocked) {
        actionBox.setStrokeStyle(2, 0x00e5ff, 1);
        actionText.setText('SELECIONAR').setColor('#00e5ff');
      } else {
        actionBox.setStrokeStyle(2, 0xffd400, 1);
        actionText.setText(`DESBLOQUEAR · 🪙 ${carDef.unlockCost}`).setColor('#ffd400');
      }
    });
  }

  _showToast(message) {
    const toast = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 30, message, {
        fontFamily: 'Arial',
        fontSize: '15px',
        color: '#ffffff',
        backgroundColor: '#0b1220'
      })
      .setOrigin(0.5)
      .setPadding(10, 6, 10, 6)
      .setAlpha(0);

    this.tweens.add({
      targets: toast,
      alpha: 1,
      duration: 200,
      yoyo: true,
      hold: 1200,
      onComplete: () => toast.destroy()
    });
  }

  _createBackButton() {
    const box = this.add
      .rectangle(80, GAME_HEIGHT - 30, 120, 40, 0x0b1220, 0.7)
      .setStrokeStyle(2, 0xffffff, 0.8)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(80, GAME_HEIGHT - 30, 'VOLTAR', {
        fontFamily: 'Arial Black, Arial',
        fontSize: '15px',
        color: '#ffffff'
      })
      .setOrigin(0.5);

    box.on('pointerdown', () => this.scene.start(SCENE_KEYS.MENU));
  }
}

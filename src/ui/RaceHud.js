// HUD de corrida: posição, volta, tempo e velocidade. Vive na camera
// de UI (ver RaceScene) para nao ser afetado pelo zoom/follow da
// camera principal. Nitro, moedas e minimapa entram aqui nas
// Etapas 7, 8 e 9 sem precisar recriar o layout.
export default class RaceHud {
  constructor(scene, { width }) {
    this.scene = scene;
    this.gameObjects = [];

    const panelStyle = {
      fontFamily: 'Arial Black, Arial',
      fontSize: '22px',
      color: '#ffffff'
    };

    this.positionText = scene.add.text(16, 14, '', panelStyle).setDepth(150);
    this.lapText = scene.add.text(16, 44, '', { ...panelStyle, fontSize: '18px' }).setDepth(150);
    this.timeText = scene.add
      .text(width / 2, 14, '', { ...panelStyle, fontSize: '20px' })
      .setOrigin(0.5, 0)
      .setDepth(150);
    this.speedText = scene.add
      .text(width - 16, 14, '', { ...panelStyle, fontSize: '18px' })
      .setOrigin(1, 0)
      .setDepth(150);

    this.gameObjects.push(this.positionText, this.lapText, this.timeText, this.speedText);
  }

  update({ position, totalRacers, lap, totalLaps, raceTime, speedKmh, formatTime }) {
    this.positionText.setText(`${position}º / ${totalRacers}`);
    this.lapText.setText(`Volta ${Math.min(lap, totalLaps)}/${totalLaps}`);
    this.timeText.setText(formatTime(raceTime));
    this.speedText.setText(`${speedKmh.toFixed(0)} km/h`);
  }
}

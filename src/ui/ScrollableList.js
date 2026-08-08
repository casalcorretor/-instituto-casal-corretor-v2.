import { clamp } from '../utils/MathUtils.js';

// Rolagem vertical por arraste (touch/mouse) pra listas mais altas que
// a tela — necessario a partir da Etapa 14, quando o catalogo cresceu
// pra 25 carros (5 fileiras) e nao cabe mais inteiro nos 540px de
// altura do jogo. Reaproveitado pela garagem e pela loja: os elementos
// "fixos" (titulo, saldo, botao voltar) devem receber
// setScrollFactor(0) pra nao rolar junto com a grade.
export function enableVerticalScroll(scene, { contentHeight, viewportHeight }) {
  const maxScroll = Math.max(0, contentHeight - viewportHeight);
  if (maxScroll <= 0) return { maxScroll: 0 };

  let dragging = false;
  let startPointerY = 0;
  let startScrollY = 0;

  const onDown = (pointer) => {
    dragging = true;
    startPointerY = pointer.y;
    startScrollY = scene.cameras.main.scrollY;
  };

  const onMove = (pointer) => {
    if (!dragging) return;
    const delta = pointer.y - startPointerY;
    scene.cameras.main.scrollY = clamp(startScrollY - delta, 0, maxScroll);
  };

  const onUp = () => {
    dragging = false;
  };

  const onWheel = (_pointer, _gameObjects, _deltaX, deltaY) => {
    scene.cameras.main.scrollY = clamp(scene.cameras.main.scrollY + deltaY * 0.5, 0, maxScroll);
  };

  scene.input.on('pointerdown', onDown);
  scene.input.on('pointermove', onMove);
  scene.input.on('pointerup', onUp);
  scene.input.on('pointerupoutside', onUp);
  scene.input.on('wheel', onWheel);

  scene.events.once('shutdown', () => {
    scene.input.off('pointerdown', onDown);
    scene.input.off('pointermove', onMove);
    scene.input.off('pointerup', onUp);
    scene.input.off('pointerupoutside', onUp);
    scene.input.off('wheel', onWheel);
  });

  return { maxScroll };
}

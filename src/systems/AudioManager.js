// Ponto unico de reproducao de efeitos sonoros. Por enquanto e um
// stub seguro: se o som ainda nao foi carregado (Etapa 12 carrega os
// arquivos de audio de verdade), simplesmente nao toca nada em vez de
// lancar erro. Sistemas como o nitro (Etapa 7) ja chamam playSfx() —
// quando a Etapa 12 registrar os sons, eles passam a tocar sem
// precisar mudar quem chama.
export function playSfx(scene, key, config = {}) {
  if (!scene?.sound || !scene.cache.audio.exists(key)) return;
  scene.sound.play(key, config);
}

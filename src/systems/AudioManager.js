// Ponto unico de reproducao de efeitos sonoros. Por enquanto e um
// stub seguro: se o som ainda nao foi carregado (Etapa 18 carrega os
// sons de verdade, sintetizados via Web Audio API como no RUSH DRIVE),
// simplesmente nao toca nada em vez de lancar erro. Sistemas como o
// turbo (Etapa 7) ja chamam playSfx() — quando a Etapa 18 implementar
// os sons de verdade, eles passam a tocar sem precisar mudar quem
// chama.
export function playSfx(_scene, _key) {
  // implementado na Etapa 18
}

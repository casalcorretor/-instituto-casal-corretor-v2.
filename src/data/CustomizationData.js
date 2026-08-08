// Opcoes de personalizacao do carro (spec pede pintura/rodas/adesivos/
// efeitos de turbo/rastros/acessorios). Como o jogo desenha os carros
// em codigo (vista de cima, sem modelos 3D), as categorias que fazem
// sentido visualmente com esse estilo ja estao implementadas de
// verdade (pintura, rodas, rastro, efeito de turbo, efeito de gol);
// adesivos/acessorios ficam reservados aqui pra quando o jogo tiver um
// desenho de carro mais detalhado — mudar so aqui, sem mexer no resto.
export const PAINT_OPTIONS = [
  { id: 'default', label: 'Padrao', color: null },
  { id: 'crimson', label: 'Carmesim', color: 0xff2d55 },
  { id: 'azure', label: 'Azul', color: 0x2fa8ff },
  { id: 'lime', label: 'Verde-limao', color: 0x8bff2f },
  { id: 'graphite', label: 'Grafite', color: 0x333333 },
  { id: 'gold', label: 'Dourado', color: 0xffd700 }
];

export const WHEEL_OPTIONS = [
  { id: 'default', label: 'Padrao', color: 0x141414 },
  { id: 'silver', label: 'Prata', color: 0xc0c0c0 },
  { id: 'red', label: 'Vermelho', color: 0xff3b3b },
  { id: 'gold', label: 'Dourado', color: 0xffd700 }
];

export const TRAIL_OPTIONS = [
  { id: 'none', label: 'Nenhum', color: null },
  { id: 'white', label: 'Branco', color: 0xffffff },
  { id: 'cyan', label: 'Ciano', color: 0x21e6c1 },
  { id: 'magenta', label: 'Magenta', color: 0xff2fd6 }
];

export const TURBO_EFFECT_OPTIONS = [
  { id: 'default', label: 'Padrao', color: null },
  { id: 'ice', label: 'Gelo', color: 0x8fdcff },
  { id: 'fire', label: 'Fogo', color: 0xff6a2f },
  { id: 'toxic', label: 'Toxico', color: 0x9dff2f }
];

export const GOAL_EFFECT_OPTIONS = [
  { id: 'default', label: 'Padrao', color: 0x21e6c1 },
  { id: 'gold', label: 'Dourado', color: 0xffd700 },
  { id: 'magenta', label: 'Magenta', color: 0xff2fd6 }
];

// Reservado pra uma futura passada visual mais detalhada nos carros —
// ainda sem efeito visual algum.
export const STICKER_OPTIONS = [{ id: 'none', label: 'Nenhum' }];
export const ACCESSORY_OPTIONS = [{ id: 'none', label: 'Nenhum' }];

export function getOption(list, id) {
  return list.find((o) => o.id === id) || list[0];
}

// Dados das arenas. Etapa 2 constroi o sistema completo (paredes,
// abertura dos gols, marcacoes) usando a arena Urbana; as outras 2
// temas (Futurista, Noturna) reaproveitam o mesmo sistema quando a
// tela de selecao de arenas for criada (Etapa 17), do mesmo jeito que
// o RUSH DRIVE fez com as pistas.
export const ARENA_WIDTH = 1600;
export const ARENA_HEIGHT = 900;
export const WALL_THICKNESS = 24;
export const GOAL_WIDTH = 220; // abertura vertical do gol, centralizada

export const ARENAS = {
  urban: {
    id: 'urban',
    name: 'Arena Urbana',
    theme: 'urban'
  }
};

export const DEFAULT_ARENA_ID = 'urban';

// Definição fixa do chaveamento (Masters_2026_Chaves.png).
// seeds = posições na chave (1..16). Semifinais/final referenciam ids de partidas.
export const COURTS = {
  tucano: { id: 'tucano', name: 'Quadra Tucano' },
  beija: { id: 'beija', name: 'Quadra Beija-Flor' },
}

export const CATEGORIES = [
  {
    id: 'A',
    name: 'Categoria A',
    subtitle: '1ª à 8ª colocação',
    seeds: [1, 2, 3, 4, 5, 6, 7, 8],
    rounds: [
      {
        name: 'Quartas de final',
        day: 'Sábado · 12/dez',
        matches: [
          { id: 'A1', time: '08:00', court: 'tucano', seeds: [1, 8] },
          { id: 'A2', time: '08:00', court: 'beija', seeds: [4, 5] },
          { id: 'A3', time: '11:00', court: 'tucano', seeds: [2, 7] },
          { id: 'A4', time: '11:00', court: 'beija', seeds: [3, 6] },
        ],
      },
      {
        name: 'Semifinais',
        day: 'Sábado · 12/dez',
        matches: [
          { id: 'A5', time: '14:00', court: 'tucano', from: ['A1', 'A2'] },
          { id: 'A6', time: '15:30', court: 'tucano', from: ['A3', 'A4'] },
        ],
      },
      {
        name: 'Final',
        day: 'Domingo · 13/dez',
        matches: [{ id: 'A7', time: '10:00', court: 'tucano', from: ['A5', 'A6'] }],
      },
    ],
  },
  {
    id: 'B',
    name: 'Categoria B',
    subtitle: '9ª à 16ª colocação',
    seeds: [9, 10, 11, 12, 13, 14, 15, 16],
    rounds: [
      {
        name: 'Quartas de final',
        day: 'Sábado · 12/dez',
        matches: [
          { id: 'B1', time: '09:30', court: 'tucano', seeds: [9, 16] },
          { id: 'B2', time: '09:30', court: 'beija', seeds: [12, 13] },
          { id: 'B3', time: '12:30', court: 'tucano', seeds: [10, 15] },
          { id: 'B4', time: '12:30', court: 'beija', seeds: [11, 14] },
        ],
      },
      {
        name: 'Semifinais',
        day: 'Sábado · 12/dez',
        matches: [
          { id: 'B5', time: '14:00', court: 'beija', from: ['B1', 'B2'] },
          { id: 'B6', time: '15:30', court: 'beija', from: ['B3', 'B4'] },
        ],
      },
      {
        name: 'Final',
        day: 'Domingo · 13/dez',
        matches: [{ id: 'B7', time: '08:00', court: 'tucano', from: ['B5', 'B6'] }],
      },
    ],
  },
]

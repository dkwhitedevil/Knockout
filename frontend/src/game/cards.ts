import { GameCard } from '@/lib/gameTypes';

export const CARD_POOL: Omit<GameCard, 'id'>[] = [
  { name: 'Slash', type: 'ATTACK', power: 5, description: 'Quick strike' },
  { name: 'Fireball', type: 'ATTACK', power: 7, description: 'Heavy fire damage' },
  { name: 'Heal', type: 'SPECIAL', power: 4, description: 'Restore HP' },
  { name: 'Shield', type: 'DEFENSE', power: 3, description: 'Block damage' },
];

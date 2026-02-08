import { GameCard, Player } from '@/lib/gameTypes';

export function applyCard(card: GameCard, source: Player, target: Player) {
  switch (card.type) {
    case 'ATTACK':
      target.health = Math.max(0, target.health - card.power);
      break;
    case 'SPECIAL':
      // Use SPECIAL as Heal for the mock rules
      source.health = source.health + card.power;
      break;
    case 'DEFENSE':
      // Defense could be modeled as temporary shield; for now it's a no-op placeholder
      break;
    default:
      break;
  }

  if (target.health <= 0) {
    // mark dead
    (target as any).alive = false;
  }
}

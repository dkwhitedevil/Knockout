import { GameCard, Player } from '@/lib/gameTypes';
import { CARD_POOL } from '../cards';
import { applyCard } from '../rules/combat';

export type GameState = {
  players: Player[];
  activePlayerIndex: number;
  turnNumber: number;
  phase: 'WAITING' | 'PLAYING' | 'ENDED';
};

type Subscriber = (state: GameState) => void;

function uid(prefix = '') {
  return prefix + Math.random().toString(36).slice(2, 9);
}

export class MockEngine {
  private state: GameState;
  private subs: Subscriber[] = [];

  constructor(addresses: string[]) {
    const players: Player[] = addresses.slice(0, 4).map((addr) => ({
      id: addr,
      ensName: '',
      displayName: addr.slice(0, 6),
      health: 20,
      maxHealth: 20,
      cards: [],
      isConnected: true,
    } as Player));

    this.state = {
      players,
      activePlayerIndex: 0,
      turnNumber: 1,
      phase: 'WAITING',
    };

    this.dealHands();
  }

  private drawCard(): GameCard {
    const base = CARD_POOL[Math.floor(Math.random() * CARD_POOL.length)];
    return { id: uid('c_'), name: base.name, type: base.type as any, power: base.power, description: base.description } as GameCard;
  }

  private dealHands() {
    this.state.players.forEach((p) => {
      p.cards = [];
      for (let i = 0; i < 5; i++) p.cards.push(this.drawCard());
    });
    this.publish();
  }

  getState() {
    return JSON.parse(JSON.stringify(this.state)) as GameState;
  }

  subscribe(cb: Subscriber) {
    this.subs.push(cb);
    // send initial
    cb(this.getState());
    return () => {
      this.subs = this.subs.filter((s) => s !== cb);
    };
  }

  private publish() {
    const snapshot = this.getState();
    this.subs.forEach((s) => s(snapshot));
  }

  private nextAliveIndex(from: number) {
    const n = this.state.players.length;
    let idx = (from + 1) % n;
    const start = idx;
    while (!this.state.players[idx].isConnected || (this.state.players[idx].health <= 0)) {
      idx = (idx + 1) % n;
      if (idx === start) return -1;
    }
    return idx;
  }

  playCard(cardId: string, targetId?: string) {
    const active = this.state.players[this.state.activePlayerIndex];
    if (!active) return;
    const card = active.cards.find((c) => c.id === cardId);
    if (!card) return;

    let target = active;
    if (targetId) {
      const t = this.state.players.find((p) => p.id === targetId);
      if (t) target = t;
    }

    applyCard(card as GameCard, active, target);

    // remove used card and draw replacement
    active.cards = active.cards.filter((c) => c.id !== cardId);
    active.cards.push(this.drawCard());

    // check win condition
    const alive = this.state.players.filter((p) => p.health > 0);
    if (alive.length <= 1) {
      this.state.phase = 'ENDED';
      this.publish();
      return;
    }

    // advance turn
    const next = this.nextAliveIndex(this.state.activePlayerIndex);
    if (next >= 0) {
      this.state.activePlayerIndex = next;
      this.state.turnNumber += 1;
    } else {
      this.state.phase = 'ENDED';
    }

    this.publish();
  }

  endTurn() {
    const next = this.nextAliveIndex(this.state.activePlayerIndex);
    if (next >= 0) {
      this.state.activePlayerIndex = next;
      this.state.turnNumber += 1;
    } else {
      this.state.phase = 'ENDED';
    }
    this.publish();
  }
}

export default MockEngine;

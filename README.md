# 🃏 Knockout

A fast-paced, multiplayer **card battle royale** game built on blockchain. Players stake once, play instantly, and the last one standing wins the pot.

---

## 🎮 Game Overview

**Knockout** is a competitive card game where:

* **4–8 players** compete in real-time
* **No turn order** — everyone plays simultaneously
* **No gas fees per move** — single transaction per session
* **5–8 minute matches** — ultra-fast gameplay
* **Real stakes** — winner takes the pooled entry fee

Think **PUBG with cards** — strategy, bluffing, and split-second decisions.

For complete game rules, see [RULEBOOK.md](RULEBOOK.md).

---

## 🏗️ Project Structure

```
Knockout/
├── backend/              # Game logic & smart contracts
│   ├── package.json
│   └── tsconfig.json
├── frontend/             # Web UI (Next.js)
│   ├── app/
│   ├── package.json
│   ├── tsconfig.json
│   └── next.config.ts
├── RULEBOOK.md          # Official game rules
└── README.md            # This file
```

---

## 🛠️ Tech Stack

### Frontend
- **Next.js** — React framework
- **TypeScript** — Type-safe development
- **CSS** — Styling

### Backend
- **TypeScript** — Type-safe backend
- **Smart Contracts** — Game logic & settlement on blockchain

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app will run at `http://localhost:3000`.

### Backend Setup

```bash
cd backend
npm install
npm run build
```

---

## 📋 Key Features

✅ **Session-based gameplay** — One entry fee, instant play
✅ **Fair & transparent** — Provably fair card shuffling
✅ **Simultaneous action** — No waiting for other players
✅ **Final Knockout Round** — 2-player endgame with increased stakes
✅ **Round History Log** — View all cards played (proof of skill)
✅ **No mid-game transactions** — Eliminate pay-to-win behavior

---

## 🎯 Match Flow

1. **Entry** — Player joins a room (e.g., 5 USDC entry fee)
2. **Setup** — Match starts when 4–8 players join
3. **Rounds** — 10–15 second rounds of simultaneous card selection
4. **Elimination** — Players with 0 HP are removed
5. **Final Knockout** — Last 2 players enter high-stakes endgame
6. **Settlement** — Winner receives pooled stake (minus platform fee)

---

## 📚 Documentation

- **[RULEBOOK.md](RULEBOOK.md)** — Complete game rules for players & judges

---

## 📄 License

See [LICENSE](LICENSE) for details.

---

## 🤝 Contributing

Contributions welcome! Please ensure:
- Code follows TypeScript best practices
- Changes maintain game fairness & balance
- Updates to rules are reflected in RULEBOOK.md

---

## 🔥 Built for

- **Players** — Fast, skill-based card game
- **Judges** — Transparent, fair, provably skill-based
- **Blockchain** — Efficient, single-transaction settlement

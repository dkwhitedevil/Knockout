import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./MockGame.css";
import "../styles/card.css";

/* ================= TYPES ================= */

type Player = {
  id: number;
  name: string;
  health: number;
  hand: string[];
  alive: boolean;
};

type Action = {
  playerId: number;
  card: string;
};

/* ================= INITIAL STATE ================= */

const initialPlayers: Player[] = [
  { id: 1, name: "dinesh.eth", health: 20, hand: ["Strike", "Shield", "Steal", "Skip", "All-In"], alive: true },
  { id: 2, name: "vijay.eth", health: 20, hand: ["Heavy Hit", "Reflect", "Swap", "Strike", "Second Chance"], alive: true },
  { id: 3, name: "thiru.eth", health: 20, hand: ["Strike", "Shield", "Steal", "Skip", "All-In"], alive: true },
  { id: 4, name: "vimal.eth", health: 20, hand: ["Heavy Hit", "Reflect", "Swap", "Strike", "Second Chance"], alive: true },
];

/* ================= COMPONENT ================= */

export default function MockGame() {
  const navigate = useNavigate();

  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [round, setRound] = useState(1);
  const [log, setLog] = useState<string[]>([]);
  const [waitingChoice, setWaitingChoice] = useState(true);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [damageAnimation, setDamageAnimation] = useState<{ [key: number]: string }>({});
  const [activePlayer, setActivePlayer] = useState<number | null>(null);
  const [stealOptions, setStealOptions] = useState<string[] | null>(null);
  const [stealTarget, setStealTarget] = useState<Player | null>(null);

  const logRef = useRef<HTMLDivElement | null>(null);
  const ws = useRef<WebSocket | null>(null);

  /* ================= WEBSOCKET ================= */

  useEffect(() => {
    ws.current = new WebSocket("ws://localhost:8081");

    ws.current.onopen = () => console.log("🟢 Connected to Yellow server");
    ws.current.onclose = () => console.log("🔴 Disconnected from Yellow server");
    ws.current.onerror = (error) => console.error("WS error:", error);

    return () => {
      ws.current?.close();
    };
  }, []);

  /* ================= SERVER HELPERS ================= */

  const sendLogToServer = (message: string) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(
        JSON.stringify({
          type: "gameLog",
          payload: { message },
        })
      );
    }
  };

  const sendGameStateToServer = (updatedState: Player[], round: number, logs: string[]) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(
        JSON.stringify({
          type: "gameStateUpdate",
          payload: { players: updatedState, round, log: logs },
        })
      );
    }
  };

  const addLog = (message: string) => {
    setLog((prev) => [...prev, message]);
    sendLogToServer(message);
  };

  /* ================= PURE HELPERS ================= */

  const triggerDamageAnimation = (playerId: number, damage: number) => {
    setDamageAnimation((prev) => ({ ...prev, [playerId]: `-${damage}` }));
    setTimeout(() => {
      setDamageAnimation((prev) => ({ ...prev, [playerId]: "" }));
    }, 1000);
  };

  const damage = (state: Player[], attacker: number, amount: number) => {
    const targets = state.filter((p) => p.id !== attacker && p.alive);
    if (!targets.length) return { state, log: null };

    const target = targets[Math.floor(Math.random() * targets.length)];

    triggerDamageAnimation(target.id, amount);

    const newState = state.map((p) =>
      p.id === target.id
        ? { ...p, health: Math.max(0, p.health - amount), alive: p.health - amount > 0 }
        : p
    );

    return { state: newState, log: `${target.name} takes ${amount} damage` };
  };

  const steal = (state: Player[], playerId: number) => {
    const targets = state.filter((p) => p.id !== playerId && p.hand.length && p.alive);
    if (!targets.length) return { state, log: null };

    const target = targets[Math.floor(Math.random() * targets.length)];
    setStealOptions(target.hand); // Ensure options are set
    setStealTarget(target); // Ensure target is set

    return { state, log: null }; // Wait for user interaction
  };

  const handleStealChoice = (card: string) => {
    if (!stealTarget) return;

    const newState = players.map((p) => {
      if (p.id === 1) return { ...p, hand: [...p.hand, card] };
      if (p.id === stealTarget.id) return { ...p, hand: p.hand.filter((c) => c !== card) };
      return p;
    });

    setPlayers(newState);
    addLog(`dinesh.eth steals ${card} from ${stealTarget.name}`);
    setStealOptions(null);
    setStealTarget(null);
  };

  /* ================= ROUND RESOLUTION ================= */

  const resolveRound = (playerCard: string) => {
    let state = [...players];
    const logs: string[] = [];

    const actions: Action[] = [];

    actions.push({ playerId: 1, card: playerCard });

    state.forEach((p) => {
      if (p.id !== 1 && p.alive) {
        const random = p.hand[Math.floor(Math.random() * p.hand.length)];
        actions.push({ playerId: p.id, card: random });
      }
    });

    logs.push(`--- Round ${round} ---`);
    addLog(`--- Round ${round} ---`);

    actions.forEach((action) => {
      const player = state.find((p) => p.id === action.playerId);
      if (!player || !player.alive) return;

      logs.push(`${player.name} plays ${action.card}`);
      addLog(`${player.name} plays ${action.card}`);

      switch (action.card) {
        case "Strike": {
          const result = damage(state, player.id, 3);
          state = result.state;
          if (result.log) {
            logs.push(result.log);
            addLog(result.log);
          }
          break;
        }

        case "Heavy Hit": {
          const result = damage(state, player.id, 5);
          state = result.state;
          if (result.log) {
            logs.push(result.log);
            addLog(result.log);
          }
          break;
        }

        case "Steal": {
          const result = steal(state, player.id);
          state = result.state;
          if (result.log) {
            logs.push(result.log);
            addLog(result.log);
          }
          break;
        }

        default:
          break;
      }
    });

    setPlayers(state);
    sendGameStateToServer(state, round, logs);

    const alive = state.filter((p) => p.alive);
    if (alive.length === 1) {
      addLog(`🏆 ${alive[0].name} wins the game! 0.4000 sui is sent to your address`);
      setTimeout(() => {
        navigate("/game-over", { state: { winner: alive[0].name } });
      }, 1200);
      return;
    }

    setRound((r) => r + 1);
    setWaitingChoice(true);
  };

  /* ================= AUTO NEXT PLAYER ================= */

  useEffect(() => {
    if (!waitingChoice) {
      setActivePlayer(currentPlayerIndex + 1);
      const timer = setTimeout(() => {
        setCurrentPlayerIndex((i) => (i + 1) % players.length);
        setActivePlayer(null);
        setWaitingChoice(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [waitingChoice, currentPlayerIndex, players.length]);

  /* ================= USER TURN ================= */

  const playCard = (card: string) => {
    if (!waitingChoice) return;
    setWaitingChoice(false);
    setTimeout(() => resolveRound(card), 3000);
  };

  /* ================= UI EFFECTS ================= */

  useEffect(() => {
    logRef.current?.scrollTo({
      top: logRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [log]);

  const isCurrentPlayer = (playerId: number) => playerId === players[currentPlayerIndex]?.id;
  const isActivePlayer = (playerId: number) => activePlayer === playerId;

  /* ================= RENDER ================= */

  return (
    <div className="table">
      <p className="round">Round {round}</p>

      <div className="game-container">
        <div className="left-container">
          {/* Opponents and Player Details */}
          <div className="opponents">
            {players.slice(1).map((p) => (
              <div
                key={p.id}
                className={`seat ${!p.alive ? "dead" : ""} ${isActivePlayer(p.id) ? "active-player" : ""}`}
              >
                <h3>{p.name}</h3>
                <p>{p.health} HP</p>
              </div>
            ))}
          </div>

          <div className="player-area">
            <h2 className={isCurrentPlayer(players[0].id) ? "current-turn" : ""}>
              {players[0].name} — {players[0].health} HP
            </h2>

            {damageAnimation[players[0].id] && (
              <span className="damage-popup">{damageAnimation[players[0].id]}</span>
            )}

            <div className="cards">
              {players[0].hand.map((card, i) => (
                <img
                  key={i}
                  src={
                {
                  "Strike": "/strike.jpg",
                  "Shield": "/shield.jpeg",
                  "Steal": "/steal.jpeg",
                  "Skip": "/skip.jpeg",
                  "All-In": "/allin.jpeg",
                  "Heavy Hit": "/heavyhit.jpeg",
                  "Reflect": "/reflect.jpeg",
                  "Swap": "/swap.jpeg",
                  "Second Chance": "/secondchance.jpeg",
                }[card] || "/placeholder.svg"
              }
                  alt={card}
                  className="card-image"
                  onClick={() => playCard(card)}
                  style={{ cursor: waitingChoice ? "pointer" : "not-allowed" }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="right-container">
          {/* Game Log */}
          <div className="log">
              <h2 className="log-title">Game Log</h2>
          </div>
          <div className="log" ref={logRef} style={{
  background: "linear-gradient(135deg, #ff9a9e, #fad0c4)", // Gradient background
  border: "2px solid #ff6f61", // Bright border color
  borderRadius: "8px", // Rounded corners
  padding: "10px", // Add padding for better spacing
  boxShadow: "5px 5px 10px rgba(0, 0, 0, 0.2)", // Subtle shadow for depth
  color: "#333", // Text color for readability
  overflowY: "auto", // Ensure scrollability for long logs
}}>
            {log.slice(-50).map((entry, i) => (
              <p key={i}>{entry}</p>
            ))}
          </div>
        </div>
      </div>

      {/* Steal Options UI */}
      {stealOptions && (
        <div className="popup-overlay" style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000,
        }}>
          <div className="popup-container" style={{
            backgroundColor: "#fff",
            border: "4px solid black",
            borderRadius: "8px",
            padding: "20px",
            textAlign: "center",
            boxShadow: "10px 10px 0px black",
            width: "80%", // Increased width
            maxWidth: "800px", // Set a maximum width
          }}>
            <h3 className="popup-title" style={{
              fontSize: "1.5rem",
              marginBottom: "1rem",
              fontWeight: "bold",
            }}>Choose a card to steal</h3>
            <div className="popup-options" style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
              gap: "10px",
            }}>
              {stealOptions.map((card, index) => (
                <img
                  key={index}
                  src={{
                    "Strike": "/strike.jpg",
                    "Shield": "/shield.jpeg",
                    "Steal": "/steal.jpeg",
                    "Skip": "/skip.jpeg",
                    "All-In": "/allin.jpeg",
                    "Heavy Hit": "/heavyhit.jpeg",
                    "Reflect": "/reflect.jpeg",
                    "Swap": "/swap.jpeg",
                    "Second Chance": "/secondchance.jpeg",
                  }[card] || "/placeholder.svg"}
                  alt={card}
                  className="popup-card-image"
                  style={{
                    width: "150px",
                    height: "150px",
                    cursor: "pointer",
                    border: "2px solid black",
                    borderRadius: "4px",
                    boxShadow: "5px 5px 0px black",
                    transition: "transform 0.2s, box-shadow 0.2s", // Smooth transition for hover effects
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.1)"; // Slightly enlarge the card
                    e.currentTarget.style.boxShadow = "8px 8px 0px black"; // Enhance shadow
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)"; // Reset size
                    e.currentTarget.style.boxShadow = "5px 5px 0px black"; // Reset shadow
                  }}
                  onClick={() => handleStealChoice(card)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

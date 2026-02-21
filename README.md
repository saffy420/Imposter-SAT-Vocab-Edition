# Imposter: SAT Vocab Edition

A real-time multiplayer vocabulary game. One random player is secretly the "imposter" — they don't see the vocab word. Everyone else uses the word naturally in conversation. The imposter tries to blend in.

---

## Project Structure

```
ImposterSATEdition/
├── .gitignore
├── README.md
├── client/
│   ├── package.json
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── index.js       ← React entry point
│       ├── App.jsx        ← Full UI
│       └── api.js         ← REST + WebSocket client
└── server/
    ├── package.json
    └── index.js           ← Express + WebSocket server
```

---

## Local Development

### Terminal 1 — Server
```bash
cd server
npm install
npm start
# Server running on http://localhost:4000
```

### Terminal 2 — Client
```bash
cd client
npm install
npm start
# Opens http://localhost:3000
```

Both terminals must stay open while playing.

---

## Environment Variables

### Client (`client/.env.local` for local dev)
```
REACT_APP_API_URL=http://localhost:4000
REACT_APP_WS_URL=ws://localhost:4001
```

---

## How to Play

1. **Leader** creates a party and imports vocab words (`word - definition` format)
2. **Players** join via the 6-character code
3. Leader starts the game
4. Everyone except the imposter sees the vocab word
5. Players discuss — the imposter tries to blend in without knowing the word
6. Leader ends the game to reveal who the imposter was

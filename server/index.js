/**
 * Imposter: SAT Vocab Edition — Backend Server
 * ─────────────────────────────────────
 * Express REST API + WebSocket on the SAME port (Railway/Render compatible)
 *
 * REST Endpoints
 * ──────────────
 *  POST   /api/party              Create a party
 *  GET    /api/party/:code        Get party state
 *  POST   /api/party/:code/join   Join a party
 *  DELETE /api/party/:code        Disband a party (leader only)
 *  GET    /health                 Health check
 *
 * WebSocket Events (client → server)
 * ────────────────────────────────────
 *  { type: "JOIN",       code, playerId, playerName? }
 *  { type: "START_GAME" }
 *  { type: "END_GAME"   }
 *  { type: "END_ROUND"  }
 *  { type: "KICK",      targetId }
 *  { type: "RENAME",    targetId, newName }
 *  { type: "PING"       }
 *
 * WebSocket Events (server → client)
 * ────────────────────────────────────
 *  { type: "PARTY_STATE",    party }
 *  { type: "GAME_STARTED",   role, word, definition, members }
 *  { type: "GAME_ENDED",     reveal }
 *  { type: "KICKED",         reason }
 *  { type: "PARTY_DISBANDED", message }
 *  { type: "ERROR",          message }
 *  { type: "PONG" }
 */

const express  = require("express");
const cors     = require("cors");
const http     = require("http");
const { WebSocketServer, WebSocket } = require("ws");
const { v4: uuid } = require("uuid");

// ─── In-memory store ──────────────────────────────────────────────────────────
const parties = new Map(); // Map<code, Party>
const sockets = new Map(); // Map<ws, { playerId, partyCode }>

// ─── Helpers ──────────────────────────────────────────────────────────────────
function genCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  do {
    code = Array.from({ length: 6 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join("");
  } while (parties.has(code));
  return code;
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function serializeMember(m) {
  return { id: m.id, name: m.name, isLeader: m.isLeader, joinedAt: m.joinedAt };
}

function serializeParty(party) {
  return {
    code:      party.code,
    partyName: party.partyName,
    leaderId:  party.leaderId,
    wordCount: party.words.length,
    members:   [...party.members.values()].map(serializeMember),
    gameState: party.gameState
      ? { active: party.gameState.active, startedAt: party.gameState.startedAt }
      : null,
    createdAt: party.createdAt,
  };
}

function broadcast(partyCode, payload, excludeId = null) {
  const msg = JSON.stringify(payload);
  for (const [ws, meta] of sockets) {
    if (meta.partyCode === partyCode && meta.playerId !== excludeId) {
      if (ws.readyState === WebSocket.OPEN) ws.send(msg);
    }
  }
}

function sendTo(partyCode, playerId, payload) {
  const msg = JSON.stringify(payload);
  for (const [ws, meta] of sockets) {
    if (meta.partyCode === partyCode && meta.playerId === playerId) {
      if (ws.readyState === WebSocket.OPEN) ws.send(msg);
    }
  }
}

function pushPartyState(party) {
  broadcast(party.code, { type: "PARTY_STATE", party: serializeParty(party) });
}

function scheduleCleanup(code) {
  setTimeout(() => {
    if (parties.has(code)) {
      broadcast(code, { type: "PARTY_DISBANDED", message: "Party expired after 4 hours." });
      parties.delete(code);
      console.log(`[cleanup] Party ${code} expired`);
    }
  }, 4 * 60 * 60 * 1000);
}

// ─── Express App ──────────────────────────────────────────────────────────────
const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || "*",
  methods: ["GET", "POST", "DELETE"],
}));
app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({ ok: true, parties: parties.size, uptime: process.uptime() });
});

/**
 * POST /api/party
 * Body: { partyName, leaderName, words: [{ word, definition }] }
 */
app.post("/api/party", (req, res) => {
  const { partyName, leaderName, words = [] } = req.body;
  if (!partyName?.trim()) return res.status(400).json({ error: "partyName is required" });
  if (!leaderName?.trim()) return res.status(400).json({ error: "leaderName is required" });

  const code     = genCode();
  const leaderId = uuid();
  const leader   = { id: leaderId, name: leaderName.trim(), isLeader: true, joinedAt: new Date() };

  const party = {
    code,
    partyName: partyName.trim(),
    leaderId,
    words: words
      .map(w => ({ word: w.word?.trim(), definition: w.definition?.trim() }))
      .filter(w => w.word && w.definition),
    members:   new Map([[leaderId, leader]]),
    gameState: null,
    createdAt: new Date(),
  };

  parties.set(code, party);
  scheduleCleanup(code);

  return res.status(201).json({ code, playerId: leaderId, party: serializeParty(party) });
});

/**
 * GET /api/party/:code
 */
app.get("/api/party/:code", (req, res) => {
  const party = parties.get(req.params.code.toUpperCase());
  if (!party) return res.status(404).json({ error: "Party not found" });
  return res.json({ party: serializeParty(party) });
});

/**
 * POST /api/party/:code/join
 * Body: { playerName }
 */
app.post("/api/party/:code/join", (req, res) => {
  const party = parties.get(req.params.code.toUpperCase());
  if (!party) return res.status(404).json({ error: "Party not found" });
  if (party.gameState?.active) return res.status(409).json({ error: "Game is already in progress" });

  const { playerName } = req.body;
  if (!playerName?.trim()) return res.status(400).json({ error: "playerName is required" });

  const nameTaken = [...party.members.values()].some(
    m => m.name.toLowerCase() === playerName.trim().toLowerCase()
  );
  if (nameTaken) return res.status(409).json({ error: "That username is already taken in this party" });

  const playerId = uuid();
  const member   = { id: playerId, name: playerName.trim(), isLeader: false, joinedAt: new Date() };
  party.members.set(playerId, member);

  pushPartyState(party);

  return res.status(201).json({ playerId, party: serializeParty(party) });
});

/**
 * DELETE /api/party/:code
 * Header: x-player-id (must be leader)
 */
app.delete("/api/party/:code", (req, res) => {
  const party = parties.get(req.params.code.toUpperCase());
  if (!party) return res.status(404).json({ error: "Party not found" });

  const playerId = req.headers["x-player-id"];
  if (playerId !== party.leaderId) return res.status(403).json({ error: "Only the leader can disband the party" });

  broadcast(party.code, { type: "PARTY_DISBANDED", message: "The leader has ended the party." });
  parties.delete(party.code);

  return res.json({ ok: true });
});

// ─── HTTP Server ──────────────────────────────────────────────────────────────
const PORT       = process.env.PORT || 4000;
const httpServer = http.createServer(app);

// ─── WebSocket Server (same port as HTTP — Railway compatible) ────────────────
const wsServer = new WebSocketServer({ server: httpServer });

wsServer.on("connection", (ws) => {
  sockets.set(ws, { playerId: null, partyCode: null });

  ws.on("message", (raw) => {
    let msg;
    try { msg = JSON.parse(raw); }
    catch { return ws.send(JSON.stringify({ type: "ERROR", message: "Invalid JSON" })); }

    const { type } = msg;

    // ── PING ────────────────────────────────────────────────────────────────
    if (type === "PING") {
      return ws.send(JSON.stringify({ type: "PONG" }));
    }

    // ── JOIN ────────────────────────────────────────────────────────────────
    if (type === "JOIN") {
      const { code, playerId, playerName } = msg;
      const party = parties.get(code?.toUpperCase());
      if (!party) return ws.send(JSON.stringify({ type: "ERROR", message: "Party not found" }));

      sockets.set(ws, { playerId, partyCode: code.toUpperCase() });

      if (!party.members.has(playerId) && playerName) {
        const member = { id: playerId, name: playerName, isLeader: false, joinedAt: new Date() };
        party.members.set(playerId, member);
      }

      ws.send(JSON.stringify({ type: "PARTY_STATE", party: serializeParty(party) }));
      broadcast(code.toUpperCase(), { type: "PARTY_STATE", party: serializeParty(party) }, playerId);
      return;
    }

    // All further events need an established context
    const ctx   = sockets.get(ws);
    const party = ctx?.partyCode ? parties.get(ctx.partyCode) : null;
    if (!party) return ws.send(JSON.stringify({ type: "ERROR", message: "Not in a party" }));

    const { playerId } = ctx;
    const isLeader = playerId === party.leaderId;

    // ── START_GAME ──────────────────────────────────────────────────────────
    if (type === "START_GAME") {
      if (!isLeader)           return ws.send(JSON.stringify({ type: "ERROR", message: "Only the leader can start the game" }));
      if (party.members.size < 2) return ws.send(JSON.stringify({ type: "ERROR", message: "Need at least 2 players" }));
      if (!party.words.length) return ws.send(JSON.stringify({ type: "ERROR", message: "No vocabulary words loaded" }));

      const memberList = [...party.members.values()];
      const impostor   = randomItem(memberList);
      const chosenWord = randomItem(party.words);

      party.gameState = {
        active:     true,
        impostor:   impostor.id,
        word:       chosenWord.word,
        definition: chosenWord.definition,
        startedAt:  new Date(),
      };

      for (const member of memberList) {
        const isImpostor = member.id === impostor.id;
        sendTo(party.code, member.id, {
          type:       "GAME_STARTED",
          role:       isImpostor ? "IMPOSTOR" : "PLAYER",
          word:       isImpostor ? null : chosenWord.word,
          definition: isImpostor ? null : chosenWord.definition,
          members:    memberList.map(serializeMember),
        });
      }
      return;
    }

    // ── END_GAME ────────────────────────────────────────────────────────────
    if (type === "END_GAME") {
      if (!isLeader) return ws.send(JSON.stringify({ type: "ERROR", message: "Only the leader can end the game" }));

      const reveal = party.gameState
        ? { word: party.gameState.word, definition: party.gameState.definition, impostorId: party.gameState.impostor }
        : null;

      party.gameState = null;
      broadcast(party.code, { type: "GAME_ENDED", reveal });
      return;
    }

    // ── END_ROUND ───────────────────────────────────────────────────────────
    if (type === "END_ROUND") {
      if (!isLeader)           return ws.send(JSON.stringify({ type: "ERROR", message: "Only the leader can end rounds" }));
      if (!party.words.length) return ws.send(JSON.stringify({ type: "ERROR", message: "No vocabulary words loaded" }));

      const memberList = [...party.members.values()];
      const impostor   = randomItem(memberList);
      const chosenWord = randomItem(party.words);

      party.gameState = {
        active:     true,
        impostor:   impostor.id,
        word:       chosenWord.word,
        definition: chosenWord.definition,
        startedAt:  new Date(),
      };

      for (const member of memberList) {
        const isImpostor = member.id === impostor.id;
        sendTo(party.code, member.id, {
          type:       "GAME_STARTED",
          role:       isImpostor ? "IMPOSTOR" : "PLAYER",
          word:       isImpostor ? null : chosenWord.word,
          definition: isImpostor ? null : chosenWord.definition,
          members:    memberList.map(serializeMember),
        });
      }
      return;
    }

    // ── KICK ────────────────────────────────────────────────────────────────
    if (type === "KICK") {
      if (!isLeader) return ws.send(JSON.stringify({ type: "ERROR", message: "Only the leader can kick players" }));
      const { targetId } = msg;
      if (!targetId || targetId === party.leaderId) return ws.send(JSON.stringify({ type: "ERROR", message: "Cannot kick this player" }));

      party.members.delete(targetId);
      sendTo(party.code, targetId, { type: "KICKED", reason: "You were removed by the leader" });

      for (const [sock, meta] of sockets) {
        if (meta.partyCode === party.code && meta.playerId === targetId) {
          sockets.set(sock, { playerId: null, partyCode: null });
        }
      }

      pushPartyState(party);
      return;
    }

    // ── RENAME ──────────────────────────────────────────────────────────────
    if (type === "RENAME") {
      if (!isLeader) return ws.send(JSON.stringify({ type: "ERROR", message: "Only the leader can rename players" }));
      const { targetId, newName } = msg;
      if (!targetId || !newName?.trim()) return ws.send(JSON.stringify({ type: "ERROR", message: "targetId and newName required" }));

      const target = party.members.get(targetId);
      if (!target) return ws.send(JSON.stringify({ type: "ERROR", message: "Player not found" }));

      const collision = [...party.members.values()].some(
        m => m.id !== targetId && m.name.toLowerCase() === newName.trim().toLowerCase()
      );
      if (collision) return ws.send(JSON.stringify({ type: "ERROR", message: "Name already taken" }));

      target.name = newName.trim();
      pushPartyState(party);
      return;
    }

    ws.send(JSON.stringify({ type: "ERROR", message: `Unknown event type: ${type}` }));
  });

  ws.on("close", () => {
    const ctx = sockets.get(ws);
    sockets.delete(ws);
    if (ctx?.partyCode) {
      const party = parties.get(ctx.partyCode);
      if (party) pushPartyState(party);
    }
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────
httpServer.listen(PORT, () => {
  console.log(`✅ Server (REST + WebSocket) running on port ${PORT}`);
  console.log(`✅ Health check → http://localhost:${PORT}/health`);
});

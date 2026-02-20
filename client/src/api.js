/**
 * api.js — Imposter: SAT Vocab Edition client library
 * ─────────────────────────────────────────────
 * Wraps all REST calls and the WebSocket connection.
 *
 * WebSocket now connects to the SAME origin as the REST API
 * (single port — Railway/Render compatible).
 */

const REST_BASE = process.env.REACT_APP_API_URL || "";
const WS_URL    = process.env.REACT_APP_WS_URL  || (() => {
  // Auto-derive WebSocket URL from current page origin in production
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host  = process.env.REACT_APP_API_URL
    ? process.env.REACT_APP_API_URL.replace(/^https?:/, proto)
    : `${proto}//${window.location.host}`;
  return host;
})();

// ─── Shared fetch helper ──────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const res = await fetch(`${REST_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
  return json;
}

// ─── Internal WS state ───────────────────────────────────────────────────────
let _ws                = null;
let _code              = null;
let _playerId          = null;
let _handlers          = {};
let _pingTimer         = null;
let _reconnectTimer    = null;
let _reconnectAttempts = 0;
const MAX_RECONNECT    = 5;

// ─── REST ─────────────────────────────────────────────────────────────────────

/**
 * Create a new party (leader).
 * @param {{ partyName, leaderName, words: [{word, definition}] }}
 * @returns {{ code, playerId, party }}
 */
async function createParty({ partyName, leaderName, words = [] }) {
  return apiFetch("/api/party", { method: "POST", body: { partyName, leaderName, words } });
}

/**
 * Get the current public state of a party.
 * @param {string} code
 */
async function getParty(code) {
  return apiFetch(`/api/party/${code.toUpperCase()}`);
}

/**
 * Join an existing party (member).
 * @param {string} code
 * @param {string} playerName
 * @returns {{ playerId, party }}
 */
async function joinParty(code, playerName) {
  return apiFetch(`/api/party/${code.toUpperCase()}/join`, {
    method: "POST",
    body:   { playerName },
  });
}

/**
 * Disband the party entirely (leader only).
 * @param {string} code
 * @param {string} leaderId
 */
async function disbandParty(code, leaderId) {
  return apiFetch(`/api/party/${code.toUpperCase()}`, {
    method:  "DELETE",
    headers: { "x-player-id": leaderId },
  });
}

// ─── WebSocket ────────────────────────────────────────────────────────────────

/**
 * Open a WebSocket connection and bind event handlers.
 *
 * handlers = {
 *   onPartyState(party)
 *   onGameStarted({ role, word, definition, members })
 *   onGameEnded({ reveal })
 *   onKicked({ reason })
 *   onDisbanded({ message })
 *   onError({ message })
 *   onOpen()
 *   onClose()
 * }
 */
function connect(code, playerId, handlers = {}) {
  _code              = code.toUpperCase();
  _playerId          = playerId;
  _handlers          = handlers;
  _reconnectAttempts = 0;
  _openConnection();
}

function _openConnection() {
  if (_ws) { _ws.onclose = null; _ws.close(); }

  _ws = new WebSocket(WS_URL);

  _ws.onopen = () => {
    _reconnectAttempts = 0;
    _send({ type: "JOIN", code: _code, playerId: _playerId });
    _startPing();
    _handlers.onOpen?.();
  };

  _ws.onmessage = (event) => {
    let msg;
    try { msg = JSON.parse(event.data); } catch { return; }

    switch (msg.type) {
      case "PONG":            break;
      case "PARTY_STATE":     _handlers.onPartyState?.(msg.party);  break;
      case "GAME_STARTED":    _handlers.onGameStarted?.(msg);       break;
      case "GAME_ENDED":      _handlers.onGameEnded?.(msg);         break;
      case "KICKED":          _handlers.onKicked?.(msg);            break;
      case "PARTY_DISBANDED": _handlers.onDisbanded?.(msg);         break;
      case "ERROR":           _handlers.onError?.(msg);             break;
      default: console.warn("[ws] Unknown message type:", msg.type);
    }
  };

  _ws.onclose = () => {
    _stopPing();
    _handlers.onClose?.();
    _scheduleReconnect();
  };

  _ws.onerror = (err) => console.error("[ws] error", err);
}

function _scheduleReconnect() {
  if (_reconnectAttempts >= MAX_RECONNECT) {
    console.warn("[ws] Max reconnect attempts reached");
    return;
  }
  const delay = Math.min(1000 * 2 ** _reconnectAttempts, 15000);
  _reconnectAttempts++;
  console.log(`[ws] Reconnecting in ${delay}ms (attempt ${_reconnectAttempts})`);
  _reconnectTimer = setTimeout(_openConnection, delay);
}

function _send(payload) {
  if (_ws?.readyState === WebSocket.OPEN) {
    _ws.send(JSON.stringify(payload));
  } else {
    console.warn("[ws] Cannot send — socket not open");
  }
}

function _startPing() {
  _stopPing();
  _pingTimer = setInterval(() => _send({ type: "PING" }), 25000);
}

function _stopPing() {
  if (_pingTimer) { clearInterval(_pingTimer); _pingTimer = null; }
}

function disconnect() {
  clearTimeout(_reconnectTimer);
  _stopPing();
  if (_ws) { _ws.onclose = null; _ws.close(); _ws = null; }
  _code = null; _playerId = null; _handlers = {};
}

// ─── WS actions ───────────────────────────────────────────────────────────────
const startGame            = ()               => _send({ type: "START_GAME" });
const endGame              = ()               => _send({ type: "END_GAME"   });
const endRound             = ()               => _send({ type: "END_ROUND"  });
const kick                 = (targetId)       => _send({ type: "KICK",   targetId });
const rename               = (targetId, name) => _send({ type: "RENAME", targetId, newName: name });

// ─── Export ───────────────────────────────────────────────────────────────────
const api = {
  createParty, getParty, joinParty, disbandParty,
  connect, disconnect,
  startGame, endGame, endRound, kick, rename,
};

export default api;

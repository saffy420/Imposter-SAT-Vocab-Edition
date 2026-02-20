/**
 * App.jsx — Imposter: SAT Vocab Edition
 * Full React app wired to the real backend via api.js
 */
import { useState, useEffect, useCallback } from "react";
import api from "./api";

// ─── Global Styles ────────────────────────────────────────────────────────────
const GLOBAL_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Playfair+Display:wght@700;900&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --navy: #0f1e3d;
    --navy-mid: #1a2f5e;
    --navy-light: #243a72;
    --blue: #3b82f6;
    --blue-light: #93c5fd;
    --purple: #7c5cbf;
    --white: #f8faff;
    --off-white: #eef2fb;
    --text: #0f1e3d;
    --muted: #64748b;
    --danger: #ef4444;
    --danger-bg: #fee2e2;
    --success: #22c55e;
    --success-bg: #dcfce7;
    --card-bg: rgba(255,255,255,0.95);
    --shadow: 0 8px 32px rgba(15,30,61,0.12);
    --shadow-lg: 0 20px 60px rgba(15,30,61,0.18);
    --radius: 18px;
    --radius-sm: 10px;
    --transition: 0.22s cubic-bezier(.4,0,.2,1);
  }

  [data-theme="dark"] {
    --navy: #0a0f1e;
    --navy-mid: #111827;
    --navy-light: #1f2937;
    --white: #f1f5f9;
    --off-white: #1e2942;
    --text: #e2e8f0;
    --muted: #94a3b8;
    --card-bg: rgba(17,24,39,0.97);
    --shadow: 0 8px 32px rgba(0,0,0,0.4);
    --shadow-lg: 0 20px 60px rgba(0,0,0,0.5);
  }

  html, body, #root {
    height: 100%;
    font-family: 'DM Sans', sans-serif;
    background: var(--navy);
    color: var(--text);
    overflow-x: hidden;
  }

  .app-bg {
    min-height: 100vh;
    background: linear-gradient(135deg, #0f1e3d 0%, #1a2f5e 50%, #0d1b4b 100%);
    position: relative;
    overflow: hidden;
  }

  [data-theme="dark"] .app-bg {
    background: linear-gradient(135deg, #060b1a 0%, #0d1424 50%, #06091a 100%);
  }

  .bg-orb {
    position: fixed; border-radius: 50%; filter: blur(80px);
    opacity: 0.18; pointer-events: none; z-index: 0;
    animation: float 8s ease-in-out infinite;
  }
  .bg-orb-1 { width:500px; height:500px; background:#7c5cbf; top:-100px; right:-100px; }
  .bg-orb-2 { width:350px; height:350px; background:#3b82f6; bottom:-50px; left:-80px; animation-delay:3s; }
  .bg-orb-3 { width:250px; height:250px; background:#93c5fd; top:40%; left:30%; animation-delay:5s; }

  @keyframes float {
    0%,100% { transform: translateY(0) scale(1); }
    50%      { transform: translateY(-30px) scale(1.05); }
  }

  .card {
    background: var(--card-bg);
    backdrop-filter: blur(20px);
    border-radius: var(--radius);
    box-shadow: var(--shadow-lg);
    border: 1px solid rgba(255,255,255,0.12);
    color: var(--text);
    position: relative; z-index: 1;
    animation: cardIn 0.4s cubic-bezier(.4,0,.2,1) both;
  }

  @keyframes cardIn {
    from { opacity:0; transform:translateY(24px) scale(.97); }
    to   { opacity:1; transform:translateY(0) scale(1); }
  }

  .btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 600;
    padding: 12px 24px; border-radius: 12px; border: none; cursor: pointer;
    transition: all var(--transition); white-space: nowrap; letter-spacing: .01em;
  }
  .btn:active { transform: scale(.97); }
  .btn-primary  { background: linear-gradient(135deg,#3b82f6 0%,#7c5cbf 100%); color:#fff; box-shadow:0 4px 20px rgba(59,130,246,.35); }
  .btn-primary:hover  { box-shadow:0 6px 28px rgba(59,130,246,.55); transform:translateY(-2px); }
  .btn-secondary { background:rgba(59,130,246,.1); color:var(--blue); border:2px solid rgba(59,130,246,.25); }
  .btn-secondary:hover { background:rgba(59,130,246,.18); border-color:var(--blue); transform:translateY(-1px); }
  .btn-danger   { background:var(--danger-bg); color:var(--danger); border:2px solid rgba(239,68,68,.2); }
  .btn-danger:hover { background:rgba(239,68,68,.18); }
  .btn-ghost    { background:transparent; color:var(--muted); padding:6px 10px; font-size:13px; }
  .btn-ghost:hover { background:rgba(0,0,0,.06); color:var(--text); }
  .btn-icon     { width:34px; height:34px; padding:0; border-radius:8px; font-size:14px; }
  .btn-sm       { padding:7px 14px; font-size:13px; border-radius:8px; }
  .btn-lg       { padding:16px 36px; font-size:17px; border-radius:14px; }
  .btn:disabled { opacity:.45; cursor:not-allowed; transform:none !important; }

  .input {
    width:100%; padding:13px 16px; border-radius:var(--radius-sm);
    border:2px solid rgba(15,30,61,.12); background:var(--off-white);
    font-family:'DM Sans',sans-serif; font-size:15px; color:var(--text);
    transition:border-color var(--transition),box-shadow var(--transition); outline:none;
  }
  .input:focus { border-color:var(--blue); box-shadow:0 0 0 4px rgba(59,130,246,.12); }
  .input::placeholder { color:var(--muted); }
  textarea.input { resize:vertical; min-height:130px; font-size:13.5px; line-height:1.6; }

  .label {
    font-size:12.5px; font-weight:600; text-transform:uppercase;
    letter-spacing:.08em; color:var(--muted); margin-bottom:6px; display:block;
  }

  .badge {
    display:inline-flex; align-items:center; gap:5px; padding:4px 10px;
    border-radius:99px; font-size:11.5px; font-weight:700;
    letter-spacing:.04em; text-transform:uppercase;
  }
  .badge-leader { background:linear-gradient(135deg,#3b82f6,#7c5cbf); color:#fff; }
  .badge-player { background:rgba(148,163,184,.18); color:var(--muted); }

  .join-code {
    font-family:'Playfair Display',serif; font-size:36px; font-weight:900;
    letter-spacing:.22em;
    background:linear-gradient(135deg,#3b82f6,#7c5cbf);
    -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
  }

  .member-row {
    display:flex; align-items:center; gap:10px; padding:10px 14px;
    border-radius:12px; background:var(--off-white);
    border:1px solid rgba(0,0,0,.05);
    transition:background var(--transition);
    animation:fadeSlide .25s ease both;
  }
  .member-row:hover { background:rgba(59,130,246,.07); }

  @keyframes fadeSlide {
    from { opacity:0; transform:translateX(-8px); }
    to   { opacity:1; transform:translateX(0); }
  }

  .avatar {
    width:36px; height:36px; border-radius:50%;
    display:flex; align-items:center; justify-content:center;
    font-weight:700; font-size:14px; color:#fff; flex-shrink:0;
  }

  .topbar {
    position:fixed; top:0; left:0; right:0; z-index:100;
    display:flex; align-items:center; justify-content:space-between;
    padding:14px 24px; backdrop-filter:blur(16px);
    background:rgba(15,30,61,.6); border-bottom:1px solid rgba(255,255,255,.08);
  }
  .topbar-title {
    font-family:'Playfair Display',serif; font-size:18px; font-weight:700;
    color:#fff; letter-spacing:.02em;
  }

  .theme-toggle {
    width:44px; height:24px; border-radius:99px;
    background:rgba(255,255,255,.2); border:none; cursor:pointer;
    position:relative; transition:background var(--transition);
  }
  .theme-toggle::after {
    content:''; position:absolute; width:18px; height:18px; border-radius:50%;
    background:#fff; top:3px; left:3px; transition:transform var(--transition);
  }
  [data-theme="dark"] .theme-toggle::after { transform:translateX(20px); }
  [data-theme="dark"] .theme-toggle { background:rgba(59,130,246,.5); }

  .status-dot {
    width:8px; height:8px; border-radius:50%; display:inline-block;
    margin-right:6px; animation:pulse-dot 2s infinite;
  }
  .status-dot.green  { background:var(--success); }
  .status-dot.yellow { background:#f59e0b; }
  .status-dot.red    { background:var(--danger); }

  @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:.45} }

  .divider { border:none; border-top:1px solid rgba(0,0,0,.08); margin:20px 0; }
  [data-theme="dark"] .divider { border-color:rgba(255,255,255,.08); }

  .center-wrap {
    min-height:100vh; display:flex; align-items:center; justify-content:center;
    padding:80px 16px 40px; position:relative; z-index:1;
  }

  .lobby-grid {
    display:grid; grid-template-columns:1fr 1fr; gap:24px; width:100%; max-width:900px;
  }
  @media(max-width:700px) { .lobby-grid { grid-template-columns:1fr; } }

  .float-panel {
    position:fixed; top:70px; right:20px; bottom:20px; width:280px;
    background:var(--card-bg); backdrop-filter:blur(20px);
    border-radius:var(--radius); box-shadow:var(--shadow-lg);
    border:1px solid rgba(255,255,255,.12);
    display:flex; flex-direction:column; z-index:50; overflow:hidden;
    animation:slideIn .3s ease;
  }
  @keyframes slideIn { from{opacity:0;transform:translateX(30px)} to{opacity:1;transform:translateX(0)} }
  .float-panel-header { padding:16px 18px 14px; border-bottom:1px solid rgba(0,0,0,.07); font-weight:700; font-size:14px; color:var(--text); background:rgba(59,130,246,.04); }
  .float-panel-body   { flex:1; overflow-y:auto; padding:12px; display:flex; flex-direction:column; gap:8px; }
  .float-panel-footer { padding:12px; border-top:1px solid rgba(0,0,0,.07); display:flex; flex-direction:column; gap:8px; }

  .vocab-word {
    font-family:'Playfair Display',serif; font-size:52px; font-weight:900;
    background:linear-gradient(135deg,#3b82f6,#7c5cbf);
    -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
    line-height:1.1; animation:wordReveal .6s cubic-bezier(.4,0,.2,1) both;
  }
  @keyframes wordReveal { from{opacity:0;transform:scale(.8) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }

  .imposter-label {
    font-family:'Playfair Display',serif; font-size:42px; font-weight:900;
    color:var(--danger); animation:wordReveal .6s ease both;
  }

  .timer { font-size:13px; font-weight:600; color:var(--muted); letter-spacing:.05em; }

  .word-chip {
    display:inline-flex; align-items:center; gap:6px;
    background:rgba(59,130,246,.1); color:var(--blue);
    padding:6px 14px; border-radius:99px; font-size:13px; font-weight:600;
  }

  .rename-input {
    flex:1; padding:5px 8px; font-size:13px; border:1.5px solid var(--blue);
    border-radius:6px; background:var(--off-white); color:var(--text); outline:none;
    font-family:'DM Sans',sans-serif;
  }

  .field { display:flex; flex-direction:column; gap:6px; }

  .toast {
    position:fixed; bottom:24px; left:50%; transform:translateX(-50%);
    background:var(--navy-mid); color:#fff; padding:12px 24px;
    border-radius:12px; font-size:14px; font-weight:500;
    box-shadow:var(--shadow-lg); z-index:999; animation:toastIn .3s ease;
  }
  @keyframes toastIn { from{opacity:0;transform:translate(-50%,20px)} to{opacity:1;transform:translate(-50%,0)} }

  .error-banner {
    background:var(--danger-bg); color:var(--danger); padding:10px 16px;
    border-radius:10px; font-size:13.5px; font-weight:500;
    border:1px solid rgba(239,68,68,.2);
  }

  .reveal-card {
    background:rgba(59,130,246,.07); border:1px solid rgba(59,130,246,.18);
    border-radius:14px; padding:18px 20px; margin-top:16px;
  }

  ::-webkit-scrollbar { width:5px; }
  ::-webkit-scrollbar-thumb { background:rgba(148,163,184,.3); border-radius:99px; }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const COLORS = ["#3b82f6","#7c5cbf","#06b6d4","#f59e0b","#10b981","#ef4444","#8b5cf6","#f97316"];
const getColor = n => COLORS[(n?.charCodeAt(0) ?? 0) % COLORS.length];

const parseVocab = (text) =>
  text.split("\n").map(l => l.trim()).filter(Boolean).map(l => {
    const idx = l.indexOf(" - ");
    return idx === -1 ? null : { word: l.slice(0, idx).trim(), definition: l.slice(idx + 3).trim() };
  }).filter(Boolean);

function useTimer(active) {
  const [s, setS] = useState(0);
  useEffect(() => {
    if (!active) { setS(0); return; }
    const id = setInterval(() => setS(p => p + 1), 1000);
    return () => clearInterval(id);
  }, [active]);
  return `${String(Math.floor(s / 60)).padStart(2,"0")}:${String(s % 60).padStart(2,"0")}`;
}

// ─── Small shared components ──────────────────────────────────────────────────
function Toast({ msg, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2400); return () => clearTimeout(t); }, [onDone]);
  return <div className="toast">{msg}</div>;
}

function TopBar({ theme, toggleTheme, showBack, onBack, rightSlot }) {
  return (
    <div className="topbar">
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        {showBack && (
          <button className="btn btn-ghost" onClick={onBack} style={{ color:"rgba(255,255,255,.7)" }}>← Back</button>
        )}
        <span className="topbar-title">📚 Imposter: SAT Vocab Edition </span>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        {rightSlot}
        <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme" />
      </div>
    </div>
  );
}

function MemberRow({ member, isLeader, onKick, onRename }) {
  const [renaming, setRenaming] = useState(false);
  const [val, setVal] = useState(member.name);

  const commit = () => {
    if (val.trim() && val !== member.name) onRename(member.id, val.trim());
    setRenaming(false);
  };

  return (
    <div className="member-row">
      <div className="avatar" style={{ background: getColor(member.name) }}>
        {member.name[0]?.toUpperCase()}
      </div>
      {renaming ? (
        <>
          <input
            className="rename-input" value={val}
            onChange={e => setVal(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") setRenaming(false); }}
            autoFocus
          />
          <button
            className="btn btn-icon"
            style={{ background:"var(--success-bg)", color:"var(--success)", width:28, height:28, fontSize:12 }}
            onClick={commit}
          >✓</button>
        </>
      ) : (
        <>
          <span style={{ flex:1, fontWeight:600, fontSize:14 }}>{member.name}</span>
          {member.isLeader
            ? <span className="badge badge-leader">Leader</span>
            : <span className="badge badge-player">Player</span>}
          {isLeader && !member.isLeader && (
            <>
              <button className="btn btn-icon btn-ghost" title="Rename" onClick={() => { setVal(member.name); setRenaming(true); }}>✏️</button>
              <button className="btn btn-icon btn-ghost" style={{ color:"var(--danger)" }} title="Kick" onClick={() => onKick(member.id)}>✖</button>
            </>
          )}
        </>
      )}
    </div>
  );
}

// ─── Screen: Landing ──────────────────────────────────────────────────────────
function Landing({ go }) {
  return (
    <div className="center-wrap" style={{ flexDirection:"column", textAlign:"center", gap:40 }}>
      <div>
        <div style={{ width:80, height:80, borderRadius:22, margin:"0 auto 28px", background:"linear-gradient(135deg,#3b82f6,#7c5cbf)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:36, boxShadow:"0 12px 40px rgba(59,130,246,.45)" }}>📖</div>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(38px,8vw,72px)", fontWeight:900, color:"#fff", lineHeight:1.1, marginBottom:14 }}>
          Imposter:<br />SAT Vocab Edition
        </h1>
        <p style={{ color:"rgba(255,255,255,.6)", fontSize:18 }}>Spot the imposter. Master your vocab.</p>
      </div>

      <div style={{ display:"flex", gap:16, flexWrap:"wrap", justifyContent:"center" }}>
        <button className="btn btn-primary btn-lg" onClick={() => go("create")}>✨ Create Party</button>
        <button className="btn btn-secondary btn-lg" style={{ color:"#fff", borderColor:"rgba(255,255,255,.25)", background:"rgba(255,255,255,.1)" }} onClick={() => go("join")}>🔗 Join Party</button>
      </div>

      <div style={{ display:"flex", gap:24, flexWrap:"wrap", justifyContent:"center" }}>
        {[["🎭","Bluff & Deduce","One player gets the imposter role"],["📝","Real SAT Words","Import your own vocabulary lists"],["⚡","Live Multiplayer","Play with friends via join code"]].map(([icon,t,d]) => (
          <div key={t} style={{ background:"rgba(255,255,255,.07)", backdropFilter:"blur(10px)", borderRadius:16, padding:"18px 22px", width:190, border:"1px solid rgba(255,255,255,.1)" }}>
            <div style={{ fontSize:28, marginBottom:8 }}>{icon}</div>
            <div style={{ color:"#fff", fontWeight:700, fontSize:14 }}>{t}</div>
            <div style={{ color:"rgba(255,255,255,.5)", fontSize:12.5, marginTop:4 }}>{d}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Screen: Create Party ─────────────────────────────────────────────────────
function CreateParty({ onCreated }) {
  const [partyName, setPartyName] = useState("");
  const [username, setUsername]   = useState("");
  const [vocabText, setVocabText] = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const words = parseVocab(vocabText);

  const handleCreate = async () => {
    setError(""); setLoading(true);
    try {
      const result = await api.createParty({ partyName: partyName.trim(), leaderName: username.trim(), words });
      onCreated(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="center-wrap">
      <div className="card" style={{ width:"100%", maxWidth:560, padding:"36px 40px" }}>
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:800, marginBottom:6 }}>Create Party</h2>
        <p style={{ color:"var(--muted)", fontSize:14, marginBottom:28 }}>Set up your game room and import vocabulary</p>
        {error && <div className="error-banner" style={{ marginBottom:16 }}>⚠️ {error}</div>}
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
          <div className="field">
            <label className="label">Party Name</label>
            <input className="input" placeholder="e.g. SAT Prep Squad" value={partyName} onChange={e => setPartyName(e.target.value)} />
          </div>
          <div className="field">
            <label className="label">Your Username (Leader)</label>
            <input className="input" placeholder="Choose a name..." value={username} onChange={e => setUsername(e.target.value)} />
          </div>
          <hr className="divider" style={{ margin:"4px 0" }} />
          <div className="field">
            <label className="label">Import Vocabulary</label>
            <textarea
              className="input"
              placeholder={"aberration - a deviation from what is normal\nlaconic - using very few words\nbenevolent - well meaning and kindly"}
              value={vocabText}
              onChange={e => setVocabText(e.target.value)}
            />
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:8 }}>
              <span style={{ color:"var(--muted)", fontSize:12 }}>
                Use <code style={{ background:"rgba(0,0,0,.07)", padding:"2px 5px", borderRadius:4 }}>word - definition</code> format, one per line
              </span>
              {words.length > 0 && <span className="word-chip">✓ {words.length} words</span>}
            </div>
          </div>
          <button className="btn btn-primary" style={{ width:"100%" }} onClick={handleCreate}
            disabled={!partyName.trim() || !username.trim() || loading}>
            {loading ? "Creating..." : "Create & Enter Lobby →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Screen: Join Party ───────────────────────────────────────────────────────
function JoinParty({ onJoined }) {
  const [code, setCode]       = useState("");
  const [username, setUser]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const handleJoin = async () => {
    setError(""); setLoading(true);
    try {
      const result = await api.joinParty(code.trim(), username.trim());
      onJoined({ code: code.toUpperCase(), ...result });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="center-wrap">
      <div className="card" style={{ width:"100%", maxWidth:440, padding:"36px 40px" }}>
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:800, marginBottom:6 }}>Join Party</h2>
        <p style={{ color:"var(--muted)", fontSize:14, marginBottom:28 }}>Enter a join code to jump in</p>
        {error && <div className="error-banner" style={{ marginBottom:16 }}>⚠️ {error}</div>}
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
          <div className="field">
            <label className="label">Join Code</label>
            <input
              className="input" placeholder="e.g. AB3X7K" value={code}
              onChange={e => setCode(e.target.value.toUpperCase().slice(0, 6))}
              style={{ fontSize:22, fontFamily:"'Playfair Display',serif", letterSpacing:"0.18em", textTransform:"uppercase" }}
            />
          </div>
          <div className="field">
            <label className="label">Your Username</label>
            <input className="input" placeholder="Choose a name..." value={username} onChange={e => setUser(e.target.value)} />
          </div>
          <button className="btn btn-primary" style={{ width:"100%" }} onClick={handleJoin}
            disabled={code.length !== 6 || !username.trim() || loading}>
            {loading ? "Joining..." : "Join Game →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Screen: Lobby ────────────────────────────────────────────────────────────
function Lobby({ party, isLeader, wsConnected, onStart, onEnd, onKick, onRename }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard?.writeText(party.code); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div className="center-wrap" style={{ alignItems:"flex-start" }}>
      <div className="lobby-grid">
        {/* Left: Members */}
        <div className="card" style={{ padding:"28px 28px" }}>
          <div style={{ marginBottom:20 }}>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:800 }}>{party.partyName}</h2>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginTop:10 }}>
              <div className="join-code" style={{ fontSize:26 }}>{party.code}</div>
              <button className="btn btn-secondary btn-sm" onClick={copy}>{copied ? "✓ Copied!" : "📋 Copy"}</button>
            </div>
          </div>
          <hr className="divider" style={{ margin:"16px 0" }} />
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
            <span className="label" style={{ margin:0 }}>Players ({party.members.length})</span>
            <span className="word-chip" style={{ fontSize:11 }}>📖 {party.wordCount} words</span>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {party.members.map((m, i) => (
              <div key={m.id} style={{ animationDelay:`${i * 0.05}s` }}>
                <MemberRow member={m} isLeader={isLeader} onKick={onKick} onRename={onRename} />
              </div>
            ))}
          </div>
        </div>

        {/* Right: Controls */}
        <div className="card" style={{ padding:"28px 28px", display:"flex", flexDirection:"column", gap:20 }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", marginBottom:6 }}>
              <span className={`status-dot ${wsConnected ? "green" : "red"}`} />
              <span style={{ color:"var(--muted)", fontSize:14, fontWeight:600 }}>
                {wsConnected ? "Connected — waiting for players..." : "Connecting..."}
              </span>
            </div>
            <div style={{ fontSize:13, color:"var(--muted)" }}>Share the join code with friends</div>
          </div>

          <div style={{ background:"var(--off-white)", borderRadius:14, padding:"18px 20px" }}>
            <div style={{ fontSize:13, color:"var(--muted)", marginBottom:4 }}>Players Joined</div>
            <div style={{ fontSize:36, fontWeight:800, fontFamily:"'Playfair Display',serif" }}>{party.members.length}</div>
          </div>

          {isLeader ? (
            <>
              <div style={{ background:"rgba(59,130,246,.06)", borderRadius:12, padding:"14px 16px", border:"1px solid rgba(59,130,246,.12)" }}>
                <div style={{ fontSize:12.5, color:"var(--blue)", fontWeight:700, marginBottom:4, textTransform:"uppercase", letterSpacing:"0.06em" }}>Leader Controls</div>
                <div style={{ fontSize:13, color:"var(--muted)" }}>Kick & rename players from the list. Start when everyone is ready!</div>
              </div>
              <button className="btn btn-primary" style={{ width:"100%" }} onClick={onStart}
                disabled={party.members.length < 2 || party.wordCount === 0}>
                🚀 Start Game
              </button>
              {(party.members.length < 2 || party.wordCount === 0) && (
                <p style={{ fontSize:12, color:"var(--muted)", textAlign:"center", marginTop:-8 }}>
                  {party.wordCount === 0 ? "Add vocab words to start" : "Need at least 2 players"}
                </p>
              )}
              <button className="btn btn-danger btn-sm" style={{ width:"100%" }} onClick={onEnd}>End Party</button>
            </>
          ) : (
            <div style={{ background:"rgba(124,92,191,.07)", borderRadius:12, padding:"18px 20px", border:"1px solid rgba(124,92,191,.15)", textAlign:"center" }}>
              <div style={{ fontSize:28, marginBottom:10 }}>⏳</div>
              <div style={{ fontWeight:700, marginBottom:4 }}>Waiting for leader</div>
              <div style={{ fontSize:13, color:"var(--muted)" }}>The leader will start the game soon</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Screen: Game (Player) ────────────────────────────────────────────────────
function GamePlayer({ word, definition }) {
  const timer = useTimer(true);
  return (
    <div className="center-wrap" style={{ alignItems:"center" }}>
      <div className="card" style={{ width:"100%", maxWidth:560, padding:"44px 48px", textAlign:"center" }}>
        <div className="timer" style={{ marginBottom:24 }}>⏱ {timer}</div>
        <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"var(--success-bg)", color:"var(--success)", padding:"8px 20px", borderRadius:99, marginBottom:28, fontWeight:700, fontSize:14 }}>
          ✅ You are NOT the imposter
        </div>
        <div className="vocab-word" style={{marginBottom: 16, padding: "14px 18px"}}>{word}</div>
        <div style={{ background:"rgba(59,130,246,.06)", borderRadius:12, padding:"14px 18px", border:"1px solid rgba(59,130,246,.12)" }}>
          <span style={{ fontSize:13.5, color:"var(--muted)" }}>🎭 <strong>Strategy:</strong> Say synonyms of the word. Don't give away the word to the imposter. </span>
        </div>
      </div>
    </div>
  );
}

// ─── Screen: Game (Imposter) ──────────────────────────────────────────────────
function GameImposter() {
  const timer = useTimer(true);
  return (
    <div className="center-wrap" style={{ alignItems:"center" }}>
      <div className="card" style={{ width:"100%", maxWidth:560, padding:"44px 48px", textAlign:"center" }}>
        <div className="timer" style={{ marginBottom:24 }}>⏱ {timer}</div>
        <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"var(--danger-bg)", color:"var(--danger)", padding:"8px 20px", borderRadius:99, marginBottom:28, fontWeight:700, fontSize:14 }}>
          🎭 You ARE the imposter
        </div>
        <div className="imposter-label" style={{ marginBottom:20 }}>?????</div>
        <div style={{ color:"var(--muted)", fontSize:15, lineHeight:1.6, marginBottom:28 }}>
          You don't know the word. Listen carefully to how others use it and figure it out without getting caught.
        </div>
        <div style={{ background:"rgba(239,68,68,.06)", borderRadius:12, padding:"14px 18px", border:"1px solid rgba(239,68,68,.1)" }}>
          <span style={{ fontSize:13.5, color:"var(--muted)" }}>🕵️ <strong>Strategy:</strong> Stay vague. Don't reveal that you don't know the word.</span>
        </div>
      </div>
    </div>
  );
}

// ─── Screen: Reveal ───────────────────────────────────────────────────────────
function GameReveal({ reveal, members, onBackToLobby }) {
  const imposter = members?.find(m => m.id === reveal?.impostorId);
  return (
    <div className="center-wrap" style={{ alignItems:"center" }}>
      <div className="card" style={{ width:"100%", maxWidth:500, padding:"44px 48px", textAlign:"center" }}>
        <div style={{ fontSize:48, marginBottom:16 }}>🎉</div>
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:28, fontWeight:900, marginBottom:8 }}>Round Over!</h2>
        {reveal && (
          <div className="reveal-card">
            <div style={{ fontSize:13, color:"var(--muted)", marginBottom:4, textTransform:"uppercase", letterSpacing:"0.06em", fontWeight:700 }}>The Word Was</div>
            <div style={{ fontSize:32, fontWeight:800, fontFamily:"'Playfair Display',serif", marginBottom:6 }}>{reveal.word}</div>
            <div style={{ fontSize:14, color:"var(--muted)", fontStyle:"italic", marginBottom:16 }}>"{reveal.definition}"</div>
            {imposter && (
              <div style={{ background:"var(--danger-bg)", color:"var(--danger)", padding:"10px 14px", borderRadius:10, fontWeight:700, fontSize:14 }}>
                🎭 The imposter was <strong>{imposter.name}</strong>
              </div>
            )}
          </div>
        )}
        <button className="btn btn-primary" style={{ width:"100%", marginTop:24 }} onClick={onBackToLobby}>
          Back to Lobby
        </button>
      </div>
    </div>
  );
}

// ─── Leader Float Panel ───────────────────────────────────────────────────────
function LeaderPanel({ members, onKick, onRename, onEndRound, onEndGame }) {
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) return (
    <button className="btn btn-primary" style={{ position:"fixed", top:80, right:20, zIndex:50 }} onClick={() => setCollapsed(false)}>
      👥 Panel
    </button>
  );

  return (
    <div className="float-panel">
      <div className="float-panel-header" style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span>👥 Leader Panel</span>
        <button className="btn btn-ghost btn-sm" style={{ padding:"2px 8px" }} onClick={() => setCollapsed(true)}>−</button>
      </div>
      <div className="float-panel-body">
        {members.map(m => (
          <MemberRow key={m.id} member={m} isLeader={true} onKick={onKick} onRename={onRename} />
        ))}
      </div>
      <div className="float-panel-footer">
        <button className="btn btn-secondary btn-sm" style={{ width:"100%" }} onClick={onEndRound}>⏭ New Round</button>
        <button className="btn btn-danger btn-sm" style={{ width:"100%" }} onClick={onEndGame}>✕ End Game & Reveal</button>
      </div>
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [theme, setTheme]             = useState("light");
  const [screen, setScreen]           = useState("landing");
  const [toast, setToast]             = useState(null);
  const [party, setParty]             = useState(null);
  const [myId, setMyId]               = useState(null);
  const [isLeader, setIsLeader]       = useState(false);
  const [wsConnected, setWsConn]      = useState(false);
  const [gamePayload, setGamePayload] = useState(null);
  const [revealPayload, setReveal]    = useState(null);
  const [gameMembers, setGameMembers] = useState([]);

  const showToast = useCallback(msg => setToast(msg), []);

  const wireWS = useCallback((code, playerId) => {
    api.connect(code, playerId, {
      onOpen:        ()        => setWsConn(true),
      onClose:       ()        => setWsConn(false),
      onPartyState:  (p)       => { setParty(p); setGameMembers(p.members); },
      onGameStarted: (payload) => {
        setGamePayload(payload);
        setGameMembers(payload.members || []);
        setReveal(null);
        setScreen("game");
      },
      onGameEnded:   (payload) => {
        setReveal(payload);
        setScreen("reveal");
      },
      onKicked:      (payload) => {
        showToast(`❌ ${payload.reason}`);
        api.disconnect();
        setParty(null); setMyId(null); setIsLeader(false);
        setScreen("landing");
      },
      onDisbanded:   (payload) => {
        showToast(`Party ended: ${payload.message}`);
        api.disconnect();
        setParty(null); setMyId(null); setIsLeader(false);
        setScreen("landing");
      },
      onError:       (payload) => showToast(`⚠️ ${payload.message}`),
    });
  }, [showToast]);

  const handleCreated = useCallback(({ code, playerId, party: p }) => {
    setMyId(playerId); setIsLeader(true); setParty(p);
    wireWS(code, playerId);
    setScreen("lobby");
  }, [wireWS]);

  const handleJoined = useCallback(({ code, playerId, party: p }) => {
    setMyId(playerId); setIsLeader(false); setParty(p);
    wireWS(code, playerId);
    showToast(`Joined party ${code}!`);
    setScreen("lobby");
  }, [wireWS, showToast]);

  const handleStart    = () => api.startGame();
  const handleEndGame  = () => api.endGame();
  const handleEndRound = () => api.endRound();
  const handleKick     = (targetId)       => { api.kick(targetId);          showToast("Player kicked"); };
  const handleRename   = (targetId, name) => { api.rename(targetId, name);  showToast("Player renamed"); };

  const handleLeave = useCallback(async () => {
    if (isLeader && party?.code) {
      try { await api.disbandParty(party.code, myId); } catch {}
    }
    api.disconnect();
    setParty(null); setMyId(null); setIsLeader(false);
    setGamePayload(null); setReveal(null);
    setScreen("landing");
  }, [isLeader, party, myId]);

  const handleBackToLobby = () => { setReveal(null); setGamePayload(null); setScreen("lobby"); };

  useEffect(() => () => api.disconnect(), []);

  const showTopBack = !["landing", "game", "reveal"].includes(screen);

  return (
    <>
      <style>{GLOBAL_STYLE}</style>
      <div className="app-bg" data-theme={theme}>
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
        <div className="bg-orb bg-orb-3" />

        <TopBar
          theme={theme}
          toggleTheme={() => setTheme(t => t === "light" ? "dark" : "light")}
          showBack={showTopBack}
          onBack={handleLeave}
          rightSlot={
            ["lobby","game","reveal"].includes(screen) && party ? (
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span className={`status-dot ${wsConnected ? "green" : "red"}`} />
                <span style={{ color:"rgba(255,255,255,.7)", fontSize:13 }}>
                  {party.code} · {party.members?.length ?? 0} players
                </span>
              </div>
            ) : null
          }
        />

        {screen === "landing" && <Landing go={setScreen} />}
        {screen === "create"  && <CreateParty onCreated={handleCreated} />}
        {screen === "join"    && <JoinParty onJoined={handleJoined} />}

        {screen === "lobby" && party && (
          <Lobby
            party={party} isLeader={isLeader} wsConnected={wsConnected}
            onStart={handleStart} onEnd={handleLeave}
            onKick={handleKick} onRename={handleRename}
          />
        )}

        {screen === "game" && gamePayload && (
          <>
            {gamePayload.role === "IMPOSTOR"
              ? <GameImposter />
              : <GamePlayer word={gamePayload.word} definition={gamePayload.definition} />
            }
            {isLeader && (
              <LeaderPanel
                members={gameMembers}
                onKick={handleKick} onRename={handleRename}
                onEndRound={handleEndRound} onEndGame={handleEndGame}
              />
            )}
          </>
        )}

        {screen === "reveal" && (
          <GameReveal reveal={revealPayload?.reveal} members={gameMembers} onBackToLobby={handleBackToLobby} />
        )}

        {toast && <Toast msg={toast} onDone={() => setToast(null)} />}

        <div style={{ position:"fixed", bottom:12, left:0, right:0, textAlign:"center", fontSize:11, color:"rgba(255,255,255,0.25)", pointerEvents:"none", zIndex:999, letterSpacing:"0.03em" }}>
          Made by Leon Chakraborty for the CCS SAT Prep Club
        </div>
      </div>
    </>
  );
}

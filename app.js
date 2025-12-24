/***********************
 * CONFIG (edit these)
 ***********************/
const WIN_POINTS = 7;

const ROLES = [
  { name: "Snake", desc: "If you look them in the eyes, you drink." },
  { name: "Joker", desc: "If they joke and you laugh, you drink." },
  { name: "Cop", desc: "They can call 'Hands up' anytime. Last is punished." },
  { name: "Ghost", desc: "If you say their name, you drink." },
  { name: "Mirror", desc: "If they copy you and you notice, you drink." },
  { name: "Dealer", desc: "They choose who drinks for any ‘choose’ moment." },
];

const SOLO_CHALLENGES = [
  "Do a forward roll.",
  "Do a handstand (or attempt) for 3 seconds.",
  "Spin 10 times then walk a straight line.",
  "Throw an egg (or small object) high and catch it.",
  "Speak in an accent until your next turn.",
];

const TIMER_PROMPTS = [
  { label: "Men waterfall until the timer stops.", group: "M" },
  { label: "Women waterfall until the timer stops.", group: "F" },
  { label: "Everyone waterfall until the timer stops.", group: "ALL" },
];

// Event mix (weights)
const EVENT_WEIGHTS = [
  { type: "TIMER", weight: 4 },
  { type: "SOLO", weight: 4 },
  { type: "RULE_ADD", weight: 2 },
  { type: "RULE_REMOVE", weight: 1 },
];

/***********************
 * STATE
 ***********************/
let state = {
  players: [],       // {id, name, gender: "M"|"F", roleName, roleDesc, points}
  rules: [],         // {target:"ALL"|playerId, text}
  round: 1,
  sinceRulesShown: 0,
  turnsTaken: {},    // playerId -> count (for fairness on targeted events)
  lastTargetId: null,
  activeEvent: null, // {type, ...}
  gameOver: false
};

/***********************
 * DOM
 ***********************/
const $ = (id) => document.getElementById(id);

const setupView = $("setupView");
const rolesView = $("rolesView");
const gameView = $("gameView");
const openRulesBtn = $("openRulesBtn");

const playerCountSel = $("playerCount");
const playersForm = $("playersForm");
const startSetupBtn = $("startSetupBtn");

const rolesList = $("rolesList");
const continueToRulesBtn = $("continueToRulesBtn");

const roundLabel = $("roundLabel");
const targetLabel = $("targetLabel");
const eventTitle = $("eventTitle");
const eventBody = $("eventBody");

const nextBtn = $("nextBtn");

const timerArea = $("timerArea");
const timerDisplay = $("timerDisplay");
const timerStartBtn = $("timerStartBtn");

const challengeControls = $("challengeControls");
const passBtn = $("passBtn");
const failBtn = $("failBtn");

const ruleControls = $("ruleControls");
const ruleTargetSel = $("ruleTarget");
const ruleText = $("ruleText");
const saveRuleBtn = $("saveRuleBtn");

const removeRuleControls = $("removeRuleControls");
const removeRuleSelect = $("removeRuleSelect");
const removeRuleBtn = $("removeRuleBtn");

const rulesModal = $("rulesModal");
const closeRulesBtn = $("closeRulesBtn");
const playersTableBody = $("playersTableBody");
const rulesListEl = $("rulesList");

const winnerArea = $("winnerArea");
const winnerText = $("winnerText");
const resetBtn = $("resetBtn");

/***********************
 * INIT UI
 ***********************/
initSetup();

openRulesBtn.addEventListener("click", () => showRulesModal());
closeRulesBtn.addEventListener("click", () => hideRulesModal());

startSetupBtn.addEventListener("click", onSetupEnter);
continueToRulesBtn.addEventListener("click", () => {
  rolesView.classList.add("hidden");
  gameView.classList.remove("hidden");
  openRulesBtn.classList.remove("hidden");
  showRulesModal(); // show once before game starts
  renderGame();
});

nextBtn.addEventListener("click", onNext);

passBtn.addEventListener("click", () => {
  if (!state.activeEvent || state.activeEvent.type !== "SOLO") return;
  addPoints(state.activeEvent.targetId, 1);
  finishEvent();
});

failBtn.addEventListener("click", () => {
  if (!state.activeEvent || state.activeEvent.type !== "SOLO") return;
  finishEvent();
});

saveRuleBtn.addEventListener("click", () => {
  if (!state.activeEvent || state.activeEvent.type !== "RULE_ADD") return;

  const target = ruleTargetSel.value;
  const text = (ruleText.value || "").trim();
  if (!text) return alert("Enter a rule text.");

  state.rules.push({ target, text });
  ruleText.value = "";
  finishEvent();
});

removeRuleBtn.addEventListener("click", () => {
  if (!state.activeEvent || state.activeEvent.type !== "RULE_REMOVE") return;
  const idx = parseInt(removeRuleSelect.value, 10);
  if (Number.isNaN(idx)) return;

  state.rules.splice(idx, 1);
  finishEvent();
});

resetBtn.addEventListener("click", () => resetGame());

/***********************
 * SETUP
 ***********************/
function initSetup() {
  // player count options
  playerCountSel.innerHTML = "";
  for (let n = 2; n <= 12; n++) {
    const opt = document.createElement("option");
    opt.value = String(n);
    opt.textContent = String(n);
    playerCountSel.appendChild(opt);
  }
  playerCountSel.value = "4";
  playerCountSel.addEventListener("change", renderPlayerInputs);
  renderPlayerInputs();
}

function renderPlayerInputs() {
  const n = parseInt(playerCountSel.value, 10);
  playersForm.innerHTML = "";

  for (let i = 0; i < n; i++) {
    const row = document.createElement("div");
    row.className = "playerRow";

    const name = document.createElement("input");
    name.placeholder = `Player ${i + 1} name`;
    name.dataset.kind = "name";
    name.dataset.index = String(i);

    const gender = document.createElement("select");
    gender.dataset.kind = "gender";
    gender.dataset.index = String(i);
    gender.innerHTML = `
      <option value="M">Male</option>
      <option value="F">Female</option>
    `;

    row.appendChild(name);
    row.appendChild(gender);
    playersForm.appendChild(row);
  }
}

function onSetupEnter() {
  const n = parseInt(playerCountSel.value, 10);
  const names = [];
  const genders = [];

  const inputs = playersForm.querySelectorAll("input, select");
  for (const el of inputs) {
    const idx = parseInt(el.dataset.index, 10);
    if (el.dataset.kind === "name") names[idx] = (el.value || "").trim();
    if (el.dataset.kind === "gender") genders[idx] = el.value;
  }

  // validate names
  for (let i = 0; i < n; i++) {
    if (!names[i]) return alert(`Enter a name for Player ${i + 1}.`);
  }

  // build players
  state = {
    players: names.map((nm, i) => ({
      id: uid(),
      name: nm,
      gender: genders[i] || "M",
      roleName: "",
      roleDesc: "",
      points: 0,
    })),
    rules: [],
    round: 1,
    sinceRulesShown: 0,
    turnsTaken: {},
    lastTargetId: null,
    activeEvent: null,
    gameOver: false
  };

  for (const p of state.players) state.turnsTaken[p.id] = 0;

  // assign roles
  assignRoles();

  // show roles
  setupView.classList.add("hidden");
  rolesView.classList.remove("hidden");
  renderRoles();
}

function assignRoles() {
  // shuffle roles, reuse if not enough
  const rolePool = shuffle([...ROLES]);
  for (let i = 0; i < state.players.length; i++) {
    const r = rolePool[i % rolePool.length];
    state.players[i].roleName = r.name;
    state.players[i].roleDesc = r.desc;
  }
}

function renderRoles() {
  rolesList.innerHTML = "";
  for (const p of state.players) {
    const div = document.createElement("div");
    div.className = "roleCard";
    div.innerHTML = `
      <div class="name">${escapeHtml(p.name)}</div>
      <div class="role">${escapeHtml(p.roleName)}</div>
      <div class="desc">${escapeHtml(p.roleDesc)}</div>
    `;
    rolesList.appendChild(div);
  }
}

/***********************
 * GAME LOOP
 ***********************/
function onNext() {
  if (state.gameOver) return;

  // auto-show rules every 7 rounds (after completing 7 events)
  if (state.sinceRulesShown >= 7) {
    showRulesModal();
    state.sinceRulesShown = 0;
    // do not advance round here; rules modal is just a checkpoint
    return;
  }

  // if no active event, start first
  startNewEvent();
}

function startNewEvent() {
  // clear UI controls
  timerArea.classList.add("hidden");
  challengeControls.classList.add("hidden");
  ruleControls.classList.add("hidden");
  removeRuleControls.classList.add("hidden");
  winnerArea.classList.add("hidden");

  const evType = weightedPick(EVENT_WEIGHTS).type;

  if (evType === "TIMER") return startTimerEvent();
  if (evType === "SOLO") return startSoloEvent();
  if (evType === "RULE_ADD") return startRuleAddEvent();
  if (evType === "RULE_REMOVE") return startRuleRemoveEvent();

  // fallback
  startSoloEvent();
}

function startTimerEvent() {
  const prompt = TIMER_PROMPTS[Math.floor(Math.random() * TIMER_PROMPTS.length)];
  const total = randInt(10, 30);

  const glitchType = weightedPick([
    { type: "FREEZE", weight: 1 },
    { type: "BACKWARDS", weight: 1 },
    { type: "GLITCH", weight: 1 }
  ]).type;

  state.activeEvent = {
    type: "TIMER",
    group: prompt.group,
    label: prompt.label,
    total,
    glitchType
  };

  targetLabel.textContent = prompt.group === "ALL" ? "Everyone" : (prompt.group === "M" ? "Men" : "Women");
  eventTitle.textContent = "Timer";
  eventBody.textContent = prompt.label + " Press Start.";

  timerArea.classList.remove("hidden");
  timerDisplay.textContent = String(total).padStart(2, "0");
  timerStartBtn.disabled = false;

  timerStartBtn.onclick = () => runChaosTimer(state.activeEvent);
}

async function runChaosTimer(ev) {
  timerStartBtn.disabled = true;

  // Implement “one glitch per timer event”
  if (ev.glitchType === "FREEZE") {
    await runFreezeTimer(ev.total);
  } else if (ev.glitchType === "BACKWARDS") {
    await runBackwardsTimer(ev.total);
  } else {
    await runGlitchNumbersTimer(ev.total);
  }

  // award points to group
  awardGroupPoint(ev.group);

  // finish
  eventBody.textContent = "Congratulations — point awarded. Press Next.";
  timerStartBtn.disabled = false;
  finishEvent(/*doNotAutoStartNext*/ true);
}

function awardGroupPoint(group) {
  for (const p of state.players) {
    if (group === "ALL") addPoints(p.id, 1);
    if (group === "M" && p.gender === "M") addPoints(p.id, 1);
    if (group === "F" && p.gender === "F") addPoints(p.id, 1);
  }
}

function startSoloEvent() {
  const targetId = pickFairPlayerId();
  const p = getPlayer(targetId);

  const challenge = SOLO_CHALLENGES[Math.floor(Math.random() * SOLO_CHALLENGES.length)];

  state.activeEvent = { type: "SOLO", targetId, challenge };
  state.turnsTaken[targetId] += 1;

  targetLabel.textContent = p.name;
  eventTitle.textContent = "Single Player Challenge";
  eventBody.textContent = challenge;

  challengeControls.classList.remove("hidden");
}

function startRuleAddEvent() {
  const targetId = pickFairPlayerId();
  const p = getPlayer(targetId);

  state.activeEvent = { type: "RULE_ADD", targetId };
  state.turnsTaken[targetId] += 1;

  targetLabel.textContent = p.name;
  eventTitle.textContent = "Create a Rule";
  eventBody.textContent = "You’ve been chosen to add a rule.";

  // target dropdown
  ruleTargetSel.innerHTML = "";
  ruleTargetSel.appendChild(new Option("All players", "ALL"));
  for (const pl of state.players) ruleTargetSel.appendChild(new Option(pl.name, pl.id));

  ruleText.value = "";
  ruleControls.classList.remove("hidden");
}

function startRuleRemoveEvent() {
  const targetId = pickFairPlayerId();
  const p = getPlayer(targetId);

  state.activeEvent = { type: "RULE_REMOVE", targetId };
  state.turnsTaken[targetId] += 1;

  targetLabel.textContent = p.name;
  eventTitle.textContent = "Remove a Rule";
  eventBody.textContent = "Choose one rule to remove (permanently).";

  // populate rules
  removeRuleSelect.innerHTML = "";
  if (state.rules.length === 0) {
    removeRuleSelect.appendChild(new Option("No rules to remove", "-1"));
    removeRuleBtn.disabled = true;
  } else {
    removeRuleBtn.disabled = false;
    state.rules.forEach((r, idx) => {
      const label = `${idx + 1}) ${formatRule(r)}`;
      removeRuleSelect.appendChild(new Option(label, String(idx)));
    });
  }

  removeRuleControls.classList.remove("hidden");
}

function finishEvent(doNotAutoStartNext = false) {
  // After each event: check win, then advance counters
  const winner = state.players.find(p => p.points >= WIN_POINTS);
  if (winner) {
    state.gameOver = true;
    showWinner(winner);
    renderGame();
    return;
  }

  // round increments when an event completes
  state.round += 1;
  state.sinceRulesShown += 1;

  renderGame();

  // Do not auto-start the next event; user presses Next
  // (So TV/host pacing stays controlled.)
}

function renderGame() {
  roundLabel.textContent = String(state.round);

  // If no event active, show prompt
  if (!state.activeEvent && !state.gameOver) {
    targetLabel.textContent = "—";
    eventTitle.textContent = "Ready";
    eventBody.textContent = "Press Next to draw the next event.";
  }

  // Always keep modal data current
  if (!rulesModal.classList.contains("hidden")) renderRulesModal();
}

function showWinner(winner) {
  winnerArea.classList.remove("hidden");
  winnerText.textContent = `${winner.name} wins with ${winner.points} points.`;
}

/***********************
 * RULES MODAL
 ***********************/
function showRulesModal() {
  renderRulesModal();
  rulesModal.classList.remove("hidden");
}

function hideRulesModal() {
  rulesModal.classList.add("hidden");
}

function renderRulesModal() {
  // players table
  playersTableBody.innerHTML = "";
  for (const p of state.players) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(p.name)}</td>
      <td>${p.gender}</td>
      <td>${escapeHtml(p.roleName)}</td>
      <td><b>${p.points}</b></td>
      <td>
        <button data-act="minus" data-id="${p.id}">-</button>
        <button data-act="plus" data-id="${p.id}">+</button>
      </td>
    `;
    playersTableBody.appendChild(tr);
  }

  // attach handlers (simple delegation)
  playersTableBody.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const act = btn.dataset.act;
      addPoints(id, act === "plus" ? 1 : -1);
      renderRulesModal();
      renderGame();
    });
  });

  // rules list
  rulesListEl.innerHTML = "";
  state.rules.forEach(r => {
    const li = document.createElement("li");
    li.textContent = formatRule(r);
    rulesListEl.appendChild(li);
  });
}

function formatRule(r) {
  if (r.target === "ALL") return r.text;
  const p = state.players.find(x => x.id === r.target);
  return p ? `[${p.name}] ${r.text}` : r.text;
}

/***********************
 * TIMER GLITCHES
 ***********************/
async function runFreezeTimer(total) {
  // freeze once for 0–8 seconds at a random time
  const freezeAt = randInt(1, Math.max(1, total - 1));
  const freezeFor = randInt(0, 8);

  for (let t = total; t >= 0; t--) {
    timerDisplay.textContent = String(t).padStart(2, "0");
    if (t === freezeAt && freezeFor > 0) {
      await sleep(freezeFor * 1000);
    }
    await sleep(1000);
  }
}

async function runBackwardsTimer(total) {
  // at a random time near the end, count up 0–8 then resume down
  const triggerAt = randInt(1, Math.max(1, total - 2));
  const upBy = randInt(0, 8);

  let t = total;
  while (t >= 0) {
    timerDisplay.textContent = String(t).padStart(2, "0");

    if (t === triggerAt && upBy > 0) {
      // count up
      for (let u = 1; u <= upBy; u++) {
        await sleep(1000);
        timerDisplay.textContent = String(t + u).padStart(2, "0");
      }
      // resume down from (t + upBy)
      t = t + upBy;
    }

    await sleep(1000);
    t--;
  }
}

async function runGlitchNumbersTimer(total) {
  // ignore "total seconds" display; show random numbers N times, end on 0.
  const iterations = randInt(10, 30);
  let first = randInt(0, 10);
  timerDisplay.textContent = String(first).padStart(2, "0");
  await sleep(700);

  for (let i = 1; i <= iterations; i++) {
    await sleep(350);
    const num = (i === iterations) ? 0 : randInt(0, 99);
    timerDisplay.textContent = String(num).padStart(2, "0");
  }
}

/***********************
 * FAIR TARGET SELECTION
 ***********************/
function pickFairPlayerId() {
  // Eligible = those within +1 of the minimum turnsTaken
  const counts = state.players.map(p => state.turnsTaken[p.id] ?? 0);
  const min = Math.min(...counts);

  const eligible = state.players
    .filter(p => (state.turnsTaken[p.id] ?? 0) <= min + 1)
    .map(p => p.id);

  // Prefer not to repeat same person twice unless forced
  const filtered = eligible.filter(id => id !== state.lastTargetId);
  const pickFrom = filtered.length > 0 ? filtered : eligible;

  const chosen = pickFrom[Math.floor(Math.random() * pickFrom.length)];
  state.lastTargetId = chosen;
  return chosen;
}

/***********************
 * HELPERS
 ***********************/
function addPoints(playerId, delta) {
  const p = getPlayer(playerId);
  if (!p) return;
  p.points = Math.max(0, p.points + delta);
}

function getPlayer(id) {
  return state.players.find(p => p.id === id);
}

function weightedPick(items) {
  const total = items.reduce((s, x) => s + x.weight, 0);
  let r = Math.random() * total;
  for (const x of items) {
    r -= x.weight;
    if (r <= 0) return x;
  }
  return items[items.length - 1];
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

function uid() {
  return Math.random().toString(16).slice(2, 10) + Date.now().toString(16).slice(-4);
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));
}

function resetGame() {
  // keep players but reset points/rules/rounds
  for (const p of state.players) p.points = 0;
  state.rules = [];
  state.round = 1;
  state.sinceRulesShown = 0;
  state.turnsTaken = {};
  for (const p of state.players) state.turnsTaken[p.id] = 0;
  state.lastTargetId = null;
  state.activeEvent = null;
  state.gameOver = false;

  winnerArea.classList.add("hidden");
  renderGame();
}

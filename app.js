/***********************
 * CORE (simplified scaffold)
 * - Keeps: Title -> Setup (names) -> Roles -> Rules -> Start Game -> Game Loop
 * - Rules page updated:
 *   - Player table: Player, Gender, Role, Total Points, +, -
 *   - Active rules: predefined BASE_RULES + tick-to-delete
 ***********************/

/***********************
 * CONFIG
 ***********************/

/**
 * WRITE YOUR PREDETERMINED ACTIVE RULES HERE.
 * These load into state.rules at reset.
 *
 * target options you can use:
 *   "ALL", "M", "F", or a specific player name later if you want.
 */
const BASE_RULES = [
  { target: "ALL", text: "No Drinking with your dominant hand." }
];

const ROLES = [
  {
    id: "statue",
    name: "Statue",
    desc: "If the Statue freezes and you move or talk first, you drink.",
    img: "assets/roles/statue.jpg"
  },
  {
    id: "Hitler",
    name: "Hitler",
    desc: "When you heil, everyone watching must follow, otherwise they must drink.",
    img: "assets/roles/hitler.jpg"
  },
  {
    id: "mime",
    name: "Mime",
    desc: "If the Mime acts something out and you guess it wrong, you drink.",
    img: "assets/roles/mime.jpg"
  },
  {
    id: "gaslighter",
    name: "Gaslighter",
    desc: "The Gaslighter can deny any rule exists. Anyone who argues drinks.",
    img: "assets/roles/gaslighter.jpg"
  },
  {
    id: "stalker",
    name: "Stalker",
    desc: "If you make eye contact with the stalker while hes stalking you then you drink. If the stalker gets a photo of you deemed "fucking creepy" by the group then you drink twice.",
    img: "assets/roles/stalker.jpg"
  },

  {
    id: "gambler",
    name: "Gambler",
    desc: "If anyone makes any bets with you for drinks you must take it on. The gambler gets first pick",
    img: "assets/roles/gambler.jpg"
  },
  {
    id: "closet gay",
    name: "closet gay",
    desc: "The closet gay will pick an action and show the group. When players see them do this action they must match it with their own. Failure to do so will result in a drink.",
    img: "assets/roles/closetgay.jpg"
  },
  {
    id: "Kim Jong Un",
    name: "Kim Jong Un",
    desc: "There is no wrong with the mighty leader. If they see something that they want the others must give it to them or drink.",
    img: "assets/roles/kimjongun.jpg"
  },
  {
    id: "Dexter",
    name: "Dexter",
    desc: "If you are alone with one other person, you may kill them, They stay in that spot until found. If all players are killed then everyone else finished a new vessel.",
    img: "assets/roles/dexter.jpg"
  },
  {
    id: "Doakes",
    name: "Doakes",
    desc: "When you squnit fucking hard at another mother fucker they have to squint back otherwise they drink.",
    img: "assets/roles/doakes.jpg"
  },
  {
    id: "Darth Vader",
    name: "Darth Vader",
    desc: "The force is strong with you. You may use it to "choke" anyone that looks at you, if they break before you finish they drink.",
    img: "assets/roles/darthvader.jpg"
  },
  {
    id: "Gollum",
    name: "Gollum",
    desc: "My precious, if i collect anything of anyone elses i dont have to give it back, but i will for a cost, x amount of drinks.",
    img: "assets/roles/gollum.jpg"
  },
  {
    id: "Yoda",
    name: "Yoda",
    desc: "when yoda speaks to others in his yoda voice they must first try to answer as a wookie, any answers that anger yoda are worth a drink.",
    img: "assets/roles/yoda.jpg"
  },
  {
    id: "Hulk",
    name: "Hulk",
    desc: "If hulk passes you something smashable, you must smash it, or take a drink.",
    img: "assets/roles/hulk.jpg"
  },
  {
    id: "Simba",
    name: "Simba",
    desc: "Once the mark is aquired, anytime a bevarage "simba" is lifted above their head, the other players must sing the chant, otherwise drink.",
    img: "assets/roles/simba.jpg"
  },
  {
    id: "ET",
    name: "ET",
    desc: "If ET, says "phone home", everyone else must send them a text with a number of drinks to take. ET then assigns the drinks to the last to do so.",
    img: "assets/roles/et.jpg"
  },
  {
    id: "Patrick",
    name: "Patrick",
    desc: "Patrick can hide something under something, after giving instruction on what to find and in what location the others must find it. everyone who doesnt find the object drinks.",
    img: "assets/roles/patrick.jpg"
  },
  {
    id: "Michael",
    name: "Michael",
    desc: "Anytime someone is walking with, towards or around, Michael they must perform parkour, any unsatifactory pakour, michael will dish out a drink.",
    img: "assets/roles/michael.jpg"
  }
];

/***********************
 * STATE
 ***********************/
let state = resetState();
let roleIndex = 0;

function resetState() {
  return {
    players: [],     // [{ id, name, gender, role, points }]
    rules: [...BASE_RULES], // predetermined rules start here
    round: 0,
    lastTargetId: null,
    activeEvent: null,
  };
}

/***********************
 * DOM
 ***********************/
const $ = (id) => document.getElementById(id);

const titleView = $("titleView");
const setupView = $("setupView");
const rolesView = $("rolesView");
const rulesView = $("rulesView");
const startView = $("startView");
const gameView  = $("gameView");

const titleNextBtn = $("titleNextBtn");

const playerCountSel = $("playerCount");
const playersForm = $("playersForm");
const startSetupBtn = $("startSetupBtn");

const rolePlayerName = $("rolePlayerName");
const roleTitle = $("roleTitle");
const roleDesc = $("roleDesc");
const roleProgress = $("roleProgress");
const rolesNextBtn = $("rolesNextBtn");

const playersTableBody = $("playersTableBody");
const rulesListEl = $("rulesList");
const rulesNextBtn = $("rulesNextBtn");

const startGameBtn = $("startGameBtn");

const roundLabel = $("roundLabel");
const targetLabel = $("targetLabel");
const eventTitle = $("eventTitle");
const eventBody = $("eventBody");
const nextBtn = $("nextBtn");

const resetBtn = $("resetBtn");

/***********************
 * INIT / NAV
 ***********************/
initSetup();

titleNextBtn.addEventListener("click", () => showSlide("setup"));
startSetupBtn.addEventListener("click", onSetupEnter);

rolesNextBtn.addEventListener("click", () => {
  roleIndex++;
  if (roleIndex >= state.players.length) {
    showSlide("rules");
    renderRulesSlide();
  } else {
    renderRoleSlide();
  }
});

rulesNextBtn.addEventListener("click", () => {
  showSlide("start");
});

startGameBtn.addEventListener("click", () => {
  showSlide("game");
  startGameLoop();
});

nextBtn.addEventListener("click", () => {
  startNewEvent();
});

resetBtn.addEventListener("click", () => {
  state = resetState();
  roleIndex = 0;
  initSetup();
  showSlide("title");
});

/**
 * Event delegation for:
 *  - Points +/- buttons
 *  - Rule tick-to-delete
 *
 * This avoids listener stacking as we re-render.
 */
playersTableBody.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action][data-player-id]");
  if (!btn) return;

  const playerId = btn.getAttribute("data-player-id");
  const action = btn.getAttribute("data-action");
  const p = state.players.find(x => x.id === playerId);
  if (!p) return;

  if (action === "inc") p.points += 1;
  if (action === "dec") p.points -= 1;

  renderRulesSlide();
});

rulesListEl.addEventListener("change", (e) => {
  const cb = e.target.closest("input[type='checkbox'][data-rule-index]");
  if (!cb) return;

  // If checked, delete the rule immediately and re-render
  if (cb.checked) {
    const idx = parseInt(cb.getAttribute("data-rule-index"), 10);
    if (!Number.isNaN(idx) && idx >= 0 && idx < state.rules.length) {
      state.rules.splice(idx, 1);
      renderRulesSlide();
    }
  }
});

/***********************
 * SLIDE HELPERS
 ***********************/
function showSlide(which) {
  titleView.classList.add("hidden");
  setupView.classList.add("hidden");
  rolesView.classList.add("hidden");
  rulesView.classList.add("hidden");
  startView.classList.add("hidden");
  gameView.classList.add("hidden");

  if (which === "title") titleView.classList.remove("hidden");
  if (which === "setup") setupView.classList.remove("hidden");
  if (which === "roles") rolesView.classList.remove("hidden");
  if (which === "rules") rulesView.classList.remove("hidden");
  if (which === "start") startView.classList.remove("hidden");
  if (which === "game")  gameView.classList.remove("hidden");
}

/***********************
 * SETUP
 ***********************/
function initSetup() {
  // default to 4 players
  if (!playerCountSel.value) playerCountSel.value = "4";

  // build initial inputs
  buildPlayerInputs(parseInt(playerCountSel.value, 10));

  // IMPORTANT: allow unlimited changes (no { once: true })
  playerCountSel.onchange = () => {
    buildPlayerInputs(parseInt(playerCountSel.value, 10));
  };
}


function buildPlayerInputs(n) {
  // capture existing values so changing count doesn't wipe typing
  const existing = [];
  const oldRows = playersForm.querySelectorAll(".playerRow");
  oldRows.forEach((_, i) => {
    const nameEl = $(`playerName_${i}`);
    const genderEl = $(`playerGender_${i}`);
    existing.push({
      name: nameEl ? nameEl.value : "",
      gender: genderEl ? genderEl.value : "ANY",
    });
  });

  playersForm.innerHTML = "";

  for (let i = 0; i < n; i++) {
    const row = document.createElement("div");
    row.className = "playerRow";

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = `Player ${i + 1} name`;
    input.id = `playerName_${i}`;
    input.value = existing[i]?.name ?? "";

    const gender = document.createElement("select");
    gender.id = `playerGender_${i}`;
    gender.innerHTML = `
      <option value="ANY">Any</option>
      <option value="M">M</option>
      <option value="F">F</option>
    `;
    gender.value = existing[i]?.gender ?? "ANY";

    row.appendChild(input);
    row.appendChild(gender);
    playersForm.appendChild(row);
  }
}


function onSetupEnter() {
  const n = parseInt(playerCountSel.value, 10);
  const players = [];

  for (let i = 0; i < n; i++) {
    const name = ($(`playerName_${i}`).value || "").trim() || `Player ${i + 1}`;
    const gender = $(`playerGender_${i}`).value || "ANY";
    players.push({
      id: crypto.randomUUID(),
      name,
      gender,
      role: null,
      points: 0, // NEW
    });
  }

  state.players = players;

  assignRolesRandomly();
  roleIndex = 0;
  showSlide("roles");
  renderRoleSlide();
}

function assignRolesRandomly() {
  const shuffled = [...ROLES].sort(() => Math.random() - 0.5);
  for (let i = 0; i < state.players.length; i++) {
    state.players[i].role = shuffled[i % shuffled.length];
  }
}

/***********************
 * ROLES SLIDE
 ***********************/
function renderRoleSlide() {
  const p = state.players[roleIndex];
  rolePlayerName.textContent = p.name;
  roleTitle.textContent = p.role?.name ?? "—";
  roleDesc.textContent = p.role?.desc ?? "—";
  roleProgress.textContent = `${roleIndex + 1} / ${state.players.length}`;
}

/***********************
 * RULES SLIDE
 ***********************/
function renderRulesSlide() {
  // player table
  playersTableBody.innerHTML = "";
  state.players.forEach((p) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(p.name)}</td>
      <td>${escapeHtml(p.gender)}</td>
      <td>${escapeHtml(p.role?.name ?? "")}</td>
      <td>${p.points}</td>
      <td>
        <button data-action="dec" data-player-id="${p.id}">−</button>
        <button data-action="inc" data-player-id="${p.id}">+</button>
      </td>
    `;

    playersTableBody.appendChild(tr);
  });

  // rules list with tick-to-delete
  // rules list with numbered layout + tick-to-delete
  rulesListEl.innerHTML = "";
  
  if (state.rules.length === 0) {
    const li = document.createElement("li");
    li.className = "ruleRow";
    li.innerHTML = `
      <div class="ruleIndex">—</div>
      <div class="ruleText">No rules yet.</div>
      <div></div>
    `;
    rulesListEl.appendChild(li);
    return;
  }
  
  state.rules.forEach((r, idx) => {
    const li = document.createElement("li");
    li.className = "ruleRow";
    li.innerHTML = `
      <div class="ruleIndex">${idx + 1}.</div>
      <div class="ruleText">${escapeHtml(r.target)}: ${escapeHtml(r.text)}</div>
      <div class="ruleCheck">
        <input type="checkbox" data-rule-index="${idx}" />
      </div>
    `;
    rulesListEl.appendChild(li);
  });

}

/***********************
 * GAME LOOP (stub)
 ***********************/
const EVENT_DEFS = [
  { id: "SOLO_CHALLENGE",  weight: 3, start: (ctx) => stubEvent(ctx, "Solo Challenge", "A single player does a challenge (not implemented yet).") },
  { id: "TIMER",           weight: 2, start: (ctx) => stubEvent(ctx, "Timer", "A timed event (not implemented yet).") },
  { id: "EVERYONE",        weight: 2, start: (ctx) => stubEvent(ctx, "Everyone", "Everyone does the same thing (not implemented yet).") },
  { id: "MAKE_RULE",       weight: 1, start: (ctx) => stubEvent(ctx, "Make a Rule", "Create a new rule (not implemented yet).") },
  { id: "REMOVE_RULE",     weight: 1, start: (ctx) => stubEvent(ctx, "Remove a Rule", "Remove an existing rule (not implemented yet).") },
];

function startGameLoop() {
  state.round = 0;
  state.lastTargetId = null;
  state.activeEvent = null;

  roundLabel.textContent = "0";
  targetLabel.textContent = "—";
  eventTitle.textContent = "Ready";
  eventBody.textContent = "Press Next to start the first event.";
}

function startNewEvent() {
  state.round += 1;
  roundLabel.textContent = String(state.round);

  const ev = weightedPick(EVENT_DEFS);
  state.activeEvent = ev.id;

  const target = pickFairPlayer();
  state.lastTargetId = target?.id ?? null;
  targetLabel.textContent = target?.name ?? "ALL";

  const ctx = {
    state,
    target,
    setTitle: (t) => (eventTitle.textContent = t),
    setBody: (b) => (eventBody.textContent = b),
  };

  ev.start(ctx);
}

function stubEvent(ctx, title, body) {
  ctx.setTitle(title);
  ctx.setBody(body);
}

/***********************
 * UTIL
 ***********************/
function weightedPick(defs) {
  const total = defs.reduce((sum, d) => sum + (d.weight ?? 1), 0);
  let roll = Math.random() * total;
  for (const d of defs) {
    roll -= (d.weight ?? 1);
    if (roll <= 0) return d;
  }
  return defs[defs.length - 1];
}

function pickFairPlayer() {
  if (!state.players.length) return null;
  if (state.players.length === 1) return state.players[0];

  const pool = state.players.filter(p => p.id !== state.lastTargetId);
  const use = pool.length ? pool : state.players;
  return use[Math.floor(Math.random() * use.length)];
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

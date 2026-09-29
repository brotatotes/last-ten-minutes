// Node consistency tests for the story script (src/story.js). No answers appear here.
'use strict';
const assert = require('assert');
const S = require('../src/story.js');
let checks = 0;
function ok(cond, msg) { checks++; assert(cond, msg); }
const STEP = 0.25;
const MAX_SPEED = 0.7; // world units per second while visible (Tommy runs at about 0.55)

// 1. Every person has one well-formed route: strictly increasing times, known looks, sorted non-overlapping hidden intervals.
for (const p of S.PEOPLE) {
  for (let i = 1; i < p.route.length; i++) ok(p.route[i][0] > p.route[i - 1][0], `${p.id}: route times must increase at ${i}`);
  for (const r of p.route) ok(typeof r[3] === 'string' && r[3].length > 0, `${p.id}: every keyframe has an action`);
  for (const [, k] of p.looks) ok(S.LOOK[k], `${p.id}: unknown look ${k}`);
  for (let i = 0; i < p.hidden.length; i++) {
    const [a, b] = p.hidden[i]; ok(a < b, `${p.id}: empty hidden interval`);
    if (i) ok(a >= p.hidden[i - 1][1], `${p.id}: hidden intervals overlap`);
  }
}

// 2. No one is in two places at once: position is continuous, and anyone moving faster than walking pace is out of sight.
for (const p of S.PEOPLE) {
  for (let t = 0; t < 600; t += STEP) {
    const a = S.pos(p.id, t), b = S.pos(p.id, t + STEP);
    const v = S.dist(a, b) / STEP;
    // a fast change is only allowed across a door, when the person is out of sight at one end of the step
    if (v > MAX_SPEED) ok(!S.visible(p.id, t) || !S.visible(p.id, t + STEP), `${p.id}: jumps ${v.toFixed(2)}/s while visible at t=${t}`);
  }
}

// 3. People who are visible at the same time never stand on the same spot (except a brief hand-over).
for (let t = 0; t <= 600; t += 1) {
  const vis = S.PEOPLE.filter(p => S.visible(p.id, t));
  for (let i = 0; i < vis.length; i++) for (let j = i + 1; j < vis.length; j++) {
    const d = S.dist(S.pos(vis[i].id, t), S.pos(vis[j].id, t));
    ok(d > 0.3, `${vis[i].id} and ${vis[j].id} overlap at t=${t} (d=${d.toFixed(2)})`);
  }
}

// 4. The red strap belongs to Evelyn's case until 9:56:12 exactly, then to Mr. Harrow's, and changes owner only once.
ok(S.STRAP_MOVE.at === 372, 'strap moves at 9:56:12');
ok(S.hms(S.STRAP_MOVE.at) === '9:56:12', 'strap time label');
let changes = [];
for (let t = 0; t <= 600; t += STEP) { if (S.strapOwner(t) !== S.strapOwner(Math.max(0, t - STEP))) changes.push(t); }
ok(changes.length === 1 && changes[0] === 372, `strap owner changes only at 372, got ${changes}`);
ok(S.strapOwner(371.99) === 'evelyn' && S.strapOwner(372) === 'harrow', 'strap owner boundary');
// Albert is at the trolley and Mr. Harrow faces away (watching the waiting-room door) while the strap moves.
for (let t = 372; t < 377; t += STEP) {
  ok(/trolley|luggage/i.test(S.action('albert', t)), `albert at trolley during strap move t=${t}`);
  ok(/waiting-room door/.test(S.action('harrow', t)), `harrow watches the waiting-room door at t=${t}`);
  ok(S.caseState('evelyn', t).where === 'trolley' && S.caseState('harrow', t).where === 'trolley', 'both cases on trolley during strap move');
  for (const c of ['evelyn', 'harrow']) { const cs = S.caseState(c, t); ok(S.dist(S.pos('albert', t), [cs.x, cs.y]) < 1.2, `albert within reach of ${c} case`); }
}

// 5. The station clock is correct until 9:53:10, then runs exactly two minutes fast; the true time is never changed.
ok(S.hms(S.CLOCK_SET.start) === '9:53:10', 'clock is set at 9:53:10');
for (let t = 0; t <= S.CLOCK_SET.start; t += STEP) ok(S.stationOffset(t) === 0, `clock offset zero at t=${t}`);
for (let t = S.CLOCK_SET.end; t <= 600; t += STEP) ok(S.stationOffset(t) === 120, `clock offset 120 at t=${t}`);
for (let t = S.CLOCK_SET.start; t < S.CLOCK_SET.end; t += STEP) ok(/pole/.test(S.action('dunn', t)) && S.visible('dunn', t), 'Dunn at the clock with the pole while the hands move');
for (let t = 0; t <= 600; t += 5) ok(S.stationOffset(t + 5) >= S.stationOffset(t), 'offset monotone');
ok(S.hm(S.stationSeconds(480)) === '10:00', 'station clock reads 10:00 when Harrow looks up at 9:58');
// Mr. Harrow has his back to the clock (not at it) while it is set.
for (let t = S.CLOCK_SET.start; t < S.CLOCK_SET.end; t += 1) ok(S.dist(S.pos('harrow', t), S.PLACES.clock) > 2, 'harrow away from the clock while it is set');

// 6. Doors: people only pass through the waiting-room and street doors while they are open.
for (const p of S.PEOPLE) {
  for (const [a, b, where] of p.hidden) {
    const door = where === 'waiting' ? 'waiting' : null;
    if (door) {
      ok(S.doorOpen(door, a - 0.5) || S.doorOpen(door, a), `${p.id} enters ${door} at ${a} with door closed`);
      if (b <= 600) ok(S.doorOpen(door, b) || S.doorOpen(door, b - 0.5), `${p.id} leaves ${door} at ${b} with door closed`);
    }
  }
}
ok(S.doorOpen('street', 28.5), 'street door open as Clara enters');
ok(S.doorOpen('street', 531), 'street door open as the umbrella leaves');
ok(!S.doorOpen('street', 300) && !S.doorOpen('waiting', 200), 'doors closed at quiet times');
// Nobody else uses the waiting room: only Clara and Evelyn are ever hidden there.
for (const p of S.PEOPLE) for (const h of p.hidden) if (h[2] === 'waiting') ok(p.id === 'clara' || p.id === 'evelyn', `${p.id} in waiting room`);

// 7. The coat swap: Clara wears red only from inside the waiting room, Evelyn wears grey only from inside it, and Clara is visibly shorter.
ok(S.look('clara', 50).key === 'greyUmb' && S.look('clara', 460).key === 'red', 'clara grey then red');
ok(S.look('evelyn', 100).key === 'red' && S.look('evelyn', 520).key === 'greyUmb', 'evelyn red then grey');
for (const p of ['clara', 'evelyn']) for (const [from] of S.BYID[p].looks.slice(1)) ok(S.hiddenWhere(p, from) === 'waiting', `${p} changes coat out of sight`);
ok(S.BYID.evelyn.h - S.BYID.clara.h >= 10, 'height difference is visible');
// Exactly one red coat is ever visible at a time.
for (let t = 0; t <= 600; t += 1) ok(S.PEOPLE.filter(p => S.visible(p.id, t) && S.look(p.id, t).key === 'red').length <= 1, `two red coats at ${t}`);
// The red coat checks a watch only while Evelyn wears it; the grey umbrella figure checks one only after 9:58:30.
for (let t = 440; t <= 600; t += 1) ok(!S.checkingWatch('clara', t), 'clara never checks a watch');

// 8. Status lines never give away a secret: labels and actions never name who is really in a coat.
const SECRET = /\b(Clara|Evelyn|Evie|Miss Pell|Miss Hart|Hart|brother|sister|Crane|ledger|disguis|swap|really|fast)\b/i;
for (const p of S.PEOPLE) {
  for (const [, l] of p.labels) if (p.id === 'evelyn' || p.id === 'clara') ok(!SECRET.test(l), `${p.id} label leaks: ${l}`);
  for (const r of p.route) ok(!SECRET.test(r[3]), `${p.id} action leaks: ${r[3]}`);
}
for (let t = 0; t <= 600; t += 1) {
  const reds = S.PEOPLE.filter(p => S.look(p.id, t).key === 'red');
  for (const p of reds) ok(S.label(p.id, t) === 'The woman in the red coat', 'red coat label is the same for both women');
}

// 9. Cases: Mr. Harrow's dark case ends up in the front carriage; the tan case with the ledger leaves by the street.
ok(S.caseState('harrow', 500).where === 'carriage', 'harrow case aboard');
ok(S.caseState('evelyn', 470).where === 'trolley', 'plain case on trolley at 9:57:50');
ok(S.caseState('evelyn', 540).where === 'hand' && S.caseState('evelyn', 540).holder === 'evelyn', 'evelyn carries it out');
ok(S.CASES.harrow.tag && /Crane/.test(S.CASES.harrow.tag), 'tag on harrow case');
for (let t = 0; t <= 600; t += STEP) for (const c of ['evelyn', 'harrow']) {
  const s = S.caseState(c, t);
  if (s.where === 'hand') ok(S.present(s.holder, t) || S.hiddenWhere(s.holder, t) === 'hall', `${c} case held by absent ${s.holder} at ${t}`);
}

// 10. Overheard lines: speaker and listener exist, windows are sane, and each line can actually be heard for at least 2 seconds.
const ids = new Set(S.PEOPLE.map(p => p.id));
for (const L of S.LINES) {
  ok(ids.has(L.speaker) && (L.listener === null || ids.has(L.listener)), `line ${L.id} people`);
  ok(L.from < L.to && L.from >= 0 && L.to <= 600, `line ${L.id} window`);
  let heard = 0;
  for (let t = L.from; t < L.to; t += STEP) if (S.overheard(L.speaker, t).some(x => x.id === L.id)) heard += STEP;
  ok(heard >= 2, `line ${L.id} audible for only ${heard}s`);
  // and never when following someone unrelated
  for (let t = L.from; t < L.to; t += 1) for (const p of S.PEOPLE) if (p.id !== L.speaker && p.id !== L.listener)
    ok(!S.overheard(p.id, t).some(x => x.id === L.id), `line ${L.id} heard while following ${p.id}`);
}
ok(S.overheard(null, 70).length === 0, 'no lines without following');

// 11. Clues: valid targets and windows; clue text is a string at every moment it is active.
const TARGETS = new Set(['tin', 'pole', 'clock', 'wrdoor', 'streetdoor', 'frontdoor', 'glove', 'blind', 'case:evelyn', 'case:harrow', ...S.PEOPLE.map(p => 'person:' + p.id)]);
for (const c of S.CLUES) {
  ok(TARGETS.has(c.target), `clue ${c.id} target ${c.target}`);
  ok(c.from < c.to && c.from >= 0 && c.to <= 601, `clue ${c.id} window`);
  for (let t = c.from; t < Math.min(c.to, 600); t += 1) ok(typeof S.clueText(c, t) === 'string' && S.clueText(c, t).length > 10, `clue ${c.id} text at ${t}`);
}
ok(new Set(S.CLUES.map(c => c.id)).size === S.CLUES.length, 'unique clue ids');
// Case clues follow strap ownership: before the move the tan case has the strap, after it the dark case does.
ok(S.clueFor('case:evelyn', 100).id === 'ledger' && S.clueFor('case:evelyn', 400).id === 'plain_case', 'tan case clue changes with the strap');
ok(S.clueFor('case:harrow', 200).id === 'tag' && S.clueFor('case:harrow', 400).id === 'tag_strap', 'dark case clue changes with the strap');

// 12. Questions are well formed: every blank has at least four options, and the answer data is hashed, never plain.
for (const q of S.QUESTIONS) {
  ok(q.parts.length === q.blanks.length + 1, `${q.id} parts/blanks`);
  for (const b of q.blanks) ok(b.length >= 4, `${q.id} blank has too few options`);
  ok(q.hints.length === 3, `${q.id} has three hints`);
  ok(S.ANSWER_HASHES[q.id].length === q.blanks.length, `${q.id} hash count`);
}
ok(S.QUESTIONS.filter(q => q.set === 1).length === 3 && S.QUESTIONS.filter(q => q.set === 2).length === 3, 'two sets of three');
// The set check reports a count, and an all-wrong set scores zero.
const wrong = {}; for (const q of S.QUESTIONS) wrong[q.id] = q.blanks.map(() => 'nobody at all');
ok(S.checkSet(1, wrong).right === 0 && !S.checkSet(1, wrong).solved, 'wrong answers score zero');

// 13. Purity: the same t always gives the same scene data.
for (const t of [0, 91.5, 190, 372, 440, 510, 600]) {
  const snap = () => JSON.stringify(S.PEOPLE.map(p => [S.pos(p.id, t), S.action(p.id, t), S.look(p.id, t), S.label(p.id, t), S.visible(p.id, t)]).concat([S.stationSeconds(t), S.strapWhere(t), S.caseState('evelyn', t), S.caseState('harrow', t)]));
  ok(snap() === snap(), `pure at ${t}`);
}

console.log(`story tests passed: ${checks} checks`);

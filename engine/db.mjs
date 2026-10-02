#!/usr/bin/env node
// Outreach tracker: JSON database helpers. No dependencies, runs on Windows and Mac.
// Usage: node engine/db.mjs <command> [args]     (run with no command for help)
//
// Data lives in ../data (targets.json, outreach.json, placements.json, backups/).
// Set OUTREACH_DATA_DIR to keep it somewhere else.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = process.env.OUTREACH_DATA_DIR || path.join(ROOT, 'data');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');
const CONFIG_FILE = path.join(ROOT, 'config', 'CONTEXT.md');
const SETUP_MARKER = 'SETUP IN PROGRESS';
const FILES = {
  targets: path.join(DATA_DIR, 'targets.json'),
  outreach: path.join(DATA_DIR, 'outreach.json'),
  placements: path.join(DATA_DIR, 'placements.json'),
};
const BACKUPS_TO_KEEP = 30; // per file

const DEAL_TYPES = ['PR', 'Corporate Gifting', 'Wholesale', 'Exclusive Partnership'];
const STATUSES = [
  'scouted', 'researched', 'concept-developed', 'drafted', 'approved', 'sent', 'replied',
  'in-conversation', 'negotiating', 'agreement', 'in-development', 'placed',
  'disqualified', 'inactive', 'do-not-contact',
];
const DNC = 'do-not-contact';
const DEAD = ['disqualified', 'inactive', DNC];
const CONFIDENCE = ['HIGH', 'MEDIUM', 'LOW'];

const TARGET_DEFAULTS = {
  name: null, outlet: null, beat: null,
  contact_email: null, contact_handle: null, contact_method: null,
  lane: 0, recent_coverage: null, fit_rationale: null,
  confidence_score: null, angle_recommendation: null,
  status: 'scouted', deal_type: null,
  existing_program_found: null, field_research_notes: null, concept_summary: null,
  date_discovered: null, date_researched: null, date_concept_developed: null,
  date_drafted: null, date_approved: null, date_sent: null, date_replied: null,
  date_negotiating: null, date_agreement: null, date_in_development: null, date_placed: null,
  follow_up_due: null, follow_up_count: 0, notes: null,
};
const OUTREACH_DEFAULTS = {
  target_id: null, draft_version: 1, subject: null, draft_text: null,
  send_type: 'pitch', status: 'drafted', created_at: null, sent_at: null, founder_notes: null,
  gmail_draft_id: null, sent_text: null, edit_notes: null, learned_at: null,
};
const PLACEMENT_DEFAULTS = {
  target_id: null, outlet: null, url: null, publish_date: null, lane: 0, notes: null,
};
const INT_FIELDS = new Set(['id', 'target_id', 'lane', 'follow_up_count', 'draft_version']);
const COMPACT = ['id', 'name', 'outlet', 'deal_type', 'lane', 'status', 'confidence_score',
  'contact_method', 'follow_up_due', 'follow_up_count'];

// ── helpers ─────────────────────────────────────────────────────────────────

class UsageError extends Error {}
const fail = (msg) => { throw new UsageError(msg); };
const out = (v) => console.log(JSON.stringify(v, null, 2));

function fmt(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
const today = () => fmt(new Date());
function daysAgo(n) { const d = new Date(); d.setDate(d.getDate() - n); return fmt(d); }
function parseDate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) fail(`Not a YYYY-MM-DD date: ${s}`);
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function addBusinessDays(n, from) {
  const d = from ? parseDate(from) : new Date();
  let left = n;
  while (left > 0) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) left--;
  }
  return fmt(d);
}

function load(file) {
  if (!fs.existsSync(file)) return [];
  const text = fs.readFileSync(file, 'utf8').replace(/^﻿/, '');
  if (!text.trim()) return [];
  const rows = JSON.parse(text);
  return Array.isArray(rows) ? rows : [rows];
}

function backup(file) {
  if (!fs.existsSync(file)) return null;
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const base = path.basename(file, '.json');
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '_').replace('.', '_').slice(0, 19);
  const dest = path.join(BACKUP_DIR, `${base}_${stamp}.json`);
  fs.copyFileSync(file, dest);
  const old = fs.readdirSync(BACKUP_DIR).filter((f) => f.startsWith(`${base}_`)).sort().reverse()
    .slice(BACKUPS_TO_KEEP);
  for (const f of old) fs.unlinkSync(path.join(BACKUP_DIR, f));
  return dest;
}

// Backup, write to a temp file, re-read to prove it parses, then swap it in.
function save(file, rows) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  backup(file);
  const tmp = `${file}.tmp`;
  try {
    fs.writeFileSync(tmp, JSON.stringify(rows, null, 2), 'utf8');
    JSON.parse(fs.readFileSync(tmp, 'utf8'));
    fs.renameSync(tmp, file);
  } catch (e) {
    fs.rmSync(tmp, { force: true });
    throw new Error(`Database save failed, original file left untouched: ${e.message}`);
  }
}

const nextId = (rows) => rows.reduce((m, r) => Math.max(m, Number(r.id) || 0), 0) + 1;
const norm = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

// How much of the draft survived into what was sent: 1 = sent as drafted.
// Word-level longest common subsequence, ignoring case, spacing and punctuation.
function similarity(a, b) {
  const words = (s) => String(s ?? '').toLowerCase().split(/\s+/).map((w) => w.replace(/[^\p{L}\p{N}]/gu, '')).filter(Boolean);
  const x = words(a); const y = words(b);
  if (!x.length && !y.length) return 1;
  let prev = new Array(y.length + 1).fill(0);
  for (let i = 1; i <= x.length; i++) {
    const cur = [0];
    for (let j = 1; j <= y.length; j++) cur[j] = x[i - 1] === y[j - 1] ? prev[j - 1] + 1 : Math.max(prev[j], cur[j - 1]);
    prev = cur;
  }
  return Math.round((2 * prev[y.length] / (x.length + y.length)) * 100) / 100;
}
// Sent as drafted means the same text once spacing is ignored, so a removed comma or dash still counts as an edit.
const asDrafted = (a, b) => String(a ?? '').replace(/\s+/g, ' ').trim() === String(b ?? '').replace(/\s+/g, ' ').trim();
const LIGHT_EDIT = 0.8; // similarity at or above: lightly edited; below: heavily edited

function coerce(key, value) {
  if (value === 'null' || value === '') return null;
  if (INT_FIELDS.has(key) && value !== null) {
    const n = Number(value);
    if (!Number.isInteger(n)) fail(`${key} must be a whole number, got "${value}"`);
    return n;
  }
  return value;
}

// Flags: --key value, bare --flag (true), repeatable --set key=value. Everything else is positional.
function parseArgs(argv) {
  // No prototype, so a key like __proto__ is kept as a plain key and then rejected by name.
  const flags = Object.create(null); const sets = Object.create(null); const pos = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) { pos.push(a); continue; }
    const key = a.slice(2);
    const next = argv[i + 1];
    if (key === 'set') {
      if (next === undefined || !next.includes('=')) fail('--set needs key=value');
      const eq = next.indexOf('=');
      sets[next.slice(0, eq)] = next.slice(eq + 1);
      i++;
    } else if (next === undefined || next.startsWith('--')) {
      flags[key] = true;
    } else { flags[key] = next; i++; }
  }
  return { flags, sets, pos };
}

// Record input: --file <path to JSON>, --json '<JSON>', and/or --set key=value pairs.
function readInput({ flags, sets }) {
  let data = {};
  try {
    if (flags.file) data = JSON.parse(fs.readFileSync(flags.file, 'utf8').replace(/^﻿/, ''));
    else if (flags.json) data = JSON.parse(flags.json);
  } catch (e) {
    fail(`Could not read the record from ${flags.file ?? '--json'}: ${e.message}`);
  }
  if (Array.isArray(data)) {
    if (Object.keys(sets).length) fail('--set cannot be combined with an array of records');
    return data;
  }
  return { ...data, ...sets };
}

function checkFields(obj, defaults, what) {
  // Own properties only, so names like __proto__ or constructor cannot pass as fields.
  const unknown = Object.keys(obj).filter((k) => !Object.hasOwn(defaults, k) && k !== 'id');
  if (unknown.length) {
    fail(`Unknown ${what} field(s): ${unknown.join(', ')}. Valid fields: ${Object.keys(defaults).join(', ')}`);
  }
  const clean = {};
  for (const [k, v] of Object.entries(obj)) clean[k] = typeof v === 'string' ? coerce(k, v) : v;
  if ('status' in clean && what === 'target' && !STATUSES.includes(clean.status)) {
    fail(`Unknown status "${clean.status}". Valid: ${STATUSES.join(', ')}`);
  }
  if ('deal_type' in clean && !DEAL_TYPES.includes(clean.deal_type)) {
    fail(`Unknown deal_type "${clean.deal_type}". Valid: ${DEAL_TYPES.join(', ')}`);
  }
  if (clean.confidence_score != null && !CONFIDENCE.includes(clean.confidence_score)) {
    fail(`confidence_score must be one of ${CONFIDENCE.join(', ')}`);
  }
  return clean;
}

function findDuplicate(rows, rec) {
  const email = norm(rec.contact_email);
  return rows.find((r) =>
    (email && norm(r.contact_email) === email) ||
    (norm(r.name) === norm(rec.name) && norm(r.outlet) === norm(rec.outlet)));
}

function pick(rows, flags) {
  if (flags.full) return rows;
  const fields = flags.fields ? String(flags.fields).split(',').map((s) => s.trim()) : COMPACT;
  return rows.map((r) => Object.fromEntries(fields.map((f) => [f, r[f] ?? null])));
}

// ── commands ────────────────────────────────────────────────────────────────

const commands = {
  init() {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    fs.mkdirSync(path.join(DATA_DIR, 'tmp'), { recursive: true });
    fs.mkdirSync(path.join(DATA_DIR, 'handoff'), { recursive: true });
    const made = [];
    for (const file of Object.values(FILES)) {
      if (!fs.existsSync(file)) { fs.writeFileSync(file, '[]', 'utf8'); made.push(path.basename(file)); }
    }
    console.log(`Data folder: ${DATA_DIR}`);
    console.log(made.length ? `Created: ${made.join(', ')}` : 'All database files already exist. Nothing overwritten.');
  },

  validate() {
    let ok = true;
    for (const file of Object.values(FILES)) {
      const name = path.basename(file);
      if (!fs.existsSync(file)) { console.log(`[MISSING] ${name} (run: node engine/db.mjs init)`); ok = false; continue; }
      try { const n = load(file).length; console.log(`[OK] ${name}: ${n} record(s)`); }
      catch (e) { console.log(`[ERROR] ${name} is CORRUPTED: ${e.message}`); ok = false; }
    }
    if (!ok) console.log('Database is not valid. See: node engine/db.mjs backups');
    if (!fs.existsSync(CONFIG_FILE)) {
      console.log('[MISSING] config/CONTEXT.md. The agent is not set up. Say "run setup".'); ok = false;
    } else if (fs.readFileSync(CONFIG_FILE, 'utf8').includes(SETUP_MARKER)) {
      console.log('[UNFINISHED] config/CONTEXT.md: setup was started but not finished. Say "run setup" to resume.'); ok = false;
    } else console.log('[OK] config/CONTEXT.md');
    if (!ok) { console.log('NOT READY. Do not run a routine.'); process.exitCode = 1; }
  },

  'add-target'(args) {
    const input = readInput(args);
    const list = Array.isArray(input) ? input : [input];
    const rows = load(FILES.targets);
    const added = []; const skipped = []; const blocked = [];
    for (const raw of list) {
      const rec = checkFields(raw, TARGET_DEFAULTS, 'target');
      if (!rec.name && !rec.outlet) fail('A target needs a name or an outlet');
      if (!rec.deal_type) fail(`deal_type is required. Valid: ${DEAL_TYPES.join(', ')}`);
      const dup = findDuplicate(rows, rec);
      if (dup && dup.status === DNC) {
        blocked.push({ name: rec.name, outlet: rec.outlet, do_not_contact_id: dup.id });
        continue;
      }
      if (dup && !args.flags.force) {
        skipped.push({ name: rec.name, outlet: rec.outlet, duplicate_of_id: dup.id, existing_status: dup.status });
        continue;
      }
      const atOutlet = rec.outlet ? rows.filter((r) => norm(r.outlet) === norm(rec.outlet)) : [];
      const sameOutlet = atOutlet.map((r) => r.id);
      const dncAtOutlet = atOutlet.filter((r) => r.status === DNC).map((r) => r.id);
      const row = { id: nextId(rows), ...TARGET_DEFAULTS, ...rec, date_discovered: rec.date_discovered ?? today() };
      rows.push(row);
      added.push({ id: row.id, name: row.name, outlet: row.outlet, status: row.status,
        ...(sameOutlet.length ? { note: `outlet already has record id(s) ${sameOutlet.join(', ')}` } : {}),
        ...(dncAtOutlet.length ? { warning: `someone at this outlet asked not to be contacted (id ${dncAtOutlet.join(', ')}). Flag this target to the founder before drafting.` } : {}) });
    }
    if (added.length) save(FILES.targets, rows);
    out({ added, skipped_as_duplicates: skipped, blocked_do_not_contact: blocked });
    if (skipped.length || blocked.length) process.exitCode = 2;
  },

  targets({ flags }) {
    let rows = load(FILES.targets);
    if (flags.status) { const s = String(flags.status).split(','); rows = rows.filter((r) => s.includes(r.status)); }
    if (flags.deal_type) rows = rows.filter((r) => r.deal_type === flags.deal_type);
    if (flags.confidence) { const c = String(flags.confidence).split(','); rows = rows.filter((r) => c.includes(r.confidence_score)); }
    if (flags.lane) rows = rows.filter((r) => String(r.lane) === String(flags.lane));
    if (flags.due) {
      const t = today();
      rows = rows.filter((r) => ['approved', 'sent'].includes(r.status) && r.follow_up_due && r.follow_up_due <= t);
    }
    if (flags['sent-since']) { const from = daysAgo(Number(flags['sent-since'])); rows = rows.filter((r) => r.date_sent && r.date_sent >= from); }
    out(pick(rows, flags));
  },

  target({ pos }) {
    const id = Number(pos[0]);
    const row = load(FILES.targets).find((r) => r.id === id) ?? fail(`No target with id ${pos[0]}`);
    out({ ...row, outreach: load(FILES.outreach).filter((o) => o.target_id === id) });
  },

  // Search before adding, so the same outlet is not pitched twice.
  // Text found on the web goes in a file (--file with {"query": "..."}), never on the command line.
  find({ pos, flags }) {
    let text = pos.join(' ');
    if (flags.file) {
      try { text = JSON.parse(fs.readFileSync(flags.file, 'utf8').replace(/^\uFEFF/, '')).query ?? ''; }
      catch (e) { fail(`Could not read the query from ${flags.file}: ${e.message}`); }
    }
    const q = norm(text);
    if (!q) fail('Usage: find <text>, or find --file <json with "query">');
    const rows = load(FILES.targets).filter((r) =>
      [r.name, r.outlet, r.contact_email, r.contact_handle].some((v) => norm(v).includes(q)));
    out(pick(rows, flags));
  },

  'update-target'(args) {
    const id = Number(args.pos[0]);
    const fields = checkFields(readInput(args), TARGET_DEFAULTS, 'target');
    if (!Object.keys(fields).length) fail('Nothing to update. Use --set key=value or --file');
    const rows = load(FILES.targets);
    const row = rows.find((r) => r.id === id) ?? fail(`No target with id ${args.pos[0]}`);
    if (row.status === DNC && fields.status && fields.status !== DNC && !args.flags.force) {
      fail(`Target ${id} is do-not-contact. Only the founder can lift that: re-run with --force if they have said so.`);
    }
    Object.assign(row, fields);
    save(FILES.targets, rows);
    out({ updated: id, fields });
  },

  'add-outreach'(args) {
    const rec = checkFields(readInput(args), OUTREACH_DEFAULTS, 'outreach');
    if (!Number.isInteger(rec.target_id)) fail('target_id is required');
    if (!load(FILES.targets).some((t) => t.id === rec.target_id)) fail(`No target with id ${rec.target_id}`);
    if (!rec.draft_text) fail('draft_text is required');
    const rows = load(FILES.outreach);
    const row = { id: nextId(rows), ...OUTREACH_DEFAULTS, ...rec, created_at: today() };
    rows.push(row);
    save(FILES.outreach, rows);
    out({ added: { id: row.id, target_id: row.target_id, send_type: row.send_type, status: row.status } });
  },

  outreach({ flags }) {
    let rows = load(FILES.outreach);
    if (flags.target_id) rows = rows.filter((r) => r.target_id === Number(flags.target_id));
    if (flags.status) rows = rows.filter((r) => r.status === flags.status);
    out(rows);
  },

  // Sent messages that differ from the draft, for the Friday learning pass (RULES section 13).
  edits({ flags }) {
    const targets = load(FILES.targets);
    let rows = load(FILES.outreach).filter((o) => o.sent_text && o.draft_text);
    if (!flags.all) rows = rows.filter((o) => !o.learned_at);
    const result = rows.map((o) => {
      const t = targets.find((x) => x.id === o.target_id) ?? {};
      return { id: o.id, target_id: o.target_id, outlet: t.outlet ?? null, deal_type: t.deal_type ?? null,
        send_type: o.send_type, sent_at: o.sent_at, as_drafted: asDrafted(o.draft_text, o.sent_text),
        similarity: similarity(o.draft_text, o.sent_text),
        draft_text: o.draft_text, sent_text: o.sent_text, edit_notes: o.edit_notes, learned_at: o.learned_at };
    });
    out({
      sent_as_drafted: result.filter((r) => r.as_drafted).map((r) => r.id),
      edited: result.filter((r) => !r.as_drafted || flags.all),
      ...(flags.all ? {} : { note: 'Mark each reviewed record with update-outreach <id> --set learned_at=<today> (and edit_notes for edited ones).' }),
    });
  },

  'update-outreach'(args) {
    const id = Number(args.pos[0]);
    const fields = checkFields(readInput(args), OUTREACH_DEFAULTS, 'outreach');
    const rows = load(FILES.outreach);
    const row = rows.find((r) => r.id === id) ?? fail(`No outreach record with id ${args.pos[0]}`);
    Object.assign(row, fields);
    save(FILES.outreach, rows);
    out({ updated: id, fields });
  },

  'add-placement'(args) {
    const rec = checkFields(readInput(args), PLACEMENT_DEFAULTS, 'placement');
    const rows = load(FILES.placements);
    const row = { id: nextId(rows), ...PLACEMENT_DEFAULTS, ...rec };
    rows.push(row);
    save(FILES.placements, rows);
    out({ added: row });
  },

  placements() { out(load(FILES.placements)); },

  // Pipeline counts by deal type and status.
  summary() {
    const rows = load(FILES.targets);
    const table = {};
    for (const dt of DEAL_TYPES) {
      const mine = rows.filter((r) => r.deal_type === dt);
      table[dt] = { total: mine.length };
      for (const s of STATUSES) { const n = mine.filter((r) => r.status === s).length; if (n) table[dt][s] = n; }
    }
    out({ as_of: today(), total_targets: rows.length, by_deal_type: table });
  },

  report() {
    const targets = load(FILES.targets);
    const placements = load(FILES.placements);
    const t = today(); const weekStart = daysAgo(7); const thirtyAgo = daysAgo(30);
    const monthStart = `${t.slice(0, 8)}01`;
    const count = (rows, fn) => rows.filter(fn).length;
    const dead = DEAD;
    const repliedOn = ['replied', 'in-conversation', 'negotiating', 'agreement', 'in-development', 'placed'];
    const line = (label, value) => console.log(`  ${`${label}:`.padEnd(36)}${value}`);

    const section = (rows, label) => {
      const sent30 = count(rows, (r) => r.date_sent && r.date_sent >= thirtyAgo);
      const replied30 = count(rows, (r) => r.date_sent && r.date_sent >= thirtyAgo && repliedOn.includes(r.status));
      const live = (level) => count(rows, (r) => r.confidence_score === level && !dead.includes(r.status));
      console.log(`\n-- ${label} --`);
      line('Discovered this week', count(rows, (r) => r.date_discovered && r.date_discovered >= weekStart));
      line('Researched this week', count(rows, (r) => r.date_researched && r.date_researched >= weekStart));
      line('Drafted this week', count(rows, (r) => r.date_drafted && r.date_drafted >= weekStart));
      line('Sent this week', count(rows, (r) => r.date_sent && r.date_sent >= weekStart));
      line('Total active pipeline', count(rows, (r) => ![...dead, 'placed'].includes(r.status)));
      line('Drafts waiting on your send', count(rows, (r) => r.status === 'approved'));
      line('Replied', count(rows, (r) => r.status === 'replied'));
      line('In conversation', count(rows, (r) => r.status === 'in-conversation'));
      line('Negotiating', count(rows, (r) => r.status === 'negotiating'));
      line('Agreement', count(rows, (r) => r.status === 'agreement'));
      line('In development', count(rows, (r) => r.status === 'in-development'));
      line('Concept developed', count(rows, (r) => r.status === 'concept-developed'));
      line('Reply rate (30-day)', `${sent30 ? Math.round((replied30 / sent30) * 1000) / 10 : 0}%`);
      line('Targets with a follow-up sent', count(rows, (r) => r.follow_up_count > 0));
      line('Do not contact', count(rows, (r) => r.status === DNC));
      line('Confidence HIGH/MED/LOW (active)', `${live('HIGH')} / ${live('MEDIUM')} / ${live('LOW')}`);
    };

    const bar = '====================================================';
    console.log(`\n${bar}\n  OUTREACH TRACKER - WEEKLY REPORT\n  Week ending: ${t}\n${bar}`);
    section(targets, 'ALL DEAL TYPES (AGGREGATE)');
    for (const dt of DEAL_TYPES) section(targets.filter((r) => r.deal_type === dt), dt.toUpperCase());

    const ep = targets.filter((r) => r.deal_type === 'Exclusive Partnership');
    const waiting = ep.filter((r) => r.status === 'scouted');
    const sentRecent = load(FILES.outreach).filter((o) => o.sent_text && o.draft_text && o.sent_at && o.sent_at >= thirtyAgo)
      .map((o) => (asDrafted(o.draft_text, o.sent_text) ? 1 : Math.min(similarity(o.draft_text, o.sent_text), 0.99)));
    console.log('\nDRAFT QUALITY (emails sent in the last 30 days)');
    if (!sentRecent.length) console.log('  No sent emails compared yet');
    else {
      const asIs = sentRecent.filter((s) => s === 1).length;
      const light = sentRecent.filter((s) => s < 1 && s >= LIGHT_EDIT).length;
      line('Sent as drafted', `${asIs} of ${sentRecent.length} (${Math.round((asIs / sentRecent.length) * 100)}%)`);
      line('Lightly edited', light);
      line('Heavily edited', sentRecent.length - asIs - light);
    }

    console.log('\nEXCLUSIVE PARTNERSHIP PIPELINE');
    line('Scouted, not yet field-researched', waiting.length);
    line('Researched or further along', count(ep, (r) => !['scouted', 'disqualified'].includes(r.status)));
    if (waiting.length) {
      console.log('  Still needing field research:');
      for (const r of waiting) console.log(`    - ${r.name} / ${r.outlet}`);
    }

    console.log('\nFOLLOW-UPS DUE');
    const due = targets.filter((r) => r.follow_up_due && r.follow_up_due <= t && ['sent', 'approved'].includes(r.status));
    if (!due.length) console.log('  None');
    for (const r of due) console.log(`  ${r.name} - ${r.outlet} [${r.deal_type}] (due ${r.follow_up_due})`);

    console.log('\nPLACEMENTS THIS MONTH');
    const placed = placements.filter((p) => p.publish_date && p.publish_date >= monthStart);
    if (!placed.length) console.log('  None yet');
    for (const p of placed) {
      const dt = targets.find((r) => r.id === p.target_id)?.deal_type ?? 'unknown';
      console.log(`  ${p.outlet} - ${p.url} (${p.publish_date}) [${dt}]`);
    }
    console.log(bar);
  },

  // Date N business days from today (or from --from YYYY-MM-DD).
  bizdays({ pos, flags }) {
    const n = Number(pos[0]);
    if (!Number.isInteger(n) || n < 0) fail('Usage: bizdays <n> [--from YYYY-MM-DD]');
    console.log(addBusinessDays(n, flags.from));
  },

  backups() {
    if (!fs.existsSync(BACKUP_DIR)) { console.log('No backups yet.'); return; }
    const files = fs.readdirSync(BACKUP_DIR).filter((f) => f.endsWith('.json')).sort().reverse();
    if (!files.length) console.log('No backups yet.');
    for (const f of files) {
      const kb = Math.round(fs.statSync(path.join(BACKUP_DIR, f)).size / 102.4) / 10;
      console.log(`${f} (${kb} KB)`);
    }
  },

  restore({ pos }) {
    const name = pos[0] ?? fail('Usage: restore <backup file name>');
    const src = fs.existsSync(name) ? name : path.join(BACKUP_DIR, name);
    if (!fs.existsSync(src)) fail(`Backup file not found: ${name}`);
    JSON.parse(fs.readFileSync(src, 'utf8'));
    const key = Object.keys(FILES).find((k) => path.basename(src).startsWith(`${k}_`))
      ?? fail('Cannot tell which database file this backup belongs to');
    backup(FILES[key]);
    fs.copyFileSync(src, FILES[key]);
    console.log(`Restored ${path.basename(FILES[key])} from ${path.basename(src)}`);
  },
};

const HELP = `Outreach tracker database

  init                              Create the data folder and empty database files
  validate                          Pre-flight: database files readable and setup finished
  summary                           Pipeline counts by deal type and status
  report                            Weekly KPI report

  targets [filters]                 List targets (compact). Filters: --status a,b  --deal_type "X"
                                    --confidence HIGH,MEDIUM  --lane N  --due  --sent-since DAYS
                                    Output: --full, or --fields id,name,contact_email
  target <id>                       One target in full, with its outreach history
  find --file <json>                Search name, outlet, email and handle for {"query": "..."}.
                                    Run before adding. (find <text> also works for typed searches.)
  add-target --file <json>          Add one target, or an array of targets. Refuses duplicates
                                    (same email, or same name and outlet) unless --force.
                                    A do-not-contact match is always refused.
  update-target <id> --set k=v ...  Update fields. Use --file <json> for long text.

  add-outreach --file <json>        Save a draft: target_id, subject, draft_text, send_type, status
  outreach [--target_id N] [--status S]
  update-outreach <id> --set k=v ...
  edits [--all]                     Sent emails vs their drafts, with a similarity score.
                                    Default: not yet reviewed by the learning pass.

  add-placement --file <json>       Record a win: target_id, outlet, url, publish_date, lane, notes
  placements

  bizdays <n> [--from YYYY-MM-DD]   The date N business days out
  backups                           List backups, newest first
  restore <backup file name>        Restore a database file from a backup

Deal types: ${DEAL_TYPES.join(' | ')}
Statuses:   ${STATUSES.slice(0, 12).join(' > ')}
Terminal:   ${DEAD.join(', ')}
Data:       ${DATA_DIR}`;

const [cmd, ...rest] = process.argv.slice(2);
if (!cmd || cmd === 'help' || cmd === '--help') {
  console.log(HELP);
} else if (!commands[cmd]) {
  console.error(`Unknown command: ${cmd}\n\n${HELP}`);
  process.exitCode = 1;
} else {
  try {
    commands[cmd](parseArgs(rest));
  } catch (e) {
    console.error(e instanceof UsageError ? `Error: ${e.message}` : `Error: ${e.stack}`);
    process.exitCode = 1;
  }
}

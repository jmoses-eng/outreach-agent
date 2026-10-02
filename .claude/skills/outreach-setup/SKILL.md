---
name: outreach-setup
description: One-time setup for the outreach agent in this folder. Interviews the owner about their business, writes config/CONTEXT.md section by section, creates the database, and registers the five weekday scheduled tasks. Resumes where it stopped if interrupted. Use when the user says "run setup", "set up the outreach agent", "outreach setup", or when config/CONTEXT.md is missing or marked SETUP IN PROGRESS. Also use to redo one section ("update my wholesale terms", "change my voice rules").
---

# Outreach Agent Setup

You are setting this agent up for a business that is new to it. The owner may not be technical. Keep it conversational and do the mechanical work yourself.

`<AGENT_DIR>` is the folder containing `engine/`, `routines/` and `config/`. Work out its absolute path first; you will need it for the scheduled tasks.

## Ground rules

- **One question at a time.** Never send a list of questions. Ask, wait, then ask the next.
- **Save as you go.** Each section is written to `config/CONTEXT.md` as soon as it is answered (Step 3). Never hold answers in the conversation to write later.
- **Never invent business facts.** Prices, client names, minimums, product details and relationships come from the owner. If they do not know or want to skip, write "Not set" in that field and move on.
- **Offer a draft where you can.** For voice rules, lanes and discovery sources, propose something based on what they have told you (and their website, if they give you one) and let them correct it. Correcting is faster than writing.
- **Nothing in setup contacts a prospect.** The only Gmail draft setup creates is a test note addressed to the owner themselves (Step 7).

## Step 0: Where are we?

Look at `config/CONTEXT.md`:

| State | What to do |
|---|---|
| File does not exist | Fresh setup. Start at Step 1. |
| First line contains `SETUP IN PROGRESS` | Interrupted setup. Read the "Sections done" list on that line, tell the owner which sections are saved and which is next, and resume the interview at Step 3 from the first section not on the list. Do not re-ask finished sections. Re-run the Step 1 checks quietly first. |
| File exists, no marker | Already set up. Ask which section they want to change, change only that section, and stop. Do not re-run the rest of setup unless they ask. |

## Step 1: Check what is installed

1. Run `node --version`. If Node is missing, tell them to install the LTS version from nodejs.org, restart the app, and say "run setup" again. Stop here until it works.
2. Run `node "<AGENT_DIR>/engine/db.mjs" help` to confirm the helper runs.
3. Check that a Gmail connector is available in this session (a tool that creates Gmail drafts, and one that searches mail). If not, tell them to connect Gmail in the app's connector settings. The interview can continue, but the routines cannot run without it.
4. Check whether a Slack connector is available. It is optional: without it, DM drafts are written to a file in `data/handoff/` instead.

Tell them in two or three plain sentences what you found.

## Step 2: Explain what they are getting

Briefly:

- Monday it researches and qualifies new targets. Tuesday it drafts pitches for press, corporate gifting and wholesale. Wednesday it drafts follow-ups. Thursday it does deep research for exclusive partnerships. Friday it reports.
- It never sends anything. Every email lands in Gmail Drafts for them to read and send.
- It only uses contacts it can verify on a real page. It does not guess email addresses.
- Setup takes 30 to 45 minutes and saves after every section, so they can stop and say "run setup" later to pick up where they left off.

## Step 3: The interview, saved section by section

**Calibrate first.** Read `config/CONTEXT.example.md`, a fully filled config for a fictional ceramics studio. It shows the level of detail that produces good drafts: named seed targets, concrete discovery sources, real numbers, voice rules that ban specific words. Aim every section at that level. Never copy its facts, names or numbers into their config. When an answer is vague ("small businesses", "people who like nice things"), use the matching example section to show them what a specific answer looks like, and ask again.

Tell the owner the example exists and that they can open it to see where this is heading.

**Before the first question** (fresh setup only): copy `config/CONTEXT.template.md` to `config/CONTEXT.md`. The copy's first line is the marker `<!-- SETUP IN PROGRESS. Sections done: none -->`. Leave the rest of the template in place for now; unfinished sections keep their placeholders until you reach them.

**After each section is answered:**

1. Rewrite that section in `config/CONTEXT.md` with their answers. Remove its "Guidance:" lines and leave no `[square bracket]` placeholders in it: a skipped field reads "Not set".
2. Add the section's name to the "Sections done" list on the first line.
3. Tell them in one line that it is saved, and how many sections are left.

Go in this order. If they give you a website, read it first and pre-fill what you can, then confirm rather than ask from scratch.

1. **Business:** name, one-liner, what they sell, what makes it different, where to buy.
2. **Sender:** name, title, the Gmail address drafts should be created in, sign-off. If Slack is connected, their Slack member ID (Profile > three dots > Copy member ID); otherwise "none".
3. **Reply detection:** brand terms, and two or three distinctive phrases they would use in subject lines.
4. **Voice:** tone words, openers they hate, words they never use, words they like, punctuation rules. Ask them to paste one or two real messages they have sent that sound like them, and derive rules from those. Confirm the word limits in the template or change them.
5. **Geography:** what counts as local, and the priority order outward.
6. **Lanes: PR:** what kinds of outlets and writers should cover them, the angle for each, and how to score confidence. Propose four to six lanes.
7. **Lanes: Corporate Gifting:** who buys from them for gifting today, which buyer type converts best (the priority lane), then one lane at a time: target, value prop, offer, timing, where to find them, job titles, a few seed organizations.
8. **Corporate Gifting Program:** tiers, minimums, prices, customization, lead time, PDF; confirmed past clients for social proof; the seasonal calendar.
9. **Wholesale Program:** product line and retail price, wholesale price and terms, ideal store, store types in priority order, the ask for local versus distant stores, hard disqualifiers including any territory rule. Assign the wholesale lane number.
10. **Exclusive Partnership Program:** the model in their words, then categories of institution, seed targets for each, and what must be researched before pitching each category. If they do not do this kind of deal yet, write the section as "Not active" and tell them Thursday will report nothing until it is filled in.
11. **Follow-up Cadence:** confirm the defaults in the template or change them.
12. **Existing relationships:** current customers, stockists and partners who must not be cold-pitched. Separately, anyone who has asked not to be contacted: these go into the database as `do-not-contact` in Step 5, so collect name, organization and email.
13. **Example pitches:** ask for a real PR pitch at minimum. Offer to draft one from everything gathered if they have none, and have them approve the wording.
14. **Monthly Theme Calendar:** optional. If they do not plan by month, delete the section.

Number the lanes in one sequence: PR, then Corporate Gifting, then one number for Wholesale.

## Step 4: Finish the config

1. Read `config/CONTEXT.md` top to bottom. Remove the template's explanatory HTML comment and any remaining "Guidance:" lines. The only square brackets left should be the bracketed notes inside the example pitches.
2. Show them a short summary of each section and ask if anything is wrong. Fix it.
3. **Only now** remove the `SETUP IN PROGRESS` line. Until it is gone, every routine refuses to run.

## Step 5: Create the database

1. `node "<AGENT_DIR>/engine/db.mjs" init`
2. `node "<AGENT_DIR>/engine/db.mjs" validate` should now report everything OK.
3. Add anyone who asked not to be contacted as a target with `status: "do-not-contact"` and a dated note. The database will then refuse to let them be added or drafted for later.
4. Ask whether they have existing prospects or past outreach to bring in (a spreadsheet, a list, a CRM export). If so, map it to the target fields in `engine/RULES.md` section 5, show them five mapped records to confirm, then load it with `add-target --file`. Set `status` honestly: someone already pitched is `sent` with a real `date_sent`; a current customer goes in "Existing relationships", not the pipeline. Imported contacts are held to the Contact Verification Standard too: anything without a verifiable source is added at `scouted` so Monday checks it.
5. Add the Exclusive Partnership seed targets from CONTEXT at `status: "scouted"`, `lane: 0`.

## Step 6: Register the schedule

Ask what time of day they want the runs (default 8:00 AM, their local time) and confirm they are happy with Monday to Friday.

If a scheduled-task creation tool is available, create five tasks. Each prompt must be self-contained, because a scheduled run starts with no memory of this conversation. Use this prompt, with the real absolute path substituted and the right routine file:

```
You are the outreach agent for <Business name>. The agent folder is <AGENT_DIR>.
Read <AGENT_DIR>/engine/RULES.md, then <AGENT_DIR>/config/CONTEXT.md, then follow
<AGENT_DIR>/routines/<routine file> exactly. Use the Gmail connector for mail and,
if CONTEXT gives a Slack member ID, the Slack connector for DM hand-offs.
This run is unattended: do not ask questions, and never send an email. Drafts only.
```

| taskId | Routine file | Cron (8 AM default) | Description |
|---|---|---|---|
| `outreach-monday-research` | `monday-research.md` | `0 8 * * 1` | Research and qualify targets. Never drafts, never sends. |
| `outreach-tuesday-drafts` | `tuesday-drafts.md` | `0 8 * * 2` | Draft PR, gifting and wholesale pitches into Gmail Drafts. |
| `outreach-wednesday-followups` | `wednesday-followups.md` | `0 8 * * 3` | Check replies and draft follow-ups. |
| `outreach-thursday-partnerships` | `thursday-partnerships.md` | `0 8 * * 4` | Exclusive Partnership field research and drafting. |
| `outreach-friday-report` | `friday-report.md` | `0 8 * * 5` | Weekly KPI report. |

Because the tasks point at the routine files rather than copying them, pulling an update to this folder updates the routines without re-registering anything.

Tell them: scheduled tasks run while the app is open. If it is closed when a task is due, the task runs the next time they open it.

If no scheduled-task tool is available, say so plainly and tell them the manual way: open this folder and say "run the Monday routine" (or Tuesday, and so on).

## Step 7: Approve the tools once

A scheduled run has nobody watching. The first time it needs a tool the owner has not approved, it can sit waiting for a click and the run produces nothing. Get those approvals out of the way now, while they are here.

Tell them what is about to happen: "I'm going to use each tool the routines need, once. When the app asks for permission, choose the option that allows it always, not just this once."

Then use each of these, one at a time:

1. **Database:** `node "<AGENT_DIR>/engine/db.mjs" summary`
2. **File writing:** write a small JSON file to `<AGENT_DIR>/data/tmp/setup-check.json`
3. **Web search:** one search for the business's own name
4. **Web page fetch:** fetch the business's own website
5. **Gmail search:** search the sender account for mail from the last day
6. **Gmail draft:** create one draft addressed **to the owner's own address**, subject "Outreach agent test: delete me", body one line. Tell them to delete it from Gmail Drafts.
7. **Slack**, only if a member ID is set: one DM to that ID saying setup is complete.

Report which tools worked. A tool that is missing or was declined means the routines that need it will fail; say which ones.

Then be honest about the limit of this step: approvals given in this conversation may not carry over to scheduled runs on every setup. That is what Step 9 is for.

## Step 8: Dry run

Prove the quality before the first scheduled run, without touching the pipeline:

1. Ask them to name one real organization they would love to reach, in any deal type.
2. Research it the way Monday would, including contact verification.
3. Draft the pitch the way Tuesday (or Thursday) would, and show it to them **in the conversation only**. Do not add the target, save the draft or create a Gmail draft unless they ask.
4. Ask what they would change. Anything that is a rule rather than a one-off goes into the Voice Rules or the "Founder corrections" section of `config/CONTEXT.md`.

## Step 9: Hand over, and the attended first week

Tell them, briefly:

- What runs when, and that the first run is the next weekday at the time they chose.
- **For the first week, be at the computer when each run starts.** Open the run when it begins and watch for permission prompts. Choose "always allow" for each. Each of the five routines needs to complete once this way. If they would rather not wait, they can start each task by hand from the app's scheduled tasks list, or say "run the Monday routine" here. After every routine has finished once with no prompt, runs can be left alone.
- If a morning's run produced no report, a permission prompt is the first thing to check.
- Their daily job: read the run report, then go to Gmail Drafts, edit and send what they like, delete what they do not.
- Expect the first week's drafts to be rougher than later ones. Every correction they give is recorded and followed from then on.
- **Edit drafts freely before sending.** Every Friday the agent compares what they sent with what it drafted. When the same change shows up in 3 or more sent emails, it becomes a rule under "Learned from your edits" in their config, and the report says so. Deleting a draft instead of sending it is a signal too. They can remove any learned rule by saying so.
- To change anything about the business: say "update my outreach setup".
- Their config and prospect data stay on their machine in `config/CONTEXT.md` and `data/`. Both are excluded from version control, so they are also not backed up anywhere else.

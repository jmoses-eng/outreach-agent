---
name: outreach-setup
description: One-time setup for the outreach agent in this folder. Interviews the owner about their business, writes config/CONTEXT.md, creates the database, and registers the five weekday scheduled tasks. Use when the user says "run setup", "set up the outreach agent", "outreach setup", or when config/CONTEXT.md does not exist yet. Also use to redo one section ("update my wholesale terms", "change my voice rules").
---

# Outreach Agent Setup

You are setting this agent up for a business that is new to it. The owner may not be technical. Keep it conversational and do the mechanical work yourself.

`<AGENT_DIR>` is the folder containing `engine/`, `routines/` and `config/`. Work out its absolute path first; you will need it for the scheduled tasks.

## Ground rules

- **One question at a time.** Never send a list of questions. Ask, wait, then ask the next.
- **Never invent business facts.** Prices, client names, minimums, product details and relationships come from the owner. If they do not know or want to skip, write "Not set" in that field and move on.
- **Offer a draft where you can.** For voice rules, lanes and discovery sources, propose something based on what they have told you (and their website, if they give you one) and let them correct it. Correcting is faster than writing.
- **If `config/CONTEXT.md` already exists,** do not overwrite it. Ask which section they want to change, change only that, and skip to Step 6.
- **Nothing in setup sends an email** or creates a Gmail draft.

## Step 1: Check what is installed

1. Run `node --version`. If Node is missing, tell them to install the LTS version from nodejs.org, restart the app, and say "run setup" again. Stop here until it works.
2. Run `node "<AGENT_DIR>/engine/db.mjs" help` to confirm the helper runs.
3. Check that a Gmail connector is available in this session (a tool that creates Gmail drafts, and one that searches mail). If not, tell them to connect Gmail in the app's connector settings. Setup can continue, but the routines cannot run without it.
4. Check whether a Slack connector is available. It is optional: without it, DM drafts are written to a file in `data/handoff/` instead.

Tell them in two or three plain sentences what you found.

## Step 2: Explain what they are getting

Briefly:

- Monday it researches and qualifies new targets. Tuesday it drafts pitches for press, corporate gifting and wholesale. Wednesday it drafts follow-ups. Thursday it does deep research for exclusive partnerships. Friday it reports.
- It never sends anything. Every email lands in Gmail Drafts for them to read and send.
- It only uses contacts it can verify on a real page. It does not guess email addresses.

## Step 3: The interview

Go section by section, in this order. Tell them which section you are on and roughly how many are left. If they give you a website, read it first and pre-fill what you can, then confirm rather than ask from scratch.

1. **Business:** name, one-liner, what they sell, what makes it different, where to buy.
2. **Sender:** name, title, the Gmail address drafts should be created in, sign-off. If Slack is connected, their Slack member ID (Profile > three dots > Copy member ID); otherwise "none".
3. **Reply detection:** brand terms, and two or three distinctive phrases they would use in subject lines.
4. **Voice:** tone words, openers they hate, words they never use, words they like, punctuation rules. Ask them to paste one or two real messages they have sent that sound like them, and derive rules from those. Confirm the word limits in the template or change them.
5. **Geography:** what counts as local, and the priority order outward.
6. **PR lanes:** what kinds of outlets and writers should cover them, and the angle for each. Propose four to six.
7. **Corporate Gifting:** who buys from them for gifting today, which buyer type converts best (the priority lane), then one lane at a time: target, value prop, offer, timing, where to find them, job titles, a few seed organizations. Then program details (tiers, minimums, prices, customization, lead time, PDF), confirmed past clients for social proof, and the seasonal calendar.
8. **Wholesale:** product line and retail price, wholesale price and terms, ideal store, store types in priority order, the ask for local versus distant stores, hard disqualifiers including any territory rule.
9. **Exclusive Partnership:** the model in their words, then categories of institution, seed targets for each, and what must be researched before pitching each category. If they do not do this kind of deal yet, write the section as "Not active" and tell them Thursday will report nothing until it is filled in.
10. **Follow-up cadence:** confirm the defaults in the template or change them.
11. **Existing relationships:** current customers, stockists, partners and anyone not to be contacted.
12. **Example pitches:** ask for a real PR pitch at minimum. Offer to draft one from everything gathered if they have none, and have them approve the wording.
13. **Monthly themes:** optional. Skip if they do not plan by month.

## Step 4: Write the config

1. Copy `config/CONTEXT.template.md` to `config/CONTEXT.md`.
2. Fill in every section from the interview. Remove the HTML comment at the top and every "Guidance:" line. Leave no `[square bracket]` placeholders: a skipped field reads "Not set".
3. Number the lanes in one sequence: PR, then Corporate Gifting, then one number for Wholesale.
4. Show them a short summary of each section and ask if anything is wrong. Fix it before moving on.

## Step 5: Create the database

1. `node "<AGENT_DIR>/engine/db.mjs" init`
2. `node "<AGENT_DIR>/engine/db.mjs" validate`
3. Ask whether they have existing prospects or past outreach to bring in (a spreadsheet, a list, a CRM export). If so, map it to the target fields in `engine/RULES.md` section 5, show them five mapped records to confirm, then load it with `add-target --file`. Set `status` honestly: someone already pitched is `sent` with a real `date_sent`; a current customer goes in "Existing relationships", not the pipeline. Imported contacts are held to the Contact Verification Standard too: anything without a verifiable source is added at `scouted` so Monday checks it.
4. Add the Exclusive Partnership seed targets from CONTEXT at `status: "scouted"`, `lane: 0`.

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

## Step 7: Dry run

Prove it works before the first scheduled run, without touching Gmail:

1. Ask them to name one real organization they would love to reach, in any deal type.
2. Research it the way Monday would, including contact verification.
3. Draft the pitch the way Tuesday (or Thursday) would, and show it to them **in the conversation only**. Do not add the target, save the draft or create a Gmail draft unless they ask.
4. Ask what they would change. Anything that is a rule rather than a one-off goes into the Voice Rules or the "Founder corrections" section of `config/CONTEXT.md`.

## Step 8: Hand over

Tell them, briefly:

- What runs when, and that the first run is the next weekday at the time they chose.
- Their daily job: read the run report, then go to Gmail Drafts, edit and send what they like, delete what they do not.
- To change anything about the business: say "update my outreach setup".
- Their config and prospect data stay on their machine in `config/CONTEXT.md` and `data/`. Both are excluded from version control.

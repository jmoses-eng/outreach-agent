# Friday: Weekly KPI Report

Read `engine/RULES.md` and `config/CONTEXT.md` first. `<AGENT_DIR>` is the folder containing `engine/`.

## Step 1: Sync, then pull the report

First run `node "<AGENT_DIR>/engine/db.mjs" validate`. If it reports NOT READY, stop.

1. Run the send sync from RULES section 6 so "sent this week" is accurate.
2. `node "<AGENT_DIR>/engine/db.mjs" report`

The report gives, in aggregate and per deal type: discovered, researched, drafted and sent this week; active pipeline; drafts waiting on the founder's send; replied, in-conversation, negotiating, agreement, in-development and concept-developed counts; 30-day reply rate; follow-ups; confidence breakdown. It also gives an Exclusive Partnership block, follow-ups due, and placements this month.

Present it to the founder, reformatted for readability if needed. Do not recompute the numbers yourself. The `report` command is the source of truth.

## Step 2: Replies not yet logged

Search Gmail for the last 7 days using the reply-detection searches in CONTEXT, plus the bounce search from RULES section 12. For anything the database does not reflect yet, flag it with its target and deal type, then sort it per RULES section 12. Suspicious content (RULES section 14), opt-outs and bounces go at the top of the report as alerts.

## Step 3: Unsent drafts

List every target still at `approved` from the send sync, oldest first, with days waiting. Drafts that are never sent are the most common reason a pipeline stalls.

## Step 4: Strategic note

Three or four sentences:

- What is working, and which lane or deal type needs more targets.
- Exclusive Partnership movement this week, always. If nothing moved past `scouted`, say so.
- What needs the founder's attention next week.

## Step 5: Learn from the founder's edits

Run the learning pass in RULES section 13: review this week's sent emails against their drafts, promote patterns that have repeated in at least 3 sends into "Learned from your edits" in CONTEXT, read what the deleted drafts had in common, and add a "What I learned this week" section to the report.

## Step 6: Record wins

If the founder reports a placement, an order or a signed partnership, record it with `add-placement --file` and set the target to `placed` with `date_placed`.

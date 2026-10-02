# Wednesday: Follow-ups, All Deal Types

Read `engine/RULES.md` and `config/CONTEXT.md` first. `<AGENT_DIR>` is the folder containing `engine/`.

Cadence and tone differ by deal type. The mechanics are the same for all four: check replies, find what is due, draft, hand over, retire what is exhausted.

## Pre-flight

`node "<AGENT_DIR>/engine/db.mjs" validate`. If it reports NOT READY, stop.

## Step 1: Send sync and reply check

1. Run the send sync from RULES section 6. Keep the list of unsent drafts for the report.
2. Search Gmail for replies in the last 30 days using the reply-detection searches in CONTEXT (brand terms and subject phrases).
3. Run the bounce search from RULES section 12 for the same 30 days.
4. Sort every reply, opt-out and bounce per RULES section 12 and update the target to match.
5. Put every reply at the top of the run report with full context and its deal type. Do not answer replies. The founder does.

## Step 2: What is due

`targets --due --full`, keeping only `status = sent` and `follow_up_count < 2`.

A target still at `approved` after the send sync means the first message never went out. Skip it: no follow-up, no change to `follow_up_count` or `follow_up_due`. A "circling back" note on a first touch that never happened is exactly the failure this check prevents.

List what remains: name, outlet, deal type, original send date, `follow_up_count`, original angle or concept.

## Step 3: Draft one follow-up per due target

Read the original pitch first (`target <id>` shows the outreach history). Then, by deal type, using the limits and cadence in CONTEXT:

- **PR and Corporate Gifting:** shorter than the original, warmer (assume busy, not uninterested), one line that re-contextualizes. Do not repeat the pitch.
- **Wholesale:** follow the Wholesale cadence in CONTEXT. Typically follow-up 1 attaches or links the wholesale sheet with one new line of context, and follow-up 2 is the shortest message, restating the ask plainly.
- **Exclusive Partnership:** reference the `concept_summary` and field research. Still no pricing or program PDF. The ask is still a conversation.

All follow RULES section 9.

Save with `add-outreach --file`, `send_type` = `follow_up_1` or `follow_up_2`.

## Step 4: Create the follow-up drafts (unattended, nothing sends)

**Email targets:** create a Gmail draft in the sender account named in CONTEXT, threaded as a reply to the original message where the thread is available. Never call a send tool. Save the draft ID the tool returns: `update-outreach <outreach id> --set gmail_draft_id=<id>`. Then `update-outreach <outreach id> --set status=approved`, so the next send sync picks it up.

**DM and LinkedIn targets:** follow RULES section 7. Do not change `follow_up_count` or `follow_up_due` until the founder confirms the DM was posted.

## Step 5: Advance the record (email targets only)

- Add 1 to `follow_up_count`.
- Set the next `follow_up_due` with `bizdays <n>` using the next interval for that deal type in CONTEXT.

## Step 6: Retire exhausted targets

A target at `follow_up_count >= 2`, past its `follow_up_due`, with no reply:

- `status = inactive`, with a dated note.
- Report: "[Name] / [Outlet] ([Deal Type]) marked inactive after 2 unanswered follow-ups."

## Run report

1. Replies, with context
2. Alerts: suspicious content (RULES section 14), opt-outs, bounced addresses, and drafts to delete
3. Follow-up drafts created, with full text
4. DM follow-ups handed over
5. **Unsent drafts still waiting on you**: name, outlet, days waiting. This list is the nudge.
6. Targets marked inactive

If nothing is due: say "No follow-ups due today" and show `summary`.

## Post-run

Run `validate`.

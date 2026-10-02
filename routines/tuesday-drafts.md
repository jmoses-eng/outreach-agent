# Tuesday: Drafting for PR, Corporate Gifting and Wholesale

Read `engine/RULES.md` and `config/CONTEXT.md` first. `<AGENT_DIR>` is the folder containing `engine/`.

This routine drafts for three deal types. It does NOT draft Exclusive Partnership outreach. That is Thursday's job, because those drafts depend on Thursday's field research.

## Pre-flight

`node "<AGENT_DIR>/engine/db.mjs" validate`. If it reports NOT READY, stop.

## Step 1: Pull targets ready to draft

`targets --status researched --confidence HIGH,MEDIUM --full`, keeping `deal_type` in PR, Corporate Gifting, Wholesale.

Drop any target that already has an outreach record (`outreach --target_id <id>`).

**Contact filter (RULES section 2):** drop any target without a verified `contact_email` or `contact_handle`. Do not draft them. Report them at the top of the run report:

```
SKIPPED, NO VERIFIED CONTACT: [Name] / [Outlet] / [Deal Type]
  Action needed: track down a verified contact to re-enter the pipeline
```

## Step 2: Draft, branched by deal type

HIGH confidence first, then MEDIUM. Every draft follows RULES section 9 and the Voice Rules in CONTEXT. The structure for each deal type:

**PR (press pitch)**
- Line 1: a specific reference to their recent work. One sentence. Shows you read it.
- Lines 2 to 3: one sentence on the business, one on why it fits their audience specifically.
- Line 4: one clear ask (samples, a quick call, feature consideration; pick one).
- Measure it against the gold-standard PR pitch in CONTEXT.

**Corporate Gifting**
- Open with a specific reference to their organization (an event, an award, an expansion, their client roster, their neighborhood).
- One ask: a conversation about gifting orders or a preferred vendor relationship. Not a pitch deck.
- Make repeat business implicit through their own occasions. Follow the Corporate Gifting voice rules in CONTEXT, including where custom or personalized options may be mentioned.
- Use social proof only per the matching rules in CONTEXT: one relevant name, never the whole list.
- Do not attach or link the gifting program PDF or state prices in a first message.

**Wholesale**
- Open with a specific reference to the store (a category they carry, a brand on their shelf, their neighborhood, a recent feature).
- The ask follows the geography rule in CONTEXT (for example, an in-person visit for local stores and a sample send for stores further out).
- Do not send the wholesale sheet in a first message unless CONTEXT says otherwise.

Check each draft before saving:

- [ ] Opens with something specific to them
- [ ] Within the word limit for this deal type and channel
- [ ] One ask only
- [ ] Zero forbidden phrases or openers
- [ ] Punctuation rules from CONTEXT followed
- [ ] No pricing, PDF or program details in a first touch
- [ ] Reads like one person wrote it for one person

Save each draft: write `{ "target_id": <id>, "subject": "...", "draft_text": "...", "send_type": "pitch", "status": "drafted" }` to `<AGENT_DIR>/data/tmp/draft-<id>.json`, run `add-outreach --file`, then `update-target <id> --set status=drafted --set date_drafted=<today>`.

## Step 3: Create the drafts (unattended, nothing sends)

**Email targets**

1. Create a Gmail draft with the Gmail connector's draft-creation tool, in the sender account named in CONTEXT. To = `contact_email`, Subject = the subject line, Body = the full draft text.
2. `update-target <id> --set status=approved --set date_approved=<today> --set follow_up_due=<date>` where the date comes from `bizdays <n>` using the first follow-up interval for that deal type in CONTEXT.
3. `update-outreach <outreach id> --set status=approved`.

`approved` means a Gmail draft exists. It does not mean the email was sent. Never call a send tool.

**DM and LinkedIn targets**

Follow RULES section 7: leave the target at `drafted`, set no `follow_up_due`, and hand the copy to the founder in one message.

## Step 4: Run report

One block per target:

```
TARGET: [Name] / [Outlet]
DEAL TYPE: [PR / Corporate Gifting / Wholesale]
LANE: [number and name]
CONFIDENCE: [HIGH / MEDIUM]
ANGLE: [angle]
CONTACT METHOD: [email / DM]
STATUS: [Gmail draft created, waiting on your send / DM copy handed over, waiting on your post]
---
DRAFT:
[full draft text]
```

Close with counts: Gmail drafts created, DM drafts handed over, targets skipped and why.

## Post-run

Run `validate`.

# Thursday: Exclusive Partnership Field Research & Drafting

Read `engine/RULES.md` and `config/CONTEXT.md` first, the Exclusive Partnership section of CONTEXT in particular. It defines the categories, seed targets, field-research requirements and drafting rules used below. `<AGENT_DIR>` is the folder containing `engine/`.

This is the one day given entirely to Exclusive Partnership: the business as the sole developer of a product for one institution, venue or brand. It needs heavier per-target research than the discover-then-draft batch used for the other deal types, which is why it has its own day. General wholesale and gifting discovery is not part of this routine.

## Pre-flight

`node "<AGENT_DIR>/engine/db.mjs" validate`

## Step 1: Field research on scouted targets

`targets --deal_type "Exclusive Partnership" --status scouted --full`

This covers the seed targets from CONTEXT and anything Monday surfaced. If a seed target named in CONTEXT is not in the database yet, add it at `scouted` first (`find` it before adding).

For each target, do the research its category requires in CONTEXT. Every category needs:

- What you found about the institution's history and character
- A verified contact (RULES section 2). Where CONTEXT says a category needs a named person, a generic contact form or info@ address does not count. Keep researching.
- The category-specific finding CONTEXT asks for, such as whether a competing program or vendor already exists (record it in `existing_program_found`) or who holds the vendor or merchandise rights

Outcomes:

- **Disqualified** (a competing program exists, or no verified contact after real effort): `status = disqualified`, with the reason in `notes` and the finding in `existing_program_found`.
- **Warm:** `status = researched`, `date_researched`, `field_research_notes`, `confidence_score`, and `existing_program_found` = "None found, confirmed via [method]" where that check applies.

Long research notes go through `update-target <id> --file`.

Depth beats breadth here. Three targets researched properly is a better Thursday than ten skimmed.

## Step 2: Concept development

For targets at `researched`: develop a one-line concept rooted in the field research. What would the business build for this institution, and why is it specific to their history or character rather than a generic angle?

`update-target <id> --file` with `status: "concept-developed"`, `date_concept_developed`, `concept_summary`.

## Step 3: Draft

For targets at `concept-developed`, following the Exclusive Partnership drafting and voice rules in CONTEXT and RULES section 9:

- Open with the specific research finding. Not a generic compliment.
- One line signaling that the business builds from that kind of material, referencing the concept.
- Frame the concept as a rough starting idea, not a finished or committed product.
- One ask: a conversation about an exclusive partnership.
- No pricing, minimums or program PDFs in this first message.

Save with `add-outreach --file` (`send_type: "pitch"`, `status: "drafted"`), then `update-target <id> --set status=drafted --set date_drafted=<today>`.

## Step 4: Create the drafts (unattended, nothing sends)

**Email targets**

1. Create a Gmail draft in the sender account named in CONTEXT. Never call a send tool.
2. `update-target <id> --set status=approved --set date_approved=<today> --set follow_up_due=<date>` using the Exclusive Partnership follow-up interval in CONTEXT.
3. `update-outreach <outreach id> --set status=approved`.

**DM, LinkedIn and phone targets:** follow RULES section 7. For a phone target, hand over a short call script instead of a message.

## Step 5: Run report

```
TARGET: [Name] / [Institution]
DEAL TYPE: Exclusive Partnership
CATEGORY: [category from CONTEXT]
CONCEPT: [one-line concept]
CONTACT METHOD: [email / DM / phone]
STATUS: [Gmail draft created, waiting on your send / copy handed over, waiting on you]
---
DRAFT:
[full draft text]
```

Also list targets researched but not yet drafted, targets disqualified and why, and targets still at `scouted`. Close with counts.

## Post-run

Run `validate`.

# Outreach Agent

This folder is a weekly outreach agent for a small product business. It researches targets, drafts pitches and follow-ups into Gmail Drafts, and reports on the pipeline. It never sends anything.

## How it is laid out

- `engine/RULES.md`: the rules every run follows. Same for every business. Do not edit per business.
- `engine/db.mjs`: the database helper. All reads and writes to `data/` go through it.
- `routines/`: one file per weekday. Each is a full set of instructions for that day's run.
- `config/CONTEXT.md`: this business's brand, voice, lanes, offers and cadences. Created by setup. Not in version control.
- `data/`: the pipeline (targets, drafts, placements, backups). Not in version control.

## What to do when asked

- **`config/CONTEXT.md` does not exist, or its first line says SETUP IN PROGRESS:** the agent is not set up. Use the `outreach-setup` skill, which resumes where it stopped.
- **"run the Monday routine"** (or Tuesday, Wednesday, Thursday, Friday): read `engine/RULES.md`, then `config/CONTEXT.md`, then follow the matching file in `routines/` exactly.
- **"update my outreach setup"**, or a change to pricing, voice, lanes or relationships: use the `outreach-setup` skill to change that section of `config/CONTEXT.md`.
- **A correction to a draft that is really a rule:** add a dated line to "Founder corrections" in `config/CONTEXT.md`.
- **"remove the learned rule about X":** delete it from "Learned from your edits" in `config/CONTEXT.md`, and add a Founder correction saying not to relearn it.
- **Writing or updating `config/CONTEXT.md`:** `config/CONTEXT.example.md` shows a fully filled config for a fictional business. Use it for the level of detail to aim for. Never copy its facts.
- **Questions about the pipeline:** use `node engine/db.mjs summary`, `targets`, `target <id>` or `report`. Never edit the JSON files in `data/` by hand.

## Rules that always hold

- Never send email or post a message to a prospect. Gmail drafts only.
- Never contact anyone marked `do-not-contact`, and never lift that status without the founder saying so.
- Never guess an email address. See the Contact Verification Standard in `engine/RULES.md`.
- Never commit `config/CONTEXT.md` or anything in `data/`.

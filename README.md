# Outreach Agent

A weekly outreach system for a small product business, run by Claude. It finds and qualifies prospects, drafts pitches and follow-ups in your voice, and reports on the pipeline.

**It never sends anything.** Every email lands in your Gmail Drafts folder for you to read, edit and send.

## The week

| Day | What it does |
|---|---|
| Monday | Checks for replies, then researches and qualifies 5 to 10 new targets |
| Tuesday | Drafts pitches for press, corporate gifting and wholesale |
| Wednesday | Drafts follow-ups for anything due, and lists drafts you have not sent yet |
| Thursday | Deep research and drafting for exclusive partnerships |
| Friday | Weekly report by deal type |

It works four kinds of deal: **PR**, **Corporate Gifting**, **Wholesale** and **Exclusive Partnership**.

## What you need

- The Claude desktop app, on Windows or Mac
- [Node.js](https://nodejs.org) (the LTS version)
- Gmail connected to Claude (required)
- Slack connected to Claude (optional, for receiving DM drafts)

## Setup

1. Download this repository (green **Code** button > **Download ZIP**, then unzip), or clone it. Put the folder somewhere permanent, such as your Documents folder. The schedule points at this location, so do not move it afterwards.
2. In the Claude desktop app, open that folder as your working folder.
3. Type: **run setup**

Claude interviews you about your business one question at a time, writes your configuration, creates an empty pipeline, and schedules the five weekday runs. Plan on 30 to 45 minutes. Have these to hand:

- Your pricing and terms for gifting and wholesale
- One or two real pitch emails you have sent that sound like you
- A list of current customers, stockists and partners, so they are never cold-pitched

## Your daily job

1. Read the run report.
2. Open Gmail Drafts. Edit and send what you like. Delete what you do not.
3. If a draft is wrong in a way that will keep happening, tell Claude. It records the correction so later drafts follow it.

Scheduled runs happen while the Claude app is open. If it is closed at the scheduled time, the run starts the next time you open it.

## Changing things

- "update my outreach setup" to change pricing, voice, lanes or anything else about the business
- "run the Monday routine" (or any day) to run one by hand
- "show me the pipeline" for current counts

## Where your information lives

| | Location | Shared? |
|---|---|---|
| Your business configuration | `config/CONTEXT.md` | No. Stays on your machine. |
| Your prospects, drafts and wins | `data/` | No. Stays on your machine. |
| The engine and routines | `engine/`, `routines/` | Yes. This is what the repository contains. |

The database is backed up automatically before every change, in `data/backups/`.

## Getting updates

If you cloned the repository, `git pull` brings in improvements to the engine and routines. Your configuration and data are not touched, and the schedule does not need to be set up again.

## Safeguards built in

- **Drafts only.** No routine can send email or post a message.
- **Verified contacts only.** A contact must come from the target's own site, a verified profile or a press kit. Guessed addresses are never used.
- **No follow-up without a first send.** Before drafting a follow-up, the agent checks your Gmail sent mail to confirm the original actually went out.
- **No duplicates.** The database refuses to add the same contact twice, and flags when an outlet is already in the pipeline.

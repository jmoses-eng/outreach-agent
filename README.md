# Outreach Agent

A weekly outreach system for a small product business, run by Claude. It finds and qualifies prospects, drafts pitches and follow-ups in your voice, and reports on the pipeline.

**It never sends anything.** Every email lands in your Gmail Drafts folder for you to read, edit and send.

**New here? Start with the [wiki](https://github.com/jmoses-eng/outreach-agent/wiki):** installing, the setup interview, your first week, troubleshooting and FAQ.

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

Claude interviews you about your business one question at a time, writes your configuration, creates an empty pipeline, and schedules the five weekday runs. Plan on 30 to 45 minutes. It saves after every section, so you can stop and type **run setup** again later to pick up where you left off. Have these to hand:

- Your pricing and terms for gifting and wholesale
- One or two real pitch emails you have sent that sound like you
- A list of current customers, stockists and partners, so they are never cold-pitched
- Anyone who has asked you not to contact them

## Your first week

Scheduled runs happen with nobody watching. The first time a run needs a tool you have not approved (web search, Gmail, the database), the app asks for permission and waits, and that morning's run produces nothing.

So for the first week, **be at your computer when each day's run starts.** Open it, and when the app asks for permission, choose the option that allows it always. Once each of the five routines has finished once without asking, you can leave them alone. If a morning's report is missing later on, a waiting permission prompt is the first thing to check.

Expect the first week's drafts to be rougher than later ones. Tell Claude what you would change; it records each correction and follows it from then on.

## Your daily job

1. Read the run report.
2. Open Gmail Drafts. Edit and send what you like. Delete what you do not.
3. If a draft is wrong in a way that will keep happening, tell Claude. It records the correction so later drafts follow it.

## It learns from your edits

Edit drafts as much as you like before sending. Every Friday the agent compares each email you sent with the draft it wrote, and notices what you deleted without sending.

- When the same change shows up in 3 or more sent emails (say, you keep shortening the subject line), it becomes a rule in your config under "Learned from your edits", and the Friday report tells you.
- If your edits suggest a fact in your config is wrong, such as a price, it asks you rather than changing it.
- Say "remove the learned rule about subject lines" to undo one.
- The Friday report tracks how many emails you sent exactly as drafted. That share should rise as it learns.

Scheduled runs happen while the Claude app is open. If it is closed at the scheduled time, the run starts the next time you open it.

## Changing things

- "update my outreach setup" to change pricing, voice, lanes or anything else about the business
- "run the Monday routine" (or any day) to run one by hand
- "show me the pipeline" for current counts

## Where your information lives

| | Location | Shared? |
|---|---|---|
| Your business configuration | `config/CONTEXT.md` | No. Stays on your machine. |
| A filled example, for a fictional business | `config/CONTEXT.example.md` | Yes. Open it to see the level of detail that works. |
| Your prospects, drafts and wins | `data/` | No. Stays on your machine. |
| The engine and routines | `engine/`, `routines/` | Yes. This is what the repository contains. |

The database is backed up automatically before every change, in `data/backups/`. Those backups are on the same machine, so copy the `config` and `data` folders somewhere else now and then.

## Your responsibility

This tool drafts one-to-one emails for you to send. You are the sender, and the laws on commercial email where you and your recipients live apply to you. Read every draft before you send it.

## Security

Found a security problem? Please report it privately. See [SECURITY.md](SECURITY.md).

## License

MIT. See [LICENSE](LICENSE).

## Getting updates

If you cloned the repository, `git pull` brings in improvements to the engine and routines. Your configuration and data are not touched, and the schedule does not need to be set up again.

## Safeguards built in

- **Drafts only.** No routine can send email or post a message.
- **Verified contacts only.** A contact must come from the target's own site, a verified profile or a press kit. Guessed addresses are never used.
- **No follow-up without a first send.** Before drafting a follow-up, the agent checks your Gmail sent mail to confirm the original actually went out.
- **Opt-outs are permanent.** If someone asks not to be contacted, they are marked do-not-contact. The database refuses to add them again or draft for them, and only you can lift it.
- **Bounces are never retried.** A bounced address is flagged to you and dropped. The agent does not try variations of it.
- **Planted instructions are ignored.** Emails and web pages the agent reads are treated as information, never instructions. Anything that looks written to steer an AI is quoted at the top of the run report.
- **No duplicates.** The database refuses to add the same contact twice, and flags when an outlet is already in the pipeline.

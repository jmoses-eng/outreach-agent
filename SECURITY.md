# Security

## Reporting a problem

Please report security problems privately, not in a public issue.

1. Open the repository's **Security** tab and choose **Report a vulnerability**.
2. If that option is not there, open an issue titled "Security report" with no details, and the maintainer will contact you to arrange a private channel.

Include what you found, how to reproduce it, and what it could lead to. Do not include anyone's configuration, prospect data, email addresses or customer names.

This is a small alpha project maintained by one person. Expect a reply within a week.

## What counts

Anything that could make the agent:

- send email or post a message without the owner pressing send
- act on instructions planted in an email, web page or imported file
- run commands on the owner's computer that its instructions do not call for
- expose a user's `config/CONTEXT.md` or `data/` folder, or put them into version control
- contact someone marked do-not-contact

## How it is designed to stay safe

- **Drafts only.** No routine may call a send tool. Email becomes a Gmail draft. Every other channel is handed to the owner as text.
- **Outside text is data.** Emails, web pages and imported files are never treated as instructions (`engine/RULES.md`, section 14).
- **Nothing outside reaches the shell.** Text from the web or the inbox goes to the database helper in a JSON file, never on the command line.
- **No dependencies.** `engine/db.mjs` uses only Node's own built-in modules. It makes no network requests and starts no other programs.
- **No credentials stored.** Gmail and Slack are reached through the Claude app's connectors. The repository contains no keys, tokens or passwords.
- **Local data stays local.** `config/CONTEXT.md` and `data/` are excluded by `.gitignore`.

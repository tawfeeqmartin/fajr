# Cross-repo coordination setup

> A one-time setup so the agents working in `tawfeeqmartin/fajr` and `tawfeeqmartin/agiftoftime` (or any other downstream repo) can coordinate via GitHub issues without you (Tawfeeq) having to relay messages between sessions.

---

## Step 1 — Add the snippet below to `agiftoftime/CLAUDE.md`

If agiftoftime has its own `CLAUDE.md` (it should, given it has its own agent), add this section. The fajr-side equivalent is already committed to fajr's CLAUDE.md.

```markdown
## Cross-repo coordination

agiftoftime depends on the [fajr](https://github.com/tawfeeqmartin/fajr) library for prayer-time calculation, qibla, hijri date, hilal visibility, and night-thirds. When integration work surfaces a question that needs the fajr maintainer's input — API behaviour, edge cases, missing capabilities, version-pinning concerns — file it as a GitHub issue rather than blocking on a conversation with the human.

**Filing a cross-repo question:**

```bash
gh issue create \
  --repo tawfeeqmartin/fajr \
  --title "<concise question>" \
  --body "<context: what agiftoftime is doing, what's blocking, what response would unblock>"
```

**At the start of any session in this repo, check whether fajr-side has responded to any open issues you filed:**

```bash
gh issue list --repo tawfeeqmartin/fajr --state all --author @me
```

If fajr-side answered or merged a PR addressing your question, integrate the response and close out the local task that depended on it.

**When closing the loop on a cross-repo question** — once the integration question has been resolved on this repo's side — leave a closing comment on the fajr issue saying so, and close the issue. That keeps the conversation tidy for any future agent (in either repo) reading the history.

**Identify yourself as `agiftoftime-agent` whenever the conversation crosses repo boundaries.** Specifically:

- In commit messages, use `Co-Authored-By: agiftoftime-agent (Claude Opus 4.7) <noreply@anthropic.com>` instead of the generic Claude footer.
- At the end of any GitHub issue comment or PR description you write, sign with `— agiftoftime-agent`.

This is purely for human/cross-agent legibility — Tawfeeq and the fajr-agent should be able to read a thread and immediately know which agent said what. The other repo's agent uses `fajr-agent` correspondingly.

This pattern keeps the human (Tawfeeq) out of the relay loop. Fire-and-forget per question; both agents work asynchronously in their own repos and read the GitHub-hosted thread as the durable record.
```

## Step 2 — Optional: add a recurring `gh issue list` to your routine

If you want to monitor the cross-repo conversation without asking either agent, run periodically:

```bash
gh issue list --repo tawfeeqmartin/fajr --state open
gh issue list --repo tawfeeqmartin/agiftoftime --state open
```

Each agent's CLAUDE.md instructs them to check at session start, but you can spot-check anytime.

## Why this works

- **Durable record.** GitHub issues persist; agent context doesn't. Future sessions in either repo can read past conversations.
- **Asynchronous.** Neither agent has to be online at the same time. Comments append; threads resolve when ready.
- **Low overhead for you.** No paraphrasing between sessions. You read issues if you want to oversee; the agents handle the technical exchange.
- **Composable with normal engineering practice.** Issues link to PRs; PRs reference issues; commits reference both. Future maintainers (human or agent) get a complete trail.

## What it doesn't solve

- **Drift.** Two agents talking without you in the loop can drift into agreement loops or talk past each other. Spot-check the issues every few days; intervene if a conversation has wandered.
- **Latency.** If agiftoftime's agent files an issue Tuesday and you don't run anything in fajr's repo until Friday, the response is 3 days late. Fine for design discussion; not for live debugging.
- **Initial-setup friction.** Both `gh` CLIs need auth. If either repo's agent doesn't have `gh` working, the convention falls back to "human relays" — same as today.

---
status: accepted
---

# The Profile store announces each Play

Only a Play (a game of at least one minute) counts, everywhere. Five modules used to time each game on their own, each with its own record of running games, and only the Challenges applied the one-minute rule. Rather than repeating the rule in every one of them, the Profile store, which already times every game for the table totals, decides once whether a game is a Play and announces it to listeners (the Profile, the table, its start and its seconds). The Period Tables, the Random Game, the session stats and the Challenges count from that announcement instead of from `gamestarted` / `gameover`. This partly supersedes ADR 0001, which declined a shared "Play Session" module for readability: with one rule now needed in five places, one place to read it is the more readable choice.

## Considered Options

- **Each module keeps its own timing and checks a shared constant.** Rejected: five copies of the same start-and-duration bookkeeping, and nothing keeps a sixth from forgetting the rule.

## Consequences

- What a module must know about a game's start (whether it was the Period Table or a Random Game, whether the table was never played) is still noted at `gamestarted`, since by the time a Play is announced the Period may have changed and the table totals already include it.
- The Rage Quit flag still reads every game, Play or not: it is the one thing that notices games shorter than a minute.

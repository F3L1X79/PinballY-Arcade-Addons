---
status: accepted
---

# The Play Log lives in one file per year, next to profile.json

Each Profile's Play Log is kept in its own folder as `play-log-<year>.json`, one file per calendar year of the Plays' start, not inside `profile.json`. A Play weighs about 80 bytes, so a household playing five games a day adds some 150 KB a year, while `profile.json` is rewritten whole on every change of the Profile's data (Streaks, Challenges, Notified Achievements, not only Plays). One file per year keeps `profile.json` small, rewrites only the current year after a Play, and matches what the Play Log is for: summaries of a year, which read a single file.

## Considered Options

- **A `playLog` array in `profile.json`.** Rejected: the file would grow without end and be rewritten whole for unrelated changes.
- **A single `play-log.json`.** Rejected: the same endless growth, only moved; every Play rewrites every past year.
- **Summarising past years (per table and per month).** Rejected: at this size nothing needs to be lost, and later summaries may want details we cannot foresee.

## Consequences

- Every year file is guarded like `profile.json`: written through a temporary file with a `.bak` backup, recovered or set aside under a dated name when broken.
- A Profile Reset renames each year file to `play-log-<year>.reset-<date>.json`, so a mistaken reset can be undone by hand.
- The file names and the keys of a Play (`start`, `configId`, `seconds`) are persisted data, pinned in `tests/persisted_data_pinning.test.js`.

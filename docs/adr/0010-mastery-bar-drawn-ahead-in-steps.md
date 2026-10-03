---
status: accepted
---

# The Mastery Bar is drawn ahead, in steps of 5 %

The Mastery Bar shows the selected table's Table Mastery, so it changes with every table the wheel passes. A draw blocks PinballY while it runs (see ADR 0005), and drawing on each "gameselect" would make the wheel stutter. We decided to draw every state ahead with `drawing_ahead.js` and only show or hide layers when the selection changes: the panel once per Mastery Level, since it is headed by the level's name (and once more for a table never played), one square per Mastery Level (ten, each in its own brilliance), and the bar in twenty fill steps of 5 % for each of the four metals its fill takes, the empty bar of a table never played included. A move on the wheel therefore draws nothing.

## Considered Options

- **Draw the bar once the wheel stops** (about 400 ms without a press). Rejected: the fill would be exact, but the bar would lag behind the wheel, hidden or out of date while it spins.
- **Draw on each "gameselect".** Rejected: the stutter this whole decision avoids.

## Consequences

- The fill moves in steps of 5 %: a short Play may leave the bar where it was. The square and the Mastery Toast stay exact.
- About a hundred and ten layers stay alive for the whole session; nothing depends on the active Profile, so a Profile switch redraws nothing. Measured on the cabinet: about 1.3 s of drawing ahead in all, a square about 100 ms (its number), a bar a few ms.
- Before the drawing ahead ends, a selection whose layers are missing draws them on the spot, at the old cost.
- Each layer is placed (scale and position) before it is drawn: drawn first, the prototype's layers never showed.

Prototype and measurements: branch `prototype/mastery-bar` (verdict in its last commit).

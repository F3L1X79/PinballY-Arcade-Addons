# PinballY Expansion Pack

An unofficial extension of [PinballY](http://mjrnet.org/pinscape/PinballY.php), written with the JavaScript scripting API that PinballY opens to every developer. · *[Version française](README.fr.md)*

> [!WARNING]
> **Work in progress.** The project is still under construction: features, settings and saved data may change from one version to the next.

> **Give everyone in the house a real reason to come back to your pincab.** A Profile with an Avatar for each of you, a Table of the Day, weekly Challenges, Achievements from Bronze to Platinum, and PinballY itself in French, German, Spanish, Italian or Portuguese: everything PinballY was missing, without touching PinballY. And this is only the beginning…

<img src="docs/images/hero.png" alt="The wheel screen with the clock, the active Profile's badge and the week's Challenge Card" width="360">

### A Profile for everyone

<img src="docs/images/profiles.png" alt="The Change Player carousel and its Avatars" width="480">

With Change Player, everyone picks their own Profile and Avatar, with their own Achievements and Profile Stats.

### Table of the Day, Table of the Week

<img src="docs/images/period_tables.png" alt="The startup dialog with the Table of the Day and the Table of the Week" width="480">

Every day a table never played or long forgotten, every week a random one, offered right at startup.

### Weekly Challenges

<img src="docs/images/challenges.png" alt="The week's Challenge Card under the Profile badge" width="376">

A new Challenge every Monday, its card tracking your progress on the wheel screen.

### Achievements

<img src="docs/images/achievements.png" alt="The Achievement List" width="380">

Dozens of Achievements from Bronze to Platinum, announced without interrupting your games and gathered in the Achievement List.

### PinballY in 6 languages

<img src="docs/images/translation.png" alt="PinballY's Exit menu in French" width="480">

PinballY's own menus and messages in French, German, Spanish, Italian or Portuguese.

**And also**: a Random Game spun on a wheel of fortune, "Hall of Fame" and "Original Tables" filters, a clock, a status line, a reminder to rate a table, launches without a black flash, the backglass hidden during a game, launch and Achievement sounds.

## Install

Requires **Windows** and **PinballY 1.1.0 Beta 10** or later (plus the *Windows Media Player* optional feature for the launch and Achievement sounds only).

1. **Back up** `PinballY\Scripts`, especially `main.js`: this project replaces it.
2. **Copy the project** into `PinballY\Scripts`, keeping your own `System` folder.
3. **Copy `.env.example` to `.env.local`** and set what you need, one `KEY=value` per line (UTF-8). Missing settings keep their default; `.env.local` is ignored by git.
4. **Restart PinballY** and check `PinballY.log`: it lists your overrides, one "initialized" line per add-on, and `ERROR` lines naming the add-on at fault.

## Settings

```
LANGUAGE=en
ACHIEVEMENT_TOAST_SECONDS=4
```

`LANGUAGE` sets the language (`en`, `fr`, `de`, `es`, `it` or `pt`) and `ACHIEVEMENT_TOAST_SECONDS` how many seconds an Achievement stays on screen. Every feature can be turned off with its `ADD_ON_*` key, for example `ADD_ON_CLOCK=false`. Every setting is described in [.env.example](.env.example).

Each Profile's progress is saved in the `profiles` folder, which project updates never overwrite: keep it to get your progress back after reinstalling.

## Contributing

Module layout, conventions, tests, adding a language and resetting progress: see the [contributor guide](CONTRIBUTING.md).

## License

MIT. See [LICENSE](LICENSE).

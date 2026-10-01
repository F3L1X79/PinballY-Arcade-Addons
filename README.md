# PinballY Expansion Pack

An unofficial extension of [PinballY](http://mjrnet.org/pinscape/PinballY.php), written with the JavaScript scripting API that PinballY opens to every developer. · *[Version française](README.fr.md)*

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

**And also**: a Random Game spun on a wheel of fortune, "Most Played Tables" and "Original Tables" filters, a clock, a status line, a reminder to rate a table, launches without a black flash, the backglass hidden during a game, launch and Achievement sounds.

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

### Admin Profile

To keep the setup entries for yourself, add `"isAdmin": true` at the top level of your Profile's `profiles\<name>\profile.json`, PinballY closed. Once at least one Profile is marked, the other Profiles (Guest included) no longer see "Table Setup" in the main menu nor "Operator Menu" in the Exit menu; the Admin Profiles still see both, and the coin door service button still opens the Operator Menu for anyone. Several Profiles can be marked. Guest is never an Admin Profile, and a mark that is not `true` or `false`, or whose key is misspelt (`"isAdmin "`, `"IsAdmin"`), is ignored and logged in `PinballY.log`.

An Admin Profile also finds **Reset profile** in the Exit menu (Escape), right after "Operator Menu". It lists every Profile, Guest and yourself included; after one confirmation (the cursor starts on "No"), the chosen Profile starts over as if it had never played: its plays, Streaks, session records, Random Games, Challenge progress and announced Achievements are erased, while its name, Avatar and marks stay. Its former file is kept next to it as `profile.reset-<date>.json`: to undo a reset, close PinballY and rename that copy back to `profile.json`. Reset profile needs PinballY's Exit menu: if you disabled it in PinballY's options, the entry cannot show.

### Child Profile

To keep the Adult Tables away from a child, tag them in PinballY with the category `NSFW` (or name your own category with `ADULT_CATEGORY` in `.env.local`, spelt exactly as in PinballY), then add `"isChild": true` at the top level of the child's `profiles\<name>\profile.json`, PinballY closed. While that Profile is active, those tables are on the wheel under no filter, the Random Game never draws one, and starting up never leaves the wheel on one; switching to another Profile brings them back at once. The Table of the Day and the Table of the Week stay the same for the whole household: while one is an Adult Table, the child gets neither its main menu entry nor its startup choice, and that day or week neither extends nor breaks the child's Streak. Guest is never a Child Profile, so adult visitors see the whole collection. This is no parental control: nothing asks for a password.

### Menu Cleanup

Menu Cleanup lightens PinballY's menus for every Profile, Admin Profiles included: it removes Help and About from the Exit menu, and Information, Flyer, High Scores and Instruction Card from the main menu (Rate Table and Add to Favorites stay). It is the only feature **off by default**: turn it on with `ADD_ON_MENU_CLEANUP=true`. PinballY's dedicated buttons for these screens, if you mapped them, still work.

## Contributing

Module layout, conventions, tests, adding a language and resetting progress: see the [contributor guide](CONTRIBUTING.md).

## License

MIT. See [LICENSE](LICENSE).

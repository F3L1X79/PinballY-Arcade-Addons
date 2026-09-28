# PinballY Arcade Add-ons

*[Version française](README.fr.md)*

A curated list of JavaScript add-ons for [PinballY](http://mjrnet.org/pinscape/PinballY.php) that make a virtual pinball cabinet feel more like an arcade machine. Plain JavaScript run by PinballY itself: no build step, no dependencies.

## Features

- **Startup dialog**: stay on the last played table, or launch the table of the day, the table of the week or a random table.
- **Table of the day** (never played, or else played longest ago) and **table of the week** (random, Monday to Sunday).
- **Random table**: a "wheel of fortune" animation, never the last played table.
- **Main menu entries** after "Play": Change Player (a carousel of Avatars driven by the flipper buttons, also in the Exit menu and second in the startup dialog; the active Profile's Avatar and name stay at the top right of the wheel screen; picking a Profile greets the player, and so does starting PinballY when the startup dialog is off), Achievement List, Table Setup, Random Game, Table of the Day, Table of the Week.
- **"Original Tables" filter** in "Filter by Manufacturer": every table except the community-made ones.
- **"Hall of Fame" filter** in the main menu: your ten most played tables, ranked by play time.
- **Clock** at the top left of the wheel screen, in your language's format (hidden during a game).
- **Achievements**, each announced once by a small card in the bottom-right corner of the playfield screen that disappears on its own (never during a game; several stack, with an optional sound), and browsable by family in the "Achievement List":
  - collection: first table, then 10 to 100 % of your collection played;
  - play time: 1 to 100 hours;
  - tables of the day and week: first play, total days or weeks played, streaks;
  - sessions: 30 or 60 minute marathon, rage quit (a session of 30 seconds to under a minute), grand comeback after 31 days;
  - random game: 10, 50 and 100 random tables played;
  - manufacturers: 3, 5 or 8 different manufacturers played the same day, completion of a manufacturer;
  - completion of a decade or a category.
- **Interface**: PinballY translated into French, German, Spanish, Italian or Portuguese; a status line about the selected table; a reminder to rate a table after 60 minutes of play.
- **Launch**: no black flash between the wheel and the table, an optional launch sound, the backglass hidden while a table runs.

## Install

Requires **Windows** and **PinballY 1.1.0 Beta 10** or later (plus the *Windows Media Player* optional feature for the launch and Achievement sounds only).

1. **Back up** `PinballY\Scripts`, especially `main.js`: this project replaces it.
2. **Copy the project** into `PinballY\Scripts`, keeping your own `System` folder.
3. **Copy `.env.example` to `.env.local`** and set what you need, one `KEY=value` per line (UTF-8). Missing settings keep their default; `.env.local` is ignored by git.
4. **Restart PinballY** and check `PinballY.log`: it lists your overrides, one "initialized" line per add-on, and `ERROR` lines naming the add-on at fault.

| Setting | Default | Meaning |
|---|---|---|
| `LANGUAGE` | `en` | `en`, `fr`, `de`, `es`, `it` or `pt`. |
| `LAUNCH_SOUND_FILE` | empty | Full path to the launch sound, e.g. `C:\PinballY\Media\Sounds\launch.mp3`. |
| `ACHIEVEMENT_SOUND_FILE` | empty | Full path to a sound played with each Achievement card. |
| `PROFILE_GREETING_SOUND_FILE` | empty | Full path to a sound played when a player is greeted. |
| `COMMUNITY_TABLES_MANUFACTURER` | `VPX Community` | Manufacturer name of your community-made tables. |
| `SKIP_RANDOM_GAME_ANIMATION` | `false` | `true` skips the wheel animation. |
| `ASK_TO_RATE_AFTER_MINUTES_PLAYED` | `60` | Play time before the rating reminder. |
| `ACHIEVEMENT_TOAST_SECONDS` | `4` | Seconds an Achievement card stays fully visible (above 0, at most 60). |
| `ACHIEVEMENT_TOAST_SCALE` | `1.0` | Size of an Achievement card: `1` = the original size, `2` = twice as large (from 0.5 to 3, with a dot: `1.6`). |
| `ADD_ON_<NAME>` | `true` | `false` turns an add-on off, e.g. `ADD_ON_FORCE_BACKGLASS=false`. |

## Your progress

Each Profile's progress is saved in the `profiles` folder next to `main.js`, which project updates never overwrite.

## Contributing

Module layout, conventions, tests, adding a language and resetting progress: see the [contributor guide](CONTRIBUTING.md).

## License

MIT. See [LICENSE](LICENSE).

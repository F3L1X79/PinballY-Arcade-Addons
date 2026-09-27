# PinballY add-ons

Custom add-ons for the PinballY virtual pinball front end: they help the player choose what to play, reward play with achievements, and polish the interface.

## Language

### Add-ons

**Add-on**:
A self-contained feature that `main.js` starts at launch and that the player can turn off in the configuration.
_Avoid_: plugin, script (a script is just a `.js` file)

### Profiles

**Profile**:
The identity a player picks so that their plays and Achievements count for them; no password, anyone can pick any Profile from the main menu. The active Profile stays active across restarts until another one is picked, unless the Profile picker is turned off: Guest is then active at startup. Plays count only for the active Profile, even when several people share one game.
_Avoid_: account, user, login

**Guest**:
The Profile that always exists and cannot be removed; it is the active Profile until another one is picked, and whenever the Profile picker is turned off.
_Avoid_: default user, anonymous

**Avatar**:
The picture that stands for a Profile.
_Avoid_: profile picture, photo

**Profile Greeting**:
The short greeting, with the Avatar and the Profile's name, shown when a Profile is picked and when PinballY starts, so the player knows whose plays will count. At startup it gives way to the startup prompt, which greets the Profile by name itself.
_Avoid_: welcome toast, login message

**Profile Stats**:
The screen, opened by the player from the main menu, that sums up the active Profile's own plays: games played, total time, favourite manufacturer and decade, most played and never played tables, collection completion, Achievements Unlocked, and Streaks. Shown as "Statistiques" in French.
_Avoid_: Pinball Profile, player card, profile screen (a Profile is the identity, not the screen)

### Choosing what to play

**Period**:
A calendar span, either a day or a week (Monday to Sunday), during which a Period Table stays the same.
_Avoid_: timeframe, cycle

**Period Table**:
A table picked once per Period and kept for the whole Period, offered to the player as a suggestion. The same for every Profile. Never the previous Period's table, unless it is the only one.
_Avoid_: daily pick, featured table, table of period

**Table of the Day**:
The Period Table whose Period is a day; prefers tables never played, otherwise the one played longest ago.

**Table of the Week**:
The Period Table whose Period is a week; picked purely at random.

**Last Played Table**:
The table the active Profile played most recently, across the whole collection, however it was launched.

**Random Game**:
A table drawn at random from the current wheel selection and launched right away; never the Last Played Table, unless it is the only one in the selection.
_Avoid_: random table, lucky pick

**Hall of Fame**:
The ten visible tables the active Profile has spent the most time on, ranked from the most played, offered as a wheel selection from the main menu.
_Avoid_: top played, most played, leaderboard

**Streak**:
The number of consecutive Periods in which the active Profile actually played the Period Table during its Period, however it was launched.
_Avoid_: combo, chain

**Periods Played**:
The total number of Periods, consecutive or not, in which the active Profile actually played the Period Table during its Period, however it was launched. Never lower than the longest Streak.
_Avoid_: exploration count, total streak

**Day's Manufacturers**:
The distinct non-empty manufacturers of the tables that started playing during one calendar day, however they were launched, hidden tables included.

### Challenges

**Challenge**:
An easy play goal set for one week, the same for every Profile except Guest, who has none, such as playing five different Stern tables; each Profile's own progress counts only games of at least one minute on visible tables, started during the week, and the Challenge is completed or missed when the week ends. Shown as "Défi" in French.
_Avoid_: quest, goal, mission, Achievement (an Achievement is a permanent milestone)

**Challenge Card**:
The small card under the Profile badge, at the top right of the wheel screen, that keeps the week's Challenge and the active Profile's progress always in view; when there is something new, such as progress or the previous week's verdict, its content changes in place. Never shown for Guest.
_Avoid_: challenge widget, challenge popup, status line

**Challenge Tables**:
The visible tables that would move the active Profile's Challenge forward if played now, offered as a wheel selection from the main menu; only some Challenges have them, for example not one about total play time. The main menu entry is shown only while there is at least one, so it can disappear for a while during an open Challenge (the Table of the Day once today has counted). When none is left while they are on the wheel, every table comes back.
_Avoid_: challenge filter, eligible tables

**Challenge Toast**:
A toast like the Achievement Toast, but with its own colour and no trophy, that announces that the active Profile completed the week's Challenge.
_Avoid_: challenge popup, challenge achievement

### Achievements

**Achievement**:
A milestone the player reaches through play, announced once with an Achievement Toast.
_Avoid_: trophy, badge, success

**Achievement Toast**:
A small card in the bottom-right corner of the playfield screen that announces one Achievement: it rises from the bottom edge, stays a few seconds, then fades away on its own. It never waits for the player nor takes their input, and shows over everything, menus included. Several toasts stack, the newest at the bottom pushing the older ones up.
_Avoid_: popup, notification, dialog (a dialog waits for the player)

**Unlocked**:
An Achievement whose condition holds right now. It can be lost again, for example when a table joins a completed group; losing it does not announce it a second time when it comes back. A Streak Achievement is the exception: the longest Streak unlocks it, so a broken Streak never takes it back.
_Avoid_: earned, obtained

**Achievement List**:
The screen, opened by the player, that shows every Achievement in one scrolling list of two sections: the Unlocked ones, the most recently Notified at the top, then the missing ones, the highest Unlock Rate first. Each Achievement shows its Achievement Rank. Shown as "Succès personnels" in French.
_Avoid_: My Achievements, trophy room

**Achievement Family**:
A kind of Achievement, absent as a whole when the Add-on it depends on is turned off: Collection, Play Time, Period Tables, Sessions, Random Game, Manufacturers, Decades, Categories, Challenges. Period Tables gathers every Achievement about playing the Table of the Day or the Table of the Week (first play, total Periods played, Streaks).
_Avoid_: group (a group is the set of tables a completion Achievement covers, such as one manufacturer's tables), category (a PinballY table category)

**Notified**:
An Achievement whose Achievement Toast has started showing. Toasts still waiting while a game runs are not Notified yet.
_Avoid_: acknowledged, seen, unlocked (an Achievement can be unlocked but not yet Notified)

**Achievement Rank**:
How hard an Achievement is: Bronze, Silver, Gold or Platinum. Every Achievement has one, whether Unlocked or missing.
_Avoid_: tier, level, difficulty, grade

**Unlock Rate**:
How many of the household's Profiles (Guest excepted) have been Notified of an Achievement, shown on the Achievement List by the Avatars of the Profiles other than the active one. It is not shown while there is only one Profile besides Guest.
_Avoid_: rarity (a rare Achievement has a low Unlock Rate), household rate, global percentage

**Achievement Progress**:
How far the active Profile is from a missing Achievement: the very value its unlock condition tests, against the target that unlocks it (for a Streak, the current Streak: a missing Streak Achievement starts over from 0 when the Streak breaks). Only Achievements with a counted target of at least 2 have one; an Unlocked Achievement shows none.
_Avoid_: progress (alone), completion (a completion Achievement covers a group of tables)

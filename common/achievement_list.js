// ============================================================
// Achievement List module: the screen the player opens (from the main menu
// or the Profile Stats) to browse every Achievement of the active Profile
// in one drawn scrolling list over a dimmed wheel (see docs/adr/0005): a
// header with the Profile, its total and its count per Achievement Rank,
// then the Unlocked Achievements (a toast still waiting first, then the
// most recently Notified) and the missing ones (the highest Unlock Rate
// first, then the furthest Achievement Progress), each part under its
// section header. Each row shows its rank emblem, when missing its
// Achievement Progress, and its Unlock Rate: the Avatars of the other
// Profiles Notified of it, once the household has two Profiles besides
// Guest.
// Next / Prev glide the highlighted line from one Achievement to the next,
// wrapping; the other lines are dimmed. Exit closes the list and calls the
// return given to open(); attract mode closes it too. While it is open,
// every button is swallowed through "commandbuttondown".
// Each item (a row or a section header) has its own layer, drawn once per
// opening when it first shows and afterwards only moved and faded; the
// header and footer sit on a mask layer above the rows. The Unlock Rates
// sit on a few layers of their own, one per on-screen slot, moved with the
// rows. Unlocked, the Achievement Progress and every Profile's Notified
// Achievements are read again on each opening.
// Opens directly, not through the wheel dialog module: the player asked
// for it.
// ============================================================

import lang from "./i18n.js";
import { safeHandler } from "./safe_handler.js";
import { displayNameOf } from "./profile_name.js";
import { RANKS_IN_ORDER } from "./achievements.js";
import {
    LIST_LOOK, computeGeometry, drawBackdrop, drawMask, drawSectionHeader, drawRow, drawOwners,
} from "./achievement_list_painter.js";

const SCRIPT_NAME = "AchievementList";

// Above PinballY's menus (custom layers 6000 and above), under the
// Achievement Toast and the Profile picker. Exported for the tests' reader.
export const ACHIEVEMENT_LIST_Z_INDEX = Object.freeze({ backdrop: 6000, items: 6001, owners: 6002, mask: 6003 });

const ITEM_KIND = Object.freeze({ SECTION: "section", ROW: "row" });
// The lines around the highlighted one, dimmed through their layer's alpha
// by their distance to it, one row or more away.
const DIMMED_ALPHA = 0.62;
// The glide slows down as it arrives (exponential ease-out).
const GLIDE_TIME_CONSTANT_MS = 40;
const GLIDE_SNAP_PX = 0.5;
const FRAME_MS = 16;
const TRANSPARENT = 0x00000000;
const ROW_PITCH = LIST_LOOK.rowHeight + LIST_LOOK.itemGap;
// Then a "+N" pill for the others.
const MAX_OWNER_AVATARS = 4;

export function createAchievementList(host, { getAchievements, profileStore }) {
    const { achievementList: TEXT } = lang;
    const backdropLayer = host.createDrawingLayer(ACHIEVEMENT_LIST_Z_INDEX.backdrop);
    const maskLayer = host.createDrawingLayer(ACHIEVEMENT_LIST_Z_INDEX.mask);
    // One per item, by index, kept from one opening to the next.
    const itemLayers = [];
    // The Unlock Rate layers, one per on-screen slot: item i uses slot i
    // modulo the slot count, so the items shown at once never share one.
    // A slot is drawn again only when its item changes: PinballY rereads an
    // image file on every draw, most of a row's cost.
    const ownerSlots = [];

    // The open list, null when closed: its items, their geometry, the
    // highlighted item's index, the scroll it glides to, the items drawn
    // since it opened and what Exit returns to.
    let shown = null;
    // Where the list and the highlighted line are while gliding, in pixels.
    const glide = { scroll: 0, highlightTop: 0, timer: null, lastMs: 0 };

    // The current Achievements with their live status.
    function readEntries() {
        return getAchievements().map(achievement => {
            if (!RANKS_IN_ORDER.includes(achievement.rank)) {
                throw new Error(`Achievement "${achievement.id}" has an unknown Achievement Rank "${achievement.rank}".`);
            }
            return { achievement, unlocked: achievement.checkUnlocked() };
        });
    }

    // A missing Achievement's Achievement Progress as its short text and
    // how far along it is (0 to 1), or null when it has none.
    function describeProgress(achievement, unlocked) {
        if (unlocked || typeof achievement.getProgress !== "function") return null;
        const progress = achievement.getProgress();
        if (!progress) return null;
        const unitTexts = TEXT.progressUnits[progress.unit];
        if (!unitTexts) {
            throw new Error(`Achievement "${achievement.id}" has an unknown progress unit "${progress.unit}".`);
        }
        return { text: unitTexts.short(progress.current, progress.target), ratio: progress.current / progress.target };
    }

    // The Profiles other than Guest, each with the Achievements it was
    // Notified of: Guest never counts in the Unlock Rate.
    function readHousehold() {
        return profileStore.listProfiles()
            .filter(profile => !profile.isGuest)
            .map(profile => ({ profile, notified: new Set(profileStore.getNotifiedOf(profile.name)) }));
    }

    // Each entry with its Achievement Progress, the Profiles other than
    // Guest Notified of it (its Unlock Rate) and its place in the definitions.
    function describeEntries(entries, household) {
        return entries.map((entry, order) => ({
            ...entry,
            order,
            progress: describeProgress(entry.achievement, entry.unlocked),
            owners: household.filter(({ notified }) => notified.has(entry.achievement.id)).map(({ profile }) => profile),
        }));
    }

    // Unlocked ones whose toast still waits first, in natural order, then
    // from the most recently Notified; the missing ones from the highest
    // Unlock Rate, then the furthest Achievement Progress, then in natural
    // order.
    function orderEntries(entries) {
        const notified = profileStore.getProfileData().notified;
        const notifiedAt = entry => notified.indexOf(entry.achievement.id);
        const unlocked = entries.filter(entry => entry.unlocked);
        const ratioOf = entry => (entry.progress ? entry.progress.ratio : 0);
        return {
            unlocked: [
                ...unlocked.filter(entry => notifiedAt(entry) === -1),
                ...unlocked.filter(entry => notifiedAt(entry) !== -1).sort((a, b) => notifiedAt(b) - notifiedAt(a)),
            ],
            // The natural order is compared too: not every engine sorts stably.
            missing: entries.filter(entry => !entry.unlocked)
                .sort((a, b) => b.owners.length - a.owners.length || ratioOf(b) - ratioOf(a) || a.order - b.order),
        };
    }

    // What a row shows of its Unlock Rate: the Avatars of the other Profiles
    // that have it, then how many more; null when no other Profile has it.
    function describeOwners(owners) {
        const activeName = profileStore.getActiveProfile().name;
        const others = owners.filter(profile => profile.name !== activeName);
        if (others.length === 0) return null;
        return {
            avatarPaths: others.slice(0, MAX_OWNER_AVATARS).map(profile => profile.avatarPath),
            moreText: others.length > MAX_OWNER_AVATARS ? TEXT.moreOwners(others.length - MAX_OWNER_AVATARS) : null,
        };
    }

    // The list's items, each with its top in pixels from the list's start.
    function buildItems(entries) {
        // Listing the Profiles checks each Avatar file, and every Profile
        // but the active one is read from its file: once per opening.
        const household = readHousehold();
        const { unlocked, missing } = orderEntries(describeEntries(entries, household));
        // Nothing to compare with while there is only one Profile besides Guest.
        const showsUnlockRate = household.length > 1;
        const items = [];
        let top = 0;
        const push = item => {
            items.push({ ...item, top });
            top += item.height + LIST_LOOK.itemGap;
        };
        for (const [title, sectionEntries] of [[TEXT.unlockedSection, unlocked], [TEXT.missingSection, missing]]) {
            push({
                kind: ITEM_KIND.SECTION,
                height: LIST_LOOK.sectionHeight,
                title: title.toLocaleUpperCase(),
                count: TEXT.sectionCount(sectionEntries.length),
            });
            for (const { achievement, unlocked: isUnlocked, progress, owners } of sectionEntries) {
                push({
                    kind: ITEM_KIND.ROW,
                    height: LIST_LOOK.rowHeight,
                    title: achievement.getTitle(),
                    description: achievement.getDescription(),
                    rank: achievement.rank,
                    unlocked: isUnlocked,
                    progress,
                    owners: showsUnlockRate ? describeOwners(owners) : null,
                });
            }
        }
        return { items, listHeight: top };
    }

    // The counts of the header's total line, also shown by the Profile Stats
    // so the two screens never disagree.
    function countAll(entries = readEntries()) {
        return { unlocked: entries.filter(entry => entry.unlocked).length, total: entries.length };
    }

    function describeHeader(entries) {
        const { unlocked, total } = countAll(entries);
        const percent = total === 0 ? 0 : Math.round(100 * unlocked / total);
        const profile = profileStore.getActiveProfile();
        return {
            title: TEXT.title.toLocaleUpperCase(),
            profileName: displayNameOf(profile),
            avatarPath: profile.avatarPath,
            totalLine: TEXT.totalLine(unlocked, total, percent),
            ratio: total === 0 ? 0 : unlocked / total,
            rankCounts: RANKS_IN_ORDER.map(rank => ({
                rank,
                count: String(entries.filter(entry => entry.unlocked && entry.achievement.rank === rank).length),
            })),
        };
    }

    function describeFooter() {
        const upper = text => text.toLocaleUpperCase();
        return {
            nextKey: upper(TEXT.keyCaps.next),
            prevKey: upper(TEXT.keyCaps.prev),
            exitKey: upper(TEXT.keyCaps.exit),
            browse: upper(TEXT.browse),
            back: upper(TEXT.back),
        };
    }

    function itemLayer(index) {
        while (itemLayers.length <= index) {
            const layer = host.createDrawingLayer(ACHIEVEMENT_LIST_Z_INDEX.items);
            layer.alpha = 0;
            itemLayers.push(layer);
        }
        return itemLayers[index];
    }

    function drawItem(index) {
        const { geometry: g } = shown;
        const item = shown.items[index];
        const layer = itemLayer(index);
        layer.clear(TRANSPARENT);
        layer.draw(dc => {
            if (item.kind === ITEM_KIND.SECTION) drawSectionHeader(host, dc, g.rowWidth, item);
            else drawRow(host, dc, g.rowWidth, item);
        }, g.rowWidth, item.height);
        layer.setScale({ ySpan: item.height / g.height });
        shown.drawn.add(index);
    }

    // The slot at this index, its layer created on first use.
    function ownerSlot(index) {
        while (ownerSlots.length <= index) {
            const layer = host.createDrawingLayer(ACHIEVEMENT_LIST_Z_INDEX.owners);
            layer.alpha = 0;
            ownerSlots.push({ layer, itemIndex: -1 });
        }
        return ownerSlots[index];
    }

    // The Unlock Rate of the row at this index, on its slot's layer.
    function ownersLayerOf(index) {
        const { geometry: g } = shown;
        const item = shown.items[index];
        const slot = ownerSlot(index % shown.slotCount);
        if (slot.itemIndex !== index) {
            slot.layer.clear(TRANSPARENT);
            slot.layer.draw(dc => drawOwners(host, dc, item.owners), LIST_LOOK.ownersWidth, item.height);
            slot.layer.setScale({ ySpan: item.height / g.height });
            slot.itemIndex = index;
        }
        return slot.layer;
    }

    // Shows the items overlapping the rows area at their place with their
    // Unlock Rate, each dimmed by its distance to the highlighted line, and
    // hides the others. An item sliding out hides under the header or the
    // footer.
    function placeItems() {
        const { geometry: g, items } = shown;
        const centerX = (g.rowX + g.rowWidth / 2) / g.width - 0.5;
        const ownersCenterX = (g.rowX + g.rowWidth - LIST_LOOK.ownersWidth / 2) / g.width - 0.5;
        const shownOwners = new Set();
        items.forEach((item, index) => {
            const top = g.areaTop + item.top - glide.scroll;
            const isInArea = top + item.height > g.areaTop && top < g.areaTop + g.areaHeight;
            if (!isInArea) {
                if (index < itemLayers.length) itemLayers[index].alpha = 0;
                return;
            }
            if (!shown.drawn.has(index)) drawItem(index);
            const layer = itemLayers[index];
            const centerY = 0.5 - (top + item.height / 2) / g.height;
            layer.setPos(centerX, centerY);
            // A section header is never highlighted: always dimmed, even
            // right above the highlighted row.
            const distance = item.kind === ITEM_KIND.SECTION ? 1 : Math.min(1, Math.abs(item.top - glide.highlightTop) / ROW_PITCH);
            layer.alpha = 1 - (1 - DIMMED_ALPHA) * distance;
            if (item.owners) {
                const ownersLayer = ownersLayerOf(index);
                ownersLayer.setPos(ownersCenterX, centerY);
                ownersLayer.alpha = layer.alpha;
                shownOwners.add(ownersLayer);
            }
        });
        for (const { layer } of ownerSlots) {
            if (!shownOwners.has(layer)) layer.alpha = 0;
        }
    }

    function stopGlide() {
        host.clearInterval(glide.timer);
        glide.timer = null;
    }

    function jumpToTarget() {
        stopGlide();
        glide.scroll = shown.scroll;
        glide.highlightTop = shown.highlighted === -1 ? -ROW_PITCH : shown.items[shown.highlighted].top;
        placeItems();
    }

    // Runs every frame while the list glides; timed on the clock, since
    // Windows timers fire late.
    function glideStep() {
        const nowMs = host.now().getTime();
        const remaining = Math.exp(-(nowMs - glide.lastMs) / GLIDE_TIME_CONSTANT_MS);
        glide.lastMs = nowMs;
        const targetTop = shown.items[shown.highlighted].top;
        glide.scroll = shown.scroll + (glide.scroll - shown.scroll) * remaining;
        glide.highlightTop = targetTop + (glide.highlightTop - targetTop) * remaining;
        if (Math.abs(glide.scroll - shown.scroll) < GLIDE_SNAP_PX && Math.abs(glide.highlightTop - targetTop) < GLIDE_SNAP_PX) {
            jumpToTarget();
            return;
        }
        placeItems();
    }

    // Keeps the items just before and after the highlighted one in view;
    // before it, an empty section's header too, above the next one's.
    function scrollToHighlighted() {
        const { items, geometry: g } = shown;
        const index = shown.highlighted;
        let beforeIndex = Math.max(0, index - 1);
        while (beforeIndex > 0 && items[beforeIndex].kind === ITEM_KIND.SECTION && items[beforeIndex - 1].kind === ITEM_KIND.SECTION) {
            beforeIndex--;
        }
        const before = items[beforeIndex];
        const after = items[Math.min(items.length - 1, index + 1)];
        let scroll = shown.scroll;
        if (before.top < scroll) scroll = before.top;
        if (after.top + after.height > scroll + g.areaHeight) scroll = after.top + after.height - g.areaHeight;
        shown.scroll = Math.max(0, Math.min(Math.max(0, shown.listHeight - g.areaHeight), scroll));
    }

    // direction: 1 for Next, -1 for Prev. Section headers are skipped; a
    // wrap jumps instead of gliding across the whole list.
    function move(direction) {
        const { items } = shown;
        if (shown.highlighted === -1) return;
        let index = shown.highlighted;
        do {
            index = (index + direction + items.length) % items.length;
        } while (items[index].kind !== ITEM_KIND.ROW);
        const wrapped = direction > 0 ? index < shown.highlighted : index > shown.highlighted;
        shown.highlighted = index;
        scrollToHighlighted();
        if (wrapped) {
            jumpToTarget();
            return;
        }
        if (glide.timer === null) {
            glide.lastMs = host.now().getTime();
            glide.timer = host.setInterval(safeHandler(SCRIPT_NAME, glideStep), FRAME_MS);
        }
    }

    // onExit: what Exit returns to, called once the list is closed.
    function open(onExit = () => {}) {
        // A native menu left open would sit over or under the list.
        if (host.getUIMode() === "menu") host.doCommand(host.getBuiltInCommand("MenuReturn"));
        stopGlide();
        const entries = readEntries();
        const { items, listHeight } = buildItems(entries);
        let geometry = null;
        backdropLayer.clear(TRANSPARENT);
        backdropLayer.draw(dc => {
            geometry = computeGeometry(dc.getSize());
            drawBackdrop(dc, geometry);
        });
        backdropLayer.alpha = 1;
        maskLayer.clear(TRANSPARENT);
        maskLayer.draw(dc => drawMask(host, dc, geometry, { header: describeHeader(entries), footer: describeFooter() }));
        maskLayer.alpha = 1;
        for (const layer of itemLayers) layer.alpha = 0;
        for (const slot of ownerSlots) {
            slot.layer.alpha = 0;
            slot.itemIndex = -1;
        }
        shown = {
            items, listHeight, geometry, onExit, scroll: 0, drawn: new Set(),
            highlighted: items.findIndex(item => item.kind === ITEM_KIND.ROW),
            // Enough for every item the rows area can show at once, even
            // only section headers, partly out at both ends.
            slotCount: Math.ceil(geometry.areaHeight / (LIST_LOOK.sectionHeight + LIST_LOOK.itemGap)) + 2,
        };
        jumpToTarget();
    }

    function close() {
        if (!shown) return;
        stopGlide();
        shown = null;
        for (const layer of [backdropLayer, maskLayer, ...itemLayers, ...ownerSlots.map(slot => slot.layer)]) layer.alpha = 0;
    }

    // Fires on every mapped button press; drives the list while it is open.
    host.on("commandbuttondown", safeHandler(SCRIPT_NAME, ev => {
        if (!shown) return;
        // Swallowed first, so a failing move still never reaches the wheel.
        ev.preventDefault();
        if (ev.command === "Next" || ev.command === "Prev") {
            move(ev.command === "Next" ? 1 : -1);
        } else if (ev.command === "Exit") {
            const { onExit } = shown;
            close();
            onExit();
        }
    }));

    // Fires when the cabinet sits idle: the list must not stay drawn over
    // attract mode or keep the buttons.
    host.on("attractmodestart", safeHandler(SCRIPT_NAME, close));

    return { open, countAll: () => countAll() };
}

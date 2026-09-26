// ============================================================
// Challenges: wires the shared Challenge module (the week's draw,
// locked in cabinet.json, and each Profile's counted games in its
// profile.json) to the Challenge Card under the Profile badge. At startup
// the week's Challenge is drawn if needed and the card drawn; the card
// follows Profile switches, hides on "gamestarted" and comes back on
// "wheelmode".
// ============================================================

import { createPinballYHost } from "../common/pinbally_host.js";
import { getProfileStore } from "../common/profile_store.js";
import { getChallenges } from "../common/challenge.js";
import { createChallengeCard } from "../common/challenge_card.js";

export default function init() {
    createChallengeCard(createPinballYHost(), getChallenges(), getProfileStore());
}

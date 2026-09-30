// ============================================================
// Navigation sound: PinballY's own Next.wav, played on each move through a
// drawn list or carousel (Achievement List, Profile picker). load() reads
// it once, ahead of the first move, which it would slow down; a missing or
// unplayable file is logged once and then stays silent, never stopping the
// navigation.
// ============================================================

// Relative to PinballY's program folder.
const NAVIGATION_SOUND = "Assets\\Button Sounds\\Next.wav";
// Enough for a held button: a player is still playing when asked again.
const NAVIGATION_SOUND_PLAYERS = 3;

export function createNavigationSound(host, scriptName) {
    // Null until loaded; false once it failed, so it is logged only once.
    let rotation = null;

    function disable(error) {
        rotation = false;
        host.log(`[${scriptName}] Navigation sound disabled: ${error.message}`);
    }

    return {
        load() {
            if (rotation !== null) return;
            try {
                const filePath = `${host.getProgramFolder().replace(/\\+$/, "")}\\${NAVIGATION_SOUND}`;
                rotation = host.createSoundRotation(filePath, NAVIGATION_SOUND_PLAYERS);
            } catch (error) {
                disable(error);
            }
        },
        play() {
            if (!rotation) return;
            try {
                rotation.play();
            } catch (error) {
                disable(error);
            }
        },
    };
}

// ============================================================
// Reads the Achievement Toasts drawn on the fake PinballY host: only the
// toasts' own draws, not the other drawn screens (the Achievement List,
// drawn ahead from startup, or the Challenge Card).
// Never loaded by PinballY.
// ============================================================

import { ACHIEVEMENT_TOAST_Z_INDEX } from "../common/achievement_toast.js";

// Every toast draw so far, in order: { zIndex, texts }.
export const toastDrawings = fake => fake.drawings().filter(drawing => drawing.zIndex === ACHIEVEMENT_TOAST_Z_INDEX);

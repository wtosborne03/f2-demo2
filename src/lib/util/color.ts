/**
 * Get a hex color string ("#RRGGBB") derived from an ID.
 * The function preserves the original mapping from ID -> hue (0..360)
 * but returns a hex color with a fixed saturation/lightness.
 *
 * @param id - The ID to derive the hue from.
 * @returns A hex color string like `#a1b2c3`.
 */
export const getHue = (id: number | string | undefined) => {
    const n = Number(id) || 1;
    // Normalize into 0..31 range then map to 0..360 degrees
    const idx = (((n - 1) % 32) + 32) % 32; // safe wrap
    const hue = Math.round((idx / 32) * 360);

    // Use a fixed saturation and lightness for consistent colors
    const saturation = 70; // percent
    const lightness = 31; // percent

    return hslToHex(hue, saturation, lightness);
};

export const getSecondaryHue = (id: number | string | undefined) => {
    const n = Number(id) || 1;
    // Normalize into 0..31 range then map to 0..360 degrees
    const idx = (((n - 1) % 32) + 32) % 32; // safe wrap
    const hue = Math.round((idx / 32) * 360);

    // Use a fixed saturation and lightness for consistent colors
    const saturation = 70; // percent
    const lightness = 26; // percent

    return hslToHex(hue, saturation, lightness);
};

/**
 * Convert HSL color to hex string.
 * h in [0,360], s and l in [0,100]
 */
const hslToHex = (h: number, s: number, l: number) => {
    const hh = (h % 360 + 360) % 360; // ensure 0..359
    const ss = Math.max(0, Math.min(100, s)) / 100;
    const ll = Math.max(0, Math.min(100, l)) / 100;

    const c = (1 - Math.abs(2 * ll - 1)) * ss;
    const x = c * (1 - Math.abs(((hh / 60) % 2) - 1));
    const m = ll - c / 2;

    let r1 = 0, g1 = 0, b1 = 0;
    if (hh >= 0 && hh < 60) {
        r1 = c; g1 = x; b1 = 0;
    } else if (hh >= 60 && hh < 120) {
        r1 = x; g1 = c; b1 = 0;
    } else if (hh >= 120 && hh < 180) {
        r1 = 0; g1 = c; b1 = x;
    } else if (hh >= 180 && hh < 240) {
        r1 = 0; g1 = x; b1 = c;
    } else if (hh >= 240 && hh < 300) {
        r1 = x; g1 = 0; b1 = c;
    } else {
        r1 = c; g1 = 0; b1 = x;
    }

    const r = Math.round((r1 + m) * 255);
    const g = Math.round((g1 + m) * 255);
    const b = Math.round((b1 + m) * 255);

    const toHex = (v: number) => v.toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};
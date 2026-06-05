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

/**
 * Determines whether a color is light or dark, and returns a contrasting text color ('#000000' or '#ffffff').
 * Supports hex strings (e.g. #fff, #ffffff), color names, and rgb/rgba formats.
 *
 * @param colorStr - The color string to check.
 * @returns A hex color string ('#000000' or '#ffffff') for text contrast.
 */
export const getContrastColor = (colorStr: string | undefined): string => {
    if (!colorStr) return '#ffffff';

    let hex = colorStr.trim().toLowerCase();

    // Map of CSS color names to hex
    const colours: { [key: string]: string } = {
        "aliceblue": "#f0f8ff", "antiquewhite": "#faebd7", "aqua": "#00ffff", "aquamarine": "#7fffd4", "azure": "#f0ffff",
        "beige": "#f5f5dc", "bisque": "#ffe4c4", "black": "#000000", "blanchedalmond": "#ffebcd", "blue": "#0000ff", "blueviolet": "#8a2be2", "brown": "#a52a2a", "burlywood": "#deb887",
        "cadetblue": "#5f9ea0", "chartreuse": "#7fff00", "chocolate": "#d2691e", "coral": "#ff7f50", "cornflowerblue": "#6495ed", "cornsilk": "#fff8dc", "crimson": "#dc143c", "cyan": "#00ffff",
        "darkblue": "#00008b", "darkcyan": "#008b8b", "darkgoldenrod": "#b8860b", "darkgray": "#a9a9a9", "darkgreen": "#006400", "darkkhaki": "#bdb76b", "darkmagenta": "#8b008b", "darkolivegreen": "#556b2f",
        "darkorange": "#ff8c00", "darkorchid": "#9932cc", "darkred": "#8b0000", "darksalmon": "#e9967a", "darkseagreen": "#8fbc8f", "darkslateblue": "#483d8b", "darkslategray": "#2f4f4f", "darkturquoise": "#00ced1",
        "darkviolet": "#9400d3", "deeppink": "#ff1493", "deepskyblue": "#00bfff", "dimgray": "#696969", "dodgerblue": "#1e90ff",
        "firebrick": "#b22222", "floralwhite": "#fffaf0", "forestgreen": "#228b22", "fuchsia": "#ff00ff",
        "gainsboro": "#dcdcdc", "ghostwhite": "#f8f8ff", "gold": "#ffd700", "goldenrod": "#daa520", "gray": "#808080", "green": "#008000", "greenyellow": "#adff2f",
        "honeydew": "#f0fff0", "hotpink": "#ff69b4",
        "indianred": "#cd5c5c", "indigo": "#4b0082", "ivory": "#fffff0", "khaki": "#f0e68c",
        "lavender": "#e6e6fa", "lavenderblush": "#fff0f5", "lawngreen": "#7cfc00", "lemonchiffon": "#fffacd", "lightblue": "#add8e6", "lightcoral": "#f08080", "lightcyan": "#e0ffff", "lightgoldenrodyellow": "#fafad2",
        "lightgrey": "#d3d3d3", "lightgreen": "#90ee90", "lightpink": "#ffb6c1", "lightsalmon": "#ffa07a", "lightseagreen": "#20b2aa", "lightskyblue": "#87cefa", "lightslategray": "#778899", "lightsteelblue": "#b0c4de",
        "lightyellow": "#ffffe0", "lime": "#00ff00", "limegreen": "#32cd32", "linen": "#faf0e6",
        "magenta": "#ff00ff", "maroon": "#800000", "mediumaquamarine": "#66cdaa", "mediumblue": "#0000cd", "mediumorchid": "#ba55d3", "mediumpurple": "#9370d8", "mediumseagreen": "#3cb371", "mediumslateblue": "#7b68ee",
        "mediumspringgreen": "#00fa9a", "mediumturquoise": "#48d1cc", "mediumvioletred": "#c71585", "midnightblue": "#191970", "mintcream": "#f5fffa", "mistyrose": "#ffe4e1", "moccasin": "#ffe4b5",
        "navajowhite": "#ffdead", "navy": "#000080",
        "oldlace": "#fdf5e6", "olive": "#808000", "olivedrab": "#6b8e23", "orange": "#ffa500", "orangered": "#ff4500", "orchid": "#da70d6",
        "palegoldenrod": "#eee8aa", "palegreen": "#98fb98", "paleturquoise": "#afeeee", "palevioletred": "#d87093", "papayawhip": "#ffefd5", "peachpuff": "#ffdab9", "peru": "#cd853f", "pink": "#ffc0cb", "plum": "#dda0dd", "powderblue": "#b0e0e6", "purple": "#800080",
        "rebeccapurple": "#663399", "red": "#ff0000", "rosybrown": "#bc8f8f", "royalblue": "#4169e1",
        "saddlebrown": "#8b4513", "salmon": "#fa8072", "sandybrown": "#f4a460", "seagreen": "#2e8b57", "seashell": "#fff5ee", "sienna": "#a0522d", "silver": "#c0c0c0", "skyblue": "#87ceeb", "slateblue": "#6a5acd", "slategray": "#708090", "snow": "#fffafa", "springgreen": "#00ff7f", "steelblue": "#4682b4",
        "tan": "#d2b48c", "teal": "#008080", "thistle": "#d8bfd8", "tomato": "#ff6347", "turquoise": "#40e0d0",
        "violet": "#ee82ee",
        "wheat": "#f5deb3", "white": "#ffffff", "whitesmoke": "#f5f5f5",
        "yellow": "#ffff00", "yellowgreen": "#9acd32"
    };

    if (colours[hex]) {
        hex = colours[hex];
    }

    let r = 255, g = 255, b = 255;
    if (hex.startsWith('#')) {
        const h = hex.slice(1);
        if (h.length === 3) {
            r = parseInt(h[0] + h[0], 16);
            g = parseInt(h[1] + h[1], 16);
            b = parseInt(h[2] + h[2], 16);
        } else if (h.length === 6) {
            r = parseInt(h.slice(0, 2), 16);
            g = parseInt(h.slice(2, 4), 16);
            b = parseInt(h.slice(4, 6), 16);
        }
    } else if (hex.startsWith('rgb')) {
        const match = hex.match(/\d+/g);
        if (match && match.length >= 3) {
            r = parseInt(match[0]);
            g = parseInt(match[1]);
            b = parseInt(match[2]);
        }
    }

    // Relative luminance formula: 0.299 * R + 0.587 * G + 0.114 * B
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    // Returns black for light backgrounds, white for dark backgrounds
    return luminance > 150 ? '#000000' : '#ffffff';
};
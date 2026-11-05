/**
 * Bundled web fonts (SIL Open Font License, see ./licenses). They ship inside the plugin, so
 * they work on Kibana servers with no internet access and pass Kibana's `font-src 'self'` policy.
 */
import montserrat500 from './montserrat-500.woff2';
import montserrat700 from './montserrat-700.woff2';
import poppins500 from './poppins-500.woff2';
import poppins700 from './poppins-700.woff2';
import playfair500 from './playfair-display-500.woff2';
import playfair700 from './playfair-display-700.woff2';
import oswald500 from './oswald-500.woff2';
import oswald700 from './oswald-700.woff2';
import spaceGrotesk500 from './space-grotesk-500.woff2';
import spaceGrotesk700 from './space-grotesk-700.woff2';
import rajdhani500 from './rajdhani-500.woff2';
import rajdhani700 from './rajdhani-700.woff2';
import type { FontId, Weight } from '../../common';

type BundledId = Exclude<FontId, 'kibana' | 'mono'>;

const BUNDLED: Record<BundledId, { family: string; fallback: string; files: Record<500 | 700, string> }> = {
  montserrat: { family: 'DH Montserrat', fallback: 'system-ui, sans-serif', files: { 500: montserrat500, 700: montserrat700 } },
  poppins: { family: 'DH Poppins', fallback: 'system-ui, sans-serif', files: { 500: poppins500, 700: poppins700 } },
  playfair: { family: 'DH Playfair Display', fallback: 'Georgia, "Times New Roman", serif', files: { 500: playfair500, 700: playfair700 } },
  oswald: { family: 'DH Oswald', fallback: '"Arial Narrow", system-ui, sans-serif', files: { 500: oswald500, 700: oswald700 } },
  spaceGrotesk: { family: 'DH Space Grotesk', fallback: 'system-ui, sans-serif', files: { 500: spaceGrotesk500, 700: spaceGrotesk700 } },
  rajdhani: { family: 'DH Rajdhani', fallback: 'system-ui, sans-serif', files: { 500: rajdhani500, 700: rajdhani700 } },
};

const isBundled = (id: FontId): id is BundledId => id in BUNDLED;

export const weightValue = (w: Weight): 500 | 700 => (w === 'bold' ? 700 : 500);

/**
 * CSS font-family for a font id. Kibana's own fonts come from the theme so they always match.
 */
export function fontFamily(id: FontId, theme: { family: string; familyCode?: string }): string {
  if (id === 'kibana') return theme.family;
  if (id === 'mono') return theme.familyCode ?? 'ui-monospace, monospace';
  const f = BUNDLED[id];
  return `"${f.family}", ${f.fallback}`;
}

/**
 * Small font files get inlined by Kibana's bundler as data: URLs, which Kibana's CSP blocks as
 * font sources. Decoding them to bytes ourselves avoids that: FontFace from an ArrayBuffer is not
 * a network load. Larger files are separate same-origin files, which `font-src 'self'` allows.
 */
function toFontSource(url: string): string | ArrayBuffer {
  if (!url.startsWith('data:')) return `url(${JSON.stringify(url)})`;
  const comma = url.indexOf(',');
  const meta = url.slice(5, comma);
  const payload = url.slice(comma + 1);
  const binary = meta.endsWith(';base64') ? atob(payload) : decodeURIComponent(payload);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

const loading = new Map<string, Promise<void>>();

/** Loads a bundled font weight once per page. Kibana's own fonts need nothing. */
export function loadFont(id: FontId, weight: 500 | 700): Promise<void> {
  if (!isBundled(id) || typeof document === 'undefined' || !('fonts' in document)) {
    return Promise.resolve();
  }
  const key = `${id}-${weight}`;
  let p = loading.get(key);
  if (!p) {
    const f = BUNDLED[id];
    const face = new FontFace(f.family, toFontSource(f.files[weight]), {
      weight: String(weight),
      style: 'normal',
      display: 'swap',
    });
    p = face
      .load()
      .then((loaded) => {
        document.fonts.add(loaded);
      })
      .catch(() => {
        // Fall back to the next font in the stack; never break the panel over a font.
        loading.delete(key);
      });
    loading.set(key, p);
  }
  return p;
}

/** Used by the editor so every option in the font picker shows in its own typeface. */
export const preloadAllFonts = (): Promise<unknown> =>
  Promise.all(
    (Object.keys(BUNDLED) as BundledId[]).flatMap((id) => [loadFont(id, 500), loadFont(id, 700)])
  );

/**
 * Complexions for the drawn figures. The palette runs light to deep and is
 * split down the middle, so every squad reads as half darker skinned.
 *
 * A player can pin their tone with `Player.skin`. Everyone else is dealt one by
 * `assignTones`, which the rosters run once on load — so a squad added later is
 * balanced without a tone written out for every entry.
 */

export const SKIN_TONES = {
  light: "#eeb894",
  tan: "#cf9163",
  brown: "#96603a",
  deep: "#65402a",
} as const;

export type SkinTone = keyof typeof SKIN_TONES;

const LIGHTER: SkinTone[] = ["light", "tan"];
const DARKER: SkinTone[] = ["brown", "deep"];
const TONE_ORDER: SkinTone[] = [...LIGHTER, ...DARKER];

/** Darker skin gets near-black hair so the shape still reads at this scale. */
const HAIR: Record<SkinTone, string> = {
  light: "#2c1810",
  tan: "#241209",
  brown: "#170f0a",
  deep: "#120c08",
};

export type Complexion = { skin: string; hair: string };

function hashName(name: string): number {
  let h = 2166136261;
  for (let i = 0; i < name.length; i++) {
    h ^= name.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function toneFor(player: { name: string; skin?: SkinTone }): SkinTone {
  return player.skin ?? TONE_ORDER[hashName(player.name) % TONE_ORDER.length];
}

/**
 * Deals a tone to everyone in a squad who has not pinned one, so exactly half
 * of them land in the darker range. Names are ranked by hash rather than by
 * their place in the roster, which keeps the mix from following the batting
 * order while staying identical on every run.
 */
export function assignTones(squad: { name: string; skin?: SkinTone }[]) {
  const pending = squad.filter((player) => player.skin == null);
  const byHash = [...pending].sort((a, b) => hashName(a.name) - hashName(b.name));

  byHash.forEach((player, rank) => {
    const pool = rank < Math.floor(byHash.length / 2) ? LIGHTER : DARKER;
    player.skin = pool[hashName(player.name) % pool.length];
  });
}

export function complexionFor(player: { name: string; skin?: SkinTone }): Complexion {
  const tone = toneFor(player);
  return { skin: SKIN_TONES[tone], hair: HAIR[tone] };
}

/** A wider spread for the stands, again half of it in the darker range. */
export const CROWD_SKIN_TONES = [
  "#f7dcc0",
  SKIN_TONES.light,
  SKIN_TONES.tan,
  SKIN_TONES.brown,
  SKIN_TONES.deep,
  "#4f3120",
];

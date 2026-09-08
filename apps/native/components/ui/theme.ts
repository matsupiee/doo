/**
 * 画面をまたいで使う配色。
 * global.css のテーマ変数と同じ値を、インラインスタイル用に持っておく。
 */
export const brand = {
  violet: "#6c5ce7",
  coral: "#f2543d",
  yellow: "#f7d046",
  cream: "#f2eee3",
  ink: "#101010",
} as const;

/** 面の色。surface だけテーマに追従し、他は明暗どちらでも同じ色を使う。 */
export type Tone = "surface" | "violet" | "coral" | "yellow" | "cream" | "ink";

export const toneStyles: Record<Tone, { background: string; foreground: string; muted: string }> = {
  surface: { background: "", foreground: "", muted: "" },
  violet: { background: brand.violet, foreground: "#ffffff", muted: "rgba(255,255,255,0.72)" },
  coral: { background: brand.coral, foreground: "#ffffff", muted: "rgba(255,255,255,0.78)" },
  yellow: { background: brand.yellow, foreground: brand.ink, muted: "rgba(16,16,16,0.62)" },
  cream: { background: brand.cream, foreground: brand.ink, muted: "rgba(16,16,16,0.55)" },
  ink: { background: brand.ink, foreground: "#f5f2ea", muted: "rgba(245,242,234,0.6)" },
};

/** カードの角丸。スクショに合わせて、面は大きめに丸める。 */
export const radius = {
  panel: 28,
  card: 24,
  pill: 999,
} as const;

/**
 * やりたいことの ID から、いつも同じ色を選ぶ（並べたときに色が散る）。
 * 4色目だけはテーマで入れ替える。cream はライトの背景に埋もれ、
 * ink はダークの背景に埋もれるため。
 */
const accentTones = ["violet", "coral", "yellow"] as const;

export function toneForKey(key: string, isDark: boolean): Tone {
  let hash = 0;
  for (let index = 0; index < key.length; index += 1) {
    hash = (hash * 31 + key.charCodeAt(index)) % 9973;
  }
  const tones: Tone[] = [...accentTones, isDark ? "cream" : "ink"];
  return tones[hash % tones.length];
}

/** アバターの丸。面の色に埋もれないよう、ブランド色の3色だけから選ぶ。 */
export function toneForAvatar(key: string): Tone {
  let hash = 0;
  for (let index = 0; index < key.length; index += 1) {
    hash = (hash * 31 + key.charCodeAt(index)) % 9973;
  }
  return accentTones[hash % accentTones.length];
}

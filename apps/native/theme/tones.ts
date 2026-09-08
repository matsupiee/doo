/**
 * カードの塗りに使う色。ビビッドな面をローテーションさせるのが、このデザインの
 * いちばんの特徴なので、色は uniwind のテーマではなくここに実体を置いて、
 * JS からも className からも同じ値を参照できるようにしている。
 */
export type Tone = "brand" | "sun" | "coral" | "mint" | "sky";

export type ToneStyle = {
  /** カードの塗り。 */
  background: string;
  /** 塗りの上に置く文字。 */
  foreground: string;
  /** 塗りの上に置く、弱めの文字。 */
  mutedForeground: string;
  /** 白い面の上にその色を出すときに使う、読める濃さ。 */
  onWhite: string;
};

export const toneStyles: Record<Tone, ToneStyle> = {
  brand: {
    background: "#5b4be8",
    foreground: "#ffffff",
    mutedForeground: "#d9d3ff",
    onWhite: "#4a3bd0",
  },
  sun: {
    background: "#f5c445",
    foreground: "#2a2072",
    mutedForeground: "#6b5a1f",
    onWhite: "#8a6a06",
  },
  coral: {
    background: "#f98d8d",
    foreground: "#2a2072",
    mutedForeground: "#7a3242",
    onWhite: "#c2455c",
  },
  mint: {
    background: "#2fbf71",
    foreground: "#ffffff",
    mutedForeground: "#d5f5e3",
    onWhite: "#1c8b4f",
  },
  sky: {
    background: "#6fa8f5",
    foreground: "#ffffff",
    mutedForeground: "#dfeaff",
    onWhite: "#2f6fc4",
  },
};

const toneOrder: Tone[] = ["brand", "sun", "coral", "mint", "sky"];

/**
 * 同じやりたいことがいつも同じ色になるように、ID から色を決める。
 * 一覧を作り直しても色が飛び回らないので、並びを覚えやすい。
 */
export function toneFor(id: string): Tone {
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) % 100000;
  }
  return toneOrder[hash % toneOrder.length] as Tone;
}

export function toneStyleFor(id: string): ToneStyle {
  return toneStyles[toneFor(id)];
}

/** 濃い面に置く白いカード・ピルの影。 */
export const cardShadow = {
  shadowColor: "#2a2072",
  shadowOpacity: 0.1,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 8 },
  elevation: 4,
} as const;

/** 塗りの上に置いた白い面の文字色。 */
export const inkOnWhite = "#2a2072";

/** 面の色として直接使う、テーマに寄らない色。 */
export const brandColors = {
  /** いちばん濃いインディゴ。入口の画面いっぱいの面に使う。 */
  ink: "#2a2072",
  /** 差し色の黄色。 */
  sun: "#f5c445",
  /** 反応（ハート）が付いているときの色。 */
  heart: "#f2687c",
  /** 濃い面の上に置く、弱めの文字。 */
  onInk: "#bdb6f0",
  /** ブランド色の塗り。 */
  brand: "#5b4be8",
  /** うすいラベンダーの塗り。 */
  surfaceTint: "#f2f0fc",
} as const;

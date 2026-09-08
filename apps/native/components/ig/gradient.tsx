import { useState } from "react";
import { View, type ViewStyle } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

let gradientCount = 0;

/**
 * SVG のグラデーションを参照する id。React の useId は url(#...) に使えない
 * 記号を含むので、自前の連番を使う。
 */
export function useGradientId() {
  const [id] = useState(() => {
    gradientCount += 1;
    return `doo-gradient-${gradientCount}`;
  });
  return id;
}

type Props = {
  colors: readonly [string, string];
  /** 大きさは style で決める。className は中身の並べ方に使う。 */
  style?: ViewStyle;
  className?: string;
  children?: React.ReactNode;
};

/**
 * 斜めの2色グラデーション。Instagram のストーリーやテキスト投稿の背景にあたる。
 * expo-linear-gradient は入れず、すでにある react-native-svg で描く。
 */
export function Gradient({ colors, children, style, className }: Props) {
  const id = useGradientId();
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [from, to] = colors;

  return (
    // 外側は style だけで大きさを決める。className を混ぜると
    // uniwind が作る style と競合して、大きさが消えてしまう。
    // Svg の "100%" は親の箱に解決されないので、実測した値を渡す。
    <View
      style={style}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        setSize((current) =>
          current.width === width && current.height === height ? current : { width, height },
        );
      }}
    >
      <Svg width={size.width} height={size.height} style={{ position: "absolute" }}>
        <Defs>
          <LinearGradient id={id} x1="0%" y1="100%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={from} />
            <Stop offset="100%" stopColor={to} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={size.width} height={size.height} fill={`url(#${id})`} />
      </Svg>
      <View className={`absolute inset-0 ${className ?? ""}`}>{children}</View>
    </View>
  );
}

import { Image, Text, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";

import { useGradientId } from "@/components/ig/gradient";

type Props = {
  name: string;
  uri?: string | null;
  size?: number;
  /** ストーリーのグラデーションリングを巻く。 */
  hasRing?: boolean;
};

/**
 * Instagram のアバター。リング付きのときは外周にグラデーションを描き、
 * 写真との間に 2px の隙間をあける。
 */
export function Avatar({ name, uri, size = 32, hasRing = false }: Props) {
  // 同じ画面に複数のリングが出るので、グラデーションの id は毎回ユニークにする。
  const gradientId = useGradientId();
  const inset = hasRing ? 4 : 0;
  const inner = size - inset * 2;
  const initial = name.slice(0, 1).toUpperCase();

  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      {hasRing ? (
        <Svg width={size} height={size} style={{ position: "absolute" }}>
          <Defs>
            <LinearGradient id={gradientId} x1="0%" y1="100%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#f9ce34" />
              <Stop offset="50%" stopColor="#ee2a7b" />
              <Stop offset="100%" stopColor="#6228d7" />
            </LinearGradient>
          </Defs>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={(size - 2) / 2}
            stroke={`url(#${gradientId})`}
            strokeWidth={2}
            fill="none"
          />
        </Svg>
      ) : null}

      <View
        style={{ width: inner, height: inner, borderRadius: inner / 2 }}
        className="overflow-hidden bg-surface-tertiary items-center justify-center"
      >
        {uri ? (
          <Image source={{ uri }} style={{ width: inner, height: inner }} />
        ) : (
          <Text
            className="text-muted font-semibold"
            style={{ fontSize: Math.max(10, inner * 0.42) }}
          >
            {initial}
          </Text>
        )}
      </View>
    </View>
  );
}

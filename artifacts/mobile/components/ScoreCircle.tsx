import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";

interface ScoreCircleProps {
  score: number;
  maxScore?: number;
  size?: number;
  label?: string;
}

export function ScoreCircle({ score, maxScore = 10, size = 80, label }: ScoreCircleProps) {
  const colors = useColors();
  const pct = score / maxScore;
  const scoreColor = pct >= 0.7 ? colors.scoreHigh : pct >= 0.4 ? colors.scoreMid : colors.scoreLow;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: scoreColor,
            backgroundColor: scoreColor + "22",
          },
        ]}
      >
        <Text style={[styles.score, { color: scoreColor, fontSize: size * 0.32 }]}>
          {score.toFixed(1)}
        </Text>
        {maxScore !== 100 && (
          <Text style={[styles.max, { color: colors.mutedForeground, fontSize: size * 0.16 }]}>
            /{maxScore}
          </Text>
        )}
      </View>
      {label && (
        <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: 6,
  },
  circle: {
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  score: {
    fontFamily: "Inter_700Bold",
    lineHeight: undefined,
  },
  max: {
    fontFamily: "Inter_400Regular",
  },
  label: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
});

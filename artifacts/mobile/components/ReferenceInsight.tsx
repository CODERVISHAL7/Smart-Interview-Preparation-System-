import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

interface ReferenceInsightProps {
  topic: string;
  subTopic?: string | null;
  questionType: string;
  similarQuestion?: string | null;
  companyTags?: string | null;
}

export function ReferenceInsight({
  topic,
  subTopic,
  questionType,
  similarQuestion,
  companyTags,
}: ReferenceInsightProps) {
  const colors = useColors();
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={[styles.container, { backgroundColor: colors.accent + "66", borderColor: colors.primary + "44" }]}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <Feather name="info" size={14} color={colors.primary} />
          <Text style={[styles.headerText, { color: colors.primary }]}>Reference Insight</Text>
        </View>
        <Feather
          name={expanded ? "chevron-up" : "chevron-down"}
          size={14}
          color={colors.primary}
        />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.content}>
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Topic</Text>
            <Text style={[styles.value, { color: colors.foreground }]}>{topic}</Text>
          </View>
          {subTopic && (
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Sub-Topic</Text>
              <Text style={[styles.value, { color: colors.foreground }]}>{subTopic}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Type</Text>
            <View style={[styles.badge, { backgroundColor: colors.primary + "22" }]}>
              <Text style={[styles.badgeText, { color: colors.primary }]}>{questionType}</Text>
            </View>
          </View>
          {companyTags && (
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Companies</Text>
              <Text style={[styles.value, { color: colors.foreground }]}>{companyTags}</Text>
            </View>
          )}
          {similarQuestion && (
            <View style={[styles.similarBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.similarLabel, { color: colors.mutedForeground }]}>Similar previously asked:</Text>
              <Text style={[styles.similarText, { color: colors.foreground }]}>{similarQuestion}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    borderWidth: 1,
    overflow: "hidden",
    marginTop: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  content: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    width: 70,
  },
  value: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  similarBox: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    marginTop: 4,
    gap: 4,
  },
  similarLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  similarText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
});

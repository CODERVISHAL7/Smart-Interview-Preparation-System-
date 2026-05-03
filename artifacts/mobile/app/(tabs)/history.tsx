import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useGetInterviewHistory } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";

type Session = {
  id: number;
  jobRole: string;
  interviewType: string;
  difficulty: string;
  status: string;
  totalScore?: number | null;
  accuracyPercent?: number | null;
  createdAt: string;
  company?: string | null;
};

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const colors = useColors();
  const colorMap: Record<string, string> = {
    easy: colors.success,
    medium: colors.warning,
    hard: colors.destructive,
  };
  const c = colorMap[difficulty.toLowerCase()] ?? colors.mutedForeground;
  return (
    <View style={[styles.badge, { backgroundColor: c + "22" }]}>
      <Text style={[styles.badgeText, { color: c }]}>{difficulty}</Text>
    </View>
  );
}

function SessionCard({ item, onPress }: { item: Session; onPress: () => void }) {
  const colors = useColors();
  const date = new Date(item.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const isComplete = item.status === "completed";

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.typeIcon, { backgroundColor: colors.primary + "22" }]}>
          <Feather name="briefcase" size={16} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.jobRole, { color: colors.foreground }]} numberOfLines={1}>
            {item.jobRole}
          </Text>
          {item.company && (
            <Text style={[styles.company, { color: colors.mutedForeground }]}>{item.company}</Text>
          )}
        </View>
        {isComplete && (
          <Text style={[styles.accuracy, { color: colors.success }]}>
            {item.accuracyPercent?.toFixed(0) ?? 0}%
          </Text>
        )}
        {!isComplete && (
          <View style={[styles.inProgressBadge, { backgroundColor: colors.warning + "22" }]}>
            <Text style={[styles.inProgressText, { color: colors.warning }]}>In Progress</Text>
          </View>
        )}
      </View>
      <View style={styles.cardFooter}>
        <DifficultyBadge difficulty={item.difficulty} />
        <View style={[styles.badge, { backgroundColor: colors.muted }]}>
          <Text style={[styles.badgeText, { color: colors.mutedForeground }]}>{item.interviewType}</Text>
        </View>
        <Text style={[styles.date, { color: colors.mutedForeground }]}>{date}</Text>
      </View>
      {isComplete && item.totalScore != null && (
        <View style={[styles.scoreBar, { backgroundColor: colors.muted }]}>
          <View
            style={[
              styles.scoreBarFill,
              {
                backgroundColor: colors.primary,
                width: `${Math.min((item.totalScore / 100) * 100, 100)}%` as any,
              },
            ]}
          />
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function HistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: sessions, isLoading, refetch } = useGetInterviewHistory();

  const topPaddingWeb = Platform.OS === "web" ? 67 : 0;
  const bottomPaddingWeb = Platform.OS === "web" ? 34 : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.headerBar,
          {
            paddingTop: insets.top + topPaddingWeb + 20,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.screenTitle, { color: colors.foreground }]}>Interview History</Text>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={sessions ?? []}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{
            padding: 20,
            paddingBottom: insets.bottom + bottomPaddingWeb + 100,
            gap: 12,
          }}
          onRefresh={refetch}
          refreshing={isLoading}
          scrollEnabled={!!(sessions && sessions.length > 0)}
          renderItem={({ item }) => (
            <SessionCard
              item={item as Session}
              onPress={() => {
                if (item.status === "completed") {
                  router.push(`/interview/report?sessionId=${item.id}&readonly=1`);
                }
              }}
            />
          )}
          ListEmptyComponent={
            <View style={[styles.emptyState, { borderColor: colors.border }]}>
              <Feather name="clock" size={36} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No interviews yet</Text>
              <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
                Complete your first mock interview to see it here
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBar: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  screenTitle: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  typeIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  jobRole: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  company: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  accuracy: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textTransform: "capitalize",
  },
  date: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginLeft: "auto",
  },
  inProgressBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  inProgressText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  scoreBar: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  scoreBarFill: {
    height: "100%",
    borderRadius: 2,
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
});

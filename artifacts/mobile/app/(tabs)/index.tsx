import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth, useUser } from "@clerk/expo";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useGetInterviewHistory } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { useInterview } from "@/context/InterviewContext";

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: string; color: string }) {
  const colors = useColors();
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.statIcon, { backgroundColor: color + "22" }]}>
        <Feather name={icon as any} size={18} color={color} />
      </View>
      <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useUser();
  const { reset } = useInterview();
  const { data: sessions, isLoading } = useGetInterviewHistory();

  const completedSessions = sessions?.filter((s) => s.status === "completed") ?? [];
  const avgAccuracy =
    completedSessions.length > 0
      ? completedSessions.reduce((sum, s) => sum + (s.accuracyPercent ?? 0), 0) / completedSessions.length
      : 0;
  const avgScore =
    completedSessions.length > 0
      ? completedSessions.reduce((sum, s) => sum + (s.totalScore ?? 0), 0) / completedSessions.length
      : 0;

  const handleStartInterview = () => {
    reset();
    router.push("/interview/setup");
  };

  const topPaddingWeb = Platform.OS === "web" ? 67 : 0;
  const bottomPaddingWeb = Platform.OS === "web" ? 34 : 0;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingTop: insets.top + topPaddingWeb + 20,
        paddingBottom: insets.bottom + bottomPaddingWeb + 100,
        paddingHorizontal: 20,
        gap: 20,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
            Hello, {user?.firstName ?? "there"}
          </Text>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Dashboard</Text>
        </View>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={[styles.avatarText, { color: colors.primaryForeground }]}>
            {(user?.firstName?.[0] ?? user?.emailAddresses?.[0]?.emailAddress?.[0] ?? "U").toUpperCase()}
          </Text>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <View style={styles.statsGrid}>
          <StatCard
            label="Interviews"
            value={completedSessions.length.toString()}
            icon="activity"
            color={colors.primary}
          />
          <StatCard
            label="Avg Accuracy"
            value={completedSessions.length > 0 ? `${avgAccuracy.toFixed(0)}%` : "—"}
            icon="target"
            color={colors.success}
          />
          <StatCard
            label="Avg Score"
            value={completedSessions.length > 0 ? `${avgScore.toFixed(1)}/100` : "—"}
            icon="star"
            color={colors.warning}
          />
          <StatCard
            label="In Progress"
            value={(sessions?.filter((s) => s.status === "in_progress").length ?? 0).toString()}
            icon="clock"
            color={colors.mutedForeground}
          />
        </View>
      )}

      <TouchableOpacity
        style={[styles.startBtn, { backgroundColor: colors.primary }]}
        onPress={handleStartInterview}
        activeOpacity={0.85}
      >
        <View style={styles.startBtnContent}>
          <View style={[styles.startBtnIcon, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
            <Feather name="play" size={22} color="#fff" />
          </View>
          <View>
            <Text style={styles.startBtnTitle}>Start New Interview</Text>
            <Text style={styles.startBtnSubtitle}>Practice with AI-powered questions</Text>
          </View>
        </View>
        <Feather name="chevron-right" size={20} color="rgba(255,255,255,0.8)" />
      </TouchableOpacity>

      {completedSessions.length > 0 && (
        <View>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Sessions</Text>
          {completedSessions.slice(0, 3).map((session) => (
            <TouchableOpacity
              key={session.id}
              style={[styles.sessionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push(`/interview/report?sessionId=${session.id}&readonly=1`)}
              activeOpacity={0.8}
            >
              <View style={styles.sessionCardLeft}>
                <View style={[styles.sessionBadge, { backgroundColor: colors.primary + "22" }]}>
                  <Feather name="briefcase" size={14} color={colors.primary} />
                </View>
                <View>
                  <Text style={[styles.sessionRole, { color: colors.foreground }]} numberOfLines={1}>
                    {session.jobRole}
                  </Text>
                  <Text style={[styles.sessionMeta, { color: colors.mutedForeground }]}>
                    {session.interviewType} · {session.difficulty}
                  </Text>
                </View>
              </View>
              <View style={styles.sessionCardRight}>
                <Text style={[styles.sessionScore, { color: colors.success }]}>
                  {session.accuracyPercent?.toFixed(0) ?? 0}%
                </Text>
                <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {completedSessions.length === 0 && !isLoading && (
        <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="inbox" size={36} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No interviews yet</Text>
          <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
            Start your first practice session to see your performance here
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    width: "47%",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  statLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 18,
    borderRadius: 16,
  },
  startBtnContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  startBtnIcon: {
    width: 46,
    height: 46,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  startBtnTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  startBtnSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.75)",
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 12,
  },
  sessionCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  sessionCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  sessionBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  sessionRole: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  sessionMeta: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textTransform: "capitalize",
    marginTop: 2,
  },
  sessionCardRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sessionScore: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  emptyState: {
    alignItems: "center",
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
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

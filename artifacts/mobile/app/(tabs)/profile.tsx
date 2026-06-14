import React, { useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useUser, useAuth } from "@clerk/expo";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useGetInterviewHistory } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";

function StatItem({ label, value, color }: { label: string; value: string; color: string }) {
  const colors = useColors();
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

function RowItem({
  icon,
  label,
  value,
  onPress,
  color,
}: {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  color?: string;
}) {
  const colors = useColors();
  return (
    <TouchableOpacity
      style={[styles.rowItem, { borderBottomColor: colors.border }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={[styles.rowIcon, { backgroundColor: (color ?? colors.primary) + "18" }]}>
        <Feather name={icon as any} size={16} color={color ?? colors.primary} />
      </View>
      <Text style={[styles.rowLabel, { color: colors.foreground }]}>{label}</Text>
      <View style={styles.rowRight}>
        {value ? (
          <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>{value}</Text>
        ) : null}
        {onPress ? <Feather name="chevron-right" size={16} color={colors.mutedForeground} /> : null}
      </View>
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useUser();
  const { signOut } = useAuth();
  const { data: sessions } = useGetInterviewHistory();

  const stats = useMemo(() => {
    const completed = sessions?.filter((s) => s.status === "completed") ?? [];
    const inProgress = sessions?.filter((s) => s.status === "in_progress") ?? [];
    const totalScore = completed.reduce((s, c) => s + (c.totalScore ?? 0), 0);
    const totalAccuracy = completed.reduce((s, c) => s + (c.accuracyPercent ?? 0), 0);
    const bestAccuracy = completed.length > 0
      ? Math.max(...completed.map((c) => c.accuracyPercent ?? 0))
      : 0;
    const avgAccuracy = completed.length > 0 ? totalAccuracy / completed.length : 0;
    const avgScore = completed.length > 0 ? totalScore / completed.length : 0;

    const topicMap: Record<string, number> = {};
    completed.forEach((s) => {
      const t = s.interviewType ?? "general";
      topicMap[t] = (topicMap[t] ?? 0) + 1;
    });
    const topTopic = Object.entries(topicMap).sort((a, b) => b[1] - a[1])[0]?.[0];

    return { completed: completed.length, inProgress: inProgress.length, avgAccuracy, avgScore, bestAccuracy, topTopic };
  }, [sessions]);

  const displayName = user?.fullName ?? user?.firstName ?? user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] ?? "User";
  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const initials = (user?.firstName?.[0] ?? user?.emailAddresses?.[0]?.emailAddress?.[0] ?? "U").toUpperCase();
  const joinedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : null;

  const topPaddingWeb = Platform.OS === "web" ? 67 : 0;
  const bottomPaddingWeb = Platform.OS === "web" ? 34 : 0;

  const handleSignOut = async () => {
    if (Platform.OS === "web") {
      const confirmed = window.confirm("Are you sure you want to sign out?");
      if (!confirmed) return;
      await signOut();
      router.replace("/(auth)/sign-in");
    } else {
      Alert.alert("Sign Out", "Are you sure you want to sign out?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            await signOut();
            router.replace("/(auth)/sign-in");
          },
        },
      ]);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingTop: insets.top + topPaddingWeb + 20,
        paddingBottom: insets.bottom + bottomPaddingWeb + 100,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.pageHeader}>
        <Text style={[styles.pageTitle, { color: colors.foreground }]}>Profile</Text>
      </View>

      <View style={[styles.heroCard, { backgroundColor: colors.primary }]}>
        <View style={styles.avatarRing}>
          <View style={[styles.avatarCircle, { backgroundColor: "rgba(255,255,255,0.25)" }]}>
            <Text style={styles.avatarInitial}>{initials}</Text>
          </View>
        </View>
        <Text style={styles.heroName}>{displayName}</Text>
        <Text style={styles.heroEmail}>{email}</Text>
        {joinedDate ? (
          <View style={styles.joinedRow}>
            <Feather name="calendar" size={12} color="rgba(255,255,255,0.7)" />
            <Text style={styles.joinedText}>Member since {joinedDate}</Text>
          </View>
        ) : null}

        <View style={styles.statsRow}>
          <StatItem
            label="Interviews"
            value={stats.completed.toString()}
            color="#fff"
          />
          <View style={styles.statDivider} />
          <StatItem
            label="Avg Score"
            value={stats.completed > 0 ? `${stats.avgScore.toFixed(0)}/100` : "—"}
            color="#fff"
          />
          <View style={styles.statDivider} />
          <StatItem
            label="Best"
            value={stats.completed > 0 ? `${stats.bestAccuracy.toFixed(0)}%` : "—"}
            color="#fff"
          />
        </View>
      </View>

      {stats.completed > 0 && (
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Performance</Text>
          <View style={styles.perfRow}>
            <View style={[styles.perfCard, { backgroundColor: colors.success + "14", borderColor: colors.success + "33" }]}>
              <Feather name="target" size={20} color={colors.success} />
              <Text style={[styles.perfValue, { color: colors.success }]}>
                {stats.avgAccuracy.toFixed(0)}%
              </Text>
              <Text style={[styles.perfLabel, { color: colors.mutedForeground }]}>Avg Accuracy</Text>
            </View>
            <View style={[styles.perfCard, { backgroundColor: colors.warning + "14", borderColor: colors.warning + "33" }]}>
              <Feather name="star" size={20} color={colors.warning} />
              <Text style={[styles.perfValue, { color: colors.warning }]}>
                {stats.avgScore.toFixed(1)}
              </Text>
              <Text style={[styles.perfLabel, { color: colors.mutedForeground }]}>Avg Score</Text>
            </View>
            <View style={[styles.perfCard, { backgroundColor: colors.primary + "14", borderColor: colors.primary + "33" }]}>
              <Feather name="layers" size={20} color={colors.primary} />
              <Text style={[styles.perfValue, { color: colors.primary }]}>
                {stats.inProgress > 0 ? stats.inProgress.toString() : "0"}
              </Text>
              <Text style={[styles.perfLabel, { color: colors.mutedForeground }]}>In Progress</Text>
            </View>
          </View>
          {stats.topTopic && (
            <View style={[styles.topTopicRow, { backgroundColor: colors.muted, borderRadius: 10 }]}>
              <Feather name="trending-up" size={14} color={colors.primary} />
              <Text style={[styles.topTopicText, { color: colors.foreground }]}>
                Most practiced:{" "}
                <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold", textTransform: "capitalize" }}>
                  {stats.topTopic}
                </Text>
              </Text>
            </View>
          )}
        </View>
      )}

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Account</Text>
        <RowItem icon="user" label="Full Name" value={displayName} />
        <RowItem icon="mail" label="Email" value={email} />
        {joinedDate ? <RowItem icon="calendar" label="Member Since" value={joinedDate} /> : null}
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Activity</Text>
        <RowItem
          icon="activity"
          label="Total Interviews"
          value={`${stats.completed + stats.inProgress}`}
        />
        <RowItem
          icon="check-circle"
          label="Completed"
          value={stats.completed.toString()}
          color={colors.success}
        />
        <RowItem
          icon="clock"
          label="In Progress"
          value={stats.inProgress.toString()}
          color={colors.warning}
        />
        <RowItem
          icon="bar-chart-2"
          label="View Full History"
          onPress={() => router.push("/(tabs)/history")}
        />
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>App</Text>
        <RowItem icon="cpu" label="AI Model" value="GPT-5.4" />
        <RowItem icon="shield" label="Data & Privacy" value="Secured by Clerk" />
      </View>

      <TouchableOpacity
        style={[styles.signOutBtn, { borderColor: colors.destructive + "55" }]}
        onPress={handleSignOut}
        activeOpacity={0.8}
      >
        <Feather name="log-out" size={18} color={colors.destructive} />
        <Text style={[styles.signOutText, { color: colors.destructive }]}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  pageHeader: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  heroCard: {
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
  },
  avatarRing: {
    padding: 3,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
    marginBottom: 4,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  heroName: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  heroEmail: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.75)",
  },
  joinedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 2,
  },
  joinedText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.65)",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
    width: "100%",
  },
  statItem: { flex: 1, alignItems: "center", gap: 3 },
  statValue: { fontSize: 20, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.7)" },
  statDivider: { width: 1, height: 36, backgroundColor: "rgba(255,255,255,0.2)" },
  section: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    gap: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
    opacity: 0.6,
  },
  perfRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  perfCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    alignItems: "center",
    gap: 6,
  },
  perfValue: { fontSize: 18, fontFamily: "Inter_700Bold" },
  perfLabel: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center" },
  topTopicRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  topTopicText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  rowItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  rowValue: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    maxWidth: 140,
    textAlign: "right",
  },
  signOutBtn: {
    marginHorizontal: 16,
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 15,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 8,
  },
  signOutText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});

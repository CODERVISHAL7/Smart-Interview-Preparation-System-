import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useGetInterviewSession } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { ScoreCircle } from "@/components/ScoreCircle";
import { ReferenceInsight } from "@/components/ReferenceInsight";
import { useInterview } from "@/context/InterviewContext";

export default function ReportScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { sessionId, readonly } = useLocalSearchParams<{ sessionId: string; readonly?: string }>();
  const { reset } = useInterview();

  const { data, isLoading } = useGetInterviewSession(parseInt(sessionId ?? "0"), {
    query: { enabled: !!sessionId },
  });

  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);

  const session = data?.session;
  const questions = data?.questions ?? [];
  const answers = data?.answers ?? [];

  if (isLoading || !data) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading results...</Text>
      </View>
    );
  }

  const scoreColor = (score: number) =>
    score >= 7 ? colors.scoreHigh : score >= 4 ? colors.scoreMid : colors.scoreLow;

  const handleDone = () => {
    if (!readonly) reset();
    router.replace("/(tabs)");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={handleDone} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          {readonly ? "Interview Report" : "Your Results"}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.summaryCard, { backgroundColor: colors.primary, borderRadius: 16 }]}>
          <Text style={styles.summaryRole} numberOfLines={1}>{session?.jobRole}</Text>
          <Text style={styles.summaryMeta}>
            {session?.interviewType} · {session?.difficulty}
          </Text>

          <View style={styles.metricsRow}>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{session?.accuracyPercent?.toFixed(0) ?? 0}%</Text>
              <Text style={styles.metricLabel}>Accuracy</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{session?.totalScore?.toFixed(1) ?? 0}</Text>
              <Text style={styles.metricLabel}>Total Score</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metric}>
              <Text style={styles.metricValue}>
                {session?.timeTakenSeconds ? `${Math.round(session.timeTakenSeconds / 60)}m` : "—"}
              </Text>
              <Text style={styles.metricLabel}>Time</Text>
            </View>
          </View>
        </View>

        {(session?.strengths?.length || session?.weaknesses?.length || session?.suggestions?.length) ? (
          <View style={styles.analysisSection}>
            {session.strengths && session.strengths.length > 0 && (
              <View style={[styles.analysisPill, { backgroundColor: colors.success + "18", borderColor: colors.success + "44" }]}>
                <View style={styles.analysisHeader}>
                  <Feather name="trending-up" size={16} color={colors.success} />
                  <Text style={[styles.analysisTitle, { color: colors.success }]}>Strengths</Text>
                </View>
                {session.strengths.map((s, i) => (
                  <View key={i} style={styles.bulletRow}>
                    <View style={[styles.bullet, { backgroundColor: colors.success }]} />
                    <Text style={[styles.bulletText, { color: colors.foreground }]}>{s}</Text>
                  </View>
                ))}
              </View>
            )}

            {session.weaknesses && session.weaknesses.length > 0 && (
              <View style={[styles.analysisPill, { backgroundColor: colors.destructive + "12", borderColor: colors.destructive + "33" }]}>
                <View style={styles.analysisHeader}>
                  <Feather name="alert-triangle" size={16} color={colors.destructive} />
                  <Text style={[styles.analysisTitle, { color: colors.destructive }]}>Areas to Improve</Text>
                </View>
                {session.weaknesses.map((w, i) => (
                  <View key={i} style={styles.bulletRow}>
                    <View style={[styles.bullet, { backgroundColor: colors.destructive }]} />
                    <Text style={[styles.bulletText, { color: colors.foreground }]}>{w}</Text>
                  </View>
                ))}
              </View>
            )}

            {session.suggestions && session.suggestions.length > 0 && (
              <View style={[styles.analysisPill, { backgroundColor: colors.warning + "12", borderColor: colors.warning + "33" }]}>
                <View style={styles.analysisHeader}>
                  <Feather name="book-open" size={16} color={colors.warning} />
                  <Text style={[styles.analysisTitle, { color: colors.warning }]}>Study Suggestions</Text>
                </View>
                {session.suggestions.map((s, i) => (
                  <View key={i} style={styles.bulletRow}>
                    <View style={[styles.bullet, { backgroundColor: colors.warning }]} />
                    <Text style={[styles.bulletText, { color: colors.foreground }]}>{s}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ) : null}

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Question Breakdown</Text>

        {questions.map((q, index) => {
          const ans = answers.find((a) => a.questionId === q.id);
          const score = ans?.score ?? 0;
          const isExpanded = expandedQuestion === q.id;

          return (
            <TouchableOpacity
              key={q.id}
              style={[styles.qCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setExpandedQuestion(isExpanded ? null : q.id)}
              activeOpacity={0.9}
            >
              <View style={styles.qCardHeader}>
                <View style={styles.qCardLeft}>
                  <View style={[styles.qNumber, { backgroundColor: scoreColor(score) + "22" }]}>
                    <Text style={[styles.qNumberText, { color: scoreColor(score) }]}>Q{index + 1}</Text>
                  </View>
                  <Text style={[styles.qText, { color: colors.foreground }]} numberOfLines={isExpanded ? undefined : 2}>
                    {q.question}
                  </Text>
                </View>
                <View style={styles.qCardRight}>
                  <Text style={[styles.qScore, { color: scoreColor(score) }]}>{score.toFixed(1)}</Text>
                  <Feather name={isExpanded ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} />
                </View>
              </View>

              {isExpanded && (
                <View style={styles.qCardExpanded}>
                  <View style={[styles.scoreRow, { borderColor: colors.border }]}>
                    <ScoreCircle score={score} size={64} label="Score" />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.feedbackLabel, { color: colors.mutedForeground }]}>Feedback</Text>
                      <Text style={[styles.feedbackText, { color: colors.foreground }]}>{ans?.feedback ?? "—"}</Text>
                    </View>
                  </View>

                  {ans?.userAnswer && (
                    <View style={[styles.answerBox, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                      <Text style={[styles.answerBoxLabel, { color: colors.mutedForeground }]}>Your Answer</Text>
                      <Text style={[styles.answerBoxText, { color: colors.foreground }]}>{ans.userAnswer}</Text>
                    </View>
                  )}

                  {ans?.idealAnswer && (
                    <View style={[styles.answerBox, { backgroundColor: colors.success + "10", borderColor: colors.success + "33" }]}>
                      <Text style={[styles.answerBoxLabel, { color: colors.success }]}>Ideal Answer</Text>
                      <Text style={[styles.answerBoxText, { color: colors.foreground }]}>{ans.idealAnswer}</Text>
                    </View>
                  )}

                  {(ans?.strengths || ans?.weaknesses) && (
                    <View style={styles.strengthWeakRow}>
                      {ans.strengths && (
                        <View style={[styles.swBox, { backgroundColor: colors.success + "10", borderColor: colors.success + "33", flex: 1 }]}>
                          <Feather name="check-circle" size={13} color={colors.success} />
                          <Text style={[styles.swText, { color: colors.foreground }]}>{ans.strengths}</Text>
                        </View>
                      )}
                      {ans.weaknesses && (
                        <View style={[styles.swBox, { backgroundColor: colors.destructive + "10", borderColor: colors.destructive + "33", flex: 1 }]}>
                          <Feather name="x-circle" size={13} color={colors.destructive} />
                          <Text style={[styles.swText, { color: colors.foreground }]}>{ans.weaknesses}</Text>
                        </View>
                      )}
                    </View>
                  )}

                  <ReferenceInsight
                    topic={q.topic}
                    subTopic={q.subTopic}
                    questionType={q.questionType}
                    similarQuestion={q.similarQuestion}
                    companyTags={q.companyTags}
                  />
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          style={[styles.doneBtn, { backgroundColor: colors.primary }]}
          onPress={handleDone}
          activeOpacity={0.85}
        >
          <Feather name="home" size={18} color={colors.primaryForeground} />
          <Text style={[styles.doneBtnText, { color: colors.primaryForeground }]}>Back to Dashboard</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 15, fontFamily: "Inter_400Regular" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  content: { padding: 16, gap: 16 },
  summaryCard: { padding: 20, gap: 4 },
  summaryRole: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#fff" },
  summaryMeta: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.75)", textTransform: "capitalize", marginBottom: 16 },
  metricsRow: { flexDirection: "row", alignItems: "center" },
  metric: { flex: 1, alignItems: "center", gap: 4 },
  metricValue: { fontSize: 24, fontFamily: "Inter_700Bold", color: "#fff" },
  metricLabel: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.75)" },
  metricDivider: { width: 1, height: 40, backgroundColor: "rgba(255,255,255,0.2)" },
  analysisSection: { gap: 10 },
  analysisPill: { padding: 14, borderRadius: 12, borderWidth: 1, gap: 8 },
  analysisHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  analysisTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  bulletRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  bullet: { width: 6, height: 6, borderRadius: 3, marginTop: 7 },
  bulletText: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 20 },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  qCard: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  qCardHeader: { flexDirection: "row", alignItems: "flex-start", padding: 14, gap: 10 },
  qCardLeft: { flex: 1, flexDirection: "row", gap: 10, alignItems: "flex-start" },
  qNumber: { width: 32, height: 32, borderRadius: 9, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  qNumberText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  qText: { fontSize: 14, fontFamily: "Inter_500Medium", flex: 1, lineHeight: 20 },
  qCardRight: { alignItems: "center", gap: 4, flexShrink: 0 },
  qScore: { fontSize: 16, fontFamily: "Inter_700Bold" },
  qCardExpanded: { paddingHorizontal: 14, paddingBottom: 14, gap: 10 },
  scoreRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingTop: 4, borderTopWidth: 1, paddingBottom: 10 },
  feedbackLabel: { fontSize: 12, fontFamily: "Inter_500Medium", marginBottom: 4 },
  feedbackText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  answerBox: { borderRadius: 10, borderWidth: 1, padding: 12, gap: 4 },
  answerBoxLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  answerBoxText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  strengthWeakRow: { flexDirection: "row", gap: 8 },
  swBox: { borderRadius: 8, borderWidth: 1, padding: 10, gap: 4 },
  swText: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  doneBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    borderRadius: 14,
    marginTop: 4,
  },
  doneBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
});

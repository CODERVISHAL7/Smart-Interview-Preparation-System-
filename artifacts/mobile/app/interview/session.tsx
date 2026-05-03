import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSubmitAnswer, useEvaluateInterview } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { useInterview } from "@/context/InterviewContext";
import { ReferenceInsight } from "@/components/ReferenceInsight";

export default function SessionScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    questions,
    sessionId,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    answers,
    setAnswer,
    startTime,
  } = useInterview();

  const submitAnswer = useSubmitAnswer();
  const evaluateInterview = useEvaluateInterview();

  const [localAnswer, setLocalAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedIds, setSubmittedIds] = useState<Set<number>>(new Set());

  const currentQuestion = questions[currentQuestionIndex];
  const progress = (currentQuestionIndex + 1) / questions.length;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const currentAnswer = answers.find((a) => a.questionId === currentQuestion?.id)?.userAnswer ?? "";
  const isCurrentSubmitted = currentQuestion ? submittedIds.has(currentQuestion.id) : false;

  const handleSubmitAnswer = async () => {
    if (!localAnswer.trim() || !currentQuestion || !sessionId) return;
    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      await submitAnswer.mutateAsync({
        data: { sessionId, questionId: currentQuestion.id, userAnswer: localAnswer },
      });
      setAnswer(currentQuestion.id, localAnswer);
      setSubmittedIds((prev) => new Set([...prev, currentQuestion.id]));
    } catch (err) {
      Alert.alert("Error", "Failed to save answer. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setLocalAnswer("");
    }
  };

  const handleEvaluate = async () => {
    if (!sessionId) return;
    const timeTaken = startTime ? Math.round((Date.now() - startTime) / 1000) : 0;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      const result = await evaluateInterview.mutateAsync({
        data: { sessionId, timeTakenSeconds: timeTaken },
      });

      router.replace({
        pathname: "/interview/report",
        params: { sessionId: sessionId.toString() },
      });
    } catch (err) {
      Alert.alert("Error", "Failed to evaluate interview. Please try again.");
    }
  };

  const allAnswered = questions.every((q) => submittedIds.has(q.id));

  if (!currentQuestion) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => Alert.alert("Exit Interview", "Your progress will be lost. Are you sure?", [
            { text: "Cancel", style: "cancel" },
            { text: "Exit", style: "destructive", onPress: () => router.replace("/(tabs)") },
          ])}
        >
          <Feather name="x" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.progressInfo}>
          <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>
            Question {currentQuestionIndex + 1} of {questions.length}
          </Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <View style={[styles.progressBarBg, { backgroundColor: colors.muted }]}>
        <View style={[styles.progressBarFill, { width: `${progress * 100}%`, backgroundColor: colors.primary }]} />
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 160 }]}
        keyboardShouldPersistTaps="handled"
        bottomOffset={20}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.questionHeader}>
          <View style={[styles.topicBadge, { backgroundColor: colors.primary + "18" }]}>
            <Text style={[styles.topicText, { color: colors.primary }]}>{currentQuestion.topic}</Text>
          </View>
          <View style={[styles.typeBadge, { backgroundColor: colors.muted }]}>
            <Text style={[styles.typeText, { color: colors.mutedForeground }]}>{currentQuestion.questionType}</Text>
          </View>
        </View>

        <Text style={[styles.question, { color: colors.foreground }]}>{currentQuestion.question}</Text>

        <ReferenceInsight
          topic={currentQuestion.topic}
          subTopic={currentQuestion.subTopic}
          questionType={currentQuestion.questionType}
          similarQuestion={currentQuestion.similarQuestion}
          companyTags={currentQuestion.companyTags}
        />

        <View style={styles.answerSection}>
          <Text style={[styles.answerLabel, { color: colors.foreground }]}>Your Answer</Text>
          {isCurrentSubmitted ? (
            <View style={[styles.submittedAnswer, { backgroundColor: colors.card, borderColor: colors.success + "44" }]}>
              <View style={styles.submittedBadge}>
                <Feather name="check-circle" size={14} color={colors.success} />
                <Text style={[styles.submittedText, { color: colors.success }]}>Submitted</Text>
              </View>
              <Text style={[styles.answerPreview, { color: colors.foreground }]}>{currentAnswer}</Text>
            </View>
          ) : (
            <TextInput
              style={[
                styles.answerInput,
                { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground },
              ]}
              value={localAnswer}
              onChangeText={setLocalAnswer}
              placeholder="Type your answer here..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          )}
        </View>
      </KeyboardAwareScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background, paddingBottom: insets.bottom + 16, borderTopColor: colors.border }]}>
        {!isCurrentSubmitted ? (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.primary, opacity: !localAnswer.trim() || isSubmitting ? 0.6 : 1 }]}
            onPress={handleSubmitAnswer}
            disabled={!localAnswer.trim() || isSubmitting}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <>
                <Feather name="check" size={18} color={colors.primaryForeground} />
                <Text style={[styles.actionBtnText, { color: colors.primaryForeground }]}>Submit Answer</Text>
              </>
            )}
          </TouchableOpacity>
        ) : isLastQuestion ? (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: allAnswered ? colors.success : colors.muted }]}
            onPress={handleEvaluate}
            disabled={!allAnswered || evaluateInterview.isPending}
            activeOpacity={0.85}
          >
            {evaluateInterview.isPending ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#fff" />
                <Text style={[styles.actionBtnText, { color: "#fff" }]}>AI is evaluating...</Text>
              </View>
            ) : (
              <>
                <Feather name="cpu" size={18} color={allAnswered ? "#fff" : colors.mutedForeground} />
                <Text style={[styles.actionBtnText, { color: allAnswered ? "#fff" : colors.mutedForeground }]}>
                  {allAnswered ? "Get AI Evaluation" : `Answer all ${questions.length} questions`}
                </Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.primary }]}
            onPress={handleNext}
            activeOpacity={0.85}
          >
            <Text style={[styles.actionBtnText, { color: colors.primaryForeground }]}>Next Question</Text>
            <Feather name="arrow-right" size={18} color={colors.primaryForeground} />
          </TouchableOpacity>
        )}

        <View style={styles.dotRow}>
          {questions.map((q, i) => (
            <TouchableOpacity
              key={q.id}
              onPress={() => { setCurrentQuestionIndex(i); setLocalAnswer(""); }}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    submittedIds.has(q.id)
                      ? colors.success
                      : i === currentQuestionIndex
                      ? colors.primary
                      : colors.border,
                  width: i === currentQuestionIndex ? 20 : 8,
                },
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  progressInfo: { alignItems: "center" },
  progressLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  progressBarBg: { height: 3 },
  progressBarFill: { height: "100%", borderRadius: 2 },
  content: { padding: 20, gap: 16 },
  questionHeader: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  topicBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  topicText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  typeText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  question: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 26,
  },
  answerSection: { gap: 10 },
  answerLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  answerInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    minHeight: 140,
    lineHeight: 22,
  },
  submittedAnswer: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  submittedBadge: { flexDirection: "row", alignItems: "center", gap: 6 },
  submittedText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  answerPreview: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 22 },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 15,
    borderRadius: 13,
  },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  actionBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  dotRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5 },
  dot: { height: 8, borderRadius: 4 },
});

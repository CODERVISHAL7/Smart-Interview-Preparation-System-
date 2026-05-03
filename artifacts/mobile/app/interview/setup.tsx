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
import { useStartInterview } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { useInterview } from "@/context/InterviewContext";

type InterviewType = "technical" | "hr" | "mixed";
type Difficulty = "easy" | "medium" | "hard";

const INTERVIEW_TYPES: { value: InterviewType; label: string; icon: string; desc: string }[] = [
  { value: "technical", label: "Technical", icon: "code", desc: "DSA, System Design, Coding" },
  { value: "hr", label: "HR / Behavioral", icon: "users", desc: "Soft skills, Culture fit" },
  { value: "mixed", label: "Mixed", icon: "layers", desc: "Technical + HR questions" },
];

const DIFFICULTIES: { value: Difficulty; label: string; color: string }[] = [
  { value: "easy", label: "Easy", color: "#10b981" },
  { value: "medium", label: "Medium", color: "#f59e0b" },
  { value: "hard", label: "Hard", color: "#ef4444" },
];

function OptionChip({
  selected,
  onPress,
  children,
  style,
}: {
  selected: boolean;
  onPress: () => void;
  children: React.ReactNode;
  style?: any;
}) {
  const colors = useColors();
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        {
          borderColor: selected ? colors.primary : colors.border,
          backgroundColor: selected ? colors.primary + "18" : colors.card,
        },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {children}
    </TouchableOpacity>
  );
}

export default function SetupScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { setSetup, setSessionId, setQuestions, setStartTime } = useInterview();
  const startInterview = useStartInterview();

  const [interviewType, setInterviewType] = useState<InterviewType>("technical");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [jobRole, setJobRole] = useState("");
  const [company, setCompany] = useState("");
  const [skills, setSkills] = useState("");

  const isValid = jobRole.trim().length > 0;

  const handleStart = async () => {
    if (!isValid) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      setSetup({ interviewType, difficulty, jobRole, company, skills });

      const result = await startInterview.mutateAsync({
        data: { interviewType, difficulty, jobRole, company: company || undefined, skills: skills || undefined },
      });

      setSessionId(result.session.id);
      setQuestions(result.questions as any);
      setStartTime(Date.now());
      router.push("/interview/session");
    } catch (err) {
      Alert.alert("Error", "Failed to generate questions. Please try again.");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Interview Setup</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Interview Type</Text>
          <View style={styles.typeGrid}>
            {INTERVIEW_TYPES.map((t) => (
              <OptionChip
                key={t.value}
                selected={interviewType === t.value}
                onPress={() => { Haptics.selectionAsync(); setInterviewType(t.value); }}
                style={styles.typeChip}
              >
                <View style={[styles.typeChipIcon, { backgroundColor: interviewType === t.value ? colors.primary + "22" : colors.muted }]}>
                  <Feather name={t.icon as any} size={18} color={interviewType === t.value ? colors.primary : colors.mutedForeground} />
                </View>
                <Text style={[styles.typeChipLabel, { color: interviewType === t.value ? colors.primary : colors.foreground }]}>
                  {t.label}
                </Text>
                <Text style={[styles.typeChipDesc, { color: colors.mutedForeground }]}>{t.desc}</Text>
              </OptionChip>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Difficulty</Text>
          <View style={styles.diffRow}>
            {DIFFICULTIES.map((d) => (
              <TouchableOpacity
                key={d.value}
                style={[
                  styles.diffChip,
                  {
                    borderColor: difficulty === d.value ? d.color : colors.border,
                    backgroundColor: difficulty === d.value ? d.color + "18" : colors.card,
                    flex: 1,
                  },
                ]}
                onPress={() => { Haptics.selectionAsync(); setDifficulty(d.value); }}
                activeOpacity={0.8}
              >
                <Text style={[styles.diffLabel, { color: difficulty === d.value ? d.color : colors.foreground }]}>
                  {d.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Job Role <Text style={{ color: colors.destructive }}>*</Text></Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            value={jobRole}
            onChangeText={setJobRole}
            placeholder="e.g. Software Engineer, Data Analyst"
            placeholderTextColor={colors.mutedForeground}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.foreground }]}>
            Company <Text style={[styles.optional, { color: colors.mutedForeground }]}>(optional)</Text>
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            value={company}
            onChangeText={setCompany}
            placeholder="e.g. Google, Amazon, TCS"
            placeholderTextColor={colors.mutedForeground}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.foreground }]}>
            Skills / Description <Text style={[styles.optional, { color: colors.mutedForeground }]}>(optional)</Text>
          </Text>
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            value={skills}
            onChangeText={setSkills}
            placeholder="e.g. React, Node.js, System Design, 2 years experience"
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <View style={[styles.infoBox, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}>
          <Feather name="info" size={14} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.primary }]}>
            AI will generate 10 context-aware questions based on your selections
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background, paddingBottom: insets.bottom + 20, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.startBtn,
            { backgroundColor: isValid ? colors.primary : colors.muted },
          ]}
          onPress={handleStart}
          disabled={!isValid || startInterview.isPending}
          activeOpacity={0.85}
        >
          {startInterview.isPending ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.primaryForeground} />
              <Text style={[styles.startBtnText, { color: colors.primaryForeground }]}>
                Generating questions...
              </Text>
            </View>
          ) : (
            <View style={styles.loadingRow}>
              <Feather name="cpu" size={18} color={isValid ? colors.primaryForeground : colors.mutedForeground} />
              <Text style={[styles.startBtnText, { color: isValid ? colors.primaryForeground : colors.mutedForeground }]}>
                Generate 10 Questions
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  content: {
    padding: 20,
    gap: 8,
  },
  section: {
    gap: 10,
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  optional: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  typeGrid: {
    gap: 10,
  },
  chip: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 14,
  },
  typeChip: {
    gap: 6,
  },
  typeChipIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  typeChipLabel: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  typeChipDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  diffRow: {
    flexDirection: "row",
    gap: 10,
  },
  diffChip: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
  },
  diffLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  textArea: {
    minHeight: 80,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 4,
  },
  infoText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    flex: 1,
    lineHeight: 18,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderTopWidth: 1,
  },
  startBtn: {
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  startBtnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
});

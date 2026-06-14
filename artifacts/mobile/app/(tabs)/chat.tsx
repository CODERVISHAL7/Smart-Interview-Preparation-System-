import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSendChatMessage } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  { icon: "user", text: "How do I answer 'Tell me about yourself'?" },
  { icon: "code", text: "Explain Big O notation simply" },
  { icon: "star", text: "STAR method for behavioral questions" },
  { icon: "server", text: "How to prepare for system design?" },
  { icon: "zap", text: "Common React interview questions" },
  { icon: "trending-up", text: "Salary negotiation tips" },
];

function TypingDots({ color }: { color: string }) {
  return (
    <View style={styles.dots}>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={[styles.dot, { backgroundColor: color, opacity: 0.4 + i * 0.2 }]}
        />
      ))}
    </View>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const colors = useColors();
  const isUser = msg.role === "user";

  return (
    <View style={[styles.bubbleRow, isUser ? styles.bubbleRowUser : styles.bubbleRowAI]}>
      {!isUser && (
        <LinearGradient
          colors={[colors.primary, colors.accent ?? colors.primary]}
          style={styles.aiBadge}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Feather name="zap" size={12} color="#fff" />
        </LinearGradient>
      )}
      <View
        style={[
          styles.bubble,
          isUser
            ? [styles.userBubble, { backgroundColor: colors.primary }]
            : [styles.aiBubble, { backgroundColor: colors.card, borderColor: colors.border }],
        ]}
      >
        <Text
          style={[
            styles.bubbleText,
            { color: isUser ? colors.primaryForeground : colors.foreground },
          ]}
        >
          {msg.content}
        </Text>
      </View>
    </View>
  );
}

export default function ChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi! I'm your AI interview coach 🚀\n\nAsk me anything — technical concepts, behavioral answers, company-specific prep, or salary tips. I'm here to help you land the job!",
    },
  ]);
  const [input, setInput] = useState("");
  const flatListRef = useRef<FlatList>(null);
  const sendMessage = useSendChatMessage();
  const isLoading = sendMessage.isPending;

  const topPaddingWeb = Platform.OS === "web" ? 67 : 0;

  const handleSend = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || isLoading) return;
    setInput("");

    const userMsg: Message = { id: Date.now().toString(), role: "user", content };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);

    try {
      const apiMessages = updatedMessages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

      const result = await sendMessage.mutateAsync({
        data: { messages: apiMessages.length > 0 ? apiMessages : [{ role: "user", content }] },
      });

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: result.reply,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I couldn't respond right now. Please try again.",
      };
      setMessages((prev) => [...prev, errMsg]);
    }
  };

  const handleReset = () => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content:
          "Hi! I'm your AI interview coach 🚀\n\nAsk me anything — technical concepts, behavioral answers, company-specific prep, or salary tips. I'm here to help you land the job!",
      },
    ]);
  };

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const showSuggestions = messages.length === 1;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? tabBarHeight : 0}
    >
      <View style={[styles.header, { paddingTop: insets.top + topPaddingWeb, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <LinearGradient
          colors={[colors.primary, colors.accent ?? colors.primary]}
          style={styles.headerIcon}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Feather name="zap" size={18} color="#fff" />
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>AI Coach</Text>
          <View style={styles.headerStatusRow}>
            <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
            <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
              Online · Powered by GPT
            </Text>
          </View>
        </View>
        {messages.length > 1 && (
          <TouchableOpacity
            style={[styles.clearBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
            onPress={handleReset}
            activeOpacity={0.7}
          >
            <Feather name="rotate-ccw" size={13} color={colors.mutedForeground} />
            <Text style={[styles.clearBtnText, { color: colors.mutedForeground }]}>Reset</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={[styles.messageList, { paddingBottom: 16 }]}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          isLoading ? (
            <View style={[styles.bubbleRow, styles.bubbleRowAI, { marginTop: 8 }]}>
              <LinearGradient
                colors={[colors.primary, colors.accent ?? colors.primary]}
                style={styles.aiBadge}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Feather name="zap" size={12} color="#fff" />
              </LinearGradient>
              <View style={[styles.bubble, styles.aiBubble, { backgroundColor: colors.card, borderColor: colors.border, paddingVertical: 14 }]}>
                <TypingDots color={colors.primary} />
              </View>
            </View>
          ) : showSuggestions ? (
            <View style={styles.suggestionsWrap}>
              <Text style={[styles.suggestLabel, { color: colors.mutedForeground }]}>
                ✦ Suggested topics
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll} contentContainerStyle={{ gap: 8, paddingRight: 16 }}>
                {SUGGESTIONS.map((s) => (
                  <TouchableOpacity
                    key={s.text}
                    style={[styles.suggestionChip, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => handleSend(s.text)}
                    activeOpacity={0.75}
                  >
                    <Feather name={s.icon as any} size={13} color={colors.primary} />
                    <Text style={[styles.suggestionText, { color: colors.foreground }]}>{s.text}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ) : null
        }
        renderItem={({ item }) => <MessageBubble msg={item} />}
      />

      <View
        style={[
          styles.inputBar,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            paddingBottom: tabBarHeight + (Platform.OS === "android" ? 8 : 0),
          },
        ]}
      >
        <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            value={input}
            onChangeText={setInput}
            placeholder="Ask your interview coach..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            maxLength={2000}
            returnKeyType="send"
            onSubmitEditing={() => handleSend()}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              {
                backgroundColor: input.trim() && !isLoading ? colors.primary : colors.muted,
              },
            ]}
            onPress={() => handleSend()}
            disabled={!input.trim() || isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Feather
                name="send"
                size={15}
                color={input.trim() ? colors.primaryForeground : colors.mutedForeground}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 16, fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
  headerStatusRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  headerSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  clearBtnText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  messageList: { paddingHorizontal: 16, paddingTop: 16, gap: 12 },
  bubbleRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  bubbleRowUser: { justifyContent: "flex-end" },
  bubbleRowAI: { justifyContent: "flex-start" },
  aiBadge: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginBottom: 2,
  },
  bubble: { maxWidth: "78%", borderRadius: 18, padding: 13 },
  userBubble: { borderBottomRightRadius: 5 },
  aiBubble: { borderWidth: StyleSheet.hairlineWidth, borderBottomLeftRadius: 5 },
  bubbleText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22 },
  dots: { flexDirection: "row", gap: 4, alignItems: "center" },
  dot: { width: 7, height: 7, borderRadius: 4 },
  suggestionsWrap: { marginTop: 16, gap: 10 },
  suggestLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5, paddingHorizontal: 2 },
  chipsScroll: { marginTop: 2 },
  suggestionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1,
  },
  suggestionText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  inputBar: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, paddingTop: 10 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    maxHeight: 100,
    paddingVertical: 5,
    lineHeight: 20,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
});

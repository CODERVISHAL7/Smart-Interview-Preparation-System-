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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSendChatMessage } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "How do I answer 'Tell me about yourself'?",
  "Explain Big O notation simply",
  "STAR method for behavioral questions",
  "How to prepare for system design?",
  "Common React interview questions",
  "Salary negotiation tips",
];

function MessageBubble({ msg }: { msg: Message }) {
  const colors = useColors();
  const isUser = msg.role === "user";

  return (
    <View style={[styles.bubbleRow, isUser ? styles.bubbleRowUser : styles.bubbleRowAI]}>
      {!isUser && (
        <View style={[styles.aiBadge, { backgroundColor: colors.primary }]}>
          <Feather name="cpu" size={13} color="#fff" />
        </View>
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
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi! I'm your AI interview coach 👋\n\nAsk me anything about interviews — technical concepts, how to answer tricky questions, company-specific prep, or career advice. I'm here to help!",
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
        .map((m) => ({ role: m.role, content: m.content }));

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

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const showSuggestions = messages.length === 1;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.header,
            {
              paddingTop: insets.top + topPaddingWeb + 12,
              borderBottomColor: colors.border,
              backgroundColor: colors.background,
            },
          ]}
        >
          <View style={[styles.headerIcon, { backgroundColor: colors.primary }]}>
            <Feather name="cpu" size={18} color="#fff" />
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>AI Coach</Text>
            <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
              Your interview prep assistant
            </Text>
          </View>
          {messages.length > 1 && (
            <TouchableOpacity
              style={[styles.clearBtn, { borderColor: colors.border }]}
              onPress={() =>
                setMessages([
                  {
                    id: "welcome",
                    role: "assistant",
                    content:
                      "Hi! I'm your AI interview coach 👋\n\nAsk me anything about interviews — technical concepts, how to answer tricky questions, company-specific prep, or career advice. I'm here to help!",
                  },
                ])
              }
              activeOpacity={0.7}
            >
              <Feather name="refresh-cw" size={14} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={[
            styles.messageList,
            { paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            isLoading ? (
              <View style={[styles.bubbleRow, styles.bubbleRowAI]}>
                <View style={[styles.aiBadge, { backgroundColor: colors.primary }]}>
                  <Feather name="cpu" size={13} color="#fff" />
                </View>
                <View style={[styles.bubble, styles.aiBubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              </View>
            ) : showSuggestions ? (
              <View style={styles.suggestionsWrap}>
                <Text style={[styles.suggestLabel, { color: colors.mutedForeground }]}>
                  Try asking:
                </Text>
                <View style={styles.suggestions}>
                  {SUGGESTIONS.map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={[styles.suggestionChip, { backgroundColor: colors.card, borderColor: colors.border }]}
                      onPress={() => handleSend(s)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.suggestionText, { color: colors.foreground }]}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
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
              paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 12),
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
              <Feather
                name="send"
                size={16}
                color={input.trim() && !isLoading ? colors.primaryForeground : colors.mutedForeground}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  headerSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  clearBtn: {
    marginLeft: "auto",
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  messageList: { paddingHorizontal: 16, paddingTop: 16, gap: 12 },
  bubbleRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, maxWidth: "100%" },
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
  bubble: { maxWidth: "78%", borderRadius: 16, padding: 12 },
  userBubble: { borderBottomRightRadius: 4 },
  aiBubble: { borderWidth: 1, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 21 },
  suggestionsWrap: { marginTop: 12, gap: 8 },
  suggestLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  suggestions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  suggestionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  suggestionText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  inputBar: { borderTopWidth: 1, paddingHorizontal: 12, paddingTop: 10 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    maxHeight: 100,
    paddingVertical: 6,
    lineHeight: 20,
  },
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
});

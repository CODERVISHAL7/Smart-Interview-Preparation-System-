import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { useSignIn, useSSO } from "@clerk/expo";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import { Link, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startSSOFlow } = useSSO();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEmailSignIn = async () => {
    if (!isLoaded || !signIn) return;
    setLoading(true);
    setError("");
    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });
      if (result.status === "complete") {
        await setActive!({ session: result.createdSessionId });
        router.replace("/(tabs)");
      }
    } catch (err: any) {
      const msg = err?.errors?.[0]?.message ?? err?.message ?? "Sign in failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = useCallback(async () => {
    try {
      const { createdSessionId, setActive: sa } = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl: AuthSession.makeRedirectUri(),
      });
      if (createdSessionId && sa) {
        await sa({ session: createdSessionId });
        router.replace("/(tabs)");
      }
    } catch (err: any) {
      setError("Google sign-in failed. Please try again.");
    }
  }, [startSSOFlow, router]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          {
            backgroundColor: colors.background,
            paddingTop: insets.top + 40,
            paddingBottom: insets.bottom + 20,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <View style={[styles.logoBox, { backgroundColor: colors.primary }]}>
            <Feather name="cpu" size={28} color="#fff" />
          </View>
          <Text style={[styles.appName, { color: colors.foreground }]}>InterviewAI</Text>
        </View>

        <Text style={[styles.title, { color: colors.foreground }]}>Welcome back</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Sign in to continue your practice
        </Text>

        <TouchableOpacity
          style={[styles.googleBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={handleGoogleSignIn}
          activeOpacity={0.8}
        >
          <Feather name="globe" size={18} color={colors.foreground} />
          <Text style={[styles.googleBtnText, { color: colors.foreground }]}>
            Continue with Google
          </Text>
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>or</Text>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.foreground }]}>Email</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground },
            ]}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.foreground }]}>Password</Text>
          <View
            style={[
              styles.passwordRow,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <TextInput
              style={[styles.passwordInput, { color: colors.foreground }]}
              value={password}
              onChangeText={setPassword}
              placeholder="Your password"
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry={!showPassword}
              autoComplete="password"
            />
            <TouchableOpacity
              onPress={() => setShowPassword((v) => !v)}
              style={styles.eyeBtn}
            >
              <Feather
                name={showPassword ? "eye-off" : "eye"}
                size={18}
                color={colors.mutedForeground}
              />
            </TouchableOpacity>
          </View>
        </View>

        {!!error && (
          <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
        )}

        <TouchableOpacity
          style={[
            styles.primaryBtn,
            {
              backgroundColor: colors.primary,
              opacity: !email || !password || loading ? 0.6 : 1,
            },
          ]}
          onPress={handleEmailSignIn}
          disabled={!email || !password || loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryBtnText}>Sign In</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
            Don't have an account?{" "}
          </Text>
          <Link href="/(auth)/sign-up" asChild>
            <TouchableOpacity>
              <Text style={[styles.footerLink, { color: colors.primary }]}>Sign up</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    gap: 16,
  },
  logoContainer: {
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  appName: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginBottom: 4,
  },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  googleBtnText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  divider: { flex: 1, height: 1 },
  dividerText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  inputGroup: { gap: 6 },
  label: { fontSize: 14, fontFamily: "Inter_500Medium" },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  eyeBtn: { padding: 4 },
  errorText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  primaryBtn: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 4,
  },
  primaryBtnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 4,
  },
  footerText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  footerLink: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
});

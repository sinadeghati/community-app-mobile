import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import authStorage from "../utils/authStorage";
import { API } from "../../lib/api";

const heroSlides = [
  {
    id: "hafez",
    title: "Welcome to Persian Map",
    subtitle: "Discover Persian businesses, events, and community near you.",
    image:
      "https://images.unsplash.com/photo-1605723517503-3cadb5818a0c?q=80&w=1200",
    badge: "Persian Community",
  },
  {
    id: "persepolis",
    title: "Persian culture, everywhere",
    subtitle: "From San Diego to LA, Toronto, and beyond.",
    image:
      "https://images.unsplash.com/photo-1578898886225-c7c894047899?q=80&w=1200",
    badge: "Culture",
  },
  {
    id: "event",
    title: "Find what’s happening tonight",
    subtitle: "Concerts, Nowruz, Yalda, festivals, and community events.",
    image:
      "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=1200",
    badge: "Events",
  },
];

const featuredCards = [
  {
    id: "1",
    title: "Fair Auto Repair",
    subtitle: "Featured business",
    image:
      "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?q=80&w=900",
    tag: "FEATURED",
  },
  {
    id: "2",
    title: "Persian Events",
    subtitle: "Tonight & this weekend",
    image:
      "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=900",
    tag: "EVENT",
  },
];

const normalizeUsername = (value: string) => {
  return value.trim().toLowerCase();
};

const normalizePassword = (value: string) => {
  return value.trim();
};

export default function HomeLoginV2() {
  const [slideIndex, setSlideIndex] = useState(0);
  const [mode, setMode] = useState<"home" | "login">("home");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
  const restoreSession = async () => {
    const tokens = await authStorage.getTokens();

    if (tokens?.access) {
      router.replace("/(tabs)/explore");
    }
  };

  restoreSession();
}, []);

  const activeSlide = heroSlides[slideIndex];

  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % heroSlides.length);
    }, 4500);

    return () => clearInterval(timer);
  }, []);

  const passwordHints = useMemo(() => {
    const p = password;

    return {
      length: p.length >= 8,
      upper: /[A-Z]/.test(p),
      lower: /[a-z]/.test(p),
      number: /\d/.test(p),
      symbol: /[^A-Za-z0-9]/.test(p),
    };
  }, [password]);

  const handleLogin = async () => {
    const cleanUsername = normalizeUsername(username);
    const cleanPassword = normalizePassword(password);

    if (!cleanUsername || !cleanPassword) {
      Alert.alert("Missing information", "Please enter your username/email and password.");
      return;
    }

    try {
      setLoading(true);

      const result = await API.login(
        cleanUsername,
        cleanPassword,
      );

      const access = result?.access || result?.tokens?.access;
      const refresh = result?.refresh || result?.tokens?.refresh;

      if (!access) {
        Alert.alert("Login failed", "Invalid username or password.");
        return;
      }

      await authStorage.setTokens({
        access,
        refresh,
      });

      router.replace("/(tabs)/explore");
    } catch (e: any) {
      console.log("Login V2 error:", e?.response?.data || e);
      Alert.alert(
        "Login failed",
        "Please check your username/password. Usernames are not case-sensitive, but passwords must match exactly."
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <ImageBackground
      source={{ uri: activeSlide.image }}
      resizeMode="cover"
      style={{ flex: 1 }}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.48)",
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              flexGrow: 1,
              paddingBottom: 40,
            }}
          >
            <View
              style={{
                paddingTop: 72,
                paddingHorizontal: 24,
              }}
            >
              <View
                style={{
                  alignSelf: "flex-start",
                  backgroundColor: "rgba(255,255,255,0.16)",
                  borderRadius: 999,
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.18)",
                }}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontWeight: "900",
                    fontSize: 12,
                    letterSpacing: 0.5,
                  }}
                >
                  {activeSlide.badge}
                </Text>
              </View>

              <Text
                style={{
                  marginTop: 22,
                  fontSize: 38,
                  lineHeight: 44,
                  fontWeight: "900",
                  color: "#fff",
                }}
              >
                {activeSlide.title}
              </Text>

              <Text
                style={{
                  marginTop: 14,
                  color: "rgba(255,255,255,0.92)",
                  fontSize: 16,
                  lineHeight: 25,
                }}
              >
                {activeSlide.subtitle}
              </Text>

              <View
                style={{
                  flexDirection: "row",
                  marginTop: 22,
                }}
              >
                {heroSlides.map((_, index) => (
                  <View
                    key={index}
                    style={{
                      width: slideIndex === index ? 28 : 8,
                      height: 8,
                      borderRadius: 999,
                      backgroundColor:
                        slideIndex === index ? "#fff" : "rgba(255,255,255,0.35)",
                      marginRight: 8,
                    }}
                  />
                ))}
              </View>
            </View>

            <View style={{ marginTop: "auto", paddingHorizontal: 18 }}>
              {mode === "home" ? (
                <View
                  style={{
                    backgroundColor: "rgba(255,255,255,0.96)",
                    borderRadius: 34,
                    padding: 22,
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.3)",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 28,
                      fontWeight: "900",
                      color: "#111",
                    }}
                  >
                    Explore the Persian community
                  </Text>

                  <Text
                    style={{
                      marginTop: 10,
                      color: "#666",
                      lineHeight: 24,
                      fontSize: 15,
                    }}
                  >
                    Businesses, concerts, events, food, services, and everything
                    Persian — all in one place.
                  </Text>

                  <View style={{ marginTop: 22 }}>
                    {featuredCards.map((card) => (
                      <View
                        key={card.id}
                        style={{
                          height: 86,
                          borderRadius: 22,
                          overflow: "hidden",
                          marginBottom: 12,
                        }}
                      >
                        <ImageBackground
                          source={{ uri: card.image }}
                          style={{
                            flex: 1,
                            justifyContent: "flex-end",
                          }}
                        >
                          <View
                            style={{
                              flex: 1,
                              backgroundColor: "rgba(0,0,0,0.35)",
                              justifyContent: "flex-end",
                              padding: 14,
                            }}
                          >
                            <View
                              style={{
                                alignSelf: "flex-start",
                                backgroundColor:
                                  card.tag === "FEATURED"
                                    ? "#d4af37"
                                    : "#7c3aed",
                                borderRadius: 999,
                                paddingHorizontal: 10,
                                paddingVertical: 4,
                              }}
                            >
                              <Text
                                style={{
                                  color: "#fff",
                                  fontSize: 11,
                                  fontWeight: "900",
                                }}
                              >
                                {card.tag}
                              </Text>
                            </View>

                            <Text
                              style={{
                                marginTop: 8,
                                color: "#fff",
                                fontWeight: "900",
                                fontSize: 17,
                              }}
                            >
                              {card.title}
                            </Text>

                            <Text
                              style={{
                                color: "rgba(255,255,255,0.88)",
                                marginTop: 2,
                              }}
                            >
                              {card.subtitle}
                            </Text>
                          </View>
                        </ImageBackground>
                      </View>
                    ))}
                  </View>

                  <Pressable
                    onPress={() => setMode("login")}
                    style={{
                      height: 58,
                      borderRadius: 18,
                      backgroundColor: "#111",
                      alignItems: "center",
                      justifyContent: "center",
                      marginTop: 8,
                    }}
                  >
                    <Text
                      style={{
                        color: "#fff",
                        fontWeight: "900",
                        fontSize: 16,
                      }}
                    >
                      Continue
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => router.replace("/(tabs)/explore")}
                    style={{
                      marginTop: 16,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: "#555",
                        fontWeight: "700",
                      }}
                    >
                      Continue as guest
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <View
                  style={{
                    backgroundColor: "rgba(255,255,255,0.97)",
                    borderRadius: 34,
                    padding: 22,
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.3)",
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        flex: 1,
                        fontSize: 30,
                        fontWeight: "900",
                        color: "#111",
                      }}
                    >
                      Welcome back
                    </Text>

                    <Pressable onPress={() => setMode("home")}>
                      <Ionicons name="close" size={28} color="#111" />
                    </Pressable>
                  </View>

                  <Text
                    style={{
                      marginTop: 8,
                      color: "#666",
                      lineHeight: 22,
                    }}
                  >
                    Sign in to manage your business, events, favorites, and community profile.
                  </Text>

                  <View
                    style={{
                      marginTop: 22,
                      height: 58,
                      borderRadius: 18,
                      backgroundColor: "#f5f6f8",
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 16,
                    }}
                  >
                    <Ionicons name="person-outline" size={22} color="#666" />

                    <TextInput
                      value={username}
                      onChangeText={setUsername}
                      autoCapitalize="none"
                      autoCorrect={false}
                      placeholder="Username or email"
                      placeholderTextColor="#888"
                      style={{
                        flex: 1,
                        marginLeft: 12,
                        fontSize: 16,
                        color: "#111",
                      }}
                    />
                  </View>

                  <View
                    style={{
                      marginTop: 14,
                      height: 58,
                      borderRadius: 18,
                      backgroundColor: "#f5f6f8",
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 16,
                    }}
                  >
                    <Ionicons name="lock-closed-outline" size={22} color="#666" />

                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      textContentType="password"
                      passwordRules="minlength: 8;"
                      placeholder="Password"
                      placeholderTextColor="#888"
                      style={{
                        flex: 1,
                        marginLeft: 12,
                        fontSize: 16,
                        color: "#111",
                      }}
                    />

                    <Pressable onPress={() => setShowPassword(!showPassword)}>
                      <Ionicons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={22}
                        color="#666"
                      />
                    </Pressable>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginTop: 14,
                    }}
                  >
                    <Pressable
                      onPress={() => setRememberMe(!rememberMe)}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      <View
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 7,
                          backgroundColor: rememberMe ? "#111" : "#e5e7eb",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {rememberMe ? (
                          <Ionicons name="checkmark" size={15} color="#fff" />
                        ) : null}
                      </View>

                      <Text
                        style={{
                          marginLeft: 9,
                          color: "#444",
                          fontWeight: "600",
                        }}
                      >
                        Remember me
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() =>
                        Alert.alert(
                          "Forgot password",
                          "Password reset flow will be connected next."
                        )
                      }
                    >
                      <Text
                        style={{
                          color: "#2563eb",
                          fontWeight: "800",
                        }}
                      >
                        Forgot password?
                      </Text>
                    </Pressable>
                  </View>

                  <View style={{ marginTop: 18 }}>
                    <Text
                      style={{
                        color: "#666",
                        fontSize: 12,
                        marginBottom: 8,
                        fontWeight: "700",
                      }}
                    >
                      Password requirements
                    </Text>

                    <View style={{ gap: 5 }}>
                      {[
                        {
                          ok: passwordHints.length,
                          label: "At least 8 characters",
                        },
                        {
                          ok: passwordHints.upper,
                          label: "Uppercase letter",
                        },
                        {
                          ok: passwordHints.lower,
                          label: "Lowercase letter",
                        },
                        {
                          ok: passwordHints.number,
                          label: "Number",
                        },
                        {
                          ok: passwordHints.symbol,
                          label: "Special character",
                        },
                      ].map((item) => (
                        <View
                          key={item.label}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                          }}
                        >
                          <Ionicons
                            name={
                              item.ok
                                ? "checkmark-circle"
                                : "ellipse-outline"
                            }
                            size={16}
                            color={item.ok ? "#16a34a" : "#999"}
                          />

                          <Text
                            style={{
                              marginLeft: 7,
                              color: item.ok ? "#16a34a" : "#777",
                              fontSize: 12,
                              fontWeight: "600",
                            }}
                          >
                            {item.label}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <Pressable
                    onPress={handleLogin}
                    disabled={loading}
                    style={{
                      height: 58,
                      borderRadius: 18,
                      backgroundColor: "#111",
                      alignItems: "center",
                      justifyContent: "center",
                      marginTop: 22,
                      opacity: loading ? 0.7 : 1,
                    }}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text
                        style={{
                          color: "#fff",
                          fontWeight: "900",
                          fontSize: 16,
                        }}
                      >
                        Sign In
                      </Text>
                    )}
                  </Pressable>

                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "center",
                      marginTop: 18,
                    }}
                  >
                    <Text
                      style={{
                        color: "#666",
                        fontSize: 14,
                      }}
                    >
                      Don’t have an account?
                    </Text>

                    <Pressable onPress={() => router.push("/register")}>
                      <Text
                        style={{
                          marginLeft: 6,
                          color: "#0f9d91",
                          fontWeight: "800",
                          fontSize: 14,
                        }}
                      >
                        Create Account
                      </Text>
                    </Pressable>
                  </View>

                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginTop: 22,
                    }}
                  >
                    <View
                      style={{
                        flex: 1,
                        height: 1,
                        backgroundColor: "#e5e7eb",
                      }}
                    />

                    <Text
                      style={{
                        marginHorizontal: 10,
                        color: "#777",
                        fontWeight: "700",
                      }}
                    >
                      OR
                    </Text>

                    <View
                      style={{
                        flex: 1,
                        height: 1,
                        backgroundColor: "#e5e7eb",
                      }}
                    />
                  </View>

                  <View style={{ flexDirection: "row", gap: 10, marginTop: 18 }}>
                    <Pressable
                      onPress={() =>
                        Alert.alert("Google Login", "Coming soon.")
                      }
                      style={{
                        flex: 1,
                        height: 54,
                        borderRadius: 18,
                        backgroundColor: "#f5f6f8",
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "row",
                      }}
                    >
                      <Ionicons
                        name="logo-google"
                        size={20}
                        color="#111"
                      />
                      <Text
                        style={{
                          marginLeft: 8,
                          fontWeight: "800",
                          color: "#111",
                        }}
                      >
                        Google
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() =>
                        Alert.alert("Apple Login", "Coming soon.")
                      }
                      style={{
                        flex: 1,
                        height: 54,
                        borderRadius: 18,
                        backgroundColor: "#f5f6f8",
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "row",
                      }}
                    >
                      <Ionicons
                        name="logo-apple"
                        size={20}
                        color="#111"
                      />
                      <Text
                        style={{
                          marginLeft: 8,
                          fontWeight: "800",
                          color: "#111",
                        }}
                      >
                        Apple
                      </Text>
                    </Pressable>
                  </View>

                  <Pressable
                    onPress={() =>
                      Alert.alert(
                        "Create Business",
                        "Business onboarding flow will be connected next."
                      )
                    }
                    style={{
                      marginTop: 18,
                      height: 54,
                      borderRadius: 18,
                      backgroundColor: "#ede9fe",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: "#5b21b6",
                        fontWeight: "900",
                        fontSize: 15,
                      }}
                    >
                      Add Your Business
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => router.replace("/(tabs)/explore")}
                    style={{
                      marginTop: 18,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: "#666",
                        fontWeight: "700",
                      }}
                    >
                      Continue as guest
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </ImageBackground>
  );
}
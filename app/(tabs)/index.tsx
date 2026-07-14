import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Keyboard,
  PanResponder,
  Platform,
  Pressable,
  type KeyboardEvent,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import authStorage from "../utils/authStorage";
import {
  hydrateAuthSession,
  loadUserProfile,
  prepareSessionForUser,
} from "../../lib/userSessionStorage";
import { API } from "../../lib/api";
import { formatAuthError } from "../../lib/authErrors";
import {
  logLoaderDone,
  logLoaderStart,
  withTimeout,
} from "../../lib/asyncGuards";
import { theme } from "../../lib/theme";
import { useTranslation } from "../../lib/i18n";
import { HomeBottomVignette } from "../../components/home/HomeBottomVignette";
import { HomeBrandOverlay } from "../../components/home/HomeBrandOverlay";
import { HomeHeroCrossfade } from "../../components/home/HomeHeroCrossfade";
import { HomePromotionView } from "../../components/home/HomePromotionView";
import { HomeSlideIndicators } from "../../components/home/HomeSlideIndicators";
import { HomeWelcomeOverlay } from "../../components/home/HomeWelcomeOverlay";
import { homeLandingStyles } from "../../components/home/homeLandingStyles";
import type { HomeCarouselSlide } from "../../components/home/homeLandingTypes";
import {
  HOME_FALLBACK_SLIDE,
  getHomeCarouselSlides,
  getPrefetchSlideUris,
} from "../../components/home/homeSlideCatalog";
import { getActiveHomePromotion } from "../../components/home/homePromotions";

const SLIDE_INTERVAL_MS = 6000;
const SLIDE_FADE_MS = 900;
const LOGIN_FADE_MS = 260;
const SWIPE_THRESHOLD = 48;

const normalizeUsername = (value: string) => value.trim().toLowerCase();
const normalizePassword = (value: string) => value.trim();

const resolveDisplayName = (profile: Record<string, unknown> | null) => {
  const raw = String(
    profile?.name || profile?.username || profile?.email || ""
  ).trim();
  if (!raw) return "there";
  return raw.split("@")[0];
};

export default function HomeLoginV2() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const activePromotion = useMemo(() => getActiveHomePromotion(), []);

  const [visibleIndex, setVisibleIndex] = useState(0);
  const [targetIndex, setTargetIndex] = useState<number | null>(null);
  const visibleIndexRef = useRef(0);
  const targetIndexRef = useRef<number | null>(null);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [displayName, setDisplayName] = useState("there");
  const [authChecked, setAuthChecked] = useState(false);
  const [showLoginOverlay, setShowLoginOverlay] = useState(true);
  const [showWelcomeIntro, setShowWelcomeIntro] = useState(!activePromotion);

  const loginOpacity = useRef(new Animated.Value(1)).current;
  const loginLift = useRef(new Animated.Value(0)).current;
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasAuthCheckedRef = useRef(false);

  const heroSlides = useMemo(() => getHomeCarouselSlides(), []);

  const clampedVisibleIndex =
    heroSlides.length > 0
      ? Math.min(visibleIndex, heroSlides.length - 1)
      : 0;

  const visibleSlide: HomeCarouselSlide =
    heroSlides[clampedVisibleIndex] ?? HOME_FALLBACK_SLIDE;
  const transitioning =
    !activePromotion &&
    targetIndex !== null &&
    targetIndex !== clampedVisibleIndex;
  const targetSlide: HomeCarouselSlide =
    transitioning && targetIndex !== null
      ? heroSlides[targetIndex] ?? HOME_FALLBACK_SLIDE
      : visibleSlide;

  visibleIndexRef.current = clampedVisibleIndex;
  targetIndexRef.current = targetIndex;

  const commitTransition = useCallback(() => {
    setTargetIndex((pending) => {
      if (pending !== null) {
        setVisibleIndex(pending);
      }
      return null;
    });
  }, []);

  const requestSlide = useCallback(
    (index: number) => {
      if (activePromotion || heroSlides.length <= 1) return;
      const next =
        ((index % heroSlides.length) + heroSlides.length) % heroSlides.length;
      if (next === visibleIndexRef.current && targetIndexRef.current === null) {
        return;
      }
      setTargetIndex(next);
    },
    [activePromotion, heroSlides.length]
  );

  const resetAutoplay = useCallback(() => {
    if (autoplayRef.current) {
      clearInterval(autoplayRef.current);
      autoplayRef.current = null;
    }
    if (activePromotion || heroSlides.length <= 1) return;

    autoplayRef.current = setInterval(() => {
      if (targetIndexRef.current !== null) return;
      const next = (visibleIndexRef.current + 1) % heroSlides.length;
      setTargetIndex(next);
    }, SLIDE_INTERVAL_MS);
  }, [activePromotion, heroSlides.length]);

  const goToNextSlide = useCallback(() => {
    requestSlide(visibleIndexRef.current + 1);
    resetAutoplay();
  }, [requestSlide, resetAutoplay]);

  const goToPrevSlide = useCallback(() => {
    requestSlide(visibleIndexRef.current - 1);
    resetAutoplay();
  }, [requestSlide, resetAutoplay]);

  const swipeActionsRef = useRef({
    goNext: goToNextSlide,
    goPrev: goToPrevSlide,
  });
  swipeActionsRef.current = {
    goNext: goToNextSlide,
    goPrev: goToPrevSlide,
  };

  const activePromotionRef = useRef(activePromotion);
  activePromotionRef.current = activePromotion;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        !activePromotionRef.current &&
        Math.abs(gesture.dx) > 14 &&
        Math.abs(gesture.dy) < 28,
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx <= -SWIPE_THRESHOLD) {
          swipeActionsRef.current.goNext();
        } else if (gesture.dx >= SWIPE_THRESHOLD) {
          swipeActionsRef.current.goPrev();
        }
      },
    })
  ).current;

  const loadAuthState = async (background = false) => {
    if (background && hasAuthCheckedRef.current) {
      logLoaderStart("home.hydrateAuthSession.background");
    } else {
      logLoaderStart("home.hydrateAuthSession");
    }
    try {
      const session = await withTimeout(
        hydrateAuthSession(),
        8000,
        "home.hydrateAuthSession",
        null
      );

      if (session) {
        setIsLoggedIn(true);
        setShowLoginOverlay(false);
        loginOpacity.setValue(0);
        try {
          const saved = await loadUserProfile(session.userId);
          setDisplayName(resolveDisplayName(saved as Record<string, unknown>));
        } catch {
          // keep default
        }
      } else {
        const tokens = await authStorage.getTokens();
        if (tokens?.access || tokens?.refresh) {
          setIsLoggedIn(true);
          setShowLoginOverlay(false);
          loginOpacity.setValue(0);
        } else {
          setIsLoggedIn(false);
          setDisplayName("there");
          setShowLoginOverlay(true);
          loginOpacity.setValue(1);
        }
      }
    } catch (error) {
      console.log("[loader] home.hydrateAuthSession error:", error);
      setIsLoggedIn(false);
      setDisplayName("there");
      setShowLoginOverlay(true);
      loginOpacity.setValue(1);
    } finally {
      logLoaderDone(
        background && hasAuthCheckedRef.current
          ? "home.hydrateAuthSession.background"
          : "home.hydrateAuthSession"
      );
      hasAuthCheckedRef.current = true;
      setAuthChecked(true);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      void loadAuthState(hasAuthCheckedRef.current);
    }, [])
  );

  useEffect(() => {
    if (visibleIndex >= heroSlides.length) {
      setVisibleIndex(0);
      setTargetIndex(null);
    }
  }, [heroSlides.length, visibleIndex]);

  useEffect(() => {
    resetAutoplay();
    return () => {
      if (autoplayRef.current) {
        clearInterval(autoplayRef.current);
      }
    };
  }, [resetAutoplay]);

  useEffect(() => {
    if (activePromotion) return;
    getPrefetchSlideUris(heroSlides, clampedVisibleIndex).forEach((uri) => {
      void Image.prefetch(uri);
    });
  }, [activePromotion, clampedVisibleIndex, heroSlides]);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const onShow = (event: KeyboardEvent) => {
      const lift = Math.max(0, event.endCoordinates.height - tabBarHeight);
      Animated.timing(loginLift, {
        toValue: -lift,
        duration: Platform.OS === "ios" ? event.duration || 250 : 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    };

    const onHide = (event: KeyboardEvent) => {
      Animated.timing(loginLift, {
        toValue: 0,
        duration: Platform.OS === "ios" ? event.duration || 250 : 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    };

    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [loginLift, tabBarHeight]);

  const dismissLoginOverlay = () => {
    Animated.timing(loginOpacity, {
      toValue: 0,
      duration: LOGIN_FADE_MS,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setShowLoginOverlay(false);
      }
    });
  };

  const handleLogin = async () => {
    const cleanUsername = normalizeUsername(username);
    const cleanPassword = normalizePassword(password);

    if (!cleanUsername || !cleanPassword) {
      Alert.alert(t("home.missingInfo"), t("home.missingCredentials"));
      return;
    }

    try {
      setLoading(true);

      const result = await API.login(cleanUsername, cleanPassword);
      const access = result?.access || result?.tokens?.access;
      const refresh = result?.refresh || result?.tokens?.refresh;

      if (!access) {
        Alert.alert(t("home.loginFailed"), t("home.invalidCredentials"));
        return;
      }

      await authStorage.setTokens({ access, refresh });

      const userId = authStorage.getUserIdStringFromAccessToken(access);
      if (userId) {
        await prepareSessionForUser(userId);
        const saved = await loadUserProfile(userId);
        setDisplayName(resolveDisplayName(saved as Record<string, unknown>));
      } else {
        setDisplayName(cleanUsername);
      }

      setIsLoggedIn(true);
      setAuthChecked(true);
      Keyboard.dismiss();
      dismissLoginOverlay();
    } catch (e: unknown) {
      Alert.alert(
        "Login failed",
        formatAuthError(e, t("home.loginFailedGeneric"))
      );
    } finally {
      setLoading(false);
    }
  };

  if (!authChecked) {
    return (
      <View style={homeLandingStyles.loadingScreen}>
        <ActivityIndicator size="large" color={theme.colors.turquoise} />
      </View>
    );
  }

  const topInset = Math.max(insets.top, Platform.OS === "ios" ? 12 : 8);
  const indicatorsBottom = showLoginOverlay
    ? Math.max(insets.bottom, 12) + 188
    : Math.max(insets.bottom, 20) + 12;

  return (
    <View style={homeLandingStyles.root}>
      {activePromotion ? (
        <HomePromotionView promotion={activePromotion} />
      ) : (
        <HomeHeroCrossfade
          visibleSlide={visibleSlide}
          targetSlide={targetSlide}
          transitioning={transitioning}
          fadeMs={SLIDE_FADE_MS}
          onTransitionEnd={commitTransition}
        />
      )}

      <HomeBottomVignette />
      <View style={homeLandingStyles.topVignette} pointerEvents="none" />

      <View style={homeLandingStyles.flex} {...panResponder.panHandlers}>
        <HomeBrandOverlay topInset={topInset} />

        {!activePromotion && showWelcomeIntro ? (
          <HomeWelcomeOverlay
            visible={showWelcomeIntro}
            displayName={displayName}
            onHidden={() => setShowWelcomeIntro(false)}
          />
        ) : null}

        <View style={homeLandingStyles.flex} />

        {!activePromotion ? (
          <HomeSlideIndicators
            slides={heroSlides}
            activeIndex={clampedVisibleIndex}
            bottomOffset={indicatorsBottom}
            onSelect={(index) => {
              requestSlide(index);
              resetAutoplay();
            }}
          />
        ) : null}
      </View>

      {showLoginOverlay ? (
        <Animated.View
          style={[
            homeLandingStyles.loginDock,
            {
              paddingBottom: Math.max(insets.bottom, 6),
              transform: [{ translateY: loginLift }],
            },
          ]}
        >
          <Animated.View
            style={[homeLandingStyles.loginOverlayCard, { opacity: loginOpacity }]}
            pointerEvents={isLoggedIn ? "none" : "auto"}
          >
            <View style={homeLandingStyles.inputRow}>
              <Ionicons
                name="person-outline"
                size={16}
                color={theme.colors.muted}
              />
              <TextInput
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder={t("home.emailPlaceholder")}
                placeholderTextColor="rgba(107,114,128,0.8)"
                style={homeLandingStyles.input}
                returnKeyType="next"
              />
            </View>

            <View style={[homeLandingStyles.inputRow, homeLandingStyles.inputRowSecond]}>
              <Ionicons
                name="lock-closed-outline"
                size={16}
                color={theme.colors.muted}
              />
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder={t("home.passwordPlaceholder")}
                placeholderTextColor="rgba(107,114,128,0.8)"
                style={homeLandingStyles.input}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={16}
                  color={theme.colors.muted}
                />
              </Pressable>
            </View>

            <Pressable
              onPress={() => router.push("/forgot-password")}
              style={homeLandingStyles.forgotPasswordLink}
            >
              <Text style={homeLandingStyles.forgotPasswordText}>
                {t("home.forgotPassword")}
              </Text>
            </Pressable>

            <Pressable
              onPress={handleLogin}
              disabled={loading}
              style={({ pressed }) => [
                homeLandingStyles.signInButton,
                loading && homeLandingStyles.signInDisabled,
                pressed && !loading && { opacity: 0.92, transform: [{ scale: 0.99 }] },
              ]}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={homeLandingStyles.signInText}>{t("home.signIn")}</Text>
              )}
            </Pressable>

            <View style={homeLandingStyles.footerLinksRow}>
              <Pressable onPress={() => router.push("/register")}>
                <Text style={homeLandingStyles.footerPrimaryText}>
                  {t("home.createAccount")}
                </Text>
              </Pressable>
              <Text style={homeLandingStyles.footerDivider}>·</Text>
              <Pressable onPress={() => router.replace("/(tabs)/explore")}>
                <Text style={homeLandingStyles.footerSecondaryText}>
                  {t("profile.guestTitle")}
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        </Animated.View>
      ) : (
        <View style={{ height: Math.max(insets.bottom, 12) }} />
      )}
    </View>
  );
}

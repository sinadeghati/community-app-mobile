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
  StyleSheet,
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
import {
  getActiveHomeHeroSlides,
  getHeroImagePrimaryUri,
  HOME_HERO_CHANNEL_LABELS,
  HOME_HERO_FALLBACK_IMAGE,
  HOME_HERO_FALLBACK_SLIDE,
  logHeroImageLoadFailure,
  type HomeHeroItem,
} from "../../lib/homeHeroData";
import {
  logLoaderDone,
  logLoaderStart,
  withTimeout,
} from "../../lib/asyncGuards";
import { PersianMapHeroLogo } from "../../components/brand/PersianMapHeroLogo";
import { theme } from "../../lib/theme";

const SLIDE_INTERVAL_MS = 5000;
const SLIDE_FADE_MS = 900;
const LOGIN_FADE_MS = 260;
const BOTTOM_GRADIENT_HEIGHT = 340;
const SWIPE_THRESHOLD = 48;
const DOT_WINDOW = 7;

const normalizeUsername = (value: string) => value.trim().toLowerCase();
const normalizePassword = (value: string) => value.trim();

const resolveDisplayName = (profile: Record<string, unknown> | null) => {
  const raw = String(
    profile?.name || profile?.username || profile?.email || ""
  ).trim();
  if (!raw) return "there";
  return raw.split("@")[0];
};

/**
 * Resolves slide image with runtime fallback — caption stays on slide; display swaps on error.
 */
function HeroImageLayer({
  slide,
  layer,
  onLoad,
}: {
  slide: HomeHeroItem;
  layer: "base" | "top";
  onLoad?: () => void;
}) {
  const primaryUri = getHeroImagePrimaryUri(slide);
  const [uri, setUri] = useState(primaryUri);

  useEffect(() => {
    setUri(primaryUri);
  }, [slide.id, primaryUri]);

  const handleError = useCallback(() => {
    if (uri === HOME_HERO_FALLBACK_IMAGE) {
      onLoad?.();
      return;
    }
    logHeroImageLoadFailure(slide.id, slide.title, primaryUri);
    void Image.prefetch(HOME_HERO_FALLBACK_IMAGE);
    setUri(HOME_HERO_FALLBACK_IMAGE);
  }, [slide.id, slide.title, primaryUri, uri, onLoad]);

  return (
    <Image
      recyclingKey={`hero-${layer}-${slide.id}`}
      source={{ uri }}
      style={StyleSheet.absoluteFillObject}
      contentFit="cover"
      cachePolicy="memory-disk"
      transition={0}
      onLoad={onLoad}
      onError={handleError}
    />
  );
}

/**
 * Two-layer crossfade: base stays visible until next image is loaded, then fades in.
 * Caption commits in parent on onTransitionEnd — one slide object end-to-end.
 */
function HeroCrossfade({
  visibleSlide,
  targetSlide,
  transitioning,
  onTransitionEnd,
}: {
  visibleSlide: HomeHeroItem;
  targetSlide: HomeHeroItem;
  transitioning: boolean;
  onTransitionEnd: () => void;
}) {
  const [baseSlide, setBaseSlide] = useState(visibleSlide);
  const [topSlide, setTopSlide] = useState(visibleSlide);
  const [topLoaded, setTopLoaded] = useState(true);
  const topOpacity = useRef(new Animated.Value(1)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (!transitioning) {
      setBaseSlide(visibleSlide);
      setTopSlide(visibleSlide);
      setTopLoaded(true);
      topOpacity.setValue(1);
    }
  }, [visibleSlide.id, transitioning, topOpacity]);

  useEffect(() => {
    if (!transitioning) return;

    let cancelled = false;
    animRef.current?.stop();
    topOpacity.stopAnimation();
    topOpacity.setValue(0);
    setTopLoaded(false);
    setTopSlide(targetSlide);

    void Image.prefetch(getHeroImagePrimaryUri(targetSlide));

    const loadFallback = setTimeout(() => {
      if (!cancelled) setTopLoaded(true);
    }, 1500);

    return () => {
      cancelled = true;
      clearTimeout(loadFallback);
    };
  }, [transitioning, targetSlide.id, topOpacity]);

  useEffect(() => {
    if (!transitioning || !topLoaded) return;

    animRef.current = Animated.timing(topOpacity, {
      toValue: 1,
      duration: SLIDE_FADE_MS,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    });

    animRef.current.start(({ finished }) => {
      if (!finished) return;
      setBaseSlide(targetSlide);
      setTopSlide(targetSlide);
      topOpacity.setValue(1);
      onTransitionEnd();
    });

    return () => {
      animRef.current?.stop();
    };
  }, [transitioning, topLoaded, targetSlide.id, onTransitionEnd, topOpacity]);

  return (
    <View style={[StyleSheet.absoluteFillObject, styles.heroImageBackdrop]}>
      <HeroImageLayer slide={baseSlide} layer="base" />
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          { opacity: transitioning ? topOpacity : 0 },
        ]}
      >
        <HeroImageLayer
          slide={topSlide}
          layer="top"
          onLoad={() => setTopLoaded(true)}
        />
      </Animated.View>
    </View>
  );
}

function PersianMapBrandHeader({
  topInset,
  isLoggedIn,
  displayName,
}: {
  topInset: number;
  isLoggedIn: boolean;
  displayName: string;
}) {
  return (
    <View style={[styles.headerOverlay, { paddingTop: topInset + 8, paddingHorizontal: 22 }]}>
      <View style={styles.brandRow}>
        <PersianMapHeroLogo size={40} />
        <View style={styles.brandTextCol}>
          <Text style={styles.brandTitle}>PersianMap</Text>
          <Text style={styles.brandSubtitle}>
            Your Persian community, connected
          </Text>
        </View>
      </View>
      {isLoggedIn ? (
        <View style={styles.greetingPill}>
          <Text style={styles.greetingText}>Hi {displayName}</Text>
        </View>
      ) : null}
    </View>
  );
}

function BottomHeroGradient() {
  return (
    <View pointerEvents="none" style={styles.bottomGradientWrap}>
      <View style={[styles.gradientBand, { opacity: 0 }]} />
      <View style={[styles.gradientBand, { opacity: 0.12 }]} />
      <View style={[styles.gradientBand, { opacity: 0.28 }]} />
      <View style={[styles.gradientBand, { opacity: 0.48 }]} />
      <View style={[styles.gradientBand, { opacity: 0.68 }]} />
    </View>
  );
}

export default function HomeLoginV2() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  /** Committed slide index — image + caption always use this until transition completes */
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
  const loginOpacity = useRef(new Animated.Value(1)).current;
  const loginLift = useRef(new Animated.Value(0)).current;
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasAuthCheckedRef = useRef(false);

  const heroItems = useMemo(() => {
    const slides = getActiveHomeHeroSlides();
    return slides.length > 0 ? slides : [HOME_HERO_FALLBACK_SLIDE];
  }, []);

  const clampedVisibleIndex =
    heroItems.length > 0
      ? Math.min(visibleIndex, heroItems.length - 1)
      : 0;

  const visibleSlide: HomeHeroItem | undefined = heroItems[clampedVisibleIndex];
  const transitioning =
    targetIndex !== null && targetIndex !== clampedVisibleIndex;
  const targetSlide: HomeHeroItem | undefined =
    transitioning && targetIndex !== null
      ? heroItems[targetIndex]
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
      if (heroItems.length <= 1) return;
      const next =
        ((index % heroItems.length) + heroItems.length) % heroItems.length;
      if (next === visibleIndexRef.current && targetIndexRef.current === null) {
        return;
      }
      setTargetIndex(next);
    },
    [heroItems.length]
  );

  const resetAutoplay = useCallback(() => {
    if (autoplayRef.current) {
      clearInterval(autoplayRef.current);
      autoplayRef.current = null;
    }
    if (heroItems.length <= 1) return;

    autoplayRef.current = setInterval(() => {
      if (targetIndexRef.current !== null) return;
      const next = (visibleIndexRef.current + 1) % heroItems.length;
      setTargetIndex(next);
    }, SLIDE_INTERVAL_MS);
  }, [heroItems.length]);

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

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 14 && Math.abs(gesture.dy) < 28,
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
    if (visibleIndex >= heroItems.length) {
      setVisibleIndex(0);
      setTargetIndex(null);
    }
  }, [heroItems.length, visibleIndex]);

  useEffect(() => {
    resetAutoplay();
    return () => {
      if (autoplayRef.current) {
        clearInterval(autoplayRef.current);
      }
    };
  }, [resetAutoplay]);

  useEffect(() => {
    heroItems.forEach((slide) => {
      void Image.prefetch(getHeroImagePrimaryUri(slide));
    });
  }, [heroItems]);

  useEffect(() => {
    if (heroItems.length <= 1) return;
    const next = heroItems[(clampedVisibleIndex + 1) % heroItems.length];
    const after = heroItems[(clampedVisibleIndex + 2) % heroItems.length];
    if (next) void Image.prefetch(getHeroImagePrimaryUri(next));
    if (after) void Image.prefetch(getHeroImagePrimaryUri(after));
  }, [clampedVisibleIndex, heroItems]);

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
        useNativeDriver: true,
      }).start();
    };

    const onHide = (event: KeyboardEvent) => {
      Animated.timing(loginLift, {
        toValue: 0,
        duration: Platform.OS === "ios" ? event.duration || 250 : 200,
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
      Alert.alert(
        "Missing information",
        "Please enter your username/email and password."
      );
      return;
    }

    try {
      setLoading(true);

      const result = await API.login(cleanUsername, cleanPassword);
      const access = result?.access || result?.tokens?.access;
      const refresh = result?.refresh || result?.tokens?.refresh;

      if (!access) {
        Alert.alert("Login failed", "Invalid username or password.");
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
      console.log("Login V2 error:", e);
      Alert.alert(
        "Login failed",
        "Please check your username and password and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!authChecked) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={theme.colors.turquoise} />
      </View>
    );
  }

  const activeVisibleSlide = visibleSlide ?? HOME_HERO_FALLBACK_SLIDE;
  const activeTargetSlide = targetSlide ?? activeVisibleSlide;

  const topInset = Math.max(insets.top, Platform.OS === "ios" ? 12 : 8);
  const dotWindowStart = Math.max(
    0,
    Math.min(
      clampedVisibleIndex - Math.floor(DOT_WINDOW / 2),
      Math.max(0, heroItems.length - DOT_WINDOW)
    )
  );
  const visibleDots = heroItems.slice(
    dotWindowStart,
    dotWindowStart + DOT_WINDOW
  );

  return (
    <View style={styles.root}>
      <HeroCrossfade
        visibleSlide={activeVisibleSlide}
        targetSlide={activeTargetSlide}
        transitioning={transitioning}
        onTransitionEnd={commitTransition}
      />

      <BottomHeroGradient />

      <View style={styles.topVignette} pointerEvents="none" />

      <View style={styles.flex}>
        <View style={styles.flex} {...panResponder.panHandlers}>
          <PersianMapBrandHeader
            topInset={topInset}
            isLoggedIn={isLoggedIn}
            displayName={displayName}
          />

          <View style={styles.heroSpacer} />

          <View
            style={[
              styles.captionBlock,
              {
                paddingHorizontal: 22,
                paddingBottom: showLoginOverlay ? 14 : Math.max(insets.bottom, 16),
              },
            ]}
            pointerEvents="box-none"
          >
            {!transitioning ? (
              <>
                <View style={styles.tierPill}>
                  <Text style={styles.tierText}>
                    {HOME_HERO_CHANNEL_LABELS[activeVisibleSlide.channel].toUpperCase()}
                  </Text>
                </View>

                <Text style={styles.slideTitle} numberOfLines={2}>
                  {activeVisibleSlide.title}
                </Text>
                <Text style={styles.slideSubtitle} numberOfLines={3}>
                  {activeVisibleSlide.subtitle}
                </Text>
              </>
            ) : (
              <View style={styles.captionPlaceholder} />
            )}

            {heroItems.length > 1 ? (
              <View style={styles.pagination}>
                <View style={styles.progressTrack}>
                  {heroItems.map((item, index) => {
                    const active = index === clampedVisibleIndex;
                    return (
                      <Pressable
                        key={`progress-${item.id}`}
                        onPress={() => {
                          requestSlide(index);
                          resetAutoplay();
                        }}
                        hitSlop={{ top: 8, bottom: 8 }}
                        style={styles.progressSegment}
                        accessibilityRole="button"
                        accessibilityLabel={`Go to slide ${index + 1}`}
                      >
                        <View
                          style={[
                            styles.progressSegmentFill,
                            active ? styles.progressSegmentFillActive : null,
                          ]}
                        />
                      </Pressable>
                    );
                  })}
                </View>
                <View style={styles.dotsRow}>
                  {visibleDots.map((item, offset) => {
                    const index = dotWindowStart + offset;
                    const active = index === clampedVisibleIndex;

                    return (
                      <Pressable
                        key={item.id}
                        onPress={() => {
                          requestSlide(index);
                          resetAutoplay();
                        }}
                        hitSlop={8}
                        style={[
                          styles.dot,
                          active ? styles.dotActive : styles.dotIdle,
                        ]}
                      />
                    );
                  })}
                </View>
              </View>
            ) : null}
          </View>
        </View>

        {showLoginOverlay ? (
          <Animated.View
            style={[
              styles.loginDock,
              {
                paddingBottom: Math.max(insets.bottom, 6),
                transform: [{ translateY: loginLift }],
              },
            ]}
          >
            <Animated.View
              style={[styles.loginOverlayCard, { opacity: loginOpacity }]}
              pointerEvents={isLoggedIn ? "none" : "auto"}
            >
              <View style={styles.inputRow}>
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
                  placeholder="Email or username"
                  placeholderTextColor="rgba(107,114,128,0.8)"
                  style={styles.input}
                  returnKeyType="next"
                />
              </View>

              <View style={[styles.inputRow, styles.inputRowSecond]}>
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
                  placeholder="Password"
                  placeholderTextColor="rgba(107,114,128,0.8)"
                  style={styles.input}
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
                onPress={handleLogin}
                disabled={loading}
                style={[styles.signInButton, loading && styles.signInDisabled]}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.signInText}>Sign in</Text>
                )}
              </Pressable>

              <View style={styles.footerLinksRow}>
                <Pressable onPress={() => router.push("/register")}>
                  <Text style={styles.footerPrimaryText}>Create account</Text>
                </Pressable>
                <Text style={styles.footerDivider}>·</Text>
                <Pressable onPress={() => router.replace("/(tabs)/explore")}>
                  <Text style={styles.footerSecondaryText}>Guest</Text>
                </Pressable>
              </View>
            </Animated.View>
          </Animated.View>
        ) : (
          <View style={{ height: Math.max(insets.bottom, 12) }} />
        )}
      </View>
    </View>
  );
}

const SLIDE_TITLE_HEIGHT = 64;
const SLIDE_SUBTITLE_HEIGHT = 54;
const PROGRESS_HEIGHT = 24;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.deepTeal,
  },
  flex: {
    flex: 1,
  },
  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.ivory,
  },
  topVignette: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 160,
    backgroundColor: "rgba(0,0,0,0.22)",
  },
  bottomGradientWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: BOTTOM_GRADIENT_HEIGHT,
    justifyContent: "flex-end",
  },
  gradientBand: {
    height: BOTTOM_GRADIENT_HEIGHT / 5,
    backgroundColor: "#000",
  },
  heroImageBackdrop: {
    backgroundColor: theme.colors.deepTeal,
  },
  headerOverlay: {
    zIndex: 2,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  brandTextCol: {
    flex: 1,
    flexShrink: 1,
  },
  heroSpacer: {
    flex: 1,
    minHeight: 8,
  },
  loginDock: {
    paddingHorizontal: 22,
    paddingTop: 10,
  },
  captionBlock: {
    zIndex: 2,
  },
  captionPlaceholder: {
    minHeight: SLIDE_TITLE_HEIGHT + SLIDE_SUBTITLE_HEIGHT + 40,
  },
  brandTitle: {
    fontSize: 30,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: "rgba(255,255,255,0.88)",
    fontWeight: "600",
  },
  tierPill: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: theme.radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  tierText: {
    color: theme.colors.gold,
    fontWeight: "800",
    fontSize: 11,
    letterSpacing: 0.6,
  },
  slideTitle: {
    marginTop: 10,
    minHeight: SLIDE_TITLE_HEIGHT,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "900",
    color: "#fff",
  },
  slideSubtitle: {
    marginTop: 4,
    minHeight: SLIDE_SUBTITLE_HEIGHT,
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
  pagination: {
    marginTop: 14,
    minHeight: PROGRESS_HEIGHT,
  },
  progressTrack: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minHeight: 18,
  },
  progressSegment: {
    flex: 1,
    justifyContent: "center",
  },
  progressSegmentFill: {
    height: 2,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.28)",
  },
  progressSegmentFillActive: {
    height: 3,
    backgroundColor: "rgba(255,255,255,0.95)",
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 999,
  },
  dotActive: {
    width: 22,
    backgroundColor: "#fff",
  },
  dotIdle: {
    width: 6,
    backgroundColor: "rgba(255,255,255,0.38)",
  },
  loginOverlayCard: {
    backgroundColor: "rgba(255,255,255,0.88)",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.55)",
  },
  inputRow: {
    height: 38,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 1,
    borderColor: "rgba(232,226,216,0.9)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  inputRowSecond: {
    marginTop: 6,
  },
  input: {
    flex: 1,
    marginLeft: 6,
    fontSize: 14,
    color: theme.colors.charcoal,
    paddingVertical: 0,
  },
  signInButton: {
    marginTop: 8,
    height: 38,
    borderRadius: 10,
    backgroundColor: theme.colors.turquoise,
    alignItems: "center",
    justifyContent: "center",
  },
  signInDisabled: {
    opacity: 0.75,
  },
  signInText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
  },
  footerLinksRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  footerPrimaryText: {
    color: theme.colors.turquoise,
    fontWeight: "800",
    fontSize: 13,
  },
  footerDivider: {
    color: theme.colors.muted,
    fontWeight: "700",
    fontSize: 13,
  },
  footerSecondaryText: {
    color: theme.colors.muted,
    fontWeight: "700",
    fontSize: 13,
  },
  greetingPill: {
    alignSelf: "flex-start",
    marginTop: 12,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderRadius: theme.radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.24)",
  },
  greetingText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
    letterSpacing: 0.2,
  },
});

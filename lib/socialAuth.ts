import { Platform } from "react-native";
import * as Crypto from "expo-crypto";
import { getOAuthPublicConfig, isGoogleSignInConfigured } from "./oauthPublicConfig";

export class SocialAuthCancelledError extends Error {
  constructor() {
    super("cancelled");
    this.name = "SocialAuthCancelledError";
  }
}

export type GoogleSignInResult = {
  idToken: string;
};

export type AppleSignInResult = {
  identityToken: string;
  nonce: string;
  fullName?: {
    givenName?: string | null;
    familyName?: string | null;
  } | null;
};

let googleConfigured = false;

const configureGoogleSignIn = async () => {
  if (googleConfigured) return;
  const { GoogleSignin } = await import("@react-native-google-signin/google-signin");
  const { googleIosClientId, googleWebClientId } = getOAuthPublicConfig();
  GoogleSignin.configure({
    iosClientId: googleIosClientId || undefined,
    webClientId: googleWebClientId || undefined,
    offlineAccess: false,
  });
  googleConfigured = true;
};

export const canUseGoogleSignIn = (): boolean => {
  if (!isGoogleSignInConfigured()) return false;
  try {
    require("@react-native-google-signin/google-signin");
    return true;
  } catch {
    return false;
  }
};

export const canUseAppleSignIn = (): boolean => {
  if (Platform.OS !== "ios") return false;
  try {
    const AppleAuthentication = require("expo-apple-authentication");
    return Boolean(AppleAuthentication?.isAvailableAsync);
  } catch {
    return false;
  }
};

export const signInWithGoogleNative = async (): Promise<GoogleSignInResult> => {
  await configureGoogleSignIn();
  const { GoogleSignin, statusCodes } = await import(
    "@react-native-google-signin/google-signin"
  );

  if (Platform.OS === "android") {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  }

  try {
    const result = await GoogleSignin.signIn();
    const idToken = result.data?.idToken;
    if (!idToken) {
      throw new Error("Google did not return an ID token. Check webClientId configuration.");
    }
    return { idToken };
  } catch (error: unknown) {
    const code = (error as { code?: string })?.code;
    if (code === statusCodes.SIGN_IN_CANCELLED) {
      throw new SocialAuthCancelledError();
    }
    throw error;
  }
};

export const signInWithAppleNative = async (): Promise<AppleSignInResult> => {
  const AppleAuthentication = await import("expo-apple-authentication");
  const available = await AppleAuthentication.isAvailableAsync();
  if (!available) {
    throw new Error("Sign in with Apple is not available on this device.");
  }

  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    rawNonce
  );

  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });

    if (!credential.identityToken) {
      throw new Error("Apple did not return an identity token.");
    }

    return {
      identityToken: credential.identityToken,
      nonce: rawNonce,
      fullName: credential.fullName,
    };
  } catch (error: unknown) {
    const code = (error as { code?: string })?.code;
    if (code === "ERR_REQUEST_CANCELED") {
      throw new SocialAuthCancelledError();
    }
    throw error;
  }
};

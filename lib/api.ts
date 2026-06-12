// lib/api.ts
import axios from "axios";
import authStorage from "../app/utils/authStorage"; // اگر مسیرت فرق دارد، فقط همین یک خط را اصلاح کن
import {
  AUTH_PASSWORD_CHANGE_PATH,
  AUTH_PASSWORD_RESET_PATH,
} from "./authApiContract";
import { resolveStoredAccessToken } from "./authSession";
const BASE_URL = "https://community-app-backend-production.up.railway.app/api";

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

/** Refresh must not pass through the auth interceptor (avoids refresh recursion). */
const refreshClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

const isTokenRefreshRequest = (url?: string) =>
  Boolean(url && url.includes("token/refresh"));

client.interceptors.request.use(async (config) => {
  if (isTokenRefreshRequest(config.url)) {
    return config;
  }

  try {
    const access = await resolveStoredAccessToken();

    if (!access || !authStorage.isJwtNotExpired(access)) {
      if (config.headers) delete (config.headers as any).Authorization;
      return config;
    }

    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${access.trim()}`;
  } catch (e) {
    console.log("[auth] request_interceptor_error", String(e));
  }

  return config;
});


export const API = {
  async refreshAccessToken(refresh: string) {
    try {
      const res = await refreshClient.post("/token/refresh/", { refresh });
      return res.data;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        const res = await refreshClient.post("/accounts/token/refresh/", {
          refresh,
        });
        return res.data;
      }
      throw error;
    }
  },

  async login(
    usernameOrPayload: string | { username: string; password: string },
    maybePassword?: string
  ) {
    const payload =
      typeof usernameOrPayload === "string"
        ? {
          username: usernameOrPayload,
          password: maybePassword,
        }
        : usernameOrPayload;

    const res = await client.post("/accounts/login/", payload);
    return res.data;
  },

  async register(username: string, email: string, password: string) {
    const res = await client.post("/accounts/register/", {
      username,
      email,
      password,
    });
    return res.data;
  },

  /** See lib/authApiContract.ts for the backend contract. */
  async requestPasswordReset(email: string) {
    const res = await client.post(AUTH_PASSWORD_RESET_PATH, {
      email: email.trim().toLowerCase(),
    });
    return res.data;
  },

  /** See lib/authApiContract.ts for the backend contract. */
  async changePassword(currentPassword: string, newPassword: string) {
    const res = await client.post(AUTH_PASSWORD_CHANGE_PATH, {
      old_password: currentPassword,
      new_password: newPassword,
    });
    return res.data;
  },

  async getListings() {
    const res = await client.get("/listings/");
    return res.data;
  },

  async getListing(id: number | string) {
    const res = await client.get(`/listings/${id}/`);
    return res.data;
  },


  async createListing(payload: any) {
    const res = await client.post("/listings/", payload);
    return res.data;
  },



  updateListing: async (id: number, payload: any) => {
    console.log("PATCH URL:", '/my-listing/${id}/', payload);
    const res = await client.patch(`/my-listing/${id}/`, payload);
    return res.data;
  },

  deleteListing: async (id: number) => {
    console.log("DELETE URL:", ' /my-listing/${id}/');
    await client.delete(`/my-listing/${id}/`);
    return true;
  },

  async createEvent(payload: Record<string, unknown>) {
    const res = await client.post("/events/", payload);
    return res.data;
  },

  async updateEvent(id: string, payload: Record<string, unknown>) {
    const res = await client.patch(`/events/${id}/`, payload);
    return res.data;
  },

  async deleteEvent(id: string) {
    await client.delete(`/events/${id}/`);
    return true;
  },

  getMyListings: async () => {
    const res = await client.get("/my-listing/");
    return res.data;
  },





  async uploadListingImage(listingId: number | string, imageUri: string) {
    const formData = new FormData();

    const filename = imageUri.split("/").pop() || `photo_${Date.now()}.jpg`;
    const ext = filename.split(".").pop()?.toLowerCase();
    const mimeType =
      ext === "png" ? "image/png" :
        ext === "heic" ? "image/heic" :
          "image/jpeg";

    formData.append("image", {
      uri: imageUri,
      name: filename,
      type: mimeType,
    } as any);

    const res = await client.post(
      `/listings/${listingId}/images/`,
      formData,
      {
        headers: {
          // خیلی مهم: اینجا حتما override کن
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return res.data;
  },



  async updateMyListing(id: number, payload: any) {
    const res = await client.patch(`/my-listing/${id}/`, payload);
    return res.data;
  },



};

// lib/api.ts
import axios from "axios";
import authStorage from "../app/utils/authStorage"; // اگر مسیرت فرق دارد، فقط همین یک خط را اصلاح کن
import AsyncStorage from "@react-native-async-storage/async-storage";
const BASE_URL = "https://community-app-backend-production.up.railway.app/api";

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

client.interceptors.request.use(async (config) => {
  try {
    const tokens = await authStorage.getTokens();
    const access = tokens?.access;

    if (!access) {
      if (config.headers) delete (config.headers as any).Authorization;
      return config;
    }
    if (!authStorage.isJwtNotExpired(access)) {
      if (config.headers) delete (config.headers as any).Authorization;
      return config;
    }
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${access.trim()}`;
    console.log("Auth HEADER >>>", (config.headers as any).Authorization);


  } catch (e) { }

  return config;
});


export const API = {
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

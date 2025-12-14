// lib/api.ts
import axios from "axios";
import authStorage from "../app/utils/authStorage"; // اگر مسیرت فرق دارد، فقط همین یک خط را اصلاح کن

const BASE_URL = "http://10.9.50.123:8000/api"; // همون IP که تو لاگ‌ها داری

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

client.interceptors.request.use(async (config) => {
  try {
    const token = await authStorage.getToken();
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {}
  return config;
});

export const API = {
  async login(username: string, password: string) {
    const res = await client.post("/accounts/login/", { username, password });
    return res.data;
  },

  async getListings() {
    const res = await client.get("/listings/");
    return res.data;
  },

  async createListing(payload: any) {
    const res = await client.post("/listings/", payload);
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

};

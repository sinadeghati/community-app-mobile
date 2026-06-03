// app/listing/[id].tsx
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Image, ActivityIndicator, ScrollView, Alert, Button, TouchableOpacity} from "react-native";
import { Linking } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { API } from "../../lib/api"; // اگر مسیرت فرق دارد، فقط همین import را مطابق پروژه‌ات کن
import authStorage from "../utils/authStorage";
import AsyncStorage from "@react-native-async-storage/async-storage";


type ListingImage = {
  id: number;
  image_url?: string; // تو API بعضی جاها image_url داریم
  image?: string;     // بعضی جاها image داریم
  uploaded_at?: string;
};

type Listing = {
  id: number | string;
  user?: number | { id: number };
  title: string;
  city: string;
  state?: string;
  price?: string;
  description?: string | null;
  contact_info?: string | null;
  created_at?: string;
  images?: ListingImage[];
  image?: string;
  category?: string;
  businessId?: string;
  businessName?: string;
};

async function loadLocalListingById(listingId: string) {
  try {
    const rawProfile = await AsyncStorage.getItem("user_profile_v2");
    if (!rawProfile) return null;

    const profile = JSON.parse(rawProfile);
    const storageKeys = [
      `my_listings_${profile.username || profile.email || "default"}`,
      profile.username || profile.email
        ? `my_listings_${profile.username || profile.email}`
        : null,
    ].filter(Boolean) as string[];

    for (const storageKey of storageKeys) {
      const rawListings = await AsyncStorage.getItem(storageKey);
      if (!rawListings) continue;

      const parsed = JSON.parse(rawListings);
      if (!Array.isArray(parsed)) continue;

      const found = parsed.find(
        (item: any) => String(item?.id) === String(listingId)
      );
      if (found) return found;
    }
  } catch (error) {
    console.log("Local listing load error:", error);
  }

  return null;
}

async function loadLocalBusinesses() {
  try {
    const raw = await AsyncStorage.getItem("my_local_businesses");
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

async function businessProfileExists(businessId: string) {
  const raw = await AsyncStorage.getItem(`profile_v2_${businessId}`);
  return !!raw;
}

async function resolveBusinessLink(
  businessId?: string,
  businessName?: string,
  listingTitle?: string
) {
  const businesses = await loadLocalBusinesses();

  const findByName = (name?: string) => {
    if (!name?.trim()) return null;
    const target = name.trim().toLowerCase();
    return businesses.find((biz: any) => {
      const candidate = (biz.name || biz.business_name || "").trim().toLowerCase();
      return candidate === target;
    });
  };

  const toLink = async (biz: any) => {
    const bizId = String(biz.id);
    if (!(await businessProfileExists(bizId))) return null;
    return {
      id: bizId,
      name: biz.name || biz.business_name || "",
    };
  };

  const byTitle = findByName(listingTitle);
  if (byTitle) {
    const link = await toLink(byTitle);
    if (link) return link;
  }

  if (businessId) {
    const byId = businesses.find(
      (biz: any) => String(biz.id) === String(businessId)
    );
    if (byId) {
      const link = await toLink(byId);
      if (link) return link;
    }
  }

  const byStoredName = findByName(businessName);
  if (byStoredName) {
    const link = await toLink(byStoredName);
    if (link) return link;
  }

  return null;
}

function mapLocalListingToDetails(local: any): Listing {
  const galleryImages = Array.isArray(local?.gallery)
    ? local.gallery
        .filter(Boolean)
        .map((uri: string, index: number) => ({
          id: index,
          image_url: uri,
          image: uri,
        }))
    : [];

  const cover = local?.image || local?.image_url || "";
  const images =
    galleryImages.length > 0
      ? galleryImages
      : cover
        ? [{ id: 0, image_url: cover, image: cover }]
        : [];

  return {
    id: local?.id,
    title: local?.title || "Listing",
    city: local?.city || "",
    state: local?.state || "",
    price: local?.price || "",
    description: local?.description || "",
    contact_info: local?.phone || local?.contact_info || "",
    category: local?.category || local?.businessCategory || "",
    image: cover,
    images,
    businessId: local?.businessId ? String(local.businessId) : undefined,
    businessName: local?.businessName || "",
  };
}

export default function ListingDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [listing, setListing] = useState<Listing | null>(null);
  const [linkedBusiness, setLinkedBusiness] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [MyUserId, setMyUserId] = useState<number | null>(null);
  


useEffect(() => {
  const loadUser = async () => {
    const tokens = await authStorage.getTokens();
    const uid = authStorage.getUserIdFromAccessToken(tokens?.access);
    setMyUserId;
  };
  loadUser();
}, []);

   const listingUserRaw = (listing as any)?.user;

const listingOwnerId =
  listingUserRaw == null
    ? null
    : typeof listingUserRaw === "object"
      ? Number(listingUserRaw.id)
      : Number(listingUserRaw);

const isOwner =
  MyUserId != null &&
  listingOwnerId != null &&
  Number(MyUserId) === Number(listingOwnerId);

  


  // برای اینکه عکس کامل نمایش داده شود (بدون crop)
  const [aspectRatio, setAspectRatio] = useState<number>(16 / 9);

  const firstImageUrl = useMemo(() => {
  const l: any = listing;

  const img =
    l?.images && l.images.length > 0
      ? l.images[l.images.length - 1]
      : null;

  return (
    l?.image_url ||
    l?.image ||
    l?.thumbnail ||
    img?.image_url ||
    img?.image ||
    ""
  ) as string;
}, [listing]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);

        const local = await loadLocalListingById(String(id ?? ""));
        if (local) {
          if (!mounted) return;
          const mapped = mapLocalListingToDetails(local);
          const resolved = await resolveBusinessLink(
            mapped.businessId,
            mapped.businessName,
            mapped.title
          );
          setListing(mapped);
          setLinkedBusiness(resolved);
          return;
        }

        const res = await fetch(`${API_BASE()}/listings/${id}/`);
        if (!res.ok) {
          if (!mounted) return;
          setListing(null);
          return;
        }

        const data = (await res.json()) as Listing;
        if (!mounted) return;
        setListing(data);
        setLinkedBusiness(null);
      } catch (e) {
        console.log("ListingDetails error:", e);
        if (mounted) {
          setListing(null);
          setLinkedBusiness(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  // وقتی URL عکس آماده شد، سایز واقعی عکس را می‌گیریم تا aspectRatio دقیق شود
  useEffect(() => {
    if (!firstImageUrl) return;

    Image.getSize(
      firstImageUrl,
      (w, h) => {
        if (w > 0 && h > 0) setAspectRatio(w / h);
      },
      () => {
        // اگر getSize شکست خورد، همون 16:9 می‌ماند
      }
    );
  }, [firstImageUrl]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      </SafeAreaView>
    );
  }

  if (!listing) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <View style={styles.center}>
          <Text>Not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
  <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
    <ScrollView contentContainerStyle={{ paddingBottom: 40,
      backgroundColor: "#fff",
     }}>
      <TouchableOpacity
  onPress={() => router.back()}
 style={{
  position: "absolute",
  top: 18,
  left: 16,
  zIndex: 10,
  backgroundColor: "rgba(0,0,0,0.45)",
  paddingHorizontal: 14,
  paddingVertical: 8,
  borderRadius: 20,
}}
>
  <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
    ← Back
  </Text>
</TouchableOpacity>
      {isOwner && (
  <View style={{ padding: 16, gap: 12 }}>
    <Button
      title="Edit Listing"
      onPress={() => {
        router.push({
          pathname: "/listing/edit",
          params: { id: String(listing?.id) },
        } as any);
      }}
    />

    <Button
      title="Delete Listing"
      color="red"
      onPress={() => {
        Alert.alert(
          "Delete listing",
          "Are you sure?",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Delete",
              style: "destructive",
              onPress: () => {
                // بعداً API delete اینجا صدا زده میشه
                console.log("delete", listing?.id);
              },
            },
          ]
        );
      }}
    />
  </View>
)}

      {/* IMAGE */}
      {firstImageUrl ? (
  <View style={{ width: "100%", height: 250, backgroundColor: "#000",
    borderRadius: 18,
    overflow: "hidden",
    marginTop: 8,
   }}>
    <Image
      source={{ uri: firstImageUrl }}
      style={{ width: "100%", height: "100%" }}
      resizeMode="contain"
    />
  </View>
) : (
  <View
    style={{
      width: "100%",
      height: 220,
      backgroundColor: "#eee",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <Text>No image</Text>
  </View>
)}


      {/* DETAILS */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40, }}>
        <Text style={{ fontSize: 24, lineHeight: 30, fontWeight: "800" }}>
          {listing?.title}
        </Text>

        {listing?.category ? (
          <Text style={{ marginTop: 6, color: "#0D9488", fontWeight: "700" }}>
            {listing.category}
          </Text>
        ) : null}

        <Text style={{ marginTop: 6, color: "#666" }}>
          {[listing?.city, listing?.state].filter(Boolean).join(", ")}
        </Text>

        {listing?.price ? (
          <Text style={{ marginTop: 14, fontSize: 22, fontWeight: "800" }}>
            ${listing.price}
          </Text>
        ) : null}

        {linkedBusiness ? (
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/profile/v2",
                params: { id: String(linkedBusiness.id) },
              })
            }
            style={{
              marginTop: 18,
              paddingVertical: 14,
              paddingHorizontal: 16,
              borderRadius: 16,
              backgroundColor: "#0D9488",
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}>
              View Business Profile
            </Text>
            <Text
              style={{
                marginTop: 4,
                color: "rgba(255,255,255,0.9)",
                fontWeight: "600",
                fontSize: 14,
              }}
            >
              {linkedBusiness.name}
            </Text>
          </TouchableOpacity>
        ) : (
          <Text style={{ marginTop: 18, fontSize: 14, color: "#888" }}>
            No business profile connected
          </Text>
        )}

        <Text style={{ marginTop: 20, fontSize: 16, fontWeight: "700" }}>
          Description
        </Text>


        {/* DESCRIPTION */}
        {listing?.description ? (
          <Text
            style={{
              marginTop: 10,
              fontSize: 17,
              lineHeight: 28,
              color: "#444",
            }}
          >
            {listing.description}
          </Text>
        ) : (
          <Text style={{ marginTop: 10, fontSize: 15, color: "#888" }}>
            No description provided.
          </Text>
        )}

{/* CONTACT INFO */}
{listing?.contact_info ? (
  <View
    style={{
      marginTop: 24,
      padding: 18,
      borderWidth: 1,
      borderColor: "#ececec",
      borderRadius: 18,
      backgroundColor: "#fff",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 3,
    }}
  >
    <Text
      style={{
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 10,
        color: "#111",
      }}
    >
      Contact
    </Text>

    <Text
      style={{
        fontSize: 20,
        fontWeight: "600",
        color: "#111",
        marginTop: 4,
      }}
    >
      {listing.contact_info}
      </Text>
<View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
  <TouchableOpacity
    style={{
      flex: 1,
      backgroundColor: "#007AFF",
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: "center",
    }}
    onPress={() => {
      if (listing?.contact_info) {
        Linking.openURL(`sms:${listing.contact_info}`);
      }
    }}
  >
    <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
      Message
    </Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={{
      flex: 1,
      backgroundColor: "#007AFF",
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: "center",
    }}
    onPress={() => {
      if (listing?.contact_info) {
        Linking.openURL(`tel:${listing.contact_info}`);
      }
    }}
  >
    <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
      Call
    </Text>
  </TouchableOpacity>
  </View>
  </View>

) : null}
    </View>
    </ScrollView>
  </SafeAreaView>
);

}

/**
 * اگر پروژه‌ات API_BASE را جای دیگری تعریف کرده، این تابع را حذف کن
 * و همان BASE_URL / API URL خودت را استفاده کن.
 */
function API_BASE() {
  // اگر در api.ts BASE_URL داری، بهتره همون را import کنی.
  // اینجا فقط برای اینکه فایل مستقل باشد.
  return "https://community-app-backend-production.up.railway.app/api"
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: { paddingBottom: 24 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  imageWrap: {
    width: "100%",
    backgroundColor: "#f2f2f2",
  },
  image: {
    width: "100%",
    // ارتفاع را با aspectRatio کنترل می‌کنیم تا کامل دیده شود
  },
  noImage: {
    height: 220,
    alignItems: "center",
    justifyContent: "center",
  },
  noImageText: { color: "#777" },

  title: { fontSize: 34, fontWeight: "800", marginTop: 16, paddingHorizontal: 16 },
  location: { fontSize: 18, color: "#666", marginTop: 6, paddingHorizontal: 16 },
  price: { fontSize: 30, fontWeight: "900", marginTop: 10, paddingHorizontal: 16 },

  sectionTitle: { fontSize: 18, fontWeight: "800", marginTop: 18, paddingHorizontal: 16 },
  bodyText: { fontSize: 16, color: "#333", marginTop: 8, lineHeight: 22, paddingHorizontal: 16 },
});

// app/listing/[id].tsx
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Image, ActivityIndicator, ScrollView, Alert, Button } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { API } from "../../lib/api"; // اگر مسیرت فرق دارد، فقط همین import را مطابق پروژه‌ات کن

type ListingImage = {
  id: number;
  image_url?: string; // تو API بعضی جاها image_url داریم
  image?: string;     // بعضی جاها image داریم
  uploaded_at?: string;
};

type Listing = {
  id: number;
  title: string;
  city: string;
  state: string;
  price: string;
  description?: string | null;
  contact_info?: string | null;
  created_at?: string;
  images?: ListingImage[];
};

export default function ListingDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // برای اینکه عکس کامل نمایش داده شود (بدون crop)
  const [aspectRatio, setAspectRatio] = useState<number>(16 / 9);

  const firstImageUrl = useMemo(() => {
    const img = listing?.images?.[0];
    return (img?.image_url || img?.image || "") as string;
  }, [listing]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        // اگر تو پروژه‌ات getListingDetails داری همون رو صدا بزن
        // اینجا مستقیم از endpoint استاندارد DRF استفاده کردم:
        const res = await fetch(`${API_BASE()}/listings/${id}/`);
        const data = (await res.json()) as Listing;

        if (!mounted) return;
        setListing(data);
      } catch (e) {
        console.log("ListingDetails error:", e);
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
  <SafeAreaView style={{ flex: 1 }}>
    <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
      {/* IMAGE */}
      {firstImageUrl ? (
  <View style={{ width: "100%", height: 320, backgroundColor: "#000" }}>
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
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: "700" }}>{listing?.title}</Text>
        <Text style={{ marginTop: 6, color: "#666" }}>
          {listing?.city}, {listing?.state}
        </Text>
        <Text style={{ marginTop: 10, fontSize: 20, fontWeight: "700" }}>
          ${listing?.price}
        </Text>
        <View style={{ marginTop: 12 }}>
          <View style={{ marginTop: 12 }}>
  <Button
    title="Edit Listing"
    onPress={() => {
      const listingId = listing?.id;
      if (!listingId) {
        Alert.alert("Error", "Listing id is missing");
        return;
      }
      router.push({
        pathname: "/listing/edit",
        params: { id: String(listingId) },
      } as any);
    }}
    />

    <Button
  title="View Profile"
  onPress={() => {
    const profileId =
      (listing as any)?.user_id ??
      (listing as any)?.owner_id ??
      (listing as any)?.user?.id;

    if (!profileId) {
      Alert.alert("Error", "Profile id is missing");
      return;
    }

    router.push({
      pathname: "/profile/[id]",
      params: { id: String(profileId) },
    } as any);
  }}
/>

  
</View>

  <Button
    title="Delete Listing"
    color="red"
    onPress={() => {
      Alert.alert(
        "Delete listing?",
        "This action cannot be undone.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                const id = listing?.id;
                if (!id == null) {
                  Alert.alert("Error", "Listing id is missing");
                 return;
                }
                 await API.deleteListing(id);

                router.replace({
  pathname: "/(tabs)/explore",
  params: { refresh: String(Date.now()) },
} as any);

              } catch (e: any) {
                Alert.alert("Error", e?.message || "Delete failed");
              }
            },
          },
        ]
      );
    }}
  />
</View>




        {/* DESCRIPTION */}
{listing?.description ? (
  <Text
    style={{
      marginTop: 12,
      fontSize: 16,
      lineHeight: 22,
      color: "#222",
    }}
  >
    {listing.description}
  </Text>
) : null}

{/* CONTACT INFO */}
{listing?.contact_info ? (
  <View
    style={{
      marginTop: 16,
      padding: 12,
      borderWidth: 1,
      borderColor: "#eee",
      borderRadius: 10,
      backgroundColor: "#fafafa",
    }}
  >
    <Text style={{ fontWeight: "700", marginBottom: 6 }}>
      Contact
    </Text>
    <Text style={{ fontSize: 16 }}>
      {listing.contact_info}
    </Text>
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
  return "http://10.9.50.123:8000/api";
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

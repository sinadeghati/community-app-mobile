// app/(tabs)/create.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Image,
  StyleSheet,
  Keyboard
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import {API} from "../../lib/api";
import { router} from "expo-router"
import * as ImageManipulator from "expo-image-manipulator"
import { useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Background, Label } from "@react-navigation/elements";
import { useRouter } from "expo-router";

const CATEGORIES = [
  { key: "services", label: "Services" },
  { key: "jobs", label: "Jobs" },
  { key: "food", label: "Food" },
  { key: "rent", label: "Rent" },
  { key: "beauty", label: "Beauty" },
  { key: "auto", label: "Auto" },
];

export default function CreateListingScreen() {
  const [title, setTitle] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [price, setPrice] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [description, setDescription] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();
  const routeParams = useLocalSearchParams();
  const idParam = routeParams.id;
  const router = useRouter();
  const [category, setCategory] = useState("services");

const editId =
  typeof idParam === "string" ? idParam :
  Array.isArray(idParam) ? idParam[0] :
  undefined;

const isEdit = !!editId;

    useEffect(() => {
    const loadForEdit = async () => {
      if (!isEdit) return;

      try {
        const listing = await API.getListing(Number(editId));

        setTitle(listing.title ?? "");
        setCity(listing.city ?? "");
        setState(listing.state ?? "");
        setPrice(String(listing.price ?? ""));
        setContactInfo(listing.contact_info ?? "");
        setDescription(listing.description ?? "");

        // اگر بعداً خواستی عکس قدیمی رو نشون بدی:
        // setImageUri(listing.image_url ?? null);
      } catch (e) {
        console.log("EDIT load failed:", e);
        Alert.alert("Error", "Could not load listing for edit");
      }
    };

    loadForEdit();
  }, [editId]);


  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Please allow photo access.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

     if (!result.canceled) {
      const uri = result.assets[0].uri;

      const manipulated = await ImageManipulator.manipulateAsync(
       uri,
       [],
       { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
  );

  setImageUri(manipulated.uri);
}

  };

  const toEnglishDigits = (s: string) =>
  s
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));

    const params = useLocalSearchParams();

   



  const handleSubmit = async () => {
  
  

  setLoading(true);

  try {
    const cleanTitle = String(title ?? "").trim();
    const cleanCity = String(city ?? "").trim();
    const cleanState = String(state ?? "").trim();
    const cleanContact = String(contactInfo ?? "").trim();

    if (!cleanTitle || !cleanCity || !cleanState || !cleanContact) {
  Alert.alert("Missing fields", "Title, City, State, Contact are required.");
  setLoading(false);
  return;
}

   

    let numericPrice = null;

if (price) {
  const cleanPrice = toEnglishDigits(String(price).trim());
  const parsed = Number(cleanPrice);

  if (!isNaN(parsed) && parsed > 0) {
    numericPrice = parsed;
  }
}

console.log("STATE DEBUG:", { state, cleanState });




    const payload = {
      title: cleanTitle,
      price: numericPrice,
      city: cleanCity,
      state: cleanState,
      contact_info: cleanContact,
      description: description?.trim() || "",
      category: category,
      latitude: 32.7157,
      longitude: -117.1611,
    };

    console.log("CREATE LISTING PAYLOAD:", payload);

    let listing;

if (isEdit && editId) {
  console.log("UPDATING LISTING ID:", editId);
  listing = await API.updateMyListing(Number(editId), payload);
} else {
  listing = await API.createListing(payload);
}

    console.log("CREATE LISTING RESPONSE:", listing);

    if (!listing?.id) {
      throw new Error("Listing created but no id returned.");
    }

    if (imageUri) {
  try {
    console.log("UPLOADING IMAGE:", imageUri);
    const uploadRes = await API.uploadListingImage(listing.id, imageUri);
    console.log("UPLOAD IMAGE RESPONSE:", uploadRes);
  } catch (e: any) {
    console.log("UPLOAD IMAGE ERROR:", e?.response?.data || e?.message || e);
    Alert.alert("Image Upload Error", "Check terminal logs (UPLOAD IMAGE ERROR).");
  }
}

setTitle("");
setPrice("");
setCity("");
setState("");
setContactInfo("");
setDescription("");
setImageUri(null);

Alert.alert("Success", "Listing posted successfully");

  router.replace({
  pathname: "/(tabs)/explore",
  params: { refresh: String(Date.now()) },
});



return;


  } catch (err: any) {
    console.log("CREATE LISTING ERROR:", err?.response?.data || err);
    Alert.alert("Error", "Check terminal logs.");
  } finally {
    setLoading(false);
  }
};


  return (
    <SafeAreaView style={{ flex:1, paddingTop: insets.top }}>
      <ScrollView
  keyboardShouldPersistTaps="handled"
  onScrollBeginDrag={Keyboard.dismiss}
  contentContainerStyle={{ padding: 16, backgroundColor: "#fff" }}
>
      <Text style={{ fontSize: 24, fontWeight: "800", marginBottom: 12 }}>Create Listing</Text>

      <Text style={{ marginBottom: 6, fontWeight: "600"}}>Category</Text>

<View style={styles.categoryRow}>
  {CATEGORIES.map((item) => {
    const active = category === item.key;

    return (
      <TouchableOpacity
        key={item.key}
        onPress={() => setCategory(item.key)}
        style={[
          styles.categoryChip,
          active && styles.categoryChipActive,
        ]}
      >
        <Text
          style={[
            styles.categoryChipText,
            active && styles.categoryChipTextActive,
          ]}
        >
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  })}
</View>

      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="Title"
        placeholderTextColor="#999"
        style={{ borderWidth: 1, borderColor: "#ccc",color: "#111", padding: 12, borderRadius: 10, marginBottom: 10 }}
      />

      <TextInput
        value={price}
        onChangeText={setPrice}
        placeholder="Price"
        placeholderTextColor="#999"
        keyboardType="numeric"
        style={{ borderWidth: 1, borderColor: "#ccc", color: "#111",  padding: 12, borderRadius: 10, marginBottom: 10 }}
      />

      <TextInput
        value={city}
        onChangeText={setCity}
        placeholder="City"
        placeholderTextColor="#999"
        style={{ borderWidth: 1, borderColor: "#ccc", color: "#111", padding: 12, borderRadius: 10, marginBottom: 10 }}
      />

      <TextInput
        value={state}
        onChangeText={setState}
        placeholder="State"
        placeholderTextColor="#999"
        style={{ borderWidth: 1, borderColor: "#ccc", color: "#111" ,  padding: 12,  borderRadius: 10, marginBottom: 10 }}
      />

      <TextInput
        value={contactInfo}
        onChangeText={setContactInfo}
        placeholder="Contact Info (phone/email)"
        placeholderTextColor="#999"
        style={{ borderWidth: 1, borderColor: "#ccc", color: "#111" , padding: 12, borderRadius: 10, marginBottom: 10 }}
      />

      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder="Description (optional)"
        placeholderTextColor="#999"
        multiline
        style={{ borderWidth: 1, borderColor: "#ccc", color: "#111" , padding: 12, borderRadius: 10, marginBottom: 10, height: 90 }}
      />

      <TouchableOpacity
        onPress={pickImage}
        style={{
          borderWidth: 1,
          padding: 12,
          borderRadius: 10,
          marginBottom: 10,
          alignItems: "center",
        }}
      >
        <Text>{imageUri ? "Change Image" : "Pick Image"}</Text>
      </TouchableOpacity>

      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={{ width: "100%", height: 220, borderRadius: 12, marginBottom: 12 }}
          resizeMode="cover"
        />
      ) : null}

      <TouchableOpacity
        onPress={handleSubmit}
        disabled={loading}
        style={{
          backgroundColor: "black",
          padding: 14,
          borderRadius: 12,
          alignItems: "center",
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? <ActivityIndicator /> : <Text style={{ color: "white", fontWeight: "800" }}>Submit</Text>}
      </TouchableOpacity>
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },

  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 18,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: "#fff",
  },

  categoryChipActive: {
    backgroundColor: "#111",
    borderColor: "#111",
  },

  categoryChipText: {
    color: "#111",
    fontSize: 14,
  },

  categoryChipTextActive: {
    color: "#fff",
  },
});

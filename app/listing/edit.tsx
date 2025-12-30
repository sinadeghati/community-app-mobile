// app/listing/edit.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  Button,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { API } from "../../lib/api";


export default function EditListing() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [city, setCity] = useState("");
  const [stateVal, setStateVal] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [contactInfo, setContactInfo] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        if (!id) {
          Alert.alert("Error", "Listing id is missing");
          return;
        }

        setLoading(true);
        const data = await API.getListing(id);

        setTitle(data?.title ?? "");
        setCity(data?.city ?? "");
        setStateVal(data?.state ?? "");
        setPrice(String(data?.price ?? ""));
        setDescription(data?.description ?? "");
        setContactInfo(data?.contact_info ?? "");
      } catch (e: any) {
        Alert.alert("Error", e?.message || "Failed to load listing");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const onSave = async () => {
    try {
      if (!id) {
        Alert.alert("Error", "Listing id is missing");
        return;
      }

      // حداقل ولیدیشن ساده
      if (!title.trim()) {
        Alert.alert("Error", "Title is required");
        return;
      }

      setSaving(true);

      const payload = {
        title: title.trim(),
        city: city.trim(),
        state: stateVal.trim(),
        price: price, // اگر عدد می‌خوای بعداً تبدیلش می‌کنیم
        description: description.trim(),
        contact_info: contactInfo.trim(),
      };

      await API.updateListing(id, payload);

      // برگرد به Details همون آگهی + refresh
     router.replace("/(tabs)/mylistings");
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={{ marginTop: 10 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Edit Listing</Text>

      <Text style={styles.label}>Title</Text>
      <TextInput value={title} onChangeText={setTitle} style={styles.input} />

      <Text style={styles.label}>City</Text>
      <TextInput value={city} onChangeText={setCity} style={styles.input} />

      <Text style={styles.label}>State</Text>
      <TextInput value={stateVal} onChangeText={setStateVal} style={styles.input} />

      <Text style={styles.label}>Price</Text>
      <TextInput
        value={price}
        onChangeText={setPrice}
        style={styles.input}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        value={description}
        onChangeText={setDescription}
        style={[styles.input, styles.textArea]}
        multiline
      />

      <Text style={styles.label}>Contact Info</Text>
      <TextInput
        value={contactInfo}
        onChangeText={setContactInfo}
        style={styles.input}
      />

      <View style={{ marginTop: 16 }}>
        <Button
          title={saving ? "Saving..." : "Save"}
          onPress={onSave}
          disabled={saving}
        />
      </View>

      <View style={{ marginTop: 10 }}>
        <Button title="Cancel" onPress={() => router.back()} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  header: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
  },
  label: {
    marginTop: 10,
    marginBottom: 6,
    fontSize: 14,
    color: "#444",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  textArea: {
    minHeight: 110,
    textAlignVertical: "top",
  },
});

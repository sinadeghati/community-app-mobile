import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TextInput,
  Pressable,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getActiveUserId,
  loadUserBusinesses,
  loadUserProfile,
  requireAuthenticatedUser,
} from "../../lib/userSessionStorage";
import { useRouter, useLocalSearchParams } from "expo-router";

const colors = {
  bg: "#F6F4EF",
  card: "#FFFFFF",
  text: "#111111",
  muted: "#6B7280",
  border: "#E5E7EB",
  teal: "#0F9D94",
  tealSoft: "#DDF5F3",
  danger: "#DC2626",
  gold: "#E6C27A",
};

export default function CreateListingFinal() {
  const router = useRouter();

  const { editId, returnTo } = useLocalSearchParams<{
    editId?: string;
    returnTo?: string;
  }>();

  const handleBack = () => {
    if (returnTo === "mylistings") {
      router.replace("/mylistings");
      return;
    }
    router.back();
  };

  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");

  const [phone, setPhone] = useState("");
  const [instagram, setInstagram] = useState("");
  const [website, setWebsite] = useState("");

  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");

  const [coverImage, setCoverImage] = useState<string | null>(null);

  const [gallery, setGallery] = useState<string[]>([]);
  const [localBusinesses, setLocalBusinesses] = useState<any[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const guard = async () => {
      const userId = await requireAuthenticatedUser();
      if (!cancelled && !userId) {
        router.replace("/(tabs)");
      }
    };

    void guard();

    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    const loadBusinesses = async () => {
      try {
        const userId = await getActiveUserId();
        const list = userId ? await loadUserBusinesses(userId) : [];
        setLocalBusinesses(Array.isArray(list) ? list : []);
      } catch (error) {
        console.log("Failed to load local businesses", error);
      }
    };

    loadBusinesses();
  }, []);

  useEffect(() => {
    const loadEditListing = async () => {
      if (!editId) return;

      try {
        const userId = await getActiveUserId();
        const profile = userId ? (await loadUserProfile(userId)) || {} : {};

        const storageKey = `my_listings_${profile.username || profile.email || "default"}`;

        const existing = await AsyncStorage.getItem(storageKey);
        const parsedListings = existing ? JSON.parse(existing) : [];


        const listing = parsedListings.find(
          (item: any) => item.id === String(editId)
        );

        console.log("EDIT ID:", editId);
        console.log("LISTINGS:", parsedListings);
        console.log("FOUND:", listing);

        if (!listing) return;

        console.log("EDIT ID:", editId);
        console.log("LISTINGS:", parsedListings);
        console.log("FOUND:", listing);

        setTitle(listing.title || "");
        setCategory(listing.category || "");
        setDescription(listing.description || "");
        setPhone(listing.phone || "");
        setInstagram(listing.instagram || "");
        setWebsite(listing.website || "");
        setCity(listing.city || "");
        setAddress(listing.address || "");
        setCoverImage(listing.image || null);
        setGallery(listing.gallery || []);
        setSelectedBusinessId(
          listing.businessId ? String(listing.businessId) : null
        );
      } catch (error) {
        console.log("Failed to load listing for edit", error);
      }
    };

    loadEditListing();
  }, [editId]);

  const canPublish = useMemo(() => {
    return (
      title.trim().length > 2 &&
      category.trim().length > 1 &&
      description.trim().length > 2 &&
      coverImage
    );
  }, [title, category, description, coverImage]);

  const pickCoverImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets?.length > 0) {
      setCoverImage(result.assets[0].uri);
    }
  };

  const pickGalleryImage = async () => {
    if (gallery.length >= 8) {
      Alert.alert("Limit reached", "Maximum 8 gallery photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled && result.assets?.length > 0) {
      setGallery((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const removeGalleryImage = (uri: string) => {
    setGallery((prev) => prev.filter((item) => item !== uri));
  };

  const saveDraft = () => {
    Alert.alert("Draft Saved", "Draft system will connect to backend later.");
  };

  const publishListing = async () => {
    if (!canPublish) {
      Alert.alert(
        "Missing information",
        "Please complete required fields first."
      );
      return;
    }

    try {


      setLoading(true);

      const userId = await getActiveUserId();
      const profile = userId ? (await loadUserProfile(userId)) || {} : {};

      const storageKey = `my_listings_${profile.username || profile.email || "default"
        }`;

      const existing = await AsyncStorage.getItem(storageKey);
      const parsedListings = existing ? JSON.parse(existing) : [];

      const linkedBusiness = selectedBusinessId
        ? localBusinesses.find(
            (biz: any) => String(biz.id) === String(selectedBusinessId)
          )
        : null;

      const newListing: Record<string, unknown> = {
        id: Date.now().toString(),
        title,
        category,
        city,
        image: coverImage,
        status: "active",
        views: 0,
        favorites: 0,
        messages: 0,
        updatedAt: "Just now",
        description,
        phone,
        instagram,
        website,
        address,
        gallery,
        ownerUsername: profile.username || "",
        ownerEmail: profile.email || "",
        businessCategory: category,
      };

      if (linkedBusiness) {
        newListing.businessId = String(linkedBusiness.id);
        newListing.businessName =
          linkedBusiness.name || linkedBusiness.business_name || "";
      }

      let updatedListings;

      if (editId) {
        updatedListings = parsedListings.map((item: any) => {
          if (item.id !== String(editId)) return item;

          const updated: any = {
            ...item,
            ...newListing,
            id: item.id,
            updatedAt: "Updated just now",
          };

          if (!linkedBusiness) {
            delete updated.businessId;
            delete updated.businessName;
          }

          return updated;
        });
      } else {
        updatedListings = [newListing, ...parsedListings];
      }

      await AsyncStorage.setItem(
        storageKey,
        JSON.stringify(updatedListings)
      );

      setTimeout(() => {
        setLoading(false);

        Alert.alert(
          "Listing Published",
          "Your business listing has been published."
        );

        router.push("/mylistings");
      }, 1200);
    } catch (error) {
      setLoading(false);

      Alert.alert("Error", "Something went wrong.");
    }
  };


  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colors.bg,
      }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 120,
          }}
        >
          <View
            style={{
              backgroundColor: colors.teal,
              paddingHorizontal: 20,
              paddingTop: 20,
              paddingBottom: 36,
              borderBottomLeftRadius: 34,
              borderBottomRightRadius: 34,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Pressable
                onPress={handleBack}
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  backgroundColor: "rgba(255,255,255,0.18)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name="arrow-back"
                  size={22}
                  color="#FFFFFF"
                />
              </Pressable>

              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 28,
                    fontWeight: "900",
                  }}
                >
                  Create Listing
                </Text>

                <Text
                  style={{
                    marginTop: 4,
                    color: "rgba(255,255,255,0.82)",
                    fontSize: 14,
                    fontWeight: "600",
                  }}
                >
                  Add your business, services, events, or products.
                </Text>
              </View>

              <Pressable onPress={saveDraft}>
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontWeight: "900",
                  }}
                >
                  Save Draft
                </Text>
              </Pressable>
            </View>
          </View>
          <View
            style={{
              marginTop: 20,
              marginHorizontal: 18,
              backgroundColor: colors.card,
              borderRadius: 30,
              padding: 18,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text
              style={{
                fontSize: 22,
                fontWeight: "900",
                color: colors.text,
              }}
            >
              Cover Image
            </Text>

            <Text
              style={{
                marginTop: 6,
                color: colors.muted,
                lineHeight: 21,
              }}
            >
              Choose a beautiful cover image for your business profile.
            </Text>

            <Pressable
              onPress={pickCoverImage}
              style={{
                marginTop: 18,
                height: 210,
                borderRadius: 24,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: "#F3F4F6",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {coverImage ? (
                <Image
                  source={{ uri: coverImage }}
                  resizeMode="cover"
                  style={{
                    width: "100%",
                    height: "100%",
                  }}
                />
              ) : (
                <View
                  style={{
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons
                    name="image-outline"
                    size={42}
                    color={colors.muted}
                  />

                  <Text
                    style={{
                      marginTop: 10,
                      color: colors.text,
                      fontSize: 16,
                      fontWeight: "800",
                    }}
                  >
                    Upload Cover Photo
                  </Text>

                  <Text
                    style={{
                      marginTop: 4,
                      color: colors.muted,
                      fontSize: 13,
                    }}
                  >
                    Tap to select image
                  </Text>
                </View>
              )}
            </Pressable>

            <View
              style={{
                marginTop: 26,
              }}
            >
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "900",
                  color: colors.text,
                }}
              >
                Gallery
              </Text>

              <Text
                style={{
                  marginTop: 6,
                  color: colors.muted,
                  lineHeight: 21,
                }}
              >
                Add photos of your business, products, food, office, or services.
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  paddingTop: 18,
                  paddingRight: 20,
                }}
              >
                <Pressable
                  onPress={pickGalleryImage}
                  style={{
                    width: 110,
                    height: 110,
                    borderRadius: 22,
                    backgroundColor: colors.tealSoft,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                  }}
                >
                  <Ionicons
                    name="add"
                    size={34}
                    color={colors.teal}
                  />
                </Pressable>

                {gallery.map((item) => (
                  <View
                    key={item}
                    style={{
                      marginRight: 12,
                    }}
                  >
                    <Image
                      source={{ uri: item }}
                      style={{
                        width: 110,
                        height: 110,
                        borderRadius: 22,
                      }}
                    />

                    <Pressable
                      onPress={() => removeGalleryImage(item)}
                      style={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: "rgba(0,0,0,0.72)",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons
                        name="close"
                        size={16}
                        color="#FFFFFF"
                      />
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
            </View>

            <View
              style={{
                marginTop: 26,
              }}
            >
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "900",
                  color: colors.text,
                  marginBottom: 14,
                }}
              >
                Category
              </Text>

              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                }}
              >
                {[
                  "Restaurant",
                  "Cafe",
                  "Beauty",
                  "Auto",
                  "Real Estate",
                  "Events",
                  "Services",
                  "Shopping",
                ].map((item) => {
                  const selected = category === item;

                  return (
                    <Pressable
                      key={item}
                      onPress={() => setCategory(item)}
                      style={{
                        paddingHorizontal: 16,
                        height: 42,
                        borderRadius: 21,
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 10,
                        marginBottom: 10,
                        backgroundColor: selected
                          ? colors.teal
                          : "#F3F4F6",
                      }}
                    >
                      <Text
                        style={{
                          color: selected ? "#FFFFFF" : colors.text,
                          fontWeight: "800",
                          fontSize: 13,
                        }}
                      >
                        {item}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            <View
              style={{
                marginTop: 30,
              }}
            >
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: "900",
                  color: colors.text,
                  marginBottom: 4,
                }}
              >
                Business Information
              </Text>

              <Text
                style={{
                  color: colors.muted,
                  lineHeight: 21,
                }}
              >
                Add your public business details and contact information.
              </Text>

              {localBusinesses.length > 0 ? (
                <View style={{ marginTop: 18 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "800",
                      color: colors.text,
                      marginBottom: 10,
                    }}
                  >
                    Connected business profile
                  </Text>

                  <Pressable
                    onPress={() => setSelectedBusinessId(null)}
                    style={{
                      alignSelf: "flex-start",
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 999,
                      marginBottom: 8,
                      backgroundColor:
                        selectedBusinessId === null ? colors.teal : "#F3F4F6",
                      borderWidth: 1,
                      borderColor:
                        selectedBusinessId === null ? colors.teal : colors.border,
                    }}
                  >
                    <Text
                      style={{
                        color:
                          selectedBusinessId === null ? "#fff" : colors.text,
                        fontWeight: "800",
                        fontSize: 13,
                      }}
                    >
                      No business linked
                    </Text>
                  </Pressable>

                  {localBusinesses.map((biz: any) => {
                    const bizId = String(biz.id);
                    const bizName = biz.name || biz.business_name || "Business";
                    const selected = selectedBusinessId === bizId;

                    return (
                      <Pressable
                        key={bizId}
                        onPress={() => setSelectedBusinessId(bizId)}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 10,
                          borderRadius: 16,
                          marginBottom: 8,
                          backgroundColor: selected ? colors.teal : "#F3F4F6",
                          borderWidth: 1,
                          borderColor: selected ? colors.teal : colors.border,
                        }}
                      >
                        <Text
                          style={{
                            color: selected ? "#fff" : colors.text,
                            fontWeight: "800",
                            fontSize: 14,
                          }}
                        >
                          {bizName}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}

              <InputField
                label="Listing Title"
                value={title}
                onChangeText={setTitle}
                placeholder="Example: Tahchin Corner"
                icon="business-outline"
              />

              <InputField
                label="Description"
                value={description}
                onChangeText={setDescription}
                placeholder="Describe your business, services, products, food, atmosphere, or specialties..."
                icon="document-text-outline"
                multiline
              />

              <InputField
                label="Phone Number"
                value={phone}
                onChangeText={setPhone}
                placeholder="(858) 555-5555"
                icon="call-outline"
                keyboardType="phone-pad"
              />

              <InputField
                label="Instagram"
                value={instagram}
                onChangeText={setInstagram}
                placeholder="@yourbusiness"
                icon="logo-instagram"
              />

              <InputField
                label="Website"
                value={website}
                onChangeText={setWebsite}
                placeholder="https://yourbusiness.com"
                icon="globe-outline"
                keyboardType="url"
              />

              <InputField
                label="City"
                value={city}
                onChangeText={setCity}
                placeholder="San Diego"
                icon="location-outline"
              />

              <InputField
                label="Address"
                value={address}
                onChangeText={setAddress}
                placeholder="Street address or area"
                icon="map-outline"
              />
            </View>

            <View
              style={{
                marginTop: 28,
                borderRadius: 24,
                backgroundColor: colors.tealSoft,
                padding: 16,
                flexDirection: "row",
                alignItems: "flex-start",
              }}
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={22}
                color={colors.teal}
              />

              <View
                style={{
                  flex: 1,
                  marginLeft: 12,
                }}
              >
                <Text
                  style={{
                    color: colors.text,
                    fontWeight: "900",
                    fontSize: 14,
                  }}
                >
                  Owner Access Only
                </Text>

                <Text
                  style={{
                    marginTop: 4,
                    color: colors.muted,
                    lineHeight: 21,
                    fontSize: 13,
                  }}
                >
                  Only the business owner can edit, delete, manage photos, or publish listings.
                  Public users can only view your business profile.
                </Text>
              </View>
            </View>
            <View
              style={{
                marginTop: 30,
              }}
            >
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: "900",
                  color: colors.text,
                  marginBottom: 6,
                }}
              >
                Preview
              </Text>

              <Text
                style={{
                  color: colors.muted,
                  lineHeight: 21,
                }}
              >
                This is how your listing may appear in Explore and Business Profile.
              </Text>

              <View
                style={{
                  marginTop: 18,
                  borderRadius: 28,
                  overflow: "hidden",
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <View
                  style={{
                    height: 210,
                    backgroundColor: "#E5E7EB",
                  }}
                >
                  {coverImage ? (
                    <Image
                      source={{ uri: coverImage }}
                      resizeMode="cover"
                      style={{
                        width: "100%",
                        height: "100%",
                      }}
                    />
                  ) : (
                    <View
                      style={{
                        flex: 1,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: colors.tealSoft,
                      }}
                    >
                      <Ionicons
                        name="image-outline"
                        size={42}
                        color={colors.teal}
                      />

                      <Text
                        style={{
                          marginTop: 10,
                          color: colors.text,
                          fontWeight: "800",
                        }}
                      >
                        Cover preview
                      </Text>
                    </View>
                  )}
                </View>

                <View
                  style={{
                    padding: 18,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        numberOfLines={1}
                        style={{
                          fontSize: 22,
                          fontWeight: "900",
                          color: colors.text,
                        }}
                      >
                        {title || "Business Name"}
                      </Text>

                      <Text
                        style={{
                          marginTop: 5,
                          color: colors.muted,
                          fontWeight: "700",
                        }}
                      >
                        {category || "Category"}
                      </Text>
                    </View>

                    <View
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 7,
                        borderRadius: 999,
                        backgroundColor: colors.tealSoft,
                      }}
                    >
                      <Text
                        style={{
                          color: colors.teal,
                          fontWeight: "900",
                          fontSize: 12,
                        }}
                      >
                        Preview
                      </Text>
                    </View>
                  </View>

                  <Text
                    numberOfLines={3}
                    style={{
                      marginTop: 14,
                      color: colors.muted,
                      lineHeight: 22,
                    }}
                  >
                    {description || "Your business description will appear here."}
                  </Text>

                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginTop: 16,
                    }}
                  >
                    <Ionicons
                      name="location-outline"
                      size={18}
                      color={colors.muted}
                    />

                    <Text
                      style={{
                        marginLeft: 6,
                        color: colors.muted,
                        fontWeight: "700",
                      }}
                    >
                      {city || "Location"}
                    </Text>
                  </View>

                  <View
                    style={{
                      flexDirection: "row",
                      marginTop: 20,
                    }}
                  >
                    <Pressable
                      style={{
                        flex: 1,
                        height: 48,
                        borderRadius: 16,
                        backgroundColor: colors.teal,
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "row",
                        marginRight: 8,
                      }}
                    >
                      <Ionicons
                        name="call-outline"
                        size={18}
                        color="#FFFFFF"
                      />

                      <Text
                        style={{
                          marginLeft: 6,
                          color: "#FFFFFF",
                          fontWeight: "900",
                        }}
                      >
                        Call
                      </Text>
                    </Pressable>

                    <Pressable
                      style={{
                        width: 52,
                        height: 48,
                        borderRadius: 16,
                        backgroundColor: "#F3F4F6",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons
                        name="heart-outline"
                        size={22}
                        color={colors.text}
                      />
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>

            <View
              style={{
                flexDirection: "row",
                marginTop: 30,
              }}
            >
              <Pressable
                onPress={saveDraft}
                style={{
                  flex: 1,
                  height: 58,
                  borderRadius: 20,
                  backgroundColor: "#E5E7EB",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 10,
                }}
              >
                <Text
                  style={{
                    color: colors.text,
                    fontWeight: "900",
                    fontSize: 15,
                  }}
                >
                  Save Draft
                </Text>
              </Pressable>

              <Pressable
                disabled={!canPublish || loading}
                onPress={publishListing}
                style={{
                  flex: 1.4,
                  height: 58,
                  borderRadius: 20,
                  backgroundColor:
                    canPublish && !loading
                      ? colors.teal
                      : "#9CA3AF",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "row",
                }}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons
                      name="rocket-outline"
                      size={20}
                      color="#FFFFFF"
                    />

                    <Text
                      style={{
                        marginLeft: 8,
                        color: "#FFFFFF",
                        fontWeight: "900",
                        fontSize: 16,
                      }}
                    >
                      Publish Listing
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const InputField = ({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType,
  icon,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  multiline?: boolean;
  keyboardType?: any;
  icon: keyof typeof Ionicons.glyphMap;
}) => (
  <View style={{ marginTop: 18 }}>
    <Text
      style={{
        marginBottom: 8,
        fontSize: 15,
        fontWeight: "900",
        color: colors.text,
      }}
    >
      {label}
    </Text>

    <View
      style={{
        minHeight: multiline ? 120 : 58,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: "#FAFAFA",
        flexDirection: "row",
        alignItems: multiline ? "flex-start" : "center",
        paddingHorizontal: 14,
      }}
    >
      <Ionicons
        name={icon}
        size={20}
        color={colors.muted}
        style={{ marginTop: multiline ? 18 : 0 }}
      />

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        multiline={multiline}
        keyboardType={keyboardType}
        style={{
          flex: 1,
          marginLeft: 10,
          fontSize: 15,
          color: colors.text,
          paddingTop: multiline ? 16 : 0,
          paddingBottom: multiline ? 16 : 0,
        }}
      />
    </View>
  </View>
);

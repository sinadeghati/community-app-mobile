import { Alert, Linking } from "react-native";

/** Opens the device SMS app for an external text message (not in-app chat). */
export async function openSmsToPhone(phone: string) {
  const cleanPhone = String(phone).replace(/\D/g, "");

  if (!cleanPhone) {
    Alert.alert(
      "No phone number",
      "This contact does not have a phone number yet."
    );
    return;
  }

  try {
    await Linking.openURL(`sms:${cleanPhone}`);
  } catch {
    Alert.alert("Could not open messages", "Please try again later.");
  }
}

export function pickPhone(record: Record<string, unknown> | null | undefined) {
  if (!record) {
    return "";
  }
  return String(record.phone || record.contact_info || record.contact || "").trim();
}

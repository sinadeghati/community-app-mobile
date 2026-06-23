import React from "react";
import { LegalDocumentScreen } from "../../components/legal/LegalDocumentScreen";

const SECTIONS = [
  {
    title: "Overview",
    body:
      "Korook (“we”, “us”) operates the Korook mobile application and related services at korook.com. This Privacy Policy explains how we collect, use, and protect your information when you use Korook.",
  },
  {
    title: "Information we collect",
    body:
      "We may collect account information (name, username, email), profile details you choose to share, business and event listings you create, favorites and interest signals, and general location (city/region) when you grant permission. We do not sell your personal information.",
  },
  {
    title: "How we use information",
    body:
      "We use your information to operate the app, personalize discovery, display listings and events near you, secure your account, and improve Korook. Communications you initiate (calls, directions, external links) are handled by your device and third-party services.",
  },
  {
    title: "Location",
    body:
      "When enabled, Korook uses your location to center the map and show nearby businesses and events. We show community members city or general area on profiles — not your precise street address unless you choose to share it elsewhere.",
  },
  {
    title: "Photos & content",
    body:
      "Images you upload (profile photos, business galleries, event flyers) are stored to display your listings. You are responsible for content you post and must have rights to share it.",
  },
  {
    title: "Data retention & deletion",
    body:
      "You can permanently delete your Korook account from Profile or Account settings. Deletion removes your profile and server-side data we control. We may retain certain records as required by law or for fraud prevention. Contact support@korook.com to exercise other privacy rights applicable in your region.",
  },
  {
    title: "Contact",
    body:
      "Questions about this policy: support@korook.com",
  },
];

export default function PrivacyPolicyScreen() {
  return (
    <LegalDocumentScreen
      title="Privacy Policy"
      subtitle="Last updated: June 2026"
      sections={SECTIONS}
    />
  );
}

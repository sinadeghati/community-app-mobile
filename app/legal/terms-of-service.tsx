import React from "react";
import { LegalDocumentScreen } from "../../components/legal/LegalDocumentScreen";

const SECTIONS = [
  {
    title: "Agreement",
    body:
      "By creating an account or using Korook, you agree to these Terms of Service. If you do not agree, do not use the app.",
  },
  {
    title: "The Korook service",
    body:
      "Korook helps users discover Persian-owned businesses, community events, and local services. Listings and events may be created by community members and business owners. Korook does not guarantee the accuracy of third-party content.",
  },
  {
    title: "Your account",
    body:
      "You are responsible for safeguarding your login credentials and for activity under your account. Provide accurate registration information and keep your profile up to date.",
  },
  {
    title: "User content",
    body:
      "You retain ownership of content you submit. By posting listings, photos, reviews, or events, you grant Korook a license to display and distribute that content within the service. Do not post unlawful, misleading, or infringing material.",
  },
  {
    title: "Prohibited conduct",
    body:
      "You may not scrape the service, interfere with security, harass users, post spam, or use Korook for illegal purposes. We may remove content or suspend accounts that violate these terms.",
  },
  {
    title: "Disclaimer",
    body:
      "Korook is provided “as is.” We are not liable for business transactions, event attendance, or third-party services linked from the app. Use your own judgment when engaging with listings.",
  },
  {
    title: "Changes",
    body:
      "We may update these terms. Continued use after changes constitutes acceptance. Material updates will be communicated in-app or via email where appropriate.",
  },
  {
    title: "Contact",
    body:
      "Legal inquiries: support@korook.com",
  },
];

export default function TermsOfServiceScreen() {
  return (
    <LegalDocumentScreen
      title="Terms of Service"
      subtitle="Last updated: June 2026"
      sections={SECTIONS}
    />
  );
}

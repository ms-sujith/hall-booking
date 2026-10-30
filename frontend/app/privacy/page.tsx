import type { Metadata } from "next";
import PolicyPage from "../../components/PolicyPage";

export const metadata: Metadata = {
  title: "Privacy Policy | HallBook",
  description: "How HallBook handles account, booking and payment-related information.",
};

export default function PrivacyPage() {
  return <PolicyPage page="privacy" />;
}
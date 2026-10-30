import type { Metadata } from "next";
import PolicyPage from "../../components/PolicyPage";

export const metadata: Metadata = {
  title: "Terms and Conditions | HallBook",
  description: "Terms and conditions for using HallBook.",
};

export default function TermsPage() {
  return <PolicyPage page="terms" />;
}
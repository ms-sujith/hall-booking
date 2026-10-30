import type { Metadata } from "next";
import PolicyPage from "../../components/PolicyPage";

export const metadata: Metadata = {
  title: "Pricing Details | HallBook",
  description: "Understand venue pricing and online payment details on HallBook.",
};

export default function PricingPage() {
  return <PolicyPage page="pricing" />;
}
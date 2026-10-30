import type { Metadata } from "next";
import PolicyPage from "../../components/PolicyPage";

export const metadata: Metadata = {
  title: "Cancellation and Refund Policy | HallBook",
  description: "Hall-specific cancellation rules and refund processing information.",
};

export default function RefundPolicyPage() {
  return <PolicyPage page="refund-policy" />;
}
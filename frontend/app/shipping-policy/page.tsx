import type { Metadata } from "next";
import PolicyPage from "../../components/PolicyPage";

export const metadata: Metadata = {
  title: "Shipping and Service Delivery Policy | HallBook",
  description: "HallBook provides digital venue booking services and does not ship physical goods.",
};

export default function ShippingPolicyPage() {
  return <PolicyPage page="shipping-policy" />;
}
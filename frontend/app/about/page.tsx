import type { Metadata } from "next";
import PolicyPage from "../../components/PolicyPage";

export const metadata: Metadata = {
  title: "About Us | HallBook",
  description: "Learn about the HallBook hall discovery and booking platform.",
};

export default function AboutPage() {
  return <PolicyPage page="about" />;
}
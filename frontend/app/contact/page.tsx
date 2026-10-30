import type { Metadata } from "next";
import PolicyPage from "../../components/PolicyPage";

export const metadata: Metadata = {
  title: "Contact Us | HallBook",
  description: "Contact HallBook customer support and grievance redressal.",
};

export default function ContactPage() {
  return <PolicyPage page="contact" />;
}
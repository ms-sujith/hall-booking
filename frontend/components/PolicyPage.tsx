type PolicyPageKey =
  | "about"
  | "contact"
  | "pricing"
  | "terms"
  | "privacy"
  | "refund-policy"
  | "shipping-policy";

type PolicySection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
};

type PolicyContent = {
  title: string;
  intro: string;
  sections: PolicySection[];
};

const SUPPORT_EMAIL = "sujithms335@gmail.com";
const SUPPORT_PHONE_DISPLAY = "+91 97420 68540";
const SUPPORT_PHONE_LINK = "+919742068540";
const LAST_UPDATED = "31 October 2026";

const pages: Record<PolicyPageKey, PolicyContent> = {
  about: {
    title: "About HallBook",
    intro:
      "HallBook is an online platform designed to help customers discover function halls and marriage venues, send booking requests and manage booking information.",
    sections: [
      {
        heading: "What HallBook does",
        paragraphs: [
          "HallBook helps customers explore venue information, compare available details and submit booking requests. The platform also helps hall owners receive and manage booking enquiries.",
          "HallBook provides the technology and booking interface. Unless a listing expressly says otherwise, the venue and event-related services are provided by the respective hall owner or venue operator.",
        ],
      },
      {
        heading: "How bookings work",
        bullets: [
          "A customer submits a booking request and the booking may show as PENDING.",
          "The hall owner reviews the request and may confirm or reject it.",
          "Where payment is required, the customer can proceed through the payment option made available after confirmation.",
          "Customers should rely on the booking status and payment status shown in HallBook and contact support if the information appears incorrect.",
        ],
      },
      {
        heading: "Our approach",
        paragraphs: [
          "We aim to make hall discovery and booking communication clearer and more convenient. Customers should review venue facilities, availability, pricing, inclusions and the applicable cancellation terms before completing a booking or payment.",
        ],
      },
    ],
  },
  contact: {
    title: "Contact Us",
    intro:
      "Contact HallBook for help with accounts, hall enquiries, bookings, payments, cancellations, refunds or complaints.",
    sections: [
      {
        heading: "Customer support",
        paragraphs: [
          `Email: ${SUPPORT_EMAIL}`,
          `Phone: ${SUPPORT_PHONE_DISPLAY}`,
          "When contacting us about a booking or payment, please include your booking reference, the email address registered with HallBook and the payment transaction reference, if available. Do not send your password, card number, CVV, UPI PIN or OTP.",
        ],
      },
      {
        heading: "Business and grievance details",
        paragraphs: [
          "Legal business/operator name: Sujith M S (individual operator of HallBook)",
          "Principal business address: House No. 13, 2nd Cross, Arunodaya Layout, Yelahanka RTO Office Road, Yelahanka, Bengaluru, Karnataka - 560019, India.",
          "Grievance Officer name: Sujith M S",
          "Grievance Officer designation: Grievance Officer",
          `Grievance email: ${SUPPORT_EMAIL}`,
          `Grievance phone: ${SUPPORT_PHONE_DISPLAY}`,
        ],
      },
      {
        heading: "Grievance redressal",
        paragraphs: [
          "We will acknowledge consumer grievances within 48 hours of receipt and endeavour to resolve them within one month, in accordance with applicable requirements. If your concern relates to a specific hall, please include the hall name and booking reference so that we can review it with the relevant venue operator.",
        ],
      },
    ],
  },
  pricing: {
    title: "Pricing Details",
    intro:
      "HallBook lists venues and booking information. The price of a venue booking is generally set by the respective hall owner or venue operator.",
    sections: [
      {
        heading: "Venue prices",
        paragraphs: [
          "Prices may vary by venue, event date, duration, guest capacity, facilities, package and other requirements. Review the price and inclusions shown for the selected hall and confirm any details with the hall owner before paying.",
          "The amount presented to you for payment should be reviewed before you authorise the transaction. Any applicable taxes, additional services or other charges should be clarified before payment is completed.",
        ],
      },
      {
        heading: "No universal booking price",
        paragraphs: [
          "HallBook does not publish one fixed price for all halls. Each venue may have its own rates and booking conditions. A price enquiry or booking request is not a confirmed booking; check the booking status and final amount before proceeding.",
        ],
      },
      {
        heading: "Payment",
        paragraphs: [
          "Where online payment is enabled, payments are processed through the payment gateway displayed at checkout. The payment amount and transaction details should be checked before you authorise payment. HallBook may receive transaction references and payment status for booking records and support.",
        ],
      },
    ],
  },
  terms: {
    title: "Terms and Conditions",
    intro:
      "These Terms and Conditions apply to your access to and use of the HallBook website and booking platform. By using HallBook, you agree to these terms.",
    sections: [
      {
        heading: "The HallBook platform",
        paragraphs: [
          "HallBook provides an online platform for customers to discover venues and submit booking requests, and for hall owners to manage enquiries and booking information. Unless expressly stated otherwise, venue facilities and event services are supplied by the relevant hall owner or venue operator, not by HallBook.",
          "The platform is operated by Sujith M S, an individual operator of HallBook. The principal business address and grievance contact are displayed on the Contact Us page.",
        ],
      },
      {
        heading: "Accounts and accurate information",
        bullets: [
          "You must provide accurate, current information when creating an account or making a booking request.",
          "You are responsible for keeping your login credentials confidential and for activity carried out through your account.",
          "Notify HallBook promptly if you believe your account has been accessed without permission.",
          "Do not misuse the platform, submit fraudulent requests or interfere with its operation.",
        ],
      },
      {
        heading: "Booking requests and confirmation",
        paragraphs: [
          "A booking request may initially be marked PENDING. The request is not confirmed merely because it has been submitted. The hall owner must review the request and the booking status must show confirmation before the customer proceeds with payment where payment is required.",
          "Venue availability, facilities, inclusions, event arrangements and final pricing should be checked with the hall owner. Keep your booking confirmation and payment acknowledgement for reference.",
        ],
      },
      {
        heading: "Payments",
        paragraphs: [
          "Online payments, when available, are handled by the payment gateway shown at checkout. HallBook may receive payment status and transaction references to update booking records and provide support. Do not share card details, CVV, UPI PIN or OTP with HallBook or any person claiming to be support staff.",
          "If money is debited but HallBook does not show the expected payment status, contact customer support with your booking reference and payment transaction reference. Do not make a repeat payment until the issue has been checked.",
        ],
      },
      {
        heading: "Cancellation and refunds",
        paragraphs: [
          "Cancellation eligibility and any refund depend on the cancellation terms applicable to the selected hall and communicated for that booking. Review those terms before completing payment. The detailed process and the 5-7 business-day refund processing estimate after initiation are described in the Refund and Cancellation Policy.",
          "Changing a booking status to CANCELLED does not, by itself, mean that a payment refund has been approved or initiated. Contact HallBook to request a review of a paid booking cancellation or refund.",
        ],
      },
      {
        heading: "Third-party services and availability",
        paragraphs: [
          "HallBook may rely on third-party services, including payment processing and website hosting. Their services may be subject to their own terms and availability. We take reasonable steps to keep the platform available but do not guarantee uninterrupted or error-free operation.",
        ],
      },
      {
        heading: "Changes and applicable law",
        paragraphs: [
          "We may update these terms when the platform or applicable requirements change. The updated version will be published on this page with a revised date. These terms are governed by the laws applicable in India, subject to the rights and remedies available under applicable consumer law.",
        ],
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    intro:
      "This Privacy Policy explains how HallBook collects, uses, stores and shares information when you use the website and booking platform.",
    sections: [
      {
        heading: "Information we may collect",
        bullets: [
          "Account information such as your name, email address and login-related information.",
          "Booking information such as the selected hall, event date, booking status and details you submit with a request.",
          "Payment-related records such as transaction references, payment status and amount needed to reconcile a booking. Payment credentials are handled by the payment gateway; do not send card numbers, CVV, UPI PIN or OTP to HallBook.",
          "Messages and information you provide when contacting customer support or submitting a grievance.",
        ],
      },
      {
        heading: "How we use information",
        bullets: [
          "To create and administer your account.",
          "To submit, manage and communicate booking requests and status updates.",
          "To coordinate relevant booking details with the selected hall owner or venue operator.",
          "To facilitate payment reconciliation, handle support requests, prevent misuse and maintain platform security.",
          "To meet legal, regulatory, accounting and dispute-resolution requirements where applicable.",
        ],
      },
      {
        heading: "When information is shared",
        paragraphs: [
          "We share relevant booking information with the selected hall owner or venue operator so they can assess and fulfil your booking request. Razorpay processes online payments through its checkout flow and handles payment credentials under its applicable terms and privacy practices. HallBook uses Vercel for frontend hosting, Render for backend hosting and Supabase for database services. These providers may process information as needed to host, secure and operate the platform. We may also disclose information where required by law or to address security, fraud or disputes.",
        ],
      },
      {
        heading: "Passwords, payments and browser storage",
        paragraphs: [
          "Account passwords are processed in protected, hashed form rather than stored as readable passwords. Online payment credentials are entered through the payment gateway's payment flow; HallBook uses transaction references and payment status for booking records. The website may use browser storage to maintain your signed-in session and account state.",
        ],
      },
      {
        heading: "Retention and security",
        paragraphs: [
          "We retain information for as long as reasonably necessary to provide the service, maintain booking and payment records, resolve disputes and comply with applicable legal requirements. We use reasonable technical and organisational safeguards, but no internet transmission or storage system can be guaranteed to be completely secure.",
        ],
      },
      {
        heading: "Your requests and privacy contact",
        paragraphs: [
          `For requests to access, correct or delete account information, or for privacy questions, contact ${SUPPORT_EMAIL}. We may need to verify your identity before acting on a request and may retain records where required for legal, accounting or dispute purposes. We handle personal information in accordance with applicable Indian data-protection requirements.`,
        ],
      },
      {
        heading: "Updates to this policy",
        paragraphs: [
          "We may update this policy when our practices or applicable requirements change. The latest version will be published on this page with its updated date.",
        ],
      },
    ],
  },
  "refund-policy": {
    title: "Cancellation and Refund Policy",
    intro:
      "HallBook uses a hall-specific cancellation approach. Refund eligibility depends on the cancellation terms applicable to the particular venue and booking.",
    sections: [
      {
        heading: "Review the hall's cancellation terms",
        paragraphs: [
          "Different halls may have different cancellation conditions. Before making a payment, review the cancellation terms communicated for the selected hall and booking. These terms determine whether a cancellation is eligible for a full refund, partial refund or no refund.",
          "If the applicable hall cancellation terms are not clear to you, contact the hall owner and HallBook support before paying. Keep a copy of the terms or written confirmation provided for your booking.",
        ],
      },
      {
        heading: "How to cancel a booking",
        bullets: [
          "Where the booking is eligible, use the cancellation option in your HallBook account. The current platform supports customer cancellation for bookings whose status is PENDING or CONFIRMED.",
          "If the cancellation option is unavailable, or you need help with a booking, email or call HallBook support and provide your booking reference.",
          "A cancellation changes the booking status. It does not automatically approve or initiate a refund for an amount already paid.",
        ],
      },
      {
        heading: "How refund requests are reviewed",
        paragraphs: [
          "For a paid booking, contact HallBook to request a refund review. We will review the booking, payment status and cancellation terms applicable to the selected hall, and coordinate with the hall owner where needed. The outcome may be a full refund, partial refund or no refund, depending on the applicable hall terms and circumstances. We will communicate the decision to you.",
          "If a hall owner cancels a confirmed booking or cannot provide the venue, contact HallBook promptly. We will review the circumstances with the venue operator and communicate the available resolution under the booking terms.",
        ],
      },
      {
        heading: "Refund processing time",
        paragraphs: [
          "Once a refund is approved and actually initiated, the expected processing time is 5-7 business days for the amount to reflect through the original payment method. The time taken by the bank, card issuer, UPI provider or payment network may vary and may extend beyond this estimate. The processing period starts from the date the refund is initiated, not the date the cancellation request is submitted.",
        ],
      },
      {
        heading: "How to contact us",
        paragraphs: [
          `Email ${SUPPORT_EMAIL} or call ${SUPPORT_PHONE_DISPLAY}. Include your booking reference, registered email address, payment transaction reference and reason for the request. Never share your password, card number, CVV, UPI PIN or OTP.`,
        ],
      },
    ],
  },
  "shipping-policy": {
    title: "Shipping and Service Delivery Policy",
    intro:
      "HallBook is a digital platform for hall and venue bookings. It does not sell or ship physical products.",
    sections: [
      {
        heading: "No physical shipping",
        paragraphs: [
          "No physical goods are dispatched through HallBook, so shipping charges, courier tracking and physical delivery timelines do not apply to the venue-booking service.",
        ],
      },
      {
        heading: "Delivery of booking services",
        paragraphs: [
          "The service provided through HallBook is access to venue information, booking requests and booking-status information. Booking details and status are made available through the website account. The actual venue and event services are provided by the respective hall owner or venue operator on the agreed event date, subject to the confirmed booking and applicable venue terms.",
          "If you have paid but cannot see the expected booking or payment status, contact HallBook support with your booking reference and payment transaction reference.",
        ],
      },
      {
        heading: "Support",
        paragraphs: [
          `For booking or service-delivery questions, contact ${SUPPORT_EMAIL} or ${SUPPORT_PHONE_DISPLAY}.`,
        ],
      },
    ],
  },
};

const policyLinks: Array<{ href: string; label: string }> = [
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact Us" },
  { href: "/pricing", label: "Pricing" },
  { href: "/terms", label: "Terms & Conditions" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/refund-policy", label: "Cancellation & Refunds" },
  { href: "/shipping-policy", label: "Shipping Policy" },
];

export default function PolicyPage({ page }: { page: PolicyPageKey }) {
  const content = pages[page];

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <a href="/" className="text-2xl font-bold tracking-tight">
            Hall<span className="text-indigo-600">Book</span>
          </a>
          <nav className="flex items-center gap-4 text-sm">
            <a href="/halls" className="font-medium hover:text-indigo-600">Browse Halls</a>
            <a href="/login" className="font-medium hover:text-indigo-600">Login</a>
          </nav>
        </div>
      </header>

      <article className="mx-auto max-w-4xl px-6 py-12">
        <a href="/" className="text-sm font-medium text-indigo-600 hover:underline">
          Back to HallBook
        </a>

        <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
            HallBook | Last updated {LAST_UPDATED}
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            {content.title}
          </h1>
          <p className="mt-4 text-base leading-7 text-zinc-600">{content.intro}</p>

          <div className="mt-8 space-y-8">
            {content.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-xl font-semibold">{section.heading}</h2>
                {section.paragraphs?.map((paragraph, index) => (
                  <p key={index} className="mt-3 leading-7 text-zinc-700">
                    {paragraph}
                  </p>
                ))}
                {section.bullets && (
                  <ul className="mt-3 list-disc space-y-2 pl-6 leading-7 text-zinc-700">
                    {section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                  </ul>
                )}
              </section>
            ))}
          </div>


          <div className="mt-10 border-t border-zinc-200 pt-6">
            <h2 className="text-lg font-semibold">HallBook Support</h2>
            <p className="mt-2 text-sm text-zinc-600">
              <a className="text-indigo-600 hover:underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
              <span className="px-2">|</span>
              <a className="text-indigo-600 hover:underline" href={`tel:${SUPPORT_PHONE_LINK}`}>{SUPPORT_PHONE_DISPLAY}</a>
            </p>
          </div>
        </div>
      </article>

      <footer className="border-t border-zinc-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <nav className="flex flex-wrap gap-x-5 gap-y-3 text-sm text-zinc-600">
            {policyLinks.map((link) => (
              <a key={link.href} href={link.href} className="hover:text-indigo-600 hover:underline">
                {link.label}
              </a>
            ))}
          </nav>
          <p className="mt-5 text-xs text-zinc-500">&copy; 2026 HallBook. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
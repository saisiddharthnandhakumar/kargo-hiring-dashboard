import { BackgroundPaths } from "@/components/ui/background-paths";

export default function LandingPage() {
  return (
    <BackgroundPaths
      title="Hire like your best hires"
      subtitle="Every CV is scored against what your best past hires had in common. You make the call. The email is already written."
      ctaLabel="Open the shortlist"
      ctaHref="/dashboard"
      secondaryLabel="Upload a CV"
      secondaryHref="/dashboard?upload=1"
      footnote={["Ranked against past hires", "Pass or fail, with the reason", "Email ready to send"]}
    />
  );
}

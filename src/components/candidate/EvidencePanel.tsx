import { ConfidenceLabel } from "@/components/ui/ConfidenceLabel";
import type { CandidateEvidence, EvidenceSignal } from "@/lib/repositories";

function Row({ label, signal }: { label: string; signal: EvidenceSignal<unknown> }) {
  const value = Array.isArray(signal.value)
    ? signal.value.length > 0
      ? signal.value.join("; ")
      : "Not found in CV"
    : String(signal.value);

  return (
    <div className="border-b border-border py-3 last:border-0">
      <div className="flex items-start justify-between gap-4">
        <p className="text-xs font-medium tracking-wide text-muted uppercase">{label}</p>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted uppercase">
            {signal.basis}
          </span>
          <ConfidenceLabel confidence={signal.confidence} />
        </div>
      </div>
      <p className="mt-1 text-sm text-foreground">{value}</p>
      {signal.evidence !== value && (
        <blockquote className="mt-1 border-l-2 border-border-strong pl-2 text-xs text-muted italic">
          &ldquo;{signal.evidence}&rdquo;
        </blockquote>
      )}
    </div>
  );
}

export function EvidencePanel({ evidence }: { evidence: CandidateEvidence }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-foreground">
        Evidence
      </h2>
      <p className="text-xs text-muted">
        Every field below is what the model actually found in the CV — nothing here is inferred
        beyond what&apos;s marked &ldquo;inferred,&rdquo; and nothing is invented.
      </p>
      <div className="rounded-lg border border-border bg-surface px-4">
        <Row label="Current role" signal={evidence.currentRole} />
        <Row label="Years of experience" signal={evidence.yearsExperience} />
        <Row label="Companies" signal={evidence.companies} />
        <Row label="Education" signal={evidence.education} />
        <Row label="Logistics / operations experience" signal={evidence.logisticsExperience} />
        <Row label="Product experience" signal={evidence.productExperience} />
        <Row label="Technical experience" signal={evidence.technicalExperience} />
        <Row label="Ownership examples" signal={evidence.ownershipExamples} />
        <Row label="Decision examples" signal={evidence.decisionExamples} />
        <Row label="Discovery examples" signal={evidence.discoveryExamples} />
        <Row label="Stakeholder signals" signal={evidence.stakeholderSignals} />
        <Row label="Career transitions" signal={evidence.careerTransitions} />
        <Row label="Measurable outcomes" signal={evidence.measurableOutcomes} />
      </div>
      {evidence.rawEvidence && (
        <p className="text-xs text-muted">Other notes: {evidence.rawEvidence}</p>
      )}
    </section>
  );
}

import { notFound } from "next/navigation";
import { AuditTrail } from "@/components/candidate/AuditTrail";
import { CandidateHeader } from "@/components/candidate/CandidateHeader";
import { ConcernsPanel } from "@/components/candidate/ConcernsPanel";
import { EmailComposer } from "@/components/candidate/EmailComposer";
import { EvidencePanel } from "@/components/candidate/EvidencePanel";
import { HistoricalSignalsPanel } from "@/components/candidate/HistoricalSignalsPanel";
import { InterviewBriefPanel } from "@/components/candidate/InterviewBriefPanel";
import { OverridePanel } from "@/components/candidate/OverridePanel";
import { ProcessNowPanel } from "@/components/candidate/ProcessNowPanel";
import { ScoreBreakdown } from "@/components/candidate/ScoreBreakdown";
import { WhySurfaced } from "@/components/candidate/WhySurfaced";
import { getCandidateDetail } from "@/lib/candidate-detail/get-candidate-detail";

export const dynamic = "force-dynamic";

export default async function CandidateDetailPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = await params;
  const detail = await getCandidateDetail(applicationId);
  if (!detail) notFound();

  const { application, candidate, evidence, score, brief, emailDrafts, emailLogs, auditLog, rubric, historicalChecks } =
    detail;

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <CandidateHeader
        name={candidate.name}
        currentRole={evidence?.currentRole.value ?? null}
        roleTitle={rubric.roleTitle}
        overallScore={score?.overallScore ?? null}
        status={application.status}
      />

      <div className="flex flex-col gap-6">
        {!evidence || !score ? (
          <ProcessNowPanel applicationId={application.id} processingError={application.processingError} />
        ) : (
          <>
            <WhySurfaced text={score.whySurfaced} />
            <ScoreBreakdown
              applicationId={application.id}
              criteria={score.criteria}
              historicalSignal={score.historicalSignal}
            />
            <ConcernsPanel strengths={score.strengths} concerns={score.concerns} />
            {historicalChecks && <HistoricalSignalsPanel checks={historicalChecks} />}
            <EvidencePanel evidence={evidence} />
            <InterviewBriefPanel applicationId={application.id} initialBrief={brief} />
            <EmailComposer
              applicationId={application.id}
              candidateEmail={candidate.email}
              initialDrafts={emailDrafts}
              initialLogs={emailLogs}
            />
          </>
        )}

        <OverridePanel
          applicationId={application.id}
          status={application.status}
          roleKey={application.roleKey}
          hasScore={Boolean(score)}
        />
        <AuditTrail entries={auditLog} />
      </div>
    </main>
  );
}

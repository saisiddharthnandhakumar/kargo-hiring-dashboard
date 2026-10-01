import { notFound } from "next/navigation";
import { AuditTrail } from "@/components/candidate/AuditTrail";
import { CandidateDetailTabs } from "@/components/candidate/CandidateDetailTabs";
import { CandidateHeader } from "@/components/candidate/CandidateHeader";
import { ConcernsPanel } from "@/components/candidate/ConcernsPanel";
import { DecisionBanner } from "@/components/candidate/DecisionBanner";
import { EvidencePanel } from "@/components/candidate/EvidencePanel";
import { HistoricalSignalsPanel } from "@/components/candidate/HistoricalSignalsPanel";
import { InterviewBriefPanel } from "@/components/candidate/InterviewBriefPanel";
import { OverridePanel } from "@/components/candidate/OverridePanel";
import { ProcessNowPanel } from "@/components/candidate/ProcessNowPanel";
import { ScoreBreakdown } from "@/components/candidate/ScoreBreakdown";
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

  const {
    application,
    candidate,
    evidence,
    score,
    crossRoleFit,
    brief,
    emailDrafts,
    emailLogs,
    auditLog,
    rubric,
    historicalChecks,
  } = detail;

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
          <>
            <ProcessNowPanel applicationId={application.id} processingError={application.processingError} />
            <OverridePanel
              applicationId={application.id}
              status={application.status}
              roleKey={application.roleKey}
              hasScore={false}
            />
          </>
        ) : (
          <>
            <DecisionBanner
              applicationId={application.id}
              overallScore={score.overallScore}
              whySurfaced={score.whySurfaced}
              historicalSignalTriggered={score.historicalSignal.triggered}
              crossRoleFit={crossRoleFit}
              candidateEmail={candidate.email}
              initialDrafts={emailDrafts}
              initialLogs={emailLogs}
              status={application.status}
              roleKey={application.roleKey}
              hasScore={Boolean(score)}
            />

            <CandidateDetailTabs
              tabs={[
                {
                  key: "score",
                  label: "Score Breakdown",
                  content: (
                    <ScoreBreakdown
                      applicationId={application.id}
                      criteria={score.criteria}
                      historicalSignal={score.historicalSignal}
                    />
                  ),
                },
                {
                  key: "concerns",
                  label: "Strengths & Concerns",
                  content: <ConcernsPanel strengths={score.strengths} concerns={score.concerns} />,
                },
                {
                  key: "evidence",
                  label: "CV Evidence",
                  content: <EvidencePanel evidence={evidence} />,
                },
                {
                  key: "brief",
                  label: "Interview Brief",
                  content: <InterviewBriefPanel applicationId={application.id} initialBrief={brief} />,
                },
                {
                  key: "history",
                  label: "History",
                  content: (
                    <div className="flex flex-col gap-4">
                      {historicalChecks && <HistoricalSignalsPanel checks={historicalChecks} />}
                      <AuditTrail entries={auditLog} />
                    </div>
                  ),
                },
              ]}
            />
          </>
        )}
      </div>
    </main>
  );
}

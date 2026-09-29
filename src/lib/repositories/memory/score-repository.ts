import { SCORE_MAX, SCORE_MIN, clamp, round2 } from "@/lib/scoring/aggregate";
import type { CandidateScore, ScoreRepository } from "../types";
import { generateId, mutateStore, nowIso, readStore } from "./store";

export function createMemoryScoreRepository(): ScoreRepository {
  return {
    async upsert(applicationId, score) {
      return mutateStore((draft) => {
        const existingIndex = draft.scores.findIndex((s) => s.applicationId === applicationId);
        const record: CandidateScore = {
          ...score,
          id: existingIndex >= 0 ? draft.scores[existingIndex]!.id : generateId(),
          applicationId,
          createdAt: nowIso(),
        };
        if (existingIndex >= 0) {
          draft.scores[existingIndex] = record;
        } else {
          draft.scores.push(record);
        }
        return record;
      });
    },

    async getByApplicationId(applicationId) {
      const store = await readStore();
      return store.scores.find((s) => s.applicationId === applicationId) ?? null;
    },

    async applyCriterionOverride(applicationId, criterionKey, newScore, reason, actor) {
      return mutateStore((draft) => {
        const existing = draft.scores.find((s) => s.applicationId === applicationId);
        if (!existing) {
          throw new Error(`No score to override for application: ${applicationId}`);
        }
        const criterion = existing.criteria.find((c) => c.key === criterionKey);
        if (!criterion) {
          throw new Error(`Unknown criterion key "${criterionKey}" for this application's score`);
        }

        const oldScore = criterion.score;
        criterion.score = newScore;
        criterion.weightedScore = round2(newScore * criterion.weight);

        existing.overallScore = clamp(
          round2(existing.criteria.reduce((sum, c) => sum + c.weightedScore, 0)),
          SCORE_MIN,
          SCORE_MAX,
        );

        const [keyA, keyB] = existing.historicalSignal.criteriaInvolved;
        const scoreA = existing.criteria.find((c) => c.key === keyA)?.score;
        const scoreB = existing.criteria.find((c) => c.key === keyB)?.score;
        existing.historicalSignal.triggered = scoreA === SCORE_MAX && scoreB === SCORE_MAX;

        draft.auditLog.push({
          id: generateId(),
          applicationId,
          field: `criteria.${criterionKey}.score`,
          oldValue: String(oldScore),
          newValue: String(newScore),
          reason,
          actor,
          createdAt: nowIso(),
        });

        return existing;
      });
    },
  };
}

import { reweightCriteria } from "@/lib/scoring/aggregate";
import type { RubricWeightRepository } from "../types";
import { mutateStore, readStore } from "./store";

export function createMemoryRubricWeightRepository(): RubricWeightRepository {
  return {
    async get(roleKey) {
      const store = await readStore();
      return store.rubricWeights[roleKey] ?? null;
    },

    async save(roleKey, weights, defaults) {
      return mutateStore((draft) => {
        if (weights) {
          draft.rubricWeights[roleKey] = weights;
        } else {
          delete draft.rubricWeights[roleKey];
        }

        const effective = weights ?? defaults;
        let count = 0;
        for (const score of draft.scores) {
          if (score.roleKey !== roleKey) continue;
          const next = reweightCriteria(score.criteria, effective);
          score.criteria = next.criteria;
          score.overallScore = next.overallScore;
          count++;
        }
        return count;
      });
    },
  };
}

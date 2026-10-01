import { getRepositories } from "@/lib/repositories";
import { getRubric, withWeights, type Rubric, type RoleKey } from "./index";

/** Server-only: the rubric as it's actually scored today — calibrated
 * anchors plus whatever weights the founder has saved on /rubric. */
export async function getEffectiveRubric(role: RoleKey): Promise<Rubric> {
  const weights = await getRepositories().rubricWeights.get(role);
  return withWeights(getRubric(role), weights);
}

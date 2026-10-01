/** Score a candidate needs to clear (out of 4) to auto-draft an interview
 * invite rather than a rejection, and to surface a cross-role "also fits"
 * badge. Kept in its own leaf module (no repository/AI imports) so
 * client components like VerdictBadge can import it without pulling
 * server-only code (e.g. the Neon `pg` client) into the browser bundle. */
export const AUTO_DRAFT_SCORE_THRESHOLD = 3.0;

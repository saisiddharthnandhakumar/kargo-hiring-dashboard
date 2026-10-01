import fs from "node:fs/promises";
import path from "node:path";
import type {
  Application,
  AuditLogEntry,
  BatchRun,
  Candidate,
  CandidateEvidence,
  CandidateScore,
  EmailDraft,
  EmailLog,
  InterviewBrief,
} from "../types";

export interface DemoStoreShape {
  candidates: Candidate[];
  applications: Application[];
  evidence: CandidateEvidence[];
  scores: CandidateScore[];
  briefs: InterviewBrief[];
  emailDrafts: EmailDraft[];
  emailLogs: EmailLog[];
  auditLog: AuditLogEntry[];
  batchRuns: BatchRun[];
}

function emptyStore(): DemoStoreShape {
  return {
    candidates: [],
    applications: [],
    evidence: [],
    scores: [],
    briefs: [],
    emailDrafts: [],
    emailLogs: [],
    auditLog: [],
    batchRuns: [],
  };
}

const STORE_DIR = path.join(process.cwd(), "seed", ".demo-store");
const STORE_PATH = path.join(STORE_DIR, "db.json");

/** Backfills records written before `roleKey`/`isPrimary` existed on
 * CandidateScore and `isCalibration` existed on Application, so an older
 * db.json (or the seed file, pre-migration) keeps working without a manual
 * schema migration step — there's no formal migration mechanism for the
 * JSON store. */
function upgradeStore(store: DemoStoreShape): DemoStoreShape {
  const roleKeyByApplicationId = new Map(store.applications.map((a) => [a.id, a.roleKey]));

  for (const application of store.applications) {
    if (application.isCalibration === undefined) {
      application.isCalibration = false;
    }
  }

  for (const score of store.scores) {
    if (score.roleKey === undefined) {
      score.roleKey = roleKeyByApplicationId.get(score.applicationId) ?? "pm";
    }
    if (score.isPrimary === undefined) {
      score.isPrimary = true;
    }
  }

  return store;
}

async function readStoreFromDisk(): Promise<DemoStoreShape> {
  try {
    const raw = await fs.readFile(STORE_PATH, "utf-8");
    const parsed = JSON.parse(raw) as Partial<DemoStoreShape>;
    // Merge over an empty store so a store file written by an older schema
    // (missing a newly-added collection) doesn't crash the app.
    return upgradeStore({ ...emptyStore(), ...parsed });
  } catch (err) {
    if (isNodeError(err) && err.code === "ENOENT") {
      const fresh = emptyStore();
      await writeStoreToDiskAtomically(fresh);
      return fresh;
    }
    throw err;
  }
}

async function writeStoreToDiskAtomically(store: DemoStoreShape): Promise<void> {
  await fs.mkdir(STORE_DIR, { recursive: true });
  const tmpPath = `${STORE_PATH}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmpPath, JSON.stringify(store, null, 2), "utf-8");
  await fs.rename(tmpPath, STORE_PATH);
}

function isNodeError(err: unknown): err is NodeJS.ErrnoException {
  return typeof err === "object" && err !== null && "code" in err;
}

// Real file on disk (not a bare in-memory object) so state survives Next.js
// dev-server route-module recompilation and restarts mid-batch. Every
// mutation is chained through this single in-process queue so concurrent
// route handlers (batch loop + status poll + a manual override) can't
// interleave reads/writes and corrupt the file.
let writeQueue: Promise<unknown> = Promise.resolve();

function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const result = writeQueue.then(fn, fn);
  // Swallow errors here so one failed operation doesn't permanently wedge
  // the queue for subsequent operations; the error still propagates to the
  // caller of `result` above.
  writeQueue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

/** Read-only snapshot of the whole store, queued behind the same lock as
 * writes so it never observes a half-written intermediate state. */
export function readStore(): Promise<DemoStoreShape> {
  return withLock(() => readStoreFromDisk());
}

/** Read-modify-write. `fn` receives a mutable draft and its return value is
 * returned to the caller once the new state is durably written to disk. */
export function mutateStore<T>(fn: (draft: DemoStoreShape) => T): Promise<T> {
  return withLock(async () => {
    const store = await readStoreFromDisk();
    const result = fn(store);
    await writeStoreToDiskAtomically(store);
    return result;
  });
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function nowIso(): string {
  return new Date().toISOString();
}

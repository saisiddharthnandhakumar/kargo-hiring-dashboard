import type { RoleKey } from "@/lib/rubric";
import { PM_JD_ROLE_TITLE, PM_JD_SOURCE_FILE, PM_JD_TEXT } from "./pm";
import { SPM_JD_ROLE_TITLE, SPM_JD_SOURCE_FILE, SPM_JD_TEXT } from "./spm";

export interface JobDescription {
  role: RoleKey;
  roleTitle: string;
  text: string;
  sourceFile: string;
}

const JDS: Record<RoleKey, JobDescription> = {
  pm: {
    role: "pm",
    roleTitle: PM_JD_ROLE_TITLE,
    text: PM_JD_TEXT,
    sourceFile: PM_JD_SOURCE_FILE,
  },
  spm: {
    role: "spm",
    roleTitle: SPM_JD_ROLE_TITLE,
    text: SPM_JD_TEXT,
    sourceFile: SPM_JD_SOURCE_FILE,
  },
};

export function getJobDescription(role: RoleKey): JobDescription {
  return JDS[role];
}

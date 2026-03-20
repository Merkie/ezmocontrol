import type { Job } from "../types";

const API_KEY_KEY = "ezmo_fal_api_key";
const JOBS_KEY = "ezmo_jobs";

export function getApiKey(): string {
  return localStorage.getItem(API_KEY_KEY) || "";
}

export function setApiKey(key: string): void {
  localStorage.setItem(API_KEY_KEY, key);
}

export function getJobs(): Record<string, Job> {
  try {
    const stored = localStorage.getItem(JOBS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

export function saveJobs(jobs: Record<string, Job>): void {
  localStorage.setItem(JOBS_KEY, JSON.stringify(jobs));
}

import { useState, useCallback, useEffect } from "react";
import type { Job } from "../types";
import { getJobs, saveJobs } from "../lib/storage";

export function useJobs() {
  const [jobs, setJobs] = useState<Record<string, Job>>(getJobs);

  useEffect(() => {
    saveJobs(jobs);
  }, [jobs]);

  const createJob = useCallback((data: Partial<Job>): string => {
    const id = crypto.randomUUID();
    const job: Job = {
      id,
      status: "uploading",
      createdAt: new Date().toISOString(),
      selectedModel: "fal-ai/nano-banana-2/edit",
      ...data,
    };
    setJobs((prev) => ({ ...prev, [id]: job }));
    return id;
  }, []);

  const updateJob = useCallback((id: string, updates: Partial<Job>) => {
    setJobs((prev) => {
      if (!prev[id]) return prev;
      return { ...prev, [id]: { ...prev[id], ...updates } };
    });
  }, []);

  const deleteJob = useCallback((id: string) => {
    setJobs((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const sortedJobs = Object.values(jobs).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return { jobs, sortedJobs, createJob, updateJob, deleteJob };
}

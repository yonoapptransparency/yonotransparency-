import { useQuery } from "@tanstack/react-query";
import { API_BASE } from "@/constants/api";
import type { AppConfig, GlobalSettings } from "@/types/app";

interface BackupData {
  apps: AppConfig[];
  settings: GlobalSettings;
  news: unknown[];
  blogs: unknown[];
  videos: unknown[];
}

async function fetchBackupData(): Promise<BackupData> {
  const url = `${API_BASE}/v1/public/backup-data`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch data: ${res.status}`);
  return res.json();
}

export function useApps() {
  return useQuery({
    queryKey: ["backup-data"],
    queryFn: fetchBackupData,
    select: (data) => data.apps ?? [],
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}

export function useSettings() {
  return useQuery({
    queryKey: ["backup-data"],
    queryFn: fetchBackupData,
    select: (data) => data.settings,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}

export function useApp(id: string) {
  return useQuery({
    queryKey: ["backup-data"],
    queryFn: fetchBackupData,
    select: (data) => data.apps?.find((a) => a.id === id || a.slug === id),
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
  });
}

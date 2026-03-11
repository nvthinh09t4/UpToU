import { apiClient } from './apiClient'
import type { JobHistoryItem, JobStats, RecurringJobInfo } from '@/types'

export const jobService = {
  getRecurringJobs: () =>
    apiClient.get<RecurringJobInfo[]>('/jobs/recurring'),

  getStats: () =>
    apiClient.get<JobStats>('/jobs/stats'),

  getHistory: (count = 30) =>
    apiClient.get<JobHistoryItem[]>('/jobs/history', { params: { count } }),

  triggerJob: (jobId: string) =>
    apiClient.post<{ jobId: string; message: string }>(`/jobs/${jobId}/trigger`),
}

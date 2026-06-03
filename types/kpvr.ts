import type { ActivityStatus } from "@/types/common";

export interface KpvrItem {
  id: string;
  moduleId: string;
  module?: string;
  task: string;
  period: string;
  responsible: string;
  status: ActivityStatus;
}

export interface Season {
  id: string;
  name: string;
  year: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SeasonsResponse {
  success: boolean;
  data: Season[];
  timestamp: string;
}

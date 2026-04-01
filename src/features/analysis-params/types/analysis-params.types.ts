export interface AnalysisParam {
  id: number;
  discountCode: number;
  discountName: string;
  unit: string;
  rangeStart: number;
  rangeEnd: number;
  discountPercent: number;
  priority: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAnalysisParamPayload {
  paramCode: number;
  start: number;
  end: number;
  percent: number;
}

export interface UpdateAnalysisParamPayload {
  paramCode: number;
  start: number;
  end: number;
  percent: number;
}

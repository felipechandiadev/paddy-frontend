'use client';

import React from 'react';
import AnalysisParamsGrid from './AnalysisParamsGrid';
import { AnalysisParam } from '../types/analysis-params.types';

interface AnalysisParamsPageProps {
  initialData: AnalysisParam[];
}

export default function AnalysisParamsPage({
  initialData,
}: AnalysisParamsPageProps) {
  return <AnalysisParamsGrid initialData={initialData} />;
}

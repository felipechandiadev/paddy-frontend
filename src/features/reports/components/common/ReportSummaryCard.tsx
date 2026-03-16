import React from 'react';

interface ReportSummaryCardProps {
  title: string;
  value: string;
  hint?: string;
  className?: string;
}

const ReportSummaryCard: React.FC<ReportSummaryCardProps> = ({
  title,
  value,
  hint,
  className = '',
}) => {
  return (
    <div className={`rounded-lg border border-border bg-white p-4 ${className}`}>
      <p className="text-xs uppercase tracking-wide text-neutral-500">{title}</p>
      <p className="mt-2 text-xl font-semibold text-foreground">{value}</p>
      {hint ? <p className="mt-1 text-xs text-neutral-500">{hint}</p> : null}
    </div>
  );
};

export default ReportSummaryCard;

'use client';

import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import type { PageSize, PageOrientation } from './PrintDialog.types';

const generatePageStyle = (pageSize: PageSize = 'A4', pageOrientation: PageOrientation = 'portrait'): string => {
  return `
    @page {
      size: ${pageSize} ${pageOrientation};
      margin: 8mm;
    }

    @media print {
      html,
      body {
        margin: 0;
        padding: 0;
        background: #ffffff;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        color-adjust: exact;
      }
    }
  `;
};

export const usePrint = (
  fileName: string = 'document',
  pageSize: PageSize = 'A4',
  pageOrientation: PageOrientation = 'portrait',
) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const pageStyle = generatePageStyle(pageSize, pageOrientation);

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: fileName,
    pageStyle,
    onBeforePrint: async () => {
      console.log(`Preparing to print: ${fileName} (${pageSize} ${pageOrientation})`);
    },
    onAfterPrint: () => {
      console.log(`Printed: ${fileName}`);
    },
  });

  return {
    contentRef,
    handlePrint,
  };
};

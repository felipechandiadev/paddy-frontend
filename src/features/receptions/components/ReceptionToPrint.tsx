'use client';

import React from 'react';
import { formatDateValue } from '@/lib/date-formatter';
import {
  PrintableReception,
  ReceptionAnalysis,
  ReceptionTemplateConfig,
} from '../types/receptions.types';
import styles from './ReceptionToPrint.module.css';

interface ReceptionToPrintProps {
  reception: PrintableReception;
  isLoadingAnalysis?: boolean;
  analysisError?: string | null;
}

interface ParameterDefinition {
  key: string;
  code: number;
  label: string;
  templateAvailabilityField: keyof ReceptionTemplateConfig;
  valueField: keyof ReceptionAnalysis;
  legacyValueField: keyof ReceptionAnalysis;
  discountPercentField: keyof ReceptionAnalysis;
  toleranceField: keyof ReceptionAnalysis;
  toleranceVisibleField: keyof ReceptionAnalysis;
  isGroupField: keyof ReceptionAnalysis;
}

interface AnalysisRow {
  key: string;
  code: number;
  label: string;
  rangeValue?: number;
  discountPercent?: number;
  tolerance?: number;
  toleranceVisible: boolean;
  isInToleranceGroup: boolean;
}

function roundTo2(value: number): number {
  return Math.round(value * 100) / 100;
}

function formatDecimalSmart(value: number): string {
  const isInteger = Math.abs(value - Math.round(value)) < 0.005;

  return value.toLocaleString('es-CL', {
    minimumFractionDigits: isInteger ? 0 : 2,
    maximumFractionDigits: isInteger ? 0 : 2,
  });
}

function formatPercent(value?: number) {
  if (value === undefined || value === null) {
    return '-';
  }
  return `${formatDecimalSmart(value)}%`;
}

function formatKg(value?: number) {
  if (value === undefined || value === null) {
    return '-';
  }
  const rounded = Math.round(value);
  return `${rounded.toLocaleString('es-CL')} kg`;
}

function formatRange(value?: number) {
  if (value === undefined || value === null) {
    return '-';
  }
  return formatDecimalSmart(value);
}

function toOptionalNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export const ReceptionToPrint: React.FC<ReceptionToPrintProps> = ({
  reception,
  isLoadingAnalysis = false,
  analysisError = null,
}) => {
  const analysis = reception.analysis;

  const parameterDefinitions: ParameterDefinition[] = [
    {
      key: 'humedad',
      code: 1,
      label: 'Humedad',
      templateAvailabilityField: 'availableHumedad',
      valueField: 'humedadValue',
      legacyValueField: 'humedadRange',
      discountPercentField: 'humedadPercent',
      toleranceField: 'humedadTolerance',
      toleranceVisibleField: 'humedadTolVisible',
      isGroupField: 'humedadIsGroup',
    },
    {
      key: 'granos-verdes',
      code: 2,
      label: 'Granos Verdes',
      templateAvailabilityField: 'availableGranosVerdes',
      valueField: 'verdesValue',
      legacyValueField: 'verdesRange',
      discountPercentField: 'verdesPercent',
      toleranceField: 'verdesTolerance',
      toleranceVisibleField: 'verdesTolVisible',
      isGroupField: 'verdesIsGroup',
    },
    {
      key: 'impurezas',
      code: 3,
      label: 'Impurezas',
      templateAvailabilityField: 'availableImpurezas',
      valueField: 'impurezasValue',
      legacyValueField: 'impurezasRange',
      discountPercentField: 'impurezasPercent',
      toleranceField: 'impurezasTolerance',
      toleranceVisibleField: 'impurezasTolVisible',
      isGroupField: 'impurezasIsGroup',
    },
    {
      key: 'vano',
      code: 9,
      label: 'Vano',
      templateAvailabilityField: 'availableVano',
      valueField: 'vanoValue',
      legacyValueField: 'vanoRange',
      discountPercentField: 'vanoPercent',
      toleranceField: 'vanoTolerance',
      toleranceVisibleField: 'vanoTolVisible',
      isGroupField: 'vanoIsGroup',
    },
    {
      key: 'hualcacho',
      code: 10,
      label: 'Hualcacho',
      templateAvailabilityField: 'availableHualcacho',
      valueField: 'hualcachoValue',
      legacyValueField: 'hualcachoRange',
      discountPercentField: 'hualcachoPercent',
      toleranceField: 'hualcachoTolerance',
      toleranceVisibleField: 'hualcachoTolVisible',
      isGroupField: 'hualcachoIsGroup',
    },
    {
      key: 'granos-manchados',
      code: 11,
      label: 'Granos Manchados',
      templateAvailabilityField: 'availableGranosManchados',
      valueField: 'manchadosValue',
      legacyValueField: 'manchadosRange',
      discountPercentField: 'manchadosPercent',
      toleranceField: 'manchadosTolerance',
      toleranceVisibleField: 'manchadosTolVisible',
      isGroupField: 'manchadosIsGroup',
    },
    {
      key: 'granos-pelados',
      code: 12,
      label: 'Granos Partidos',
      templateAvailabilityField: 'availableGranosPelados',
      valueField: 'peladosValue',
      legacyValueField: 'peladosRange',
      discountPercentField: 'peladosPercent',
      toleranceField: 'peladosTolerance',
      toleranceVisibleField: 'peladosTolVisible',
      isGroupField: 'peladosIsGroup',
    },
    {
      key: 'granos-yesosos',
      code: 13,
      label: 'Granos Yesosos',
      templateAvailabilityField: 'availableGranosYesosos',
      valueField: 'yesososValue',
      legacyValueField: 'yesososRange',
      discountPercentField: 'yesososPercent',
      toleranceField: 'yesososTolerance',
      toleranceVisibleField: 'yesososTolVisible',
      isGroupField: 'yesososIsGroup',
    },
  ];

  const analysisRows: AnalysisRow[] =
    analysis && parameterDefinitions.length > 0
      ? parameterDefinitions
          .reduce<AnalysisRow[]>((rows, definition) => {
            const templateAvailability =
              reception.templateConfig?.[definition.templateAvailabilityField];

            const parameterValue =
              toOptionalNumber(analysis[definition.valueField]) ??
              toOptionalNumber(analysis[definition.legacyValueField]);
            const discountPercent = toOptionalNumber(
              analysis[definition.discountPercentField],
            );
            const tolerance = toOptionalNumber(analysis[definition.toleranceField]);
            const toleranceVisible =
              analysis[definition.toleranceVisibleField] !== false;

            const hasAnyData =
              parameterValue !== undefined ||
              discountPercent !== undefined ||
              tolerance !== undefined;

            if (templateAvailability === false) {
              return rows;
            }

            if (templateAvailability === undefined && !hasAnyData) {
              return rows;
            }

            const isInToleranceGroup =
              Boolean(analysis.useToleranceGroup) &&
              Boolean(analysis[definition.isGroupField]);

            rows.push({
              key: definition.key,
              code: definition.code,
              label: definition.label,
              rangeValue: parameterValue,
              discountPercent,
              tolerance,
              toleranceVisible,
              isInToleranceGroup,
            });

            return rows;
          }, [])
          .sort((a, b) => a.code - b.code)
      : [];

  const hasToleranceGroup =
    Boolean(analysis?.useToleranceGroup) &&
    analysisRows.some((row) => row.isInToleranceGroup);

  const groupedRows = hasToleranceGroup
    ? analysisRows.filter((row) => row.isInToleranceGroup)
    : [];
  const nonGroupedRows = hasToleranceGroup
    ? analysisRows.filter((row) => !row.isInToleranceGroup)
    : analysisRows;

  const computeRowPenalty = (row: AnalysisRow): number =>
    row.isInToleranceGroup
      ? 0
      : row.discountPercent !== undefined
      ? (reception.netWeight * Math.max(0, row.discountPercent - Number(row.tolerance ?? 0))) /
        100
      : 0;

  const groupToleranceTotal =
    toOptionalNumber(analysis?.groupToleranceValue) ??
    toOptionalNumber(analysis?.groupTolerance);

  const groupPercentTotal = roundTo2(
    groupedRows.reduce((sum, row) => sum + Number(row.discountPercent ?? 0), 0),
  );
  const groupPenaltyPercent = roundTo2(
    Math.max(0, groupPercentTotal - Number(groupToleranceTotal ?? 0)),
  );
  const groupPenaltyKg = roundTo2(
    (reception.netWeight * groupPenaltyPercent) / 100,
  );

  const computedSummaryPercent = roundTo2(
    analysisRows.reduce((sum, row) => sum + Number(row.discountPercent ?? 0), 0),
  );
  const summaryPercent =
    toOptionalNumber(analysis?.summaryPercent) ??
    toOptionalNumber(analysis?.totalGroupPercent) ??
    computedSummaryPercent;

  const computedSummaryTolerance = roundTo2(
    nonGroupedRows.reduce((sum, row) => sum + Number(row.tolerance ?? 0), 0) +
      (hasToleranceGroup ? Number(groupToleranceTotal ?? 0) : 0),
  );
  const summaryTolerance =
    toOptionalNumber(analysis?.summaryTolerance) ?? computedSummaryTolerance;

  const computedSummaryPenaltyKg = roundTo2(
    nonGroupedRows.reduce((sum, row) => sum + computeRowPenalty(row), 0) +
      (hasToleranceGroup ? groupPenaltyKg : 0),
  );
  const summaryPenaltyKg =
    toOptionalNumber(analysis?.summaryPenaltyKg) ?? computedSummaryPenaltyKg;

  const computedDiscountKg = summaryPenaltyKg;

  const totalDiscountKg =
    reception.totalConDescuentos > 0
      ? reception.totalConDescuentos
      : roundTo2(computedDiscountKg);

  const bonusKg = reception.bonusKg || 0;
  const paddyNeto =
    reception.paddyNeto > 0
      ? Math.floor(reception.paddyNeto)
      : Math.floor(reception.netWeight - totalDiscountKg + bonusKg);

  const producerAddress = [
    reception.producerAddress,
    reception.producerCity,
  ]
    .filter(Boolean)
    .join(', ');

  const observationText =
    reception.note || analysis?.notes || 'Sin observaciones registradas.';

  // En modo preview, no mostrar número/guía
  const isPreview = reception.templateName === 'Previsualización' || reception.id === 0;
  const receptionNumber = isPreview ? '-' : (reception.id > 0 ? reception.id : reception.guide);
  const dryPercent = analysis?.dryPercent ?? reception.dryPercent;

  return (
    <div className={styles.sheet}>
      <header className={styles.companyHeader}>
        <div>
          <p className={styles.companyKicker}>Sociedad Comercial e Industrial</p>
          <h1 className={styles.companyName}>Aparicio y Garcia Ltda</h1>
          <p className={styles.companyAddress}>Panamericana Sur km 342</p>
          <p className={styles.companyAddress}>Parral, Chile</p>
        </div>
        <div className={styles.documentMeta}>
          <h2 className={styles.documentTitle}>RECEPCION PADDY</h2>
          <p className={styles.documentDate} suppressHydrationWarning>
            Fecha: {formatDateValue(reception.receptionDate)}
          </p>
          {!isPreview && (
            <p className={styles.guideBadge}>Folio {receptionNumber}</p>
          )}
        </div>
      </header>

      <div className={styles.separator} />

      <section className={styles.producerSection}>
        <div className={styles.infoColumn}>
          <div className={styles.inlineInfo}>
            <span className={styles.inlineLabel}>Productor:</span>
            <span className={styles.inlineValue}>{reception.producer}</span>
          </div>
          <div className={styles.inlineInfo}>
            <span className={styles.inlineLabel}>RUT:</span>
            <span className={styles.inlineValue}>{reception.rut || '-'}</span>
          </div>
          {producerAddress && (
            <div className={styles.inlineInfo}>
              <span className={styles.inlineLabel}>Direccion:</span>
              <span className={styles.inlineValue}>{producerAddress}</span>
            </div>
          )}
        </div>

        <div className={styles.infoColumn}>
          <div className={styles.inlineInfo}>
            <span className={styles.inlineLabel}>Guia N°:</span>
            <span className={styles.inlineValue}>{reception.guide}</span>
          </div>
          <div className={styles.inlineInfo}>
            <span className={styles.inlineLabel}>Patente:</span>
            <span className={styles.plateValue}>{reception.licensePlate}</span>
          </div>
          <div className={styles.inlineInfo}>
            <span className={styles.inlineLabel}>Tipo Arroz:</span>
            <span className={styles.inlineValue}>{reception.riceType}</span>
          </div>
        </div>
      </section>

      <section className={styles.weightCards}>
        <div className={styles.weightCard}>
          <p className={styles.weightLabel}>Peso Bruto</p>
          <p className={styles.weightValue}>{formatKg(reception.grossWeight)}</p>
        </div>
        <div className={styles.weightCard}>
          <p className={styles.weightLabel}>Tara Camion</p>
          <p className={styles.weightValue}>{formatKg(reception.tare)}</p>
        </div>
        <div className={`${styles.weightCard} ${styles.weightCardHighlight}`}>
          <p className={styles.weightLabelHighlight}>Peso Neto</p>
          <p className={styles.weightValueHighlight}>{formatKg(reception.netWeight)}</p>
        </div>
      </section>

      <section className={styles.analysisSection}>
        <div className={styles.analysisHeader}>
          <h3 className={styles.analysisTitle}>ANALISIS DE LABORATORIO</h3>
          <p className={styles.analysisTemplate}>
            Plantilla: {reception.templateName || 'No definida'}
          </p>
        </div>

        {isLoadingAnalysis && (
          <div className={styles.stateBox}>
            Cargando informacion del analisis de laboratorio...
          </div>
        )}

        {!isLoadingAnalysis && analysisError && (
          <div className={`${styles.stateBox} ${styles.stateBoxError}`}>
            {analysisError}
          </div>
        )}

        {!isLoadingAnalysis && !analysisError && !analysis && (
          <div className={styles.stateBox}>
            Esta recepcion no tiene analisis de laboratorio asociado.
          </div>
        )}

        {!isLoadingAnalysis && !analysisError && analysis && (
          <table className={styles.analysisTable}>
            <thead>
              <tr>
                <th>Parametro</th>
                <th className={styles.rightAlign}>Rango</th>
                <th className={styles.rightAlign}>% Desc.</th>
                <th className={styles.rightAlign}>Tolerancia</th>
                <th className={styles.rightAlign}>Descuento Neto</th>
              </tr>
            </thead>
            <tbody>
              {analysisRows.length > 0 ? (
                <>
                  {nonGroupedRows.map((row) => {
                    const discountKg = computeRowPenalty(row);

                    return (
                      <tr key={row.key}>
                        <td>{row.label}</td>
                        <td className={styles.rightAlign}>{formatRange(row.rangeValue)}</td>
                        <td className={styles.rightAlign}>{formatPercent(row.discountPercent)}</td>
                        <td className={styles.rightAlign}>
                          {row.toleranceVisible ? formatPercent(row.tolerance) : '-'}
                        </td>
                        <td className={styles.rightAlign}>
                          {discountKg > 0 ? formatKg(discountKg) : '-'}
                        </td>
                      </tr>
                    );
                  })}

                  {hasToleranceGroup && (
                    <>
                      <tr className={styles.groupHeaderRow}>
                        <td colSpan={5} className={styles.groupHeaderCell}>
                          {analysis?.groupToleranceName || 'Grupo de Tolerancia'}
                        </td>
                      </tr>

                      {groupedRows.map((row) => {
                        const discountKg = 0;
                        const rowTolerance = 0;

                        return (
                          <tr key={row.key}>
                            <td>{row.label}</td>
                            <td className={styles.rightAlign}>{formatRange(row.rangeValue)}</td>
                            <td className={styles.rightAlign}>{formatPercent(row.discountPercent)}</td>
                            <td className={styles.rightAlign}>
                              {formatPercent(rowTolerance)}
                            </td>
                            <td className={styles.rightAlign}>
                              {formatKg(discountKg)}
                            </td>
                          </tr>
                        );
                      })}

                      <tr className={styles.groupFooterRow}>
                        <td></td>
                        <td className={styles.rightAlign}>-</td>
                        <td className={styles.rightAlign}>{formatPercent(groupPercentTotal)}</td>
                        <td className={styles.rightAlign}>{formatPercent(groupToleranceTotal)}</td>
                        <td className={styles.rightAlign}>{formatKg(groupPenaltyKg)}</td>
                      </tr>
                    </>
                  )}
                </>
              ) : (
                <tr>
                  <td colSpan={5} className={styles.emptyRow}>
                    El analisis existe, pero no tiene valores cargados para esta impresion.
                  </td>
                </tr>
              )}

              <tr className={styles.analysisFooterRow}>
                <td>Total Analisis Laboratorio</td>
                <td className={styles.rightAlign}>-</td>
                <td className={styles.rightAlign}>{formatPercent(summaryPercent)}</td>
                <td className={styles.rightAlign}>{formatPercent(summaryTolerance)}</td>
                <td className={styles.rightAlign}>{formatKg(summaryPenaltyKg)}</td>
              </tr>
            </tbody>
          </table>
        )}

        <div className={styles.dryPercentInfo}>
          <span className={styles.dryPercentLabel}>Secado:</span>
          <span className={styles.dryPercentValue}>{formatPercent(dryPercent)}</span>
        </div>
      </section>

      <section className={styles.finalTotalsSection}>
        <div className={styles.finalTotalsCard}>
          <div className={styles.totalLine}>
            <span>Total Descuentos:</span>
            <span>{formatKg(totalDiscountKg)}</span>
          </div>
          <div className={styles.totalLine}>
            <span>Bonificacion:</span>
            <span className={styles.positiveValue}>
              {bonusKg > 0 ? `+ ${formatKg(bonusKg)}` : '-'}
            </span>
          </div>
          <div className={styles.netLine}>
            <span>Paddy Neto:</span>
            <span>{formatKg(paddyNeto)}</span>
          </div>
        </div>
      </section>

      <section className={styles.notesSection}>
        <div>
          <p className={styles.notesTitle}>Observaciones</p>
          <div className={styles.notesBox}>{observationText}</div>
        </div>

        <div className={styles.legalBox}>
          Arroz Paddy recibido en deposito para posible compra posterior, sin
          responsabilidad para nuestra industria. Las mermas por secado y
          limpieza son de cargo del productor.
        </div>
      </section>

      <section className={styles.signatureSection}>
        <div className={styles.signatureBlock}>
          <img
            src="/timbre.png"
            alt="Timbre"
            className={styles.signatureStamp}
          />
          <div className={styles.signatureLine}>
            <p className={styles.signatureLabel}>Representante Autorizado</p>
            <p className={styles.signatureCompany}>
              Sociedad Comercial e Industrial Aparicio y Garcia Ltda.
            </p>
          </div>
        </div>
      </section>

      <footer className={styles.footer} suppressHydrationWarning>
        Impreso: {new Date().toLocaleString('es-CL')} | Recepcion folio: {receptionNumber}
      </footer>
    </div>
  );
};

export default ReceptionToPrint;

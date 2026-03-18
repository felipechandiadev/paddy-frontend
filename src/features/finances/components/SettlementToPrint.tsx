'use client';

import { Settlement } from '../types/finances.types';
import styles from './SettlementToPrint.module.css';

interface SettlementToPrintProps {
  settlement: Settlement;
}

const toSafeNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getCalculationDetails = (settlement: Settlement): Record<string, unknown> => {
  if (!settlement.calculationDetails || typeof settlement.calculationDetails !== 'object') {
    return {};
  }

  return settlement.calculationDetails as Record<string, unknown>;
};

const getSummary = (settlement: Settlement): Record<string, unknown> => {
  const calculationDetails = getCalculationDetails(settlement);
  const summary = calculationDetails.summary;

  if (!summary || typeof summary !== 'object') {
    return {};
  }

  return summary as Record<string, unknown>;
};

const getServiceInvoice = (
  settlement: Settlement,
  serviceKey: 'drying' | 'interest',
): Record<string, unknown> => {
  const calculationDetails = getCalculationDetails(settlement);
  const serviceInvoices =
    calculationDetails.serviceInvoices &&
    typeof calculationDetails.serviceInvoices === 'object'
      ? (calculationDetails.serviceInvoices as Record<string, unknown>)
      : {};

  const service = serviceInvoices[serviceKey];

  if (!service || typeof service !== 'object') {
    return {};
  }

  return service as Record<string, unknown>;
};

const getPurchaseInvoice = (settlement: Settlement): Record<string, unknown> => {
  const calculationDetails = getCalculationDetails(settlement);
  const purchaseInvoice = calculationDetails.purchaseInvoice;

  if (!purchaseInvoice || typeof purchaseInvoice !== 'object') {
    return {};
  }

  return purchaseInvoice as Record<string, unknown>;
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatKg(value: number): string {
  const formattedValue = new Intl.NumberFormat('es-CL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);

  return `${formattedValue} kg`;
}

function formatDate(value?: string | null): string {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleDateString('es-CL');
}

function getDocumentTitle(status: Settlement['status']): string {
  return status === 'draft' ? 'PRE-LIQUIDACION DE ARROZ' : 'LIQUIDACION DE ARROZ';
}

function formatPercent(value: number): string {
  if (!Number.isFinite(value)) {
    return '0.00%';
  }

  return `${value.toFixed(2)}%`;
}

function getPaymentMethodLabel(paymentMethod?: string | null): string {
  if (paymentMethod === 'transfer') {
    return 'Transferencia';
  }

  if (paymentMethod === 'check') {
    return 'Cheque';
  }

  if (paymentMethod === 'cash') {
    return 'Efectivo';
  }

  return '-';
}

type ReceptionPrintLine = NonNullable<Settlement['settlementReceptions']>[number];

function getReceptionPaddyVat(line: ReceptionPrintLine): number {
  const hasPersistedVat = line.paddyVat !== null && line.paddyVat !== undefined;
  if (hasPersistedVat) {
    return toSafeNumber(line.paddyVat);
  }

  return Math.round(toSafeNumber(line.paddySubTotal) * 0.19);
}

function getReceptionPaddyTotal(line: ReceptionPrintLine): number {
  const hasPersistedTotal = line.paddyTotal !== null && line.paddyTotal !== undefined;
  if (hasPersistedTotal) {
    return toSafeNumber(line.paddyTotal);
  }

  return toSafeNumber(line.paddySubTotal) + getReceptionPaddyVat(line);
}

function getReceptionDryingVat(line: ReceptionPrintLine): number {
  const hasPersistedVat = line.dryingVat !== null && line.dryingVat !== undefined;
  if (hasPersistedVat) {
    return toSafeNumber(line.dryingVat);
  }

  return Math.round(toSafeNumber(line.dryingSubTotal) * 0.19);
}

function getReceptionDryingTotal(line: ReceptionPrintLine): number {
  const hasPersistedTotal = line.dryingTotal !== null && line.dryingTotal !== undefined;
  if (hasPersistedTotal) {
    return toSafeNumber(line.dryingTotal);
  }

  return toSafeNumber(line.dryingSubTotal) + getReceptionDryingVat(line);
}

function getReceptionNet(line: ReceptionPrintLine): number {
  return toSafeNumber(line.paddySubTotal) - toSafeNumber(line.dryingSubTotal);
}

function getReceptionVat(line: ReceptionPrintLine): number {
  return getReceptionPaddyVat(line) - getReceptionDryingVat(line);
}

function getReceptionTotal(line: ReceptionPrintLine): number {
  return getReceptionPaddyTotal(line) - getReceptionDryingTotal(line);
}

export default function SettlementToPrint({ settlement }: SettlementToPrintProps) {
  const receptionLines = settlement.settlementReceptions ?? [];
  const advanceLines = settlement.settlementAdvances ?? [];

  const summary = getSummary(settlement);
  const dryingInvoice = getServiceInvoice(settlement, 'drying');
  const interestInvoice = getServiceInvoice(settlement, 'interest');
  const purchaseInvoice = getPurchaseInvoice(settlement);

  const sumPaddyNetoFromLines = receptionLines.reduce((s, l) => s + toSafeNumber(l.paddySubTotal), 0);
  const sumPaddyIvaFromLines = receptionLines.reduce(
    (s, l) =>
      s +
      (toSafeNumber(l.paddyVat) > 0
        ? toSafeNumber(l.paddyVat)
        : Math.round(toSafeNumber(l.paddySubTotal) * 0.19)),
    0,
  );
  const sumDryingNetoFromLines = receptionLines.reduce(
    (s, l) => s + toSafeNumber(l.dryingSubTotal),
    0,
  );
  const sumDryingIvaFromLines = receptionLines.reduce(
    (s, l) =>
      s +
      (toSafeNumber(l.dryingVat) > 0
        ? toSafeNumber(l.dryingVat)
        : Math.round(toSafeNumber(l.dryingSubTotal) * 0.19)),
    0,
  );

  const sumAdvancesFromLines = advanceLines.reduce((s, l) => s + toSafeNumber(l.amount), 0);
  const sumInterestFromLines = advanceLines.reduce(
    (s, l) => s + toSafeNumber(l.accumulatedInterest),
    0,
  );
  const sumInterestIvaFromLines = advanceLines.reduce(
    (s, l) => s + Math.round(toSafeNumber(l.accumulatedInterest) * 0.19),
    0,
  );

  const paddyNeto =
    toSafeNumber(settlement.totalPrice) ||
    toSafeNumber(summary.netRiceAmount) ||
    sumPaddyNetoFromLines;
  const paddyIva =
    toSafeNumber(settlement.ivaRice) ||
    toSafeNumber(summary.riceVatAmount) ||
    sumPaddyIvaFromLines;
  const paddyTotal = toSafeNumber(summary.totalRiceAmount) || paddyNeto + paddyIva;

  const totalAdvances =
    toSafeNumber(settlement.totalAdvances) ||
    toSafeNumber(summary.totalAdvances) ||
    sumAdvancesFromLines;

  const dryingNeto =
    toSafeNumber(dryingInvoice.invoiceNetAmount) ||
    toSafeNumber(summary.dryingReferenceAmount) ||
    sumDryingNetoFromLines;
  const dryingIva =
    toSafeNumber(dryingInvoice.vatAmount) ||
    sumDryingIvaFromLines;
  const dryingTotal = toSafeNumber(dryingInvoice.totalAmount) || dryingNeto + dryingIva;

  const interestNeto =
    toSafeNumber(interestInvoice.invoiceNetAmount) ||
    toSafeNumber(settlement.totalInterest) ||
    toSafeNumber(summary.estimatedInterest) ||
    sumInterestFromLines;
  const interestIva =
    toSafeNumber(interestInvoice.vatAmount) ||
    sumInterestIvaFromLines;
  const interestTotal = toSafeNumber(interestInvoice.totalAmount) || interestNeto + interestIva;

  const servicesTotal =
    toSafeNumber(summary.totalServicesWithVat) || dryingTotal + interestTotal;

  const balanceTotal =
    toSafeNumber(settlement.amountDue) ||
    toSafeNumber(summary.finalBalance) ||
    (paddyTotal - totalAdvances - servicesTotal);

  const balanceIva = paddyIva - dryingIva - interestIva;
  const balanceNeto = balanceTotal - balanceIva;
  const summaryPaddyNeto = paddyNeto - dryingNeto;
  const summaryPaddyIva = paddyIva - dryingIva;
  const summaryPaddyTotal = summaryPaddyNeto + summaryPaddyIva;

  const paddyInvoiceFolio = String(purchaseInvoice.invoiceNumber ?? '').trim() || '-';
  const paddyInvoiceDate = formatDate(
    purchaseInvoice.invoiceDate === null || purchaseInvoice.invoiceDate === undefined
      ? null
      : String(purchaseInvoice.invoiceDate),
  );
  const paddyInvoiceNet =
    toSafeNumber(purchaseInvoice.netAmount) || paddyNeto;
  const paddyInvoiceVat =
    toSafeNumber(purchaseInvoice.ivaAmount) || paddyIva;
  const paddyInvoiceSubtotal =
    toSafeNumber(purchaseInvoice.totalAmount) || paddyTotal;

  const interestInvoiceFolio = String(interestInvoice.invoiceNumber ?? '').trim() || '-';
  const interestInvoiceDate = formatDate(
    interestInvoice.invoiceDate === null || interestInvoice.invoiceDate === undefined
      ? null
      : String(interestInvoice.invoiceDate),
  );

  const dryingInvoiceFolio = String(dryingInvoice.invoiceNumber ?? '').trim() || '-';
  const dryingInvoiceDate = formatDate(
    dryingInvoice.invoiceDate === null || dryingInvoice.invoiceDate === undefined
      ? null
      : String(dryingInvoice.invoiceDate),
  );

  const documentDate =
    formatDate(settlement.issuedAt ?? settlement.createdAt ?? null) ||
    new Date().toLocaleDateString('es-CL');

  const receptionTotals = receptionLines.reduce(
    (acc, line) => {
      acc.paddyKg += toSafeNumber(line.paddyKg);
      acc.paddySubTotal += toSafeNumber(line.paddySubTotal);
      acc.paddyVat += getReceptionPaddyVat(line);
      acc.paddyTotal += getReceptionPaddyTotal(line);
      acc.dryingSubTotal += toSafeNumber(line.dryingSubTotal);
      acc.dryingVat += getReceptionDryingVat(line);
      acc.dryingTotal += getReceptionDryingTotal(line);
      acc.receptionNet += getReceptionNet(line);
      acc.receptionVat += getReceptionVat(line);
      acc.receptionTotal += getReceptionTotal(line);
      return acc;
    },
    {
      paddyKg: 0,
      paddySubTotal: 0,
      paddyVat: 0,
      paddyTotal: 0,
      dryingSubTotal: 0,
      dryingVat: 0,
      dryingTotal: 0,
      receptionNet: 0,
      receptionVat: 0,
      receptionTotal: 0,
    },
  );

  return (
    <div className={styles.sheet}>
      <header className={styles.companyHeader}>
        <div>
          <p className={styles.companyKicker}>Sociedad Comercial e Industrial</p>
          <h1 className={styles.companyName}>Aparicio y Garcia Ltda.</h1>
          <p className={styles.companyAddress}>Panamericana Sur km 345</p>
          <p className={styles.companyAddress}>Parral, Chile</p>
        </div>
        <div className={styles.documentMeta}>
          <h2 className={styles.documentTitle}>{getDocumentTitle(settlement.status)}</h2>
          <p className={styles.documentDate}>Fecha: {documentDate}</p>
          <p className={styles.guideBadge}>Folio {settlement.id}</p>
        </div>
      </header>

      <div className={styles.separator} />

      <section className={styles.producerSection}>
        <div className={styles.infoColumn}>
          <div className={styles.inlineInfo}>
            <span className={styles.inlineLabel}>Productor:</span>
            <span className={styles.inlineValue}>{settlement.producer?.name || '-'}</span>
          </div>
          <div className={styles.inlineInfo}>
            <span className={styles.inlineLabel}>RUT:</span>
            <span className={styles.inlineValue}>{settlement.producer?.rut || '-'}</span>
          </div>
          <div className={styles.inlineInfo}>
            <span className={styles.inlineLabel}>Temporada:</span>
            <span className={styles.inlineValue}>{settlement.season?.name || settlement.season?.code || '-'}</span>
          </div>
        </div>
      </section>

      <section className={styles.blockSection}>
        <h3 className={styles.blockTitle}>Recepciones de la liquidacion</h3>
        <table className={`${styles.detailTable} ${styles.receptionDetailTable}`}>
          <thead>
            <tr>
              <th>Fecha</th>
              <th className={styles.rightAlign}>Folio</th>
              <th>Guia</th>
              <th>Tipo de arroz</th>
              <th className={`${styles.rightAlign} ${styles.paddyKgColumn}`}>Paddy kg</th>
              <th className={styles.rightAlign}>Precio</th>
              <th className={styles.rightAlign}>Sub-neto Paddy</th>
              <th className={styles.rightAlign}>IVA Paddy</th>
              <th className={styles.rightAlign}>Total Paddy</th>
              <th className={styles.rightAlign}>Secado</th>
              <th className={styles.rightAlign}>Sub-neto secado</th>
              <th className={styles.rightAlign}>IVA Secado</th>
              <th className={styles.rightAlign}>Total Secado</th>
              <th className={`${styles.rightAlign} ${styles.receptionDivider}`}>Neto recepcion</th>
              <th className={styles.rightAlign}>IVA recepcion</th>
              <th className={styles.rightAlign}>Total recepcion</th>
            </tr>
          </thead>
          <tbody>
            {receptionLines.length === 0 ? (
              <tr>
                <td className={styles.emptyCell} colSpan={16}>
                  Sin recepciones asociadas a la liquidacion.
                </td>
              </tr>
            ) : (
              receptionLines.map((line) => {
                const paddyVat = getReceptionPaddyVat(line);
                const paddyTotal = getReceptionPaddyTotal(line);
                const dryingVat = getReceptionDryingVat(line);
                const dryingTotal = getReceptionDryingTotal(line);
                const receptionNet = getReceptionNet(line);
                const receptionVat = getReceptionVat(line);
                const receptionTotal = getReceptionTotal(line);

                return (
                  <tr key={line.id}>
                    <td>{formatDate(line.receptionDate)}</td>
                    <td className={styles.rightAlign}>{line.id}</td>
                    <td>{line.guideNumber || '-'}</td>
                    <td>{line.riceTypeName || '-'}</td>
                    <td className={`${styles.rightAlign} ${styles.paddyKgColumn}`}>
                      {formatKg(line.paddyKg)}
                    </td>
                    <td className={styles.rightAlign}>{formatCurrency(line.ricePrice)}</td>
                    <td className={styles.rightAlign}>{formatCurrency(line.paddySubTotal)}</td>
                    <td className={styles.rightAlign}>{formatCurrency(paddyVat)}</td>
                    <td className={styles.rightAlign}>{formatCurrency(paddyTotal)}</td>
                    <td className={styles.rightAlign}>{formatPercent(line.dryPercent)}</td>
                    <td className={styles.rightAlign}>{formatCurrency(line.dryingSubTotal)}</td>
                    <td className={styles.rightAlign}>{formatCurrency(dryingVat)}</td>
                    <td className={styles.rightAlign}>{formatCurrency(dryingTotal)}</td>
                    <td className={`${styles.rightAlign} ${styles.receptionDivider}`}>
                      {formatCurrency(receptionNet)}
                    </td>
                    <td className={styles.rightAlign}>{formatCurrency(receptionVat)}</td>
                    <td className={styles.rightAlign}>{formatCurrency(receptionTotal)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
          {receptionLines.length > 0 && (
            <tfoot>
              <tr className={styles.totalsRow}>
                <td colSpan={4}>Total</td>
                <td className={`${styles.rightAlign} ${styles.paddyKgColumn}`}>
                  {formatKg(receptionTotals.paddyKg)}
                </td>
                <td />
                <td className={styles.rightAlign}>
                  {formatCurrency(receptionTotals.paddySubTotal)}
                </td>
                <td className={styles.rightAlign}>
                  {formatCurrency(receptionTotals.paddyVat)}
                </td>
                <td className={styles.rightAlign}>
                  {formatCurrency(receptionTotals.paddyTotal)}
                </td>
                <td />
                <td className={styles.rightAlign}>
                  {formatCurrency(receptionTotals.dryingSubTotal)}
                </td>
                <td className={styles.rightAlign}>
                  {formatCurrency(receptionTotals.dryingVat)}
                </td>
                <td className={styles.rightAlign}>
                  {formatCurrency(receptionTotals.dryingTotal)}
                </td>
                <td className={`${styles.rightAlign} ${styles.receptionDivider}`}>
                  {formatCurrency(receptionTotals.receptionNet)}
                </td>
                <td className={styles.rightAlign}>
                  {formatCurrency(receptionTotals.receptionVat)}
                </td>
                <td className={styles.rightAlign}>
                  {formatCurrency(receptionTotals.receptionTotal)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </section>

      <section className={styles.blockSection}>
        <h3 className={styles.blockTitle}>Anticipos asociados</h3>
        <table className={styles.detailTable}>
          <thead>
            <tr>
              <th>Fecha</th>
              <th className={styles.rightAlign}>Monto</th>
              <th className={styles.rightAlign}>Tasa de interes</th>
              <th className={styles.rightAlign}>Total dias</th>
              <th className={styles.rightAlign}>Interes acumulado neto</th>
              <th className={styles.rightAlign}>IVA interes</th>
              <th className={styles.rightAlign}>Total interes</th>
              <th>Medio de pago</th>
              <th>Banco</th>
              <th>Referencia</th>
            </tr>
          </thead>
          <tbody>
            {advanceLines.length === 0 ? (
              <tr>
                <td className={styles.emptyCell} colSpan={10}>
                  Sin anticipos asociados a la liquidacion.
                </td>
              </tr>
            ) : (
              advanceLines.map((line) => {
                const interestVat = Math.round(line.accumulatedInterest * 0.19);
                const interestTotal = line.accumulatedInterest + interestVat;
                const bankDisplay =
                  line.paymentMethod === 'cash'
                    ? ''
                    : (line.bank || line.transferAccount || '');

                return (
                  <tr key={line.id}>
                    <td>{formatDate(line.issueDate)}</td>
                    <td className={styles.rightAlign}>{formatCurrency(line.amount)}</td>
                    <td className={styles.rightAlign}>{formatPercent(line.interestRate)}</td>
                    <td className={styles.rightAlign}>{line.totalDays}</td>
                    <td className={styles.rightAlign}>
                      {formatCurrency(line.accumulatedInterest)}
                    </td>
                    <td className={styles.rightAlign}>{formatCurrency(interestVat)}</td>
                    <td className={styles.rightAlign}>{formatCurrency(interestTotal)}</td>
                    <td>{getPaymentMethodLabel(line.paymentMethod)}</td>
                    <td>{bankDisplay}</td>
                    <td>{line.reference || '-'}</td>
                  </tr>
                );
              })
            )}
          </tbody>
          {advanceLines.length > 0 && (
            <tfoot>
              <tr className={styles.totalsRow}>
                <td>Total</td>
                <td className={styles.rightAlign}>
                  {formatCurrency(advanceLines.reduce((s, l) => s + l.amount, 0))}
                </td>
                <td />
                <td />
                <td className={styles.rightAlign}>
                  {formatCurrency(advanceLines.reduce((s, l) => s + l.accumulatedInterest, 0))}
                </td>
                <td className={styles.rightAlign}>
                  {formatCurrency(advanceLines.reduce((s, l) => s + Math.round(l.accumulatedInterest * 0.19), 0))}
                </td>
                <td className={styles.rightAlign}>
                  {formatCurrency(
                    advanceLines.reduce(
                      (s, l) => s + l.accumulatedInterest + Math.round(l.accumulatedInterest * 0.19),
                      0,
                    ),
                  )}
                </td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          )}
        </table>
      </section>
      <section className={styles.blockSection}>
        <div className={styles.summaryTablesRow}>
          <div className={styles.billingBox}>
            <h3 className={styles.blockTitle}>Facturacion</h3>
            <table className={styles.billingTable}>
              <thead>
                <tr>
                  <th>Concepto</th>
                  <th>Documento</th>
                  <th>Folio</th>
                  <th>Fecha</th>
                  <th className={styles.rightAlign}>Neto</th>
                  <th className={styles.rightAlign}>IVA</th>
                  <th className={styles.rightAlign}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Paddy</td>
                  <td>Factura compra</td>
                  <td>{paddyInvoiceFolio}</td>
                  <td>{paddyInvoiceDate}</td>
                  <td className={styles.rightAlign}>{formatCurrency(paddyInvoiceNet)}</td>
                  <td className={styles.rightAlign}>{formatCurrency(paddyInvoiceVat)}</td>
                  <td className={styles.rightAlign}>{formatCurrency(paddyInvoiceSubtotal)}</td>
                </tr>
                <tr>
                  <td>Intereses</td>
                  <td>Factura venta</td>
                  <td>{interestInvoiceFolio}</td>
                  <td>{interestInvoiceDate}</td>
                  <td className={styles.rightAlign}>{formatCurrency(interestNeto)}</td>
                  <td className={styles.rightAlign}>{formatCurrency(interestIva)}</td>
                  <td className={styles.rightAlign}>{formatCurrency(interestTotal)}</td>
                </tr>
                <tr>
                  <td>Secado</td>
                  <td>Factura venta</td>
                  <td>{dryingInvoiceFolio}</td>
                  <td>{dryingInvoiceDate}</td>
                  <td className={styles.rightAlign}>{formatCurrency(dryingNeto)}</td>
                  <td className={styles.rightAlign}>{formatCurrency(dryingIva)}</td>
                  <td className={styles.rightAlign}>{formatCurrency(dryingTotal)}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr className={styles.billingTotalsRow}>
                  <td colSpan={4}>Total</td>
                  <td className={styles.rightAlign}>{formatCurrency(balanceNeto)}</td>
                  <td className={styles.rightAlign}>{formatCurrency(balanceIva)}</td>
                  <td className={styles.rightAlign}>{formatCurrency(balanceTotal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className={styles.summaryBox}>
            <h3 className={styles.blockTitle}>Resumen Liquidacion</h3>
            <table className={styles.billingTable}>
              <thead>
                <tr>
                  <th>Concepto</th>
                  <th className={styles.rightAlign}>Neto</th>
                  <th className={styles.rightAlign}>IVA</th>
                  <th className={styles.rightAlign}>Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Paddy</td>
                  <td className={styles.rightAlign}>{formatCurrency(summaryPaddyNeto)}</td>
                  <td className={styles.rightAlign}>{formatCurrency(summaryPaddyIva)}</td>
                  <td className={styles.rightAlign}>{formatCurrency(summaryPaddyTotal)}</td>
                </tr>
                <tr>
                  <td>(-) {advanceLines.length} Anticipo{advanceLines.length !== 1 ? 's' : ''}</td>
                  <td className={styles.rightAlign}>{formatCurrency(-totalAdvances)}</td>
                  <td />
                  <td className={styles.rightAlign}>{formatCurrency(-totalAdvances)}</td>
                </tr>
                <tr>
                  <td>(-) Intereses</td>
                  <td className={styles.rightAlign}>{formatCurrency(-interestNeto)}</td>
                  <td className={styles.rightAlign}>{formatCurrency(-interestIva)}</td>
                  <td className={styles.rightAlign}>{formatCurrency(-interestTotal)}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr className={styles.billingTotalsRow}>
                  <td>Saldo a liquidar</td>
                  <td className={styles.rightAlign}>{formatCurrency(balanceNeto)}</td>
                  <td className={styles.rightAlign}>{formatCurrency(balanceIva)}</td>
                  <td className={styles.rightAlign}>{formatCurrency(balanceTotal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
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

      <footer className={styles.footer}>
        Impreso: {new Date().toLocaleString('es-CL')} | Liquidacion folio: {settlement.id}
      </footer>
    </div>
  );
}

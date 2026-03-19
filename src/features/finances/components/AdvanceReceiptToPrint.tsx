'use client';

import { AdvanceDetails, AdvanceProducerBankAccount } from '../types/finances.types';
import styles from './AdvanceReceiptToPrint.module.css';

interface AdvanceReceiptToPrintProps {
  advance: AdvanceDetails;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value?: string | null): string {
  if (!value) {
    return '-';
  }

  // Parsear fecha YYYY-MM-DD como fecha local para evitar problemas de zona horaria
  const dateStr = String(value).trim();
  const parts = dateStr.split('-');
  
  if (parts.length === 3) {
    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const day = Number(parts[2]);
    
    if (Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day)) {
      const date = new Date(year, month - 1, day);
      if (!Number.isNaN(date.getTime())) {
        return date.toLocaleDateString('es-CL');
      }
    }
  }
  
  // Fallback para otros formatos
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleDateString('es-CL');
}

function formatPercent(value?: number | null): string {
  if (value === undefined || value === null || !Number.isFinite(value)) {
    return '-';
  }

  return `${Number(value).toFixed(2)} %`;
}

function getPaymentMethodLabel(paymentMethod?: string | null): string {
  if (paymentMethod === 'transfer') {
    return 'Transferencia bancaria';
  }

  if (paymentMethod === 'check') {
    return 'Cheque';
  }

  if (paymentMethod === 'cash') {
    return 'Efectivo';
  }

  return '-';
}

function getPaymentReferenceLabel(paymentMethod?: string | null): string {
  if (paymentMethod === 'transfer') {
    return 'Referencia transferencia';
  }

  if (paymentMethod === 'check') {
    return 'Numero de cheque';
  }

  return 'Referencia interna';
}

function formatBankAccountLabel(
  account?: AdvanceProducerBankAccount | null,
  index?: number | null,
): string {
  if (!account) {
    return '-';
  }

  const suffix = account.isDefault
    ? 'Predeterminada'
    : index !== undefined && index !== null && index >= 0
      ? `Cuenta ${index + 1}`
      : null;

  return [account.bankName, account.accountTypeName, account.accountNumber, suffix]
    .filter((value) => typeof value === 'string' && value.trim().length > 0)
    .join(' · ');
}

export default function AdvanceReceiptToPrint({
  advance,
}: AdvanceReceiptToPrintProps) {
  const paymentMethodLabel = getPaymentMethodLabel(advance.paymentMethod);
  const paymentReferenceLabel = getPaymentReferenceLabel(advance.paymentMethod);
  const seasonLabel = advance.season
    ? `${advance.season.code} · ${advance.season.name}`
    : '-';
  const transferAccountLabel = formatBankAccountLabel(
    advance.bankAccount,
    advance.bankAccountIndex,
  );
  const transferHolderName =
    advance.bankAccount?.holderName || advance.producer?.name || '-';
  const transferHolderRut =
    advance.bankAccount?.holderRut || advance.producer?.rut || '-';
  const issueDateLabel = formatDate(advance.issueDate);
  const printDateLabel = new Date().toLocaleString('es-CL');
  const producerName = advance.producer?.name || '-';
  const producerRut = advance.producer?.rut || '-';

  return (
    <div className={styles.sheet}>
      <header className={styles.companyHeader}>
        <div>
          <p className={styles.companyKicker}>Sociedad Comercial e Industrial</p>
          <h1 className={styles.companyName}>Aparicio y Garcia Ltda.</h1>
          <p className={styles.companyAddress}>Panamericana Sur km 342</p>
          <p className={styles.companyAddress}>Parral, Chile</p>
        </div>
        <div className={styles.documentMeta}>
          <h2 className={styles.documentTitle}>RECEPCION CONFORME DE ANTICIPO</h2>
          <p className={styles.documentDate}>Fecha de entrega: {issueDateLabel}</p>
          <p className={styles.guideBadge}>Folio {advance.id}</p>
        </div>
      </header>

      <div className={styles.separator} />

      <section className={styles.blockSection}>
        <h3 className={styles.blockTitle}>Datos del anticipo</h3>
        <div className={styles.summaryCard}>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Nombre productor</span>
            <span className={styles.summaryValue}>{producerName}</span>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>RUT productor</span>
            <span className={styles.summaryValue}>{producerRut}</span>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Temporada</span>
            <span className={styles.summaryValue}>{seasonLabel}</span>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Monto</span>
            <span className={`${styles.summaryValue} ${styles.summaryValueStrong}`}>
              {formatCurrency(Number(advance.amount ?? 0))}
            </span>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Tasa mensual</span>
            <span className={styles.summaryValue}>
              {formatPercent(Number(advance.interestRate ?? 0))}
            </span>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Medio de pago</span>
            <span className={styles.summaryValue}>{paymentMethodLabel}</span>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>{paymentReferenceLabel}</span>
            <span className={styles.summaryValue}>{advance.referenceNumber || '-'}</span>
          </div>

          {advance.paymentMethod === 'transfer' && (
            <>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Cuenta destino</span>
                <span className={styles.summaryValue}>{transferAccountLabel}</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Titular</span>
                <span className={styles.summaryValue}>{transferHolderName}</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>RUT titular</span>
                <span className={styles.summaryValue}>{transferHolderRut}</span>
              </div>
            </>
          )}

          {advance.paymentMethod === 'check' && (
            <>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Banco emisor</span>
                <span className={styles.summaryValue}>{advance.checkBankName || '-'}</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Fecha emision</span>
                <span className={styles.summaryValue}>{formatDate(advance.checkIssueDate)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Fecha cobro</span>
                <span className={styles.summaryValue}>{formatDate(advance.checkDueDate)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Beneficiario</span>
                <span className={styles.summaryValue}>{advance.checkPayeeName || '-'}</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>RUT beneficiario</span>
                <span className={styles.summaryValue}>{advance.checkPayeeRut || '-'}</span>
              </div>
            </>
          )}

          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Observaciones pago</span>
            <span className={`${styles.summaryValue} ${styles.multilineValue}`}>
              {advance.paymentNotes || '-'}
            </span>
          </div>
        </div>
      </section>

      <section className={styles.blockSection}>
        <h3 className={styles.blockTitle}>Conformidad</h3>
        <div className={styles.conformityBox}>
          Yo, <strong>{producerName}</strong>, RUT <strong>{producerRut}</strong>,
          declaro recibir conforme el anticipo descrito en este documento por un
          monto de <strong>{formatCurrency(Number(advance.amount ?? 0))}</strong>,
          entregado con fecha <strong>{issueDateLabel}</strong> mediante{' '}
          <strong>{paymentMethodLabel.toLowerCase()}</strong>.
        </div>
      </section>

      {advance.paymentMethod === 'check' && (
        <section className={styles.blockSection}>
          <h3 className={styles.blockTitle}>Cheque adjunto</h3>
          <div className={styles.checkContainer}>
            <span className={styles.checkContainerLabel}>
              Espacio para adjuntar el cheque del anticipo
            </span>
          </div>
        </section>
      )}

      <section className={styles.signatureGrid}>
        <div className={styles.signatureBox}>
          <div className={styles.signatureLine}>
            <p className={styles.signatureLabel}>Firma Productor</p>
            <p className={styles.signatureCompany}>{producerName}</p>
          </div>
        </div>

        <div className={`${styles.signatureBox} ${styles.signatureBoxAuthorized}`}>
          <img src="/timbre.png" alt="Timbre" className={styles.signatureStamp} />
          <div className={styles.signatureLine}>
            <p className={styles.signatureLabel}>Representante Autorizado</p>
            <p className={styles.signatureCompany}>
              Sociedad Comercial e Industrial Aparicio y Garcia Ltda.
            </p>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        Impreso: {printDateLabel} | Anticipo folio: {advance.id}
      </footer>
    </div>
  );
}
'use client';

import { calculateAdvanceInterest } from '@/features/finances/services/advanceInterest';
import type { Advance } from '@/features/finances/types/finances.types';
import styles from './ProducerReceptionsToPrint.module.css';

interface ProducerAdvancesToPrintProps {
  producerId: number;
  producerName: string;
  producerRut?: string;
  advances: Advance[];
  filters: {
    seasonLabel: string;
    statusLabel: string;
  };
}

const clp = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleDateString('es-CL');
}

function getStatusLabel(status: Advance['status']): string {
  if (status === 'paid') {
    return 'Pagado';
  }

  if (status === 'settled') {
    return 'Liquidado';
  }

  return 'Anulado';
}

function getAdvanceInterest(advance: Advance): number {
  const computedInterest = calculateAdvanceInterest(advance);
  const shouldShowInterest =
    advance.status === 'paid' &&
    advance.isInterestCalculationEnabled &&
    computedInterest > 0;

  return shouldShowInterest ? computedInterest : 0;
}

export default function ProducerAdvancesToPrint({
  producerId,
  producerName,
  producerRut,
  advances,
  filters,
}: ProducerAdvancesToPrintProps) {
  const totalCapital = advances.reduce((sum, advance) => sum + advance.amount, 0);
  const totalInterest = advances.reduce((sum, advance) => {
    return sum + getAdvanceInterest(advance);
  }, 0);
  const totalAmount = totalCapital + totalInterest;

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
          <h2 className={styles.documentTitle}>LISTADO DE ANTICIPOS</h2>
          <p className={styles.documentDate}>
            Fecha impresion: {new Date().toLocaleDateString('es-CL')}
          </p>
          <p className={styles.guideBadge}>Productor ID: {producerId}</p>
        </div>
      </header>

      <div className={styles.separator} />

      <section className={styles.metaSection}>
        <div className={styles.metaRow}>
          <span className={styles.metaLabel}>Productor:</span>
          <span className={styles.metaValue}>{producerName}</span>
        </div>
        <div className={styles.metaRow}>
          <span className={styles.metaLabel}>RUT:</span>
          <span className={styles.metaValue}>{producerRut || '-'}</span>
        </div>
        <div className={styles.metaRow}>
          <span className={styles.metaLabel}>Filtro temporada:</span>
          <span className={styles.metaValue}>{filters.seasonLabel}</span>
        </div>
        <div className={styles.metaRow}>
          <span className={styles.metaLabel}>Filtro estado:</span>
          <span className={styles.metaValue}>{filters.statusLabel}</span>
        </div>
      </section>

      <section className={styles.summarySection}>
        <div className={styles.summaryCard}>
          <p className={styles.summaryLabel}>Anticipos filtrados</p>
          <p className={styles.summaryValue}>{advances.length}</p>
        </div>
        <div className={styles.summaryCard}>
          <p className={styles.summaryLabel}>Capital total</p>
          <p className={styles.summaryValue}>{clp.format(totalCapital)}</p>
        </div>
        <div className={styles.summaryCard}>
          <p className={styles.summaryLabel}>Interes total</p>
          <p className={styles.summaryValue}>{clp.format(totalInterest)}</p>
        </div>
        <div className={styles.summaryCard}>
          <p className={styles.summaryLabel}>Total capital + interes</p>
          <p className={styles.summaryValue}>{clp.format(totalAmount)}</p>
        </div>
      </section>

      {advances.length === 0 ? (
        <div className={styles.emptyState}>No hay anticipos para los filtros seleccionados.</div>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Folio</th>
              <th>Fecha</th>
              <th>Temporada</th>
              <th>Descripcion</th>
              <th className={styles.rightAlign}>Monto</th>
              <th className={styles.rightAlign}>Interes</th>
              <th className={styles.rightAlign}>Total</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {advances.map((advance) => {
              const interest = getAdvanceInterest(advance);
              const total = advance.amount + interest;

              return (
                <tr key={advance.id}>
                  <td>{advance.id}</td>
                  <td>{formatDate(advance.issueDate)}</td>
                  <td>{advance.season?.name || '-'}</td>
                  <td>{advance.description || '-'}</td>
                  <td className={styles.rightAlign}>{clp.format(advance.amount)}</td>
                  <td className={styles.rightAlign}>{interest > 0 ? clp.format(interest) : '-'}</td>
                  <td className={styles.rightAlign}>{clp.format(total)}</td>
                  <td>{getStatusLabel(advance.status)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <footer className={styles.footer}>
        Impreso: {new Date().toLocaleString('es-CL')} | Total registros: {advances.length}
      </footer>
    </div>
  );
}

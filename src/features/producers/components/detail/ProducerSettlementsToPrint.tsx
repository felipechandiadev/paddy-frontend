'use client';

import type { Settlement } from '@/features/finances/types/finances.types';
import styles from './ProducerReceptionsToPrint.module.css';

interface ProducerSettlementsToPrintProps {
  producerId: number;
  producerName: string;
  producerRut?: string;
  settlements: Settlement[];
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

function toSafeNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getSettlementSummary(settlement: Settlement): Record<string, unknown> {
  if (!settlement.calculationDetails || typeof settlement.calculationDetails !== 'object') {
    return {};
  }

  const summary = (settlement.calculationDetails as Record<string, unknown>).summary;
  return summary && typeof summary === 'object'
    ? (summary as Record<string, unknown>)
    : {};
}

function getSettlementDate(settlement: Settlement): string {
  const value = settlement.issuedAt || settlement.createdAt || settlement.updatedAt;
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('es-CL');
}

function getSettlementReceptionsCount(settlement: Settlement): number {
  if (Array.isArray(settlement.receptionIds)) {
    return settlement.receptionIds.length;
  }

  return Math.max(0, Math.round(toSafeNumber(getSettlementSummary(settlement).totalReceptions)));
}

function getSettlementAdvancesCount(settlement: Settlement): number {
  if (Array.isArray(settlement.advanceIds)) {
    return settlement.advanceIds.length;
  }

  return Math.max(
    0,
    Math.round(toSafeNumber(getSettlementSummary(settlement).totalAdvancesCount)),
  );
}

function getSettlementAmountDue(settlement: Settlement): number {
  const entityAmount = toSafeNumber(settlement.amountDue);
  if (entityAmount !== 0) {
    return entityAmount;
  }

  return toSafeNumber(getSettlementSummary(settlement).finalBalance);
}

function getDisplayStatus(settlement: Settlement): Settlement['status'] | 'annulled' {
  return settlement.deletedAt ? 'annulled' : settlement.status;
}

function getStatusLabel(displayStatus: Settlement['status'] | 'annulled'): string {
  if (displayStatus === 'draft') {
    return 'Pre-liquidacion';
  }

  if (displayStatus === 'completed') {
    return 'Liquidada';
  }

  if (displayStatus === 'annulled') {
    return 'Anulada';
  }

  return 'Cancelada';
}

export default function ProducerSettlementsToPrint({
  producerId,
  producerName,
  producerRut,
  settlements,
  filters,
}: ProducerSettlementsToPrintProps) {
  const totalAmountDue = settlements.reduce((sum, settlement) => {
    return sum + getSettlementAmountDue(settlement);
  }, 0);
  const totalReceptions = settlements.reduce((sum, settlement) => {
    return sum + getSettlementReceptionsCount(settlement);
  }, 0);
  const totalAdvances = settlements.reduce((sum, settlement) => {
    return sum + getSettlementAdvancesCount(settlement);
  }, 0);

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
          <h2 className={styles.documentTitle}>LISTADO DE LIQUIDACIONES</h2>
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
          <p className={styles.summaryLabel}>Liquidaciones filtradas</p>
          <p className={styles.summaryValue}>{settlements.length}</p>
        </div>
        <div className={styles.summaryCard}>
          <p className={styles.summaryLabel}>Recepciones totales</p>
          <p className={styles.summaryValue}>{totalReceptions}</p>
        </div>
        <div className={styles.summaryCard}>
          <p className={styles.summaryLabel}>Anticipos totales</p>
          <p className={styles.summaryValue}>{totalAdvances}</p>
        </div>
        <div className={styles.summaryCard}>
          <p className={styles.summaryLabel}>Monto final total</p>
          <p className={styles.summaryValue}>{clp.format(totalAmountDue)}</p>
        </div>
      </section>

      {settlements.length === 0 ? (
        <div className={styles.emptyState}>No hay liquidaciones para los filtros seleccionados.</div>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Folio</th>
              <th>Fecha</th>
              <th>Temporada</th>
              <th className={styles.rightAlign}>Recepciones</th>
              <th className={styles.rightAlign}>Anticipos</th>
              <th className={styles.rightAlign}>Monto final</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {settlements.map((settlement) => {
              const displayStatus = getDisplayStatus(settlement);

              return (
                <tr key={settlement.id}>
                  <td>{settlement.id}</td>
                  <td>{getSettlementDate(settlement)}</td>
                  <td>{settlement.season?.name || '-'}</td>
                  <td className={styles.rightAlign}>{getSettlementReceptionsCount(settlement)}</td>
                  <td className={styles.rightAlign}>{getSettlementAdvancesCount(settlement)}</td>
                  <td className={styles.rightAlign}>{clp.format(getSettlementAmountDue(settlement))}</td>
                  <td>{getStatusLabel(displayStatus)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <footer className={styles.footer}>
        Impreso: {new Date().toLocaleString('es-CL')} | Total registros: {settlements.length}
      </footer>
    </div>
  );
}

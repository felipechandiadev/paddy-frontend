'use client';

import { ProducerReceptionItem } from '../../types/producers.types';
import styles from './ProducerReceptionsToPrint.module.css';

interface ProducerReceptionsToPrintProps {
  producerId: number;
  producerName: string;
  producerRut?: string;
  receptions: ProducerReceptionItem[];
  filters: {
    seasonLabel: string;
    riceTypeLabel: string;
    statusLabel: string;
  };
}

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

function formatKg(value: number): string {
  return `${value.toLocaleString('es-CL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} kg`;
}

function formatNetWeightKg(value: number): string {
  return `${Math.round(value).toLocaleString('es-CL')} kg`;
}

function getStatusLabel(status: ProducerReceptionItem['status']): string {
  if (status === 'analyzed') {
    return 'Analizado';
  }

  if (status === 'settled') {
    return 'Liquidado';
  }

  return 'Pendiente';
}

export default function ProducerReceptionsToPrint({
  producerId,
  producerName,
  producerRut,
  receptions,
  filters,
}: ProducerReceptionsToPrintProps) {
  const totalNetWeight = receptions.reduce((sum, reception) => sum + reception.netWeight, 0);

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
          <h2 className={styles.documentTitle}>LISTADO DE RECEPCIONES</h2>
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
          <span className={styles.metaLabel}>Filtro tipo arroz:</span>
          <span className={styles.metaValue}>{filters.riceTypeLabel}</span>
        </div>
        <div className={styles.metaRow}>
          <span className={styles.metaLabel}>Filtro estado:</span>
          <span className={styles.metaValue}>{filters.statusLabel}</span>
        </div>
      </section>

      <section className={styles.summarySection}>
        <div className={styles.summaryCard}>
          <p className={styles.summaryLabel}>Recepciones filtradas</p>
          <p className={styles.summaryValue}>{receptions.length}</p>
        </div>
        <div className={styles.summaryCard}>
          <p className={styles.summaryLabel}>Peso neto total</p>
          <p className={styles.summaryValue}>{formatNetWeightKg(totalNetWeight)}</p>
        </div>
      </section>

      {receptions.length === 0 ? (
        <div className={styles.emptyState}>No hay recepciones para los filtros seleccionados.</div>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Folio</th>
              <th>Guia</th>
              <th>Fecha</th>
              <th>Temporada</th>
              <th>Tipo Arroz</th>
              <th>Patente</th>
              <th className={styles.rightAlign}>Peso Neto</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {receptions.map((reception) => (
              <tr key={reception.id}>
                <td>{reception.id}</td>
                <td>{reception.guide || '-'}</td>
                <td>{formatDate(reception.createdAt)}</td>
                <td>{reception.seasonName || '-'}</td>
                <td>{reception.riceTypeName || '-'}</td>
                <td>{reception.licensePlate || '-'}</td>
                <td className={styles.rightAlign}>{formatNetWeightKg(reception.netWeight)}</td>
                <td>{getStatusLabel(reception.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <footer className={styles.footer}>
        Impreso: {new Date().toLocaleString('es-CL')} | Total registros: {receptions.length}
      </footer>
    </div>
  );
}

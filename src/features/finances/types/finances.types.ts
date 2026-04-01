/**
 * Tipos para el módulo de Finances
 */

export interface Advance {
  id: number;
  producerId: number;
  seasonId: number;
  amount: number;
  issueDate: string;
  interestRate: number;
  totalDays: number;
  accruedInterest: number;
  interestEndDate?: string | null; // Fecha de termino del interes
  isInterestCalculationEnabled: boolean; // Habilitar/Deshabilitar calculo
  status: 'paid' | 'settled' | 'cancelled'; // Estado del anticipo
  paymentMethod?: AdvancePaymentMethod | null;
  bank?: string | null;
  referenceNumber?: string | null;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  
  // Relaciones (opcional)
  producer?: {
    id: number;
    name: string;
    rut: string;
  };
  season?: {
    id: number;
    code: string;
    name: string;
  };
}

export type AdvancePaymentMethod = 'transfer' | 'check' | 'cash';

export interface AdvanceProducerBankAccount {
  bankCode: number;
  bankName: string;
  accountNumber: string;
  accountTypeCode: number;
  accountTypeName: string;
  holderName?: string;
  holderRut?: string;
  isDefault?: boolean;
}

export interface AdvanceProducerOption {
  id: number;
  name: string;
  rut: string;
  city?: string;
  bankAccounts: AdvanceProducerBankAccount[];
}

export interface AdvanceSeasonOption {
  id: number;
  code: string;
  name: string;
  year: number;
  isActive: boolean;
  startDate?: string | null;
  endDate?: string | null;
}

export interface PaymentBankOption {
  id: string;
  label: string;
}

export interface CreateAdvancePayload {
  producerId: number;
  seasonId: number;
  amount: number;
  issueDate: string;
  interestRate: number;
  description?: string;
  paymentMethod: AdvancePaymentMethod;
  referenceNumber?: string;
  paymentNotes?: string;
  bankAccountIndex?: number;
  checkBankName?: string;
  checkIssueDate?: string;
  checkDueDate?: string;
  checkPayeeName?: string;
  checkPayeeRut?: string;
}

export interface AdvanceDetails extends Advance {
  transactionId?: number | null;
  paymentMethod?: AdvancePaymentMethod | null;
  referenceNumber?: string | null;
  paymentNotes?: string | null;
  bankAccountIndex?: number | null;
  bankAccount?: AdvanceProducerBankAccount | null;
  checkBankName?: string | null;
  checkIssueDate?: string | null;
  checkDueDate?: string | null;
  checkPayeeName?: string | null;
  checkPayeeRut?: string | null;
}

export interface UpdateAdvancePayload {
  seasonId?: number;
  amount?: number;
  issueDate?: string;
  interestRate?: number;
  interestEndDate?: string | null;
  isInterestCalculationEnabled?: boolean;
  status?: 'paid' | 'settled' | 'cancelled';
  description?: string;
  paymentMethod?: AdvancePaymentMethod;
  referenceNumber?: string;
  paymentNotes?: string;
  bankAccountIndex?: number;
  checkBankName?: string;
  checkIssueDate?: string;
  checkDueDate?: string;
  checkPayeeName?: string;
  checkPayeeRut?: string;
}

export interface Transaction {
  id: number;
  producerId: number;
  receptionId?: number | null;
  advanceId?: number | null;
  settlementId?: number | null;
  type: 'advance' | 'payment' | 'deduction' | 'interest' | 'refund' | 'settlement';
  amount: number;
  transactionDate: string;
  paymentMethod?: AdvancePaymentMethod | null;
  metadata?: Record<string, any>;
  referenceNumber?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;

  producer?: {
    id: number;
    name: string;
    rut: string;
  };
}

export interface SettlementReceptionPrintLine {
  id: number;
  receptionDate?: string | null;
  guideNumber: string;
  riceTypeName?: string | null;
  paddyKg: number;
  ricePrice: number;
  paddySubTotal: number;
  paddyVat?: number;
  paddyTotal?: number;
  dryPercent: number;
  dryingSubTotal: number;
  dryingVat?: number;
  dryingTotal?: number;
}

export interface SettlementAdvancePrintLine {
  id: number;
  issueDate?: string | null;
  amount: number;
  interestRate: number;
  totalDays: number;
  accumulatedInterest: number;
  paymentMethod?: AdvancePaymentMethod | null;
  bank?: string | null;
  reference?: string | null;
  transferAccount?: string | null;
}

export interface Settlement {
  id: number;
  producerId: number;
  seasonId: number;
  status: 'draft' | 'completed' | 'cancelled';
  totalReceptions: number;
  totalPrice: number;
  totalDiscounts: number;
  totalBonuses: number;
  finalAmount: number;
  totalAdvances: number;
  totalInterest: number;
  ivaRice: number;
  ivaServices: number;
  amountDue: number;
  interestNet: number;
  interestVat: number;
  interestTotal: number;
  servicesNet: number;
  servicesVat: number;
  servicesTotal: number;
  liquidationNet: number;
  liquidationVat: number;
  liquidationTotal: number;
  receptionIds?: number[];
  advanceIds?: number[];
  notes?: string | null;
  issuedAt?: string;
  calculationDetails?: Record<string, unknown> | null;
  settlementReceptions?: SettlementReceptionPrintLine[];
  settlementAdvances?: SettlementAdvancePrintLine[];
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;

  // Relaciones (opcional)
  producer?: {
    id: number;
    name: string;
    rut: string;
  };
  season?: {
    id: number;
    code: string;
    name: string;
  };
}

export interface SettlementProducerOption {
  id: number;
  name: string;
  rut: string;
  city?: string;
  bankAccounts?: AdvanceProducerBankAccount[];
}

export interface SettlementReceptionCandidate {
  id: number;
  producerId: number;
  seasonId: number;
  guideNumber: string;
  licensePlate: string;
  riceTypeName: string;
  seasonName: string;
  seasonCode: string;
  netWeight: number;
  ricePrice: number;
  estimatedAmount: number;
  status: 'cancelled' | 'analyzed' | 'settled';
  dryPercent?: number | null;
  hasAnalysis?: boolean;
  settlementId?: number | null;
  createdAt: string;
}

export interface CreateSettlementPayload {
  producerId: number;
  seasonId: number;
  receptionIds: number[];
  advanceIds: number[];
  calculationDetails?: Record<string, unknown>;
  notes?: string;
}

export interface UpdateSettlementPayload {
  receptionIds?: number[];
  advanceIds?: number[];
  calculationDetails?: Record<string, unknown>;
  notes?: string;
}

export interface CompleteSettlementPayload {
  receptionIds?: number[];
  advanceIds?: number[];
  calculationDetails?: Record<string, unknown>;
  notes?: string;
  paymentDetails?: {
    paymentMethod?: string;
    paymentDate?: string;
    referenceNumber?: string;
    bankAccountIndex?: number | null;
    notes?: string;
  };
}

export interface UpdateSettlementReceptionDryPercentResponse {
  receptionId: number;
  dryPercent: number;
  analysisRecordId: number;
}

export interface UpdateSettlementReceptionRicePriceResponse {
  receptionId: number;
  ricePrice: number;
}

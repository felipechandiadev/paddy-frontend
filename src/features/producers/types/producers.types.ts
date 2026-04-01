export interface Producer {
  id: number;
  rut: string;
  name: string;
  address: string;
  city: string;
  email: string;
  phone: string;
  contactPerson: string;
  isActive: boolean;
  bankAccounts?: BankAccount[];
  createdAt: string;
  updatedAt: string;
}

export interface BankAccount {
  bankCode: number;
  bankName: string;
  accountNumber: string;
  accountTypeCode: number;
  accountTypeName: string;
  holderName?: string;
  holderRut?: string;
  isDefault?: boolean;
}

export interface CreateProducerPayload {
  rut: string;
  name: string;
  address: string;
  city: string;
  email: string;
  phone: string;
  contactPerson: string;
  isActive?: boolean;
  bankAccounts?: BankAccount[];
}

export interface UpdateProducerPayload {
  rut?: string;
  name?: string;
  address?: string;
  city?: string;
  email?: string;
  phone?: string;
  contactPerson?: string;
  isActive?: boolean;
  bankAccounts?: BankAccount[];
}

export type ProducerReceptionStatus = 'cancelled' | 'analyzed' | 'settled';

export interface ProducerReceptionItem {
  id: number;
  guide: string;
  createdAt: string;
  seasonId?: number;
  seasonName: string;
  riceTypeId?: number;
  riceTypeName: string;
  grossWeight: number;
  tare: number;
  netWeight: number;
  licensePlate: string;
  status: ProducerReceptionStatus;
}

export interface ProducerPendingBalanceReception {
  id: number;
  guideNumber: string;
  seasonId: number;
  seasonName: string | null;
  riceTypeId: number;
  riceTypeName: string | null;
  licensePlate: string;
  createdAt: string;
  status: string;
  netWeight: number;
  ricePrice: number;
  dryPercent: number;
  netAmount: number;
  dryingReferenceAmount: number;
  riceVatAmount: number;
  totalAmount: number;
}

export interface ProducerPendingBalanceAdvance {
  id: number;
  seasonId: number;
  seasonName: string | null;
  issueDate: string | null;
  interestEndDate: string | null;
  isInterestCalculationEnabled: boolean;
  interestRate: number;
  amount: number;
  interest: number;
  totalPending: number;
  description: string | null;
}

export interface ProducerPendingBalanceSummary {
  receptionsCount: number;
  advancesCount: number;
  totalReceptionNet: number;
  totalReceptionVat: number;
  totalReceptionWithVat: number;
  totalDryingReference: number;
  totalAdvanceCapital: number;
  totalAdvanceInterest: number;
  totalAdvancesWithInterest: number;
  pendingBalance: number;
  calculatedAt: string;
}

export interface ProducerPendingBalance {
  producer: {
    id: number;
    name: string;
    rut: string;
  };
  summary: ProducerPendingBalanceSummary;
  receptions: ProducerPendingBalanceReception[];
  advances: ProducerPendingBalanceAdvance[];
}

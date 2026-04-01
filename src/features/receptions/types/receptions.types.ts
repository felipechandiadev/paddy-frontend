export type ReceptionStatus = 'cancelled' | 'analyzed' | 'settled';

export interface Reception {
  id: number;
  producerId: number;
  riceTypeId: number;
  templateId?: number;
  dryPercent?: number;
  guide: string;
  licensePlate: string;
  grossWeight: number;
  tare: number;
  netWeight: number;
  price: number;
  status: ReceptionStatus;
  note?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface ReceptionListItem {
  id: number;
  producer: string;
  season?: string;
  rut?: string;
  producerAddress?: string;
  producerCity?: string;
  riceType: string;
  templateName?: string;
  templateConfig?: ReceptionTemplateConfig;
  dryPercent?: number;
  price: number;
  grossWeight: number;
  tare: number;
  netWeight: number;
  guide: string;
  licensePlate: string;
  note?: string;
  createdAt: string;
  deletedAt?: string | null;
  totalConDescuentos: number;
  bonusKg?: number;
  paddyNeto: number;
  storedTotalDiscountKg?: number;
  storedBonusKg?: number;
  storedFinalNetWeight?: number;
  status: ReceptionStatus;
  templateBonusEnabled?: boolean;
  templateBonusTolerance?: number;
  analysis?: ReceptionAnalysis | null;
}

export interface ReceptionTemplateConfig {
  availableHumedad?: boolean;
  availableGranosVerdes?: boolean;
  availableImpurezas?: boolean;
  availableVano?: boolean;
  availableHualcacho?: boolean;
  availableGranosManchados?: boolean;
  availableGranosPelados?: boolean;
  availableGranosYesosos?: boolean;
}

export interface ReceptionAnalysis {
  id: number;
  receptionId: number;
  templateId?: number;
  useToleranceGroup?: boolean;
  groupToleranceName?: string;
  groupToleranceValue?: number;
  humedadRange?: number;
  humedadValue?: number;
  humedadPercent?: number;
  humedadTolerance?: number;
  humedadIsGroup?: boolean;
  humedadTolVisible?: boolean;
  impurezasRange?: number;
  impurezasValue?: number;
  impurezasPercent?: number;
  impurezasTolerance?: number;
  impurezasIsGroup?: boolean;
  impurezasTolVisible?: boolean;
  verdesRange?: number;
  verdesValue?: number;
  verdesPercent?: number;
  verdesTolerance?: number;
  verdesIsGroup?: boolean;
  verdesTolVisible?: boolean;
  manchadosRange?: number;
  manchadosValue?: number;
  manchadosPercent?: number;
  manchadosTolerance?: number;
  manchadosIsGroup?: boolean;
  manchadosTolVisible?: boolean;
  yesososRange?: number;
  yesososValue?: number;
  yesososPercent?: number;
  yesososTolerance?: number;
  yesososIsGroup?: boolean;
  yesososTolVisible?: boolean;
  peladosRange?: number;
  peladosValue?: number;
  peladosPercent?: number;
  peladosTolerance?: number;
  peladosIsGroup?: boolean;
  peladosTolVisible?: boolean;
  vanoRange?: number;
  vanoValue?: number;
  vanoPercent?: number;
  vanoTolerance?: number;
  vanoIsGroup?: boolean;
  vanoTolVisible?: boolean;
  hualcachoRange?: number;
  hualcachoValue?: number;
  hualcachoPercent?: number;
  hualcachoTolerance?: number;
  hualcachoIsGroup?: boolean;
  hualcachoTolVisible?: boolean;
  totalGroupPercent?: number;
  groupTolerance?: number;
  summaryPercent?: number;
  summaryTolerance?: number;
  summaryPenaltyKg?: number;
  bonusEnabled?: boolean;
  bonusPercent?: number;
  dryPercent?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PrintableReception extends ReceptionListItem {
  analysis?: ReceptionAnalysis | null;
}

export interface CreateReceptionPayload {
  producerId: number;
  riceTypeId: number;
  templateId?: number;
  seasonId?: number;
  guide: string;
  licensePlate: string;
  grossWeight: number;
  tare: number;
  netWeight: number;
  dryPercent?: number;
  price: number;
  note?: string;
}

export interface UpdateReceptionPayload {
  producerId?: number;
  riceTypeId?: number;
  templateId?: number;
  seasonId?: number;
  guide?: string;
  licensePlate?: string;
  grossWeight?: number;
  tare?: number;
  netWeight?: number;
  dryPercent?: number;
  price?: number;
  status?: ReceptionStatus;
  note?: string;
}

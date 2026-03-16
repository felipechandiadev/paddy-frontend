export interface Template {
  id: number;
  name: string;
  producerId?: number;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;

  // Tolerancia grupal
  useToleranceGroup?: boolean;
  groupToleranceValue?: number;
  groupToleranceName?: string | null;

  // Parámetros disponibles
  availableHumedad?: boolean;
  availableGranosVerdes?: boolean;
  availableImpurezas?: boolean;
  availableVano?: boolean;
  availableHualcacho?: boolean;
  availableGranosManchados?: boolean;
  availableGranosPelados?: boolean;
  availableGranosYesosos?: boolean;
  availableBonus?: boolean;
  availableDry?: boolean;

  // Mostrar tolerancia individual
  showToleranceHumedad?: boolean;
  showToleranceGranosVerdes?: boolean;
  showToleranceImpurezas?: boolean;
  showToleranceVano?: boolean;
  showToleranceHualcacho?: boolean;
  showToleranceGranosManchados?: boolean;
  showToleranceGranosPelados?: boolean;
  showToleranceGranosYesosos?: boolean;

  // Grupo de tolerancia por parámetro
  groupToleranceHumedad?: boolean;
  groupToleranceGranosVerdes?: boolean;
  groupToleranceImpurezas?: boolean;
  groupToleranceVano?: boolean;
  groupToleranceHualcacho?: boolean;
  groupToleranceGranosManchados?: boolean;
  groupToleranceGranosPelados?: boolean;
  groupToleranceGranosYesosos?: boolean;

  // Valores (porcentaje y tolerancia) de cada parámetro
  percentHumedad?: number;
  toleranceHumedad?: number;
  percentGranosVerdes?: number;
  toleranceGranosVerdes?: number;
  percentImpurezas?: number;
  toleranceImpurezas?: number;
  percentVano?: number;
  toleranceVano?: number;
  percentHualcacho?: number;
  toleranceHualcacho?: number;
  percentGranosManchados?: number;
  toleranceGranosManchados?: number;
  percentGranosPelados?: number;
  toleranceGranosPelados?: number;
  percentGranosYesosos?: number;
  toleranceGranosYesosos?: number;

  // Bonificación y Secado
  toleranceBonus?: number;
  percentDry?: number;
}

// Sistema de Nodos - Motor de cálculo reactivo

export type NodeType = 'range' | 'percent' | 'tolerance' | 'penalty' | 'generic' | 'summary' | 'text';

export type ClusterType = 'param' | 'bonus' | 'dry' | 'summary' | 'generic';

export interface Range {
  id: number;
  start: number;
  end: number;
  percent: number;
}

export interface NodeState {
  value: number;
  error: boolean;
  errorMessage: string;
  show: boolean;
}

export interface Node {
  // Identidad
  key: string;
  type: NodeType;
  label: string;
  adorn: string; // "%" o "kg"
  
  // Estado
  state: NodeState;
  getValue: () => number;
  setValue: (v: number) => void;
  
  // Propiedades visuales
  backgroundColor: string;
  
  // Sistema de dependencias
  nodeSources: Node[];
  nodeConsumers: Node[];
  addConsumer: (consumer: Node) => void;
  notifyChange: () => void;
  
  // Cálculo reactivo
  effect?: () => void;
  
  // Validación
  validate?: () => boolean;
}

export interface ParamCluster {
  key: string;
  name: string;
  type: ClusterType;
  
  // Nodos del parámetro
  range?: Node; // Valor de entrada del usuario
  percent?: Node; // Calculado automáticamente
  tolerance?: Node; // Valor de entrada del usuario
  penalty?: Node; // Calculado automáticamente (readonly)
  
  // Configuración
  available: boolean;
  toleranceGroup: boolean;
  showTolerance: boolean;
  
  // Rangos de descuento
  ranges: Range[];
}

export interface TemplateConfig {
  useToleranceGroup: boolean;
  groupToleranceValue: number;
  groupToleranceName?: string;
  
  // Parámetros disponibles
  availableHumedad: boolean;
  availableGranosVerdes: boolean;
  availableImpurezas: boolean;
  availableVano: boolean;
  availableHualcacho: boolean;
  availableGranosManchados: boolean;
  availableGranosPelados: boolean;
  availableGranosYesosos: boolean;
  
  // Tolerancias individuales
  showToleranceHumedad: boolean;
  showToleranceGranosVerdes: boolean;
  showToleranceImpurezas: boolean;
  showToleranceVano: boolean;
  showToleranceHualcacho: boolean;
  showToleranceGranosManchados: boolean;
  showToleranceGranosPelados: boolean;
  showToleranceGranosYesosos: boolean;
  
  // Grupo de tolerancia por parámetro
  groupToleranceHumedad: boolean;
  groupToleranceGranosVerdes: boolean;
  groupToleranceImpurezas: boolean;
  groupToleranceVano: boolean;
  groupToleranceHualcacho: boolean;
  groupToleranceGranosManchados: boolean;
  groupToleranceGranosPelados: boolean;
  groupToleranceGranosYesosos: boolean;
  
  // Valores (porcentaje y tolerancia) de cada parámetro
  percentHumedad: number;
  toleranceHumedad: number;
  percentGranosVerdes: number;
  toleranceGranosVerdes: number;
  percentImpurezas: number;
  toleranceImpurezas: number;
  percentVano: number;
  toleranceVano: number;
  percentHualcacho: number;
  toleranceHualcacho: number;
  percentGranosManchados: number;
  toleranceGranosManchados: number;
  percentGranosPelados: number;
  toleranceGranosPelados: number;
  percentGranosYesosos: number;
  toleranceGranosYesosos: number;
  
  // Bonificación y Secado
  availableBonus: boolean;
  toleranceBonus: number;
  availableDry: boolean;
  percentDry: number;
}

export interface ReceptionData {
  // Generales
  id?: number;
  producerId: number;
  producerName: string;
  producerRut?: string;
  producerAddress?: string;
  producerCity?: string;
  riceTypeId: number;
  riceTypeName: string;
  templateId?: number;
  price: number;
  guide: string;
  licensePlate: string;
  note: string;
  
  // Pesos
  grossWeight: number;
  tare: number;
  netWeight: number;
  
  // Calculados
  totalDiscounts: number;
  bonus: number;
  paddyNet: number;
  
  // Status
  status: 'cancelled' | 'analyzed' | 'settled';
}

export interface ReceptionContextType {
  // Estado general
  data: ReceptionData;
  template: TemplateConfig;
  clusters: Record<string, ParamCluster>;
  version: number; // Para sincronizar cambios en nodos
  isTemplateReady: boolean; // Indica si la plantilla por defecto ha sido cargada
  
  // Funciones de actualización
  setData: (field: keyof ReceptionData, value: any) => void;
  setTemplate: (config: Partial<TemplateConfig>) => void;
  setTemplateReady: (ready: boolean) => void;
  setClusterValue: (clusterKey: string, nodeKey: string, value: number) => void;
  
  // Gestión de plantilla
  loadTemplate: (templateId: number) => Promise<void>;
  
  // Validación y cálculo
  validateReception: () => boolean;
  calculateTotals: () => void;
  
  // Reset
  resetData: () => void;
}

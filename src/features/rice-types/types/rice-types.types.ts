export interface RiceType {
  id: number;
  code: string;
  name: string;
  description?: string;
  referencePrice?: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

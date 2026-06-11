export const VESA_OPTIONS = [{ value: '200 x 200 mm', label: '200 x 200 mm' }] as const;

export const DEFAULT_VESA = '200 x 200 mm';

export const RJ45_OPTIONS = [
  { value: 'Yes', label: 'Yes' },
  { value: 'No', label: 'No' },
] as const;

export type Rj45Option = (typeof RJ45_OPTIONS)[number]['value'];

export const DEFAULT_RJ45: Rj45Option = 'No';

export interface InventoryProductSpecs {
  powerConsumption?: string;
  weight?: string;
  vesa?: string;
  rj45?: Rj45Option;
}

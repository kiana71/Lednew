import React from 'react';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  DEFAULT_RJ45,
  DEFAULT_VESA,
  RJ45_OPTIONS,
  VESA_OPTIONS,
  type InventoryProductSpecs,
} from '../../constants/inventoryProductSpecs';

interface InventoryProductSpecsFieldsProps {
  values: InventoryProductSpecs;
  onChange: (updates: Partial<InventoryProductSpecs>) => void;
  /** Screens only — media players hide VESA */
  showVesa?: boolean;
}

export function InventoryProductSpecsFields({
  values,
  onChange,
  showVesa = true,
}: InventoryProductSpecsFieldsProps) {
  return (
    <>
      <div className="col-span-2 pt-4">
        <h4 className="text-sm text-muted-foreground pb-3 border-b">Product Specs</h4>
      </div>

      <div className="col-span-2 space-y-2">
        <Label htmlFor="powerConsumption">Power Consumption</Label>
        <Textarea
          id="powerConsumption"
          value={values.powerConsumption ?? ''}
          onChange={(e) => onChange({ powerConsumption: e.target.value })}
          placeholder="e.g., 120W typical"
          rows={2}
        />
      </div>

      <div className="col-span-2 space-y-2">
        <Label htmlFor="weight">Weight</Label>
        <Textarea
          id="weight"
          value={values.weight ?? ''}
          onChange={(e) => onChange({ weight: e.target.value })}
          placeholder="e.g., 26.9 kg"
          rows={2}
        />
      </div>

      {showVesa && (
        <div className="space-y-2">
          <Label htmlFor="vesa">VESA</Label>
          <Select
            value={values.vesa ?? DEFAULT_VESA}
            onValueChange={(v) => onChange({ vesa: v })}
          >
            <SelectTrigger id="vesa">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VESA_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className={`space-y-2 ${showVesa ? '' : 'col-span-2'}`}>
        <Label htmlFor="rj45">RJ45</Label>
        <Select
          value={values.rj45 ?? DEFAULT_RJ45}
          onValueChange={(v) => onChange({ rj45: v as InventoryProductSpecs['rj45'] })}
        >
          <SelectTrigger id="rj45">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RJ45_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}

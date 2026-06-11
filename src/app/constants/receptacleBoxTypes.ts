export type ReceptacleBoxMountType = 'IN_WALL' | 'SURFACE_MOUNT';

export const RECEPTACLE_BOX_MOUNT_TYPES: {
  value: ReceptacleBoxMountType;
  label: string;
}[] = [
  { value: 'IN_WALL', label: 'In wall (Flush-Mount)' },
  { value: 'SURFACE_MOUNT', label: 'Surface-Mount' },
];

export const DEFAULT_RECEPTACLE_BOX_MOUNT_TYPE: ReceptacleBoxMountType = 'IN_WALL';

export function normalizeReceptacleBoxMountType(
  value?: string | null,
): ReceptacleBoxMountType {
  return value === 'SURFACE_MOUNT' ? 'SURFACE_MOUNT' : 'IN_WALL';
}

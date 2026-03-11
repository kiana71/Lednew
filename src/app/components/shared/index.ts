/**
 * Shared Components – barrel export
 *
 * Re-usable components consumed by multiple feature modules.
 */

export { DatabaseTable } from './DatabaseTable';
export type { Column } from './DatabaseTable';

export {
  StatsCards,
  ScreenStats,
  MountStats,
  MediaPlayerStats,
  ReceptacleBoxStats,
} from './StatsCards';

export {
  getPasswordStrength,
  PasswordStrengthMeter,
  Requirement,
  PasswordRequirements,
  PasswordMatchIndicator,
} from './PasswordStrength';
export type { PasswordStrengthResult } from './PasswordStrength';

export { CompanyCombobox } from './CompanyCombobox';

export { MediaUploader } from './MediaUploader';
export type { UploadedFile } from './MediaUploader';

export {
  DashboardSkeleton,
  DatabaseViewSkeleton,
  SettingsSkeleton,
  AdminSkeleton,
  StudioSkeleton,
} from './skeletons';
import type { ReceptacleBoxConfig } from './types';
import {
  normalizeReceptacleBoxMountType,
  type ReceptacleBoxMountType,
} from '../../../constants/receptacleBoxTypes';

export function isReceptacleBoxConfigured(box: ReceptacleBoxConfig): boolean {
  if (box.configured === false) return false;
  if (box.configured === true) return true;
  return Boolean(box.inventoryId);
}

export function getConfiguredReceptacleBoxes(
  boxes: ReceptacleBoxConfig[],
): ReceptacleBoxConfig[] {
  return boxes.filter(isReceptacleBoxConfigured);
}

const COUNT_WORDS = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
] as const;

/** e.g. 1 → "one (1)", 3 → "three (3)" */
export function formatCountPhrase(count: number): string {
  if (count >= 0 && count < COUNT_WORDS.length) {
    return `${COUNT_WORDS[count]} (${count})`;
  }
  return `${count} (${count})`;
}

function formatDimensionInches(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/\.?0+$/, '');
}

function dimensionLabelForBox(box: ReceptacleBoxConfig): string {
  const w = formatDimensionInches(box.width);
  const h = formatDimensionInches(box.height);
  return `${w}x${h}`;
}

/** Group configured boxes by mount type + size (each unique type/size gets its own phrase). */
function groupBoxesByTypeAndSize(
  boxes: ReceptacleBoxConfig[],
): Map<string, ReceptacleBoxConfig[]> {
  const groups = new Map<string, ReceptacleBoxConfig[]>();

  for (const box of boxes) {
    const mountType = normalizeReceptacleBoxMountType(box.boxType);
    const dimLabel = dimensionLabelForBox(box);
    const key = `${mountType}|${dimLabel}`;
    const list = groups.get(key) ?? [];
    list.push(box);
    groups.set(key, list);
  }

  return groups;
}

function sortGroupKeys(keys: string[]): string[] {
  return [...keys].sort((a, b) => {
    const [typeA, dimA] = a.split('|');
    const [typeB, dimB] = b.split('|');
    if (typeA !== typeB) {
      return typeA === 'IN_WALL' ? -1 : 1;
    }
    return dimA.localeCompare(dimB);
  });
}

/** Width × height from drawing boxes (selected box, else first; fallback 14×17 if none). */
export function getReceptacleBoxDimensions(
  boxes: ReceptacleBoxConfig[],
  preferredBoxId?: string | null,
): {
  width: number;
  height: number;
  label: string;
} {
  if (boxes.length === 0) {
    return { width: 14, height: 17, label: '14x17' };
  }
  const box =
    (preferredBoxId && boxes.find((b) => b.id === preferredBoxId)) || boxes[0];
  const { width, height } = box;
  const w = formatDimensionInches(width);
  const h = formatDimensionInches(height);
  return { width: Number(w), height: Number(h), label: `${w}x${h}` };
}

/** Stable key for when box count, sizes, or mount types change (drives live template refresh). */
export function receptacleBoxesTemplateKey(
  boxes: ReceptacleBoxConfig[],
  preferredBoxId?: string | null,
): string {
  const configured = getConfiguredReceptacleBoxes(boxes);
  const groups = groupBoxesByTypeAndSize(configured);
  const groupKey = sortGroupKeys([...groups.keys()])
    .map((key) => `${key}:${groups.get(key)!.length}`)
    .join(';');
  return `${configured.length}|${groupKey}|${preferredBoxId ?? ''}`;
}

const NICHE_FLUSH_SUFFIX =
  ' (installed flush 5 inches from the bottom of the niche)';

/** One clause: "one (1) in-wall recessed 12x20 Box" */
function buildRequirementClause(
  count: number,
  dimLabel: string,
  mountType: ReceptacleBoxMountType,
): string {
  const countPhrase = formatCountPhrase(count);
  const boxNoun = count === 1 ? 'Box' : 'Boxes';

  if (mountType === 'SURFACE_MOUNT') {
    return `<strong>${countPhrase}</strong> Surface-Mount recessed <strong>${dimLabel}</strong> ${boxNoun}`;
  }

  return `<strong>${countPhrase}</strong> in-wall recessed <strong>${dimLabel}</strong> ${boxNoun}`;
}

export function buildDefaultInstallationNoteHtml(
  receptacleBoxes: ReceptacleBoxConfig[],
  _preferredBoxId?: string | null,
): string {
  const configuredBoxes = getConfiguredReceptacleBoxes(receptacleBoxes);
  const groups = groupBoxesByTypeAndSize(configuredBoxes);

  const clauses: string[] = [];
  for (const key of sortGroupKeys([...groups.keys()])) {
    const group = groups.get(key)!;
    const [mountType, dimLabel] = key.split('|') as [ReceptacleBoxMountType, string];
    clauses.push(buildRequirementClause(group.length, dimLabel, mountType));
  }

  const hasInWall = [...groups.keys()].some((key) => key.startsWith('IN_WALL|'));
  const requirementBody = clauses.join(' and ');
  const nicheSuffix = hasInWall ? NICHE_FLUSH_SUFFIX : '';

  const requirementParagraph =
    clauses.length > 0
      ? `<p>We require ${requirementBody}${nicheSuffix}.</p>`
      : '';

  return [
    requirementParagraph,
    '<p>Each box has:</p>',
    '<ul>',
    '<li>Two (2) power outlets on a 20-amp Circuit</li>',
    '<li>Two (2) terminated shielded CAT6 data outlets</li>',
    '</ul>',
    '<p>The backing should be 3/4&quot; minimum thickness ACX sanded plywood, installed edge-to-edge inside the niche.</p>',
  ].join('');
}

export const DEFAULT_INSTALLATION_NOTE_NAME = 'In-Wall Box Requirements';

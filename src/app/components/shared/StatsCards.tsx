/**
 * Stats Cards Component
 *
 * Reusable statistics display used by Screens, Mounts,
 * Media Players, and Receptacle Boxes views.
 */

import React from 'react';
import { Monitor, Package, TrendingUp, Play, SquareStack } from 'lucide-react';

interface StatCard {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  trend?: string;
}

interface StatsCardsProps {
  cards: StatCard[];
}

export function StatsCards({ cards }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-shrink-0">
      {cards.map((card, index) => (
        <div
          key={index}
          className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-500 mb-1">{card.title}</p>
              <p className="text-2xl font-semibold text-slate-900">{card.value}</p>
              {card.description && (
                <p className="text-xs text-slate-400 mt-1">{card.description}</p>
              )}
              {card.trend && (
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="size-3 text-green-600" />
                  <span className="text-xs text-green-600">{card.trend}</span>
                </div>
              )}
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              {card.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Pre-configured stat cards per inventory type                       */
/* ------------------------------------------------------------------ */

interface ScreenStatsProps {
  total: number;
  manufacturers: number;
  averageSize?: number;
}

export function ScreenStats({ total, manufacturers, averageSize }: ScreenStatsProps) {
  const cards: StatCard[] = [
    {
      title: 'Total Screens',
      value: total,
      icon: <Monitor className="size-5 text-slate-600" />,
      description: 'in database',
    },
    {
      title: 'Manufacturers',
      value: manufacturers,
      icon: <Package className="size-5 text-slate-600" />,
      description: 'unique brands',
    },
    {
      title: 'Average Size',
      value: averageSize ? `${averageSize.toFixed(1)}"` : '-',
      icon: <TrendingUp className="size-5 text-slate-600" />,
      description: 'screen diagonal',
    },
  ];

  return <StatsCards cards={cards} />;
}

interface MountStatsProps {
  total: number;
  brands: number;
  averageLoad?: number;
}

export function MountStats({ total, brands, averageLoad }: MountStatsProps) {
  const cards: StatCard[] = [
    {
      title: 'Total Mounts',
      value: total,
      icon: <Package className="size-5 text-slate-600" />,
      description: 'in database',
    },
    {
      title: 'Brands',
      value: brands,
      icon: <Monitor className="size-5 text-slate-600" />,
      description: 'unique brands',
    },
    {
      title: 'Avg. Load Capacity',
      value: averageLoad ? `${averageLoad.toFixed(0)} lbs` : '-',
      icon: <TrendingUp className="size-5 text-slate-600" />,
      description: 'maximum load',
    },
  ];

  return <StatsCards cards={cards} />;
}

interface MediaPlayerStatsProps {
  total: number;
  makes: number;
}

export function MediaPlayerStats({ total, makes }: MediaPlayerStatsProps) {
  const cards: StatCard[] = [
    {
      title: 'Total Media Players',
      value: total,
      icon: <Play className="size-5 text-slate-600" />,
      description: 'in database',
    },
    {
      title: 'Makes',
      value: makes,
      icon: <Package className="size-5 text-slate-600" />,
      description: 'unique makes',
    },
    {
      title: 'Inventory',
      value: total > 0 ? 'Active' : 'Empty',
      icon: <TrendingUp className="size-5 text-slate-600" />,
      description: total > 0 ? `${total} unit(s) tracked` : 'no items yet',
    },
  ];

  return <StatsCards cards={cards} />;
}

interface ReceptacleBoxStatsProps {
  total: number;
  brands: number;
}

export function ReceptacleBoxStats({ total, brands }: ReceptacleBoxStatsProps) {
  const cards: StatCard[] = [
    {
      title: 'Total Receptacle Boxes',
      value: total,
      icon: <SquareStack className="size-5 text-slate-600" />,
      description: 'in database',
    },
    {
      title: 'Brands',
      value: brands,
      icon: <Package className="size-5 text-slate-600" />,
      description: 'unique brands',
    },
    {
      title: 'Inventory',
      value: total > 0 ? 'Active' : 'Empty',
      icon: <TrendingUp className="size-5 text-slate-600" />,
      description: total > 0 ? `${total} unit(s) tracked` : 'no items yet',
    },
  ];

  return <StatsCards cards={cards} />;
}

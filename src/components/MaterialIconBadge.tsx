/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Layers,
  Wrench,
  Zap,
  Cpu,
  Box,
  Droplet,
  Wind,
  Flame,
  Sparkles,
  Shield,
  Crosshair,
  Activity,
  LucideIcon,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  Layers,
  Wrench,
  Zap,
  Cpu,
  Box,
  Droplet,
  Wind,
  Flame,
  Sparkles,
  Shield,
  Crosshair,
  Activity,
};

interface MaterialIconBadgeProps {
  iconName?: string;
  code?: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  showCode?: boolean;
  className?: string;
}

export const MaterialIconBadge: React.FC<MaterialIconBadgeProps> = ({
  iconName = 'Box',
  code,
  color,
  size = 'md',
  showCode = false,
  className = '',
}) => {
  const IconComponent = ICON_MAP[iconName] || Box;

  const sizeClasses = {
    sm: 'w-6 h-6 p-1',
    md: 'w-8 h-8 p-1.5',
    lg: 'w-10 h-10 p-2',
  }[size];

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }[size];

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <div
        className={`${sizeClasses} rounded-lg bg-slate-900 border border-slate-700/80 flex items-center justify-center shrink-0 shadow-xs`}
        style={color ? { borderColor: `${color}40`, color } : { color: '#38bdf8' }}
      >
        <IconComponent className={iconSizes} />
      </div>
      {showCode && code && (
        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-950/80 border border-sky-800/80 text-sky-300">
          [{code}]
        </span>
      )}
    </div>
  );
};

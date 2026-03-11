/**
 * Password Strength Utilities & Components
 *
 * Shared across UserSettings (SecurityTab) and AdminPanel
 * (CreateUserDialog, ResetPasswordDialog).
 */

import React from 'react';
import { Check, X } from 'lucide-react';
import { Progress } from '../ui/progress';

/* ------------------------------------------------------------------ */
/*  Strength calculator                                                */
/* ------------------------------------------------------------------ */

export interface PasswordStrengthResult {
  score: number;   // 0-100
  label: string;   // Weak | Fair | Good | Strong
  color: string;   // Tailwind text class
}

export function getPasswordStrength(password: string): PasswordStrengthResult {
  if (!password) return { score: 0, label: '', color: '' };

  let score = 0;
  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  const pct = Math.round((score / 6) * 100);

  if (pct <= 25) return { score: pct, label: 'Weak', color: 'text-red-600' };
  if (pct <= 50) return { score: pct, label: 'Fair', color: 'text-orange-500' };
  if (pct <= 75) return { score: pct, label: 'Good', color: 'text-yellow-600' };
  return { score: pct, label: 'Strong', color: 'text-green-600' };
}

/* ------------------------------------------------------------------ */
/*  PasswordStrengthMeter – renders bar + label                        */
/* ------------------------------------------------------------------ */

interface PasswordStrengthMeterProps {
  password: string;
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const strength = getPasswordStrength(password);
  if (password.length === 0) return null;

  return (
    <div className="space-y-1.5 pt-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Strength</span>
        <span className={`text-xs font-medium ${strength.color}`}>{strength.label}</span>
      </div>
      <Progress value={strength.score} className="h-1.5" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Requirement – single checklist row                                 */
/* ------------------------------------------------------------------ */

interface RequirementProps {
  met: boolean;
  label: string;
}

export function Requirement({ met, label }: RequirementProps) {
  return (
    <li className="flex items-center gap-2 text-sm">
      {met ? (
        <Check className="size-3.5 text-green-600 flex-shrink-0" />
      ) : (
        <X className="size-3.5 text-muted-foreground flex-shrink-0" />
      )}
      <span className={met ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/*  PasswordRequirements – full checklist block                        */
/* ------------------------------------------------------------------ */

interface PasswordRequirementsProps {
  password: string;
}

export function PasswordRequirements({ password }: PasswordRequirementsProps) {
  if (password.length === 0) return null;

  return (
    <div className="bg-slate-50 border rounded-lg p-4">
      <p className="text-xs font-medium text-muted-foreground mb-2">
        Password Requirements
      </p>
      <ul className="space-y-1.5">
        <Requirement met={password.length >= 6} label="At least 6 characters" />
        <Requirement met={/[A-Z]/.test(password)} label="One uppercase letter (A-Z)" />
        <Requirement met={/[a-z]/.test(password)} label="One lowercase letter (a-z)" />
        <Requirement met={/[0-9]/.test(password)} label="One number (0-9)" />
        <Requirement met={/[^A-Za-z0-9]/.test(password)} label="One special character (!@#$...)" />
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  PasswordMatchIndicator – shows match / mismatch below confirm      */
/* ------------------------------------------------------------------ */

interface PasswordMatchIndicatorProps {
  password: string;
  confirmPassword: string;
}

export function PasswordMatchIndicator({ password, confirmPassword }: PasswordMatchIndicatorProps) {
  if (confirmPassword.length === 0) return null;

  const matches = password.length > 0 && password === confirmPassword;

  return matches ? (
    <p className="text-xs text-green-600 flex items-center gap-1">
      <Check className="size-3" /> Passwords match
    </p>
  ) : (
    <p className="text-xs text-red-600 flex items-center gap-1">
      <X className="size-3" /> Passwords do not match
    </p>
  );
}

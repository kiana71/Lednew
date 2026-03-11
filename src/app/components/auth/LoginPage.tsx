/**
 * Login Page Component
 *
 * Split-panel authentication layout — dark brand panel on the left,
 * clean form on the right. Collapses to single column on mobile.
 */

import React, { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { PasswordInput } from '../ui/password-input';
import { Alert, AlertDescription } from '../ui/alert';
import {
  Loader2,
  ArrowRight,
  MonitorSmartphone,
  Layers3,
  ShieldCheck,
} from 'lucide-react';
import signcastLogo from '../../../assets/bc8c925efd893fdcdf90dd4b45e6de9600299d46.png';

const FEATURES = [
  {
    icon: MonitorSmartphone,
    title: 'Drawing Management',
    desc: 'Create, edit, and manage technical drawings for led screens.',
  },
  {
    icon: Layers3,
    title: 'Inventory Tracking',
    desc: 'Track screens, mounts, media players, and receptacle boxes.',
  },
  {
    icon: ShieldCheck,
    title: 'Role-Based Access',
    desc: 'Secure multi-user system with admin controls and audit trails.',
  },
];

export function LoginPage() {
  const { login, isLoading, error, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Show toast if redirected from an expired session
  useEffect(() => {
    if (searchParams.get('expired') === '1') {
      toast.error('Session expired. Please sign in again.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!email || !password) {
      setLocalError('Please enter both email and password');
      return;
    }
    if (!email.includes('@')) {
      setLocalError('Please enter a valid email address');
      return;
    }

    try {
      await login(email, password);
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* ═══════════ Left Brand Panel ═══════════ */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[540px] flex-shrink-0 bg-slate-950 relative overflow-hidden">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        {/* Radial glow */}
        <div
          className="absolute top-0 right-0 w-[500px] h-[500px] opacity-20"
          style={{
            background:
              'radial-gradient(circle at top right, rgba(148,163,184,0.4), transparent 60%)',
          }}
        />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo + branding */}
          <div>
            <img
              src={signcastLogo}
              alt="SignCast Media"
              className="h-10 w-auto object-contain brightness-0 invert"
            />
          </div>

          {/* Features */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-semibold text-white leading-snug">
                Technical Drawing
                <br />
                Management System
              </h2>
              <p className="text-slate-400 mt-3 text-sm leading-relaxed max-w-[340px]">
                Streamline your workflow with centralized drawing management,
                inventory tracking, and team collaboration.
              </p>
            </div>

            <div className="space-y-5">
              {FEATURES.map((f) => (
                <div key={f.title} className="flex items-start gap-4">
                  <div className="flex items-center justify-center size-9 rounded-lg bg-white/[0.07] flex-shrink-0 mt-0.5">
                    <f.icon className="size-[18px] text-slate-300" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">
                      {f.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      {f.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom */}
          <p className="text-xs text-slate-600">
            &copy; 2026 SignCast Media. All rights reserved.
          </p>
        </div>
      </div>

      {/* ═══════════ Right Form Panel ═══════════ */}
      <div className="flex-1 flex flex-col">
        {/* Mobile logo bar */}
        <div className="lg:hidden flex items-center justify-center py-8 border-b border-slate-100 bg-slate-50">
          <img
            src={signcastLogo}
            alt="SignCast Media"
            className="h-10 w-auto object-contain"
          />
        </div>

        {/* Form area — vertically centered */}
        <div className="flex-1 flex items-center justify-center px-6 py-12 sm:px-12">
          <div className="w-full max-w-sm">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-semibold text-slate-900">
                Welcome back
              </h1>
              <p className="text-sm text-muted-foreground mt-2">
                Enter your credentials to access your account.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    to="/reset-password"
                    className="text-xs text-muted-foreground hover:text-slate-900 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <PasswordInput
                  id="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  autoComplete="current-password"
                  required
                />
              </div>

              {(error || localError) && (
                <Alert variant="destructive">
                  <AlertDescription>{error || localError}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full gap-2 h-10"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </form>

            {/* No public signup — accounts are created by admins */}
          </div>
        </div>

        {/* Mobile footer */}
        <div className="lg:hidden py-6 text-center border-t border-slate-100">
          <p className="text-xs text-muted-foreground">
            &copy; 2026 SignCast Media. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
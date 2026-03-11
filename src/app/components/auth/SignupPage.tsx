/**
 * Signup Page Component
 *
 * Split-panel layout matching the LoginPage design —
 * dark brand panel on the left, signup form on the right.
 */

import React, { useState, FormEvent } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router';
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

export function SignupPage() {
  const { signup, isLoading, error, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [localError, setLocalError] = useState('');

  React.useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!name || !username || !email || !password) {
      setLocalError('Please fill in all required fields');
      return;
    }
    if (!email.includes('@')) {
      setLocalError('Please enter a valid email address');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    try {
      await signup({ name, username, email, password, companyName: companyName || undefined });
    } catch (err) {
      console.error('Signup failed:', err);
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
                Create your account
              </h1>
              <p className="text-sm text-muted-foreground mt-2">
                Fill in the details below to get started.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name">Full name *</Label>
                <Input
                  id="signup-name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                  autoComplete="name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-username">Username *</Label>
                <Input
                  id="signup-username"
                  type="text"
                  placeholder="johndoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  disabled={isLoading}
                  autoComplete="username"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email">Email address *</Label>
                <Input
                  id="signup-email"
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
                <Label htmlFor="signup-company">Company name</Label>
                <Input
                  id="signup-company"
                  type="text"
                  placeholder="Optional"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  disabled={isLoading}
                  autoComplete="organization"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password">Password *</Label>
                <PasswordInput
                  id="signup-password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  autoComplete="new-password"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-confirm">Confirm password *</Label>
                <PasswordInput
                  id="signup-confirm"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  autoComplete="new-password"
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
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </form>

            {/* Link to login */}
            <p className="text-sm text-muted-foreground text-center mt-6">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-slate-900 hover:underline"
              >
                Sign in
              </Link>
            </p>
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

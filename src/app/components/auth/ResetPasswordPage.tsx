/**
 * Reset Password Page Component
 *
 * Multi-step password reset flow with a split-panel layout matching
 * the login page. Dark brand panel left, form steps on the right.
 *
 * Steps: Email → Verify → New Password → Success
 *
 * Connects to the real backend:
 *   POST /api/auth/forgot-password     → sends 6-digit code via email
 *   POST /api/auth/verify-reset-code   → verifies the code, returns resetToken
 *   POST /api/auth/reset-password      → sets new password with the resetToken
 */

import React, { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { PasswordInput } from '../ui/password-input';
import { Alert, AlertDescription } from '../ui/alert';
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Mail,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
  Lock,
} from 'lucide-react';
import signcastLogo from '../../../assets/bc8c925efd893fdcdf90dd4b45e6de9600299d46.png';
import { apiFetch } from '../../services/apiClient';

type Step = 'email' | 'code' | 'password' | 'success';

const STEPS_META: { key: Step; label: string }[] = [
  { key: 'email', label: 'Email' },
  { key: 'code', label: 'Verify' },
  { key: 'password', label: 'Reset' },
];

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const currentIdx = STEPS_META.findIndex((s) => s.key === step);

  /* ── Step handlers ── */

  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email) { setError('Please enter your email address'); return; }
    if (!email.includes('@')) { setError('Please enter a valid email address'); return; }

    setIsLoading(true);
    try {
      const res = await apiFetch<{ success: boolean; message?: string; error?: string }>(
        '/auth/forgot-password',
        { method: 'POST', body: { email }, noAuth: true },
      );
      if (!res.success) {
        setError(res.error || 'Something went wrong');
        return;
      }
      setStep('code');
    } catch {
      setError('Network error. Please try again.');
    } finally {
    setIsLoading(false);
    }
  };

  const handleCodeSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!code || code.length < 6) { setError('Please enter the 6-digit verification code'); return; }

    setIsLoading(true);
    try {
      const res = await apiFetch<{ success: boolean; data?: { resetToken: string }; error?: string }>(
        '/auth/verify-reset-code',
        { method: 'POST', body: { email, code }, noAuth: true },
      );
      if (!res.success || !res.data) {
        setError(res.error || 'Invalid verification code');
      return;
    }
      setResetToken(res.data.resetToken);
    setStep('password');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError('');
    setIsLoading(true);
    try {
      await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: { email },
        noAuth: true,
      });
    } catch {
      // silently fail on resend
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!newPassword) { setError('Please enter a new password'); return; }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }

    setIsLoading(true);
    try {
      const res = await apiFetch<{ success: boolean; error?: string }>(
        '/auth/reset-password',
        { method: 'POST', body: { resetToken, newPassword }, noAuth: true },
      );
      if (!res.success) {
        setError(res.error || 'Failed to reset password');
        return;
      }
      setStep('success');
    } catch {
      setError('Network error. Please try again.');
    } finally {
    setIsLoading(false);
    }
  };

  /* ── Step indicator (shared) ── */
  const StepIndicator = () => (
    <div className="flex items-center gap-1 mb-8">
      {STEPS_META.map((s, idx) => (
        <React.Fragment key={s.key}>
          <div className="flex items-center gap-1.5">
            <div
              className={`size-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                idx <= currentIdx
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              {idx < currentIdx ? (
                <CheckCircle2 className="size-3.5" />
              ) : (
                idx + 1
              )}
            </div>
            <span
              className={`text-xs hidden sm:inline ${
                idx <= currentIdx
                  ? 'text-slate-700 font-medium'
                  : 'text-slate-400'
              }`}
            >
              {s.label}
            </span>
          </div>
          {idx < STEPS_META.length - 1 && (
            <div
              className={`flex-1 h-px mx-2 ${
                idx < currentIdx ? 'bg-slate-900' : 'bg-slate-200'
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );

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
          {/* Logo */}
          <div>
            <img
              src={signcastLogo}
              alt="SignCast Media"
              className="h-10 w-auto object-contain brightness-0 invert"
            />
          </div>

          {/* Contextual message */}
          <div className="space-y-6">
            <div className="flex items-center justify-center size-14 rounded-2xl bg-white/[0.07]">
              <Lock className="size-7 text-slate-300" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-white leading-snug">
                Account Recovery
              </h2>
              <p className="text-slate-400 mt-3 text-sm leading-relaxed max-w-[340px]">
                Follow the steps to verify your identity and set a new password.
                Your account data remains safe and unchanged.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {[
                'We\u2019ll send a 6-digit code to your email',
                'Enter the code to verify your identity',
                'Choose a strong new password',
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex items-center justify-center size-6 rounded-full bg-white/[0.07] text-xs font-medium text-slate-400 flex-shrink-0">
                    {i + 1}
                  </div>
                  <p className="text-sm text-slate-400">{text}</p>
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

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center px-6 py-12 sm:px-12">
          <div className="w-full max-w-sm">
            {/* Back link */}
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-slate-900 transition-colors mb-8"
            >
              <ArrowLeft className="size-3.5" />
              Back to Sign In
            </Link>

            {/* ── Step: Email ── */}
            {step === 'email' && (
              <>
                <StepIndicator />

                <div className="flex items-center justify-center size-11 rounded-full bg-slate-100 mb-5">
                  <Mail className="size-5 text-slate-600" />
                </div>
                <h1 className="text-2xl font-semibold text-slate-900">
                  Reset your password
                </h1>
                <p className="text-sm text-muted-foreground mt-2 mb-8">
                  Enter the email associated with your account and we'll send a
                  verification code.
                </p>

                <form onSubmit={handleEmailSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email address</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      autoComplete="email"
                      autoFocus
                      required
                    />
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
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
                        Sending code...
                      </>
                    ) : (
                      <>
                        Send Verification Code
                        <ArrowRight className="size-4" />
                      </>
                    )}
                  </Button>
                </form>
              </>
            )}

            {/* ── Step: Verification Code ── */}
            {step === 'code' && (
              <>
                <StepIndicator />

                <div className="flex items-center justify-center size-11 rounded-full bg-slate-100 mb-5">
                  <ShieldCheck className="size-5 text-slate-600" />
                </div>
                <h1 className="text-2xl font-semibold text-slate-900">
                  Check your email
                </h1>
                <p className="text-sm text-muted-foreground mt-2">
                  We sent a 6-digit code to
                </p>
                <p className="text-sm font-medium text-slate-700 mb-8">
                  {email}
                </p>

                <form onSubmit={handleCodeSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="reset-code">Verification code</Label>
                    <Input
                      id="reset-code"
                      type="text"
                      inputMode="numeric"
                      placeholder="123456"
                      maxLength={6}
                      value={code}
                      onChange={(e) =>
                        setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                      }
                      disabled={isLoading}
                      autoFocus
                      className="tracking-[0.3em] text-center"
                      required
                    />
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
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
                        Verifying...
                      </>
                    ) : (
                      <>
                        Verify Code
                        <ArrowRight className="size-4" />
                      </>
                    )}
                  </Button>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setStep('email');
                        setCode('');
                        setError('');
                      }}
                      className="text-xs text-muted-foreground hover:text-slate-900 transition-colors"
                    >
                      Use a different email
                    </button>
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={isLoading}
                      className="text-xs text-muted-foreground hover:text-slate-900 transition-colors disabled:opacity-50"
                    >
                      Resend code
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* ── Step: New Password ── */}
            {step === 'password' && (
              <>
                <StepIndicator />

                <div className="flex items-center justify-center size-11 rounded-full bg-slate-100 mb-5">
                  <KeyRound className="size-5 text-slate-600" />
                </div>
                <h1 className="text-2xl font-semibold text-slate-900">
                  Set a new password
                </h1>
                <p className="text-sm text-muted-foreground mt-2 mb-8">
                  Choose a strong password for your account.
                </p>

                <form onSubmit={handlePasswordSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New password</Label>
                    <PasswordInput
                      id="new-password"
                      placeholder="At least 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={isLoading}
                      autoComplete="new-password"
                      autoFocus
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm password</Label>
                    <PasswordInput
                      id="confirm-password"
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isLoading}
                      autoComplete="new-password"
                      required
                    />
                  </div>

                  {newPassword.length > 0 && (
                    <PasswordHints password={newPassword} />
                  )}

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
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
                        Resetting...
                      </>
                    ) : (
                      <>
                        Reset Password
                        <ArrowRight className="size-4" />
                      </>
                    )}
                  </Button>
                </form>
              </>
            )}

            {/* ── Step: Success ── */}
            {step === 'success' && (
              <div className="text-center py-4">
                <div className="flex items-center justify-center size-14 rounded-full bg-emerald-50 mx-auto mb-6">
                  <CheckCircle2 className="size-7 text-emerald-600" />
                </div>
                <h1 className="text-2xl font-semibold text-slate-900">
                  Password reset complete
                </h1>
                <p className="text-sm text-muted-foreground mt-2 mb-8 max-w-[280px] mx-auto">
                  Your password has been updated successfully. You can now sign
                  in with your new credentials.
                </p>

                <Button
                  className="w-full gap-2 h-10"
                  onClick={() => navigate('/login')}
                >
                  <ArrowLeft className="size-4" />
                  Back to Sign In
                </Button>
              </div>
            )}
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

/* ── Helpers ── */

function PasswordHints({ password }: { password: string }) {
  const rules = [
    { label: 'At least 6 characters', met: password.length >= 6 },
    { label: 'Contains a number', met: /\d/.test(password) },
    { label: 'Contains uppercase', met: /[A-Z]/.test(password) },
  ];

  return (
    <ul className="space-y-1.5">
      {rules.map((rule) => (
        <li
          key={rule.label}
          className={`flex items-center gap-2 text-xs transition-colors ${
            rule.met ? 'text-emerald-600' : 'text-slate-400'
          }`}
        >
          <CheckCircle2 className="size-3.5 flex-shrink-0" />
          {rule.label}
        </li>
      ))}
    </ul>
  );
}

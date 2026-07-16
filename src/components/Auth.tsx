import { useState } from 'react';
import { supabase } from '../lib/supabase';

type AuthProps = {
  onAuthenticated?: (email: string) => void;
  onContinueGuest?: () => void;
};

// Email + password registration for the game lobby.
export function Auth({ onAuthenticated, onContinueGuest }: AuthProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const normalizedEmail = email.trim();
      const result =
        mode === 'signup'
          ? await supabase.auth.signUp({ email: normalizedEmail, password })
          : await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
      const { data, error } = result;
      if (error) setMessage(error.message);
      else if (data.session || data.user) {
        onAuthenticated?.(data.user?.email ?? normalizedEmail);
        setMessage(mode === 'signup' ? 'Account created. Welcome to Brawlson.' : 'Welcome back.');
      } else if (mode === 'signup') {
        setMessage('Account created. Check your email to confirm it, then sign in.');
      }
    } catch {
      setMessage('Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogleAuth() {
    setBusy(true);
    setMessage('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) setMessage(error.message);
    } catch {
      setMessage('Google login did not start. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="registration-page">
      <section className="registration-hero" aria-labelledby="registration-title">
        <div className="registration-hero__copy">
          <p className="registration-hero__eyebrow">Brawlson Player Pass</p>
          <h1 id="registration-title">Enter the Arena</h1>
          <p>Claim your fighter name, save your progress, and jump into the arcade lobby.</p>
        </div>

        <section className="registration-card" aria-label="Account form">
          <div className="registration-tabs" role="tablist" aria-label="Choose account mode">
            <button
              type="button"
              className={mode === 'signup' ? 'is-active' : ''}
              onClick={() => {
                setMode('signup');
                setMessage('');
              }}
            >
              Register
            </button>
            <button
              type="button"
              className={mode === 'signin' ? 'is-active' : ''}
              onClick={() => {
                setMode('signin');
                setMessage('');
              }}
            >
              Sign In
            </button>
          </div>

          <form onSubmit={handleSubmit} className="registration-form">
            <label>
              <span>Email</span>
              <input
                type="email"
                placeholder="player@brawlson.gg"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </label>
            <label>
              <span>Password</span>
              <input
                type="password"
                placeholder="6+ characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                minLength={6}
                required
              />
            </label>

            <button type="submit" className="registration-submit" disabled={busy}>
              {busy ? 'Working...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="registration-divider" aria-hidden="true">
            <span />
            <strong>or</strong>
            <span />
          </div>

          <button type="button" className="registration-google" onClick={handleGoogleAuth} disabled={busy}>
            {mode === 'signin' ? 'Sign in with Google' : 'Register with Google'}
          </button>

          {message && <p className="registration-message">{message}</p>}

          <button type="button" className="registration-guest" onClick={onContinueGuest}>
            Continue as Guest
          </button>
        </section>
      </section>
    </main>
  );
}

import { useState } from 'react';
import { supabase } from '../lib/supabase';

type AuthProps = {
  language: 'en' | 'ru';
  onAuthenticated?: (email: string) => void;
  onContinueGuest?: () => void;
};

// Email + password registration for the game lobby.
export function Auth({ language, onAuthenticated, onContinueGuest }: AuthProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const copy = {
    en: {
      eyebrow: 'Brawlson Player Pass',
      title: 'Enter the Arena',
      intro: 'Claim your fighter name, save your progress, and jump into the arcade lobby.',
      accountForm: 'Account form',
      chooseMode: 'Choose account mode',
      register: 'Register',
      signIn: 'Sign In',
      email: 'Email',
      password: 'Password',
      passwordPlaceholder: '6+ characters',
      working: 'Working...',
      createAccount: 'Create Account',
      or: 'or',
      googleSignIn: 'Sign in with Google',
      googleRegister: 'Register with Google',
      guest: 'Continue as Guest',
      created: 'Account created. Welcome to Brawlson.',
      welcome: 'Welcome back.',
      confirm: 'Account created. Check your email to confirm it, then sign in.',
      error: 'Something went wrong. Try again.',
      googleError: 'Google login did not start. Try again.',
    },
    ru: {
      eyebrow: 'Пропуск игрока Brawlson',
      title: 'Войди на арену',
      intro: 'Забери имя бойца, сохрани прогресс и заходи в аркадное меню.',
      accountForm: 'Форма аккаунта',
      chooseMode: 'Выбор режима аккаунта',
      register: 'Регистрация',
      signIn: 'Войти',
      email: 'Почта',
      password: 'Пароль',
      passwordPlaceholder: '6+ символов',
      working: 'Загрузка...',
      createAccount: 'Создать аккаунт',
      or: 'или',
      googleSignIn: 'Войти через Google',
      googleRegister: 'Регистрация через Google',
      guest: 'Играть гостем',
      created: 'Аккаунт создан. Добро пожаловать в Brawlson.',
      welcome: 'С возвращением.',
      confirm: 'Аккаунт создан. Подтверди почту, потом войди.',
      error: 'Что-то пошло не так. Попробуй снова.',
      googleError: 'Вход через Google не запустился. Попробуй снова.',
    },
  }[language];

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
        setMessage(mode === 'signup' ? copy.created : copy.welcome);
      } else if (mode === 'signup') {
        setMessage(copy.confirm);
      }
    } catch {
      setMessage(copy.error);
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
      setMessage(copy.googleError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="registration-page">
      <section className="registration-hero" aria-labelledby="registration-title">
        <div className="registration-hero__copy">
          <p className="registration-hero__eyebrow">{copy.eyebrow}</p>
          <h1 id="registration-title">{copy.title}</h1>
          <p>{copy.intro}</p>
        </div>

        <section className="registration-card" aria-label={copy.accountForm}>
          <div className="registration-tabs" role="tablist" aria-label={copy.chooseMode}>
            <button
              type="button"
              className={mode === 'signup' ? 'is-active' : ''}
              onClick={() => {
                setMode('signup');
                setMessage('');
              }}
            >
              {copy.register}
            </button>
            <button
              type="button"
              className={mode === 'signin' ? 'is-active' : ''}
              onClick={() => {
                setMode('signin');
                setMessage('');
              }}
            >
              {copy.signIn}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="registration-form">
            <label>
              <span>{copy.email}</span>
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
              <span>{copy.password}</span>
              <input
                type="password"
                placeholder={copy.passwordPlaceholder}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                minLength={6}
                required
              />
            </label>

            <button type="submit" className="registration-submit" disabled={busy}>
              {busy ? copy.working : mode === 'signin' ? copy.signIn : copy.createAccount}
            </button>
          </form>

          <div className="registration-divider" aria-hidden="true">
            <span />
            <strong>{copy.or}</strong>
            <span />
          </div>

          <button type="button" className="registration-google" onClick={handleGoogleAuth} disabled={busy}>
            {mode === 'signin' ? copy.googleSignIn : copy.googleRegister}
          </button>

          {message && <p className="registration-message">{message}</p>}

          <button type="button" className="registration-guest" onClick={onContinueGuest}>
            {copy.guest}
          </button>
        </section>
      </section>
    </main>
  );
}

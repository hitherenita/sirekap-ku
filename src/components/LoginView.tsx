// Berisi tampilan formulir masuk beserta tombol pilih cepat akun contoh per peran.
import {Eye, EyeOff, LockKeyhole, LogIn, ShieldAlert, UserCheck} from 'lucide-react';
import {FormEvent, useRef, useState} from 'react';
import {APP_INFO, UserEntity, UserRole} from '../config';
import {authenticateUser, AuthValidationErrors} from '../lib/auth';

interface LoginViewProps {
  users: UserEntity[];
  onLoginSuccess: (user: UserEntity) => void;
}

const QUICK_ROLE_PRESETS: Array<{role: UserRole; label: string}> = [
  {role: 'ADMIN', label: 'Admin'},
  {role: 'PEGAWAI', label: 'Pegawai'},
  {role: 'PIMPINAN', label: 'Pimpinan'},
];

export default function LoginView({users, onLoginSuccess}: LoginViewProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<AuthValidationErrors>({});

  const usernameInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = authenticateUser(users, username, password);
    if (!result.ok || !result.user) {
      const nextErrors = result.errors ?? {};
      setErrors(nextErrors);
      if (nextErrors.username) {
        usernameInputRef.current?.focus();
      } else if (nextErrors.password) {
        passwordInputRef.current?.focus();
      } else {
        usernameInputRef.current?.focus();
      }
      return;
    }

    setErrors({});
    onLoginSuccess(result.user);
  };

  const handleQuickFill = (role: UserRole) => {
    const sampleUser = users.find((item) => item.role === role && item.is_active);
    if (!sampleUser) {
      return;
    }
    setUsername(sampleUser.email_or_username);
    setPassword(sampleUser.password);
    setErrors({});
    submitButtonRef.current?.focus();
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-neutral-50 px-4 py-6">
      <main className="mx-auto w-full max-w-md rounded-2xl bg-white p-6 sm:p-8">
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-800">
            <LockKeyhole className="h-4 w-4" aria-hidden="true" />
            <span>{APP_INFO.name}</span>
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-neutral-900">
            Masuk ke {APP_INFO.name}
          </h1>
          <p className="mt-1 text-base text-neutral-600">
            Pantau pekerjaan dan susun rekapitulasi laporan unit kerja Anda.
          </p>
        </div>

        {errors.general && (
          <div
            role="alert"
            className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-800"
          >
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{errors.general}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label
              htmlFor="login-username"
              className="mb-1.5 block text-sm font-medium text-neutral-900"
            >
              Username atau Email
            </label>
            <input
              ref={usernameInputRef}
              id="login-username"
              name="username"
              type="text"
              inputMode="text"
              autoComplete="username"
              value={username}
              onChange={(event) => {
                setUsername(event.target.value);
                if (errors.username || errors.general) {
                  setErrors((prev) => ({...prev, username: undefined, general: undefined}));
                }
              }}
              placeholder="Contoh: admin"
              aria-invalid={Boolean(errors.username)}
              aria-describedby={errors.username ? 'login-username-error' : undefined}
              className="min-h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-base text-neutral-900 placeholder:text-neutral-500 focus-visible:border-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
            />
            {errors.username && (
              <p id="login-username-error" className="mt-1.5 text-sm text-red-800">
                {errors.username}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="mb-1.5 block text-sm font-medium text-neutral-900"
            >
              Kata Sandi
            </label>
            <div className="relative">
              <input
                ref={passwordInputRef}
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (errors.password || errors.general) {
                    setErrors((prev) => ({...prev, password: undefined, general: undefined}));
                  }
                }}
                placeholder="Masukkan kata sandi"
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? 'login-password-error' : undefined}
                className="min-h-[44px] w-full rounded-xl border border-neutral-200 bg-white py-2.5 pr-12 pl-3.5 text-base text-neutral-900 placeholder:text-neutral-500 focus-visible:border-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                className="absolute top-1/2 right-1 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-neutral-600 transition-colors duration-150 ease-out hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Eye className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
            </div>
            {errors.password && (
              <p id="login-password-error" className="mt-1.5 text-sm text-red-800">
                {errors.password}
              </p>
            )}
          </div>

          <button
            ref={submitButtonRef}
            type="submit"
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-base font-medium text-white transition-colors duration-150 ease-out hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
          >
            <LogIn className="h-5 w-5" aria-hidden="true" />
            <span>Masuk</span>
          </button>
        </form>

        <div className="mt-6 border-t border-neutral-200 pt-4">
          <p className="mb-2.5 flex items-center gap-1.5 text-sm font-medium text-neutral-600">
            <UserCheck className="h-4 w-4 text-neutral-500" aria-hidden="true" />
            <span>Isi akun contoh:</span>
          </p>
          <div className="grid grid-cols-3 gap-2">
            {QUICK_ROLE_PRESETS.map((preset) => (
              <button
                key={preset.role}
                type="button"
                onClick={() => handleQuickFill(preset.role)}
                className="min-h-[44px] rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-900 transition-colors duration-150 ease-out hover:border-blue-700 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

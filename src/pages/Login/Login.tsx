import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  browserLocalPersistence,
  setPersistence,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from '../../firebase';
import TextField from '@mui/material/TextField';
import { Alert, CircularProgress } from '@mui/material';
import ForgotPassword from './ForgotPassword';
import { getRules, validateField } from './validation';
import { useAuth } from '../../context/AuthContext';
import { default as LogoIcon } from '@mui/icons-material/TokenOutlined';
import { syncUserToFirestore } from '../../api/users';
import Loading from '../../components/Loading';
import useLoading from '../../hooks/useLoading';

type FormValues = {
  email: string;
  password: string;
};

const Login = () => {
  const navigate = useNavigate();
  const { initialLoading, user } = useAuth();
  const {
    loading: actionLoading,
    startLoading: startActionLoading,
    stopLoading: stopActionLoading,
  } = useLoading(false);

  const [values, setValues] = useState<FormValues>({ email: '', password: '' });
  const [errors, setErrors] = useState<
    Partial<Record<keyof FormValues, string>>
  >({});
  const [credentialError, setCredentialError] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  useEffect(() => {
    if (!initialLoading && user) {
      navigate('/home');
    }
  }, [user, initialLoading, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };

  const validateInputs = () => {
    const newErrors: Partial<Record<keyof FormValues, string>> = {};
    Object.keys(values).forEach((key) => {
      const field = key as keyof FormValues;
      const error = validateField(values[field], getRules(field));
      if (error) newErrors[field] = error;
    });
    setErrors(newErrors);
    setCredentialError(false);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInputs()) return;

    startActionLoading();
    try {
      await setPersistence(auth, browserLocalPersistence);
      const userCredential = await signInWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );
      const user = userCredential.user;

      await syncUserToFirestore(user);

      setValues({ email: '', password: '' });
      setErrors({});
      setCredentialError(false);
    } catch (error) {
      const firebaseError = error as { code?: string; message: string };
      if (firebaseError.code === 'auth/invalid-credential') {
        setCredentialError(true);
      }
    } finally {
      stopActionLoading();
    }
  };

  return (
    <section className="relative bg-(image:--primary-gradient)">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)] bg-[size:6rem_4rem]"></div>
      </div>
      {user || initialLoading ? (
        <div className="flex h-screen flex-col items-center justify-center px-6 py-8">
          <Loading
            message={
              initialLoading
                ? 'Sprawdzanie autoryzacji...'
                : 'Przekierowywanie...'
            }
          />
        </div>
      ) : (
        <div className="flex h-screen flex-col items-center justify-center px-6 py-8">
          <div className="relative w-full rounded-lg bg-white p-6 shadow sm:max-w-md">
            <h1 className="text-dark absolute -top-8 left-1/2 mb-6 inline-flex -translate-x-1/2 flex-row items-end justify-center rounded-lg bg-white/50 px-4 py-2 font-medium shadow">
              <LogoIcon className="text-4xl" />
              <span className="text-darkYellow text-4xl text-shadow-sm/20">
                OKB
              </span>
              <span className="text-2xl underline">manager</span>
            </h1>
            <h2 className="text-dark mt-6 mb-8 text-xl">
              Zaloguj się do swojego konta
            </h2>

            <form
              className="space-y-4 md:space-y-6"
              noValidate
              onSubmit={handleSubmit}
            >
              <TextField
                size="small"
                error={!!errors.email}
                required
                fullWidth
                id="email"
                label="Email"
                name="email"
                autoFocus
                helperText={errors.email}
                value={values.email}
                onChange={handleChange}
                disabled={actionLoading}
                slotProps={{
                  input: { className: 'rounded-lg' },
                }}
              />
              <TextField
                size="small"
                error={!!errors.password}
                required
                fullWidth
                name="password"
                label="Hasło"
                type="password"
                id="password"
                helperText={errors.password}
                value={values.password}
                onChange={handleChange}
                disabled={actionLoading}
                slotProps={{
                  input: { className: 'rounded-lg' },
                }}
              />

              {credentialError && (
                <Alert severity="error">
                  Wprowadzono niepoprawny email lub hasło.
                </Alert>
              )}

              <div>
                <a
                  href="#"
                  className="text-md font-semibold text-indigo-500 hover:underline"
                  onClick={() => setForgotOpen(true)}
                >
                  Nie pamiętasz hasła?
                </a>
              </div>

              <button
                type="submit"
                className="hover:bg-darkYellow border-darkGray flex w-full cursor-pointer items-center justify-center rounded-lg border px-6 py-3 disabled:opacity-50"
                disabled={actionLoading}
              >
                {actionLoading ? <CircularProgress size={24} /> : 'Zaloguj się'}
              </button>
            </form>

            <ForgotPassword
              open={forgotOpen}
              handleClose={() => setForgotOpen(false)}
            />
          </div>
        </div>
      )}
    </section>
  );
};

export default Login;

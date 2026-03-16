'use client';

import React, { useState } from "react";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { TextField } from "@/shared/components/ui/TextField/TextField";
import { Button } from "@/shared/components/ui/Button/Button";
import Alert from "@/shared/components/ui/Alert/Alert";

interface LoginValues {
  email: string;
  password: string;
}

const initialValues: LoginValues = {
  email: "",
  password: "",
};

const LoginForm: React.FC = () => {
  const [values, setValues] = useState<LoginValues>(initialValues);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Usuario o contraseña incorrectos");
        setLoading(false);
        return;
      }

      if (result?.ok) {
        // Redirect to paddy page
        router.push("/paddy");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Error al iniciar sesión. Intenta nuevamente.");
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md bg-background rounded-lg shadow-2xl p-8">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Image
            src="/logo.svg"
            alt="AYG Logo"
            width={120}
            height={120}
          />
        </div>

        {/* Company Info */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">AYG</h1>
          <p className="text-sm text-foreground font-medium leading-tight">
            SOC.COMERCIAL E INDUSTRIAL<br />APARICIO Y GARCIA LTDA.
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} data-test-id="login-form" className="space-y-6">
          <div className="subtitle text-center p-1 pt-0 w-full mb-4 leading-snug">Ingresa tus credenciales</div>

          {error && (
            <Alert variant="error" className="mb-4">
              {error}
            </Alert>
          )}

          <div className="form-group">
            <TextField
              id="paddy-login-email"
              label="Email"
              type="email"
              value={values.email}
              onChange={(event) => setValues((prev) => ({ ...prev, email: event.target.value }))}
              required
              name="paddy_login_email"
              autoComplete="section-paddy-login email"
              data-test-id="login-email"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <TextField
              id="paddy-login-password"
              label="Contraseña"
              type="password"
              value={values.password}
              onChange={(event) => setValues((prev) => ({ ...prev, password: event.target.value }))}
              required
              name="paddy_login_password"
              autoComplete="section-paddy-login current-password"
              passwordVisibilityToggle
              data-test-id="login-password"
              disabled={loading}
            />
          </div>

          <div className="w-full mt-6">
            <Button variant="primary" type="submit" className="w-full" loading={loading} disabled={loading}>
              {loading ? "Iniciando sesión..." : "Iniciar sesión"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;

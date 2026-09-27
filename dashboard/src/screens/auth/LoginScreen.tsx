import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import type { User } from "../../lib/types";
import { AuthLayout } from "./AuthLayout";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";

export function LoginScreen() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const data = await api<{ token: string; user: User }>("/api/auth/login", {
        method: "POST",
        body: { email, password },
      });
      signIn(data.token, data.user);
      navigate("/bots");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout>
      <h1>Sign in</h1>
      {error && <div className="form-error">{error}</div>}
      <form onSubmit={submit}>
        <Field label="Email">
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </Field>
        <Field label="Password">
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </Field>
        <Button type="submit" loading={busy} style={{ width: "100%" }}>
          Sign in
        </Button>
      </form>
      <p className="auth-switch">
        No account yet? <Link to="/signup">Create one</Link>
      </p>
    </AuthLayout>
  );
}

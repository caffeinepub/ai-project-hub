import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertCircle,
  Bot,
  Brain,
  Gamepad2,
  Globe,
  Loader2,
  Lock,
  Smartphone,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { type FormEvent, useState } from "react";
import { createActorWithConfig } from "../config";

interface PasswordGateProps {
  onSuccess: () => void;
}

const FLOATING_ITEMS = [
  { icon: Globe, label: "Web Apps", x: "10%", y: "20%", delay: 0 },
  { icon: Gamepad2, label: "Games", x: "85%", y: "15%", delay: 0.3 },
  { icon: Smartphone, label: "Mobile", x: "8%", y: "70%", delay: 0.6 },
  { icon: Bot, label: "AI Bots", x: "80%", y: "72%", delay: 0.9 },
  { icon: Brain, label: "Therapy", x: "50%", y: "10%", delay: 0.45 },
  { icon: Zap, label: "Desktop", x: "75%", y: "45%", delay: 0.15 },
];

export default function PasswordGate({ onSuccess }: PasswordGateProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const actor = await createActorWithConfig();
      const ok = await actor.checkCredentials(username, password);
      if (ok) {
        onSuccess();
      } else {
        setError("Invalid username or password. Please try again.");
        setIsSubmitting(false);
      }
    } catch {
      setError("Connection error. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-mesh overflow-hidden flex items-center justify-center noise-bg">
      {/* Floating category icons */}
      {FLOATING_ITEMS.map(({ icon: Icon, label, x, y, delay }) => (
        <motion.div
          key={label}
          className="absolute hidden lg:flex items-center gap-2 px-3 py-2 rounded-lg bg-card/60 border border-border/60 backdrop-blur-sm text-muted-foreground text-xs font-medium"
          style={{ left: x, top: y }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay, duration: 0.5, ease: "easeOut" }}
        >
          <Icon className="w-3.5 h-3.5 text-primary" />
          {label}
        </motion.div>
      ))}

      {/* Grid lines decoration */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.28 0.022 258 / 0.2) 1px, transparent 1px), linear-gradient(90deg, oklch(0.28 0.022 258 / 0.2) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Glow spot */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.08] blur-[100px] bg-primary pointer-events-none" />

      {/* Main content card */}
      <motion.div
        className="relative z-10 w-full max-w-md mx-4"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="bg-card border border-border rounded-2xl p-10 shadow-2xl shadow-black/40">
          {/* Logo */}
          <motion.div
            className="flex items-center justify-center mb-8"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center">
                <Brain className="w-8 h-8 text-primary" />
              </div>
              <div className="absolute -inset-1 rounded-2xl bg-primary/5 blur-md" />
            </div>
          </motion.div>

          {/* Heading */}
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">
              AI Project Hub
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Enter your credentials to access your command center.
            </p>
          </motion.div>

          {/* Login form */}
          <motion.form
            onSubmit={handleSubmit}
            className="space-y-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            {/* Username */}
            <div className="space-y-1.5">
              <Label
                htmlFor="gate-username"
                className="text-sm font-medium text-foreground"
              >
                Username
              </Label>
              <Input
                id="gate-username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError(null);
                }}
                placeholder="Enter username"
                disabled={isSubmitting}
                required
                className="h-11 bg-background/50 border-border/60 focus:border-primary/60 transition-colors"
                data-ocid="password_gate.username.input"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label
                htmlFor="gate-password"
                className="text-sm font-medium text-foreground"
              >
                Password
              </Label>
              <Input
                id="gate-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                placeholder="Enter password"
                disabled={isSubmitting}
                required
                className="h-11 bg-background/50 border-border/60 focus:border-primary/60 transition-colors"
                data-ocid="password_gate.password.input"
              />
            </div>

            {/* Error message */}
            {error && (
              <motion.div
                className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                role="alert"
                aria-live="polite"
                data-ocid="password_gate.error_state"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </motion.div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              disabled={isSubmitting || !username || !password}
              className="w-full h-11 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all duration-200 mt-2"
              data-ocid="password_gate.submit_button"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  Verifying…
                </>
              ) : (
                <>
                  <Lock className="mr-2 w-4 h-4" />
                  Access Hub
                </>
              )}
            </Button>
          </motion.form>
        </div>
      </motion.div>

      {/* Footer */}
      <div className="absolute bottom-4 left-0 right-0 text-center text-xs text-muted-foreground/40">
        © {new Date().getFullYear()}.{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          className="hover:text-muted-foreground transition-colors"
          target="_blank"
          rel="noopener noreferrer"
        >
          Built with love using caffeine.ai
        </a>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DEMO_ACCOUNTS, DEMO_PASSWORD, type DemoAccount } from '@/lib/demo-users';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ShieldAlert, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import karnatakaEmblem from '@/assets/karnataka-emblem.png';

function friendlyAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email or password.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Try again in a moment.';
    case 'auth/invalid-api-key':
    case 'auth/api-key-not-valid':
      return 'Firebase isn\u2019t configured \u2014 check the .env file.';
    default:
      return 'Login failed. Please try again.';
  }
}

export default function Login() {
  const { login } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState(DEMO_ACCOUNTS[0].email);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRoleSelect = (account: DemoAccount) => {
    setEmail(account.email);
    setPassword(DEMO_PASSWORD);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      toast({
        title: 'Login Failed',
        description: friendlyAuthError(err),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/0.15),transparent_50%)]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl -z-10" />

      <div className="z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mb-6">
            <img src={karnatakaEmblem} alt="Karnataka State Emblem" className="w-32 h-32 mx-auto object-contain drop-shadow-[0_0_20px_hsl(var(--primary)/0.3)]" />
          </div>
          <h1 className="text-3xl font-bold tracking-widest text-primary-foreground mb-2">SCRB SANKET</h1>
          <h2 className="text-lg font-medium text-muted-foreground uppercase tracking-wider">AI Crime Intelligence Platform</h2>
          <p className="text-sm text-muted-foreground mt-2">Karnataka State Crime Records Bureau</p>
        </div>

        <Card className="border-primary/30 shadow-xl shadow-black/50 bg-card/95 backdrop-blur-sm">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-xl text-center">Authorized Access Only</CardTitle>
            <CardDescription className="text-center">Select a demo role or enter credentials</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-3 gap-2 mb-6">
              {DEMO_ACCOUNTS.map((account) => (
                <Button
                  key={account.email}
                  type="button"
                  variant={email === account.email ? 'default' : 'outline'}
                  className="text-xs"
                  onClick={() => handleRoleSelect(account)}
                >
                  {account.label}
                </Button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="font-mono bg-background/50"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Passcode</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="font-mono bg-background/50"
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full mt-6 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold tracking-wide"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'AUTHENTICATING...' : 'SECURE LOGIN'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-2 pt-4 border-t border-border/50 text-center">
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <ShieldAlert className="w-3 h-3 text-secondary" />
              <span>Restricted System. Monitored and logged.</span>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

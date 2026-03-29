'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function ClaimForm() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function checkAvailability(value: string) {
    if (value.length < 3) return;
    setChecking(true);
    setError(null);

    try {
      const res = await fetch(`/api/username/check?username=${encodeURIComponent(value)}`);
      const data = await res.json();
      if (!data.available) {
        setError('Username is already taken.');
      }
    } catch {
      // Silently ignore check failures
    } finally {
      setChecking(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username || username.length < 3) {
      setError('Must be at least 3 characters.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/${data.username}`);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? 'Failed to claim username.');
      }
    } catch {
      setError('Network error. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex items-center border-2 border-foreground bg-card">
        <span className="px-4 text-muted-foreground text-sm font-mono">ccwrapped.dev/</span>
        <input
          type="text"
          value={username}
          onChange={(e) => {
            const v = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/^-+/, '');
            setUsername(v);
            setError(null);
          }}
          onBlur={() => checkAvailability(username)}
          placeholder="username"
          className="flex-1 bg-transparent px-2 py-3 text-sm font-mono focus:outline-none"
          minLength={3}
          maxLength={30}
          autoFocus
        />
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {checking && (
        <p className="text-sm text-muted-foreground">Checking availability...</p>
      )}

      <Button type="submit" disabled={submitting || checking || username.length < 3}>
        {submitting ? 'Claiming...' : 'Claim Username'}
      </Button>

      <p className="text-xs text-muted-foreground">
        3-30 characters. Letters, numbers, and hyphens only. Must start and end with a letter or number.
      </p>
    </form>
  );
}

import { ImageResponse } from '@vercel/og';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

// Edge runtime has no persistent process — create client per request.
// Uses anon key (not service role) since card data is publicly readable via RLS.
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username: rawUsername } = await params;
  const username = rawUsername.replace(/\.png$/, '');

  const { searchParams } = new URL(request.url);
  const theme = searchParams.get('theme') === 'light' ? 'light' : 'dark';
  const period = searchParams.get('period') ?? 'week';

  // Create edge-compatible Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Fetch user
  const { data: user } = await supabase
    .from('users')
    .select('id, github_login, avatar_url')
    .eq('github_login', username)
    .single();

  if (!user) {
    return new Response('User not found', { status: 404 });
  }

  // Fetch stats for period
  const now = new Date();
  let sinceDate: string;
  let periodLabel: string;

  switch (period) {
    case 'month':
      sinceDate = new Date(now.getTime() - 30 * 86400_000).toISOString().slice(0, 10);
      periodLabel = 'This month';
      break;
    case 'all':
      sinceDate = '2020-01-01';
      periodLabel = 'All time';
      break;
    default:
      sinceDate = new Date(now.getTime() - 7 * 86400_000).toISOString().slice(0, 10);
      periodLabel = 'This week';
  }

  const { data: stats } = await supabase
    .from('daily_stats')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', sinceDate)
    .order('date', { ascending: true });

  const days = stats ?? [];

  // Aggregate
  let totalInput = 0;
  let totalOutput = 0;
  let totalSessions = 0;
  let totalProjects = 0;
  const models = new Map<string, number>();

  for (const day of days) {
    totalInput += day.input_tokens ?? 0;
    totalOutput += day.output_tokens ?? 0;
    totalSessions += day.session_count ?? 0;
    totalProjects += day.project_count ?? 0;

    const breakdowns = (day.model_breakdowns ?? []) as Array<{
      modelName: string;
      inputTokens: number;
      outputTokens: number;
    }>;
    for (const mb of breakdowns) {
      const t = (mb.inputTokens ?? 0) + (mb.outputTokens ?? 0);
      models.set(mb.modelName, (models.get(mb.modelName) ?? 0) + t);
    }
  }

  const totalTokens = totalInput + totalOutput;
  const sortedModels = [...models.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  const modelTotal = sortedModels.reduce((s, [, v]) => s + v, 0);

  // Build heatmap (last 30 days)
  const daysByDate = new Map(days.map((d) => [d.date, d]));
  const heatmapDays: number[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400_000).toISOString().slice(0, 10);
    const day = daysByDate.get(d);
    heatmapDays.push(day ? (day.input_tokens ?? 0) + (day.output_tokens ?? 0) : 0);
  }
  const maxHeatmap = Math.max(...heatmapDays, 1);

  // Colors
  const bg = theme === 'dark' ? '#0d1117' : '#ffffff';
  const fg = theme === 'dark' ? '#e6edf3' : '#1f2328';
  const dim = theme === 'dark' ? '#8b949e' : '#656d76';
  const accent = theme === 'dark' ? '#7c3aed' : '#6d28d9';

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          padding: '48px',
          backgroundColor: bg,
          color: fg,
          fontFamily: 'Inter, sans-serif',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {user.avatar_url && (
            <img
              src={user.avatar_url}
              width={64}
              height={64}
              style={{ borderRadius: '50%' }}
            />
          )}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '32px', fontWeight: 700 }}>
              @{user.github_login}
            </span>
            <span style={{ fontSize: '16px', color: dim }}>
              {periodLabel}
            </span>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: '20px', color: accent, fontWeight: 700 }}>
            devwrapped
          </div>
        </div>

        {/* Stats */}
        <div
          style={{
            display: 'flex',
            gap: '48px',
            marginTop: '40px',
            fontSize: '20px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '36px', fontWeight: 700 }}>
              {formatTokens(totalTokens)}
            </span>
            <span style={{ color: dim }}>tokens</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '36px', fontWeight: 700 }}>
              {totalSessions}
            </span>
            <span style={{ color: dim }}>sessions</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '36px', fontWeight: 700 }}>
              {totalProjects}
            </span>
            <span style={{ color: dim }}>projects</span>
          </div>
        </div>

        {/* Model bars */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            marginTop: '32px',
          }}
        >
          {sortedModels.map(([name, tokens]) => {
            const pct = modelTotal > 0 ? (tokens / modelTotal) * 100 : 0;
            const shortName = name.replace(/^claude-/, '').replace(/-\d{8}$/, '');
            return (
              <div
                key={name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '16px',
                }}
              >
                <span style={{ width: '120px', color: dim }}>{shortName}</span>
                <div
                  style={{
                    display: 'flex',
                    width: '400px',
                    height: '16px',
                    backgroundColor: theme === 'dark' ? '#21262d' : '#f0f0f0',
                    borderRadius: '8px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${Math.max(pct, 2)}%`,
                      height: '100%',
                      backgroundColor: accent,
                      borderRadius: '8px',
                    }}
                  />
                </div>
                <span style={{ color: dim }}>{Math.round(pct)}%</span>
              </div>
            );
          })}
        </div>

        {/* Heatmap */}
        <div
          style={{
            display: 'flex',
            gap: '4px',
            marginTop: '32px',
            flexWrap: 'wrap',
          }}
        >
          {heatmapDays.map((val, i) => {
            const intensity = val / maxHeatmap;
            const opacity = val === 0 ? 0.1 : 0.2 + intensity * 0.8;
            return (
              <div
                key={i}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '4px',
                  backgroundColor: accent,
                  opacity,
                }}
              />
            );
          })}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            marginTop: 'auto',
            fontSize: '14px',
            color: dim,
          }}
        >
          devwrapped.dev/@{user.github_login}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    },
  );
}

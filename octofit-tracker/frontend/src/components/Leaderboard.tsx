import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = {
  teamName?: string;
  totalPoints?: number;
  rank?: number;
};

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const data = await getJson<{ leaderboard?: LeaderboardEntry[] }>('/api/leaderboard');
        if (!active) return;
        setLeaderboard(data.leaderboard ?? []);
      } catch {
        if (active) setError('Unable to load leaderboard.');
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <CapabilityCard
      title="Leaderboard"
      description="Compare team point totals."
      isLoading={isLoading}
      error={error}
      empty={leaderboard.length === 0}
      emptyMessage="leaderboard"
    >
      <ol className="list-group list-group-numbered">
        {leaderboard.map((entry, index) => (
          <li key={`${entry.teamName ?? 'team'}-${index}`} className="list-group-item">
            {entry.teamName} — {entry.totalPoints ?? 0} pts (rank {entry.rank ?? index + 1})
          </li>
        ))}
      </ol>
    </CapabilityCard>
  );
}

import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type ActivityRecord = {
  type?: string;
  minutes?: number;
  points?: number;
};

export default function Activities() {
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const data = await getJson<{ activities?: ActivityRecord[] }>('/api/activities');
        if (!active) return;
        setActivities(data.activities ?? []);
      } catch {
        if (active) setError('Unable to load activities.');
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
      title="Activities"
      description="Track student activity minutes and points."
      isLoading={isLoading}
      error={error}
      empty={activities.length === 0}
      emptyMessage="activities"
    >
      <ul className="list-group list-group-flush">
        {activities.map((activity, index) => (
          <li key={`${activity.type ?? 'activity'}-${index}`} className="list-group-item">
            {activity.type} • {activity.minutes ?? 0} minutes • {activity.points ?? 0} pts
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}

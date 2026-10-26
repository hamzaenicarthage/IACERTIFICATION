import type { ReactNode } from 'react';

type Props = {
  title: string;
  description: string;
  isLoading?: boolean;
  error?: string | null;
  empty?: boolean;
  emptyMessage?: string;
  children?: ReactNode;
};

export function CapabilityCard({
  title,
  description,
  isLoading = false,
  error = null,
  empty = false,
  emptyMessage,
  children,
}: Props) {
  if (isLoading) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">{title}</h2>
          <p>{description}</p>
          <p role="status">Loading {title.toLowerCase()}...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">{title}</h2>
          <p>{description}</p>
          <div role="alert">Unable to load {title.toLowerCase()}.</div>
        </div>
      </section>
    );
  }

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        {empty ? <p>No {emptyMessage ?? title.toLowerCase()}.</p> : children}
      </div>
    </section>
  );
}

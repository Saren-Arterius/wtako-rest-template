// The TypeScript definitions below are automatically generated.
// Do not touch them, or risk, your modifications being lost.



export type Article = {
  id: string;
  title: string;
  content: string;
  created_at: string;
};

export type Comment = {
  id: string;
  article_id: string | null;
  content: string;
  side: string | null;
  location: unknown;
  created_at: string;
};

export type Config = {
  key: string;
  value: string | null;
};

export type KnexMigrations = {
  id: number;
  name: string | null;
  batch: number | null;
  migration_time: Date | null;
};

export type KnexMigrationsLock = {
  index: number;
  is_locked: number | null;
};

export type Profile = {
  id: string;
  username: string;
  name: string;
  description: string | null;
  created_at: string;
  details: Record<string, unknown>;
};


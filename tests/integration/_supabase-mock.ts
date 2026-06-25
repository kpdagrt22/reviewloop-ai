/**
 * A tiny in-memory stand-in for the Supabase query builder, good enough to test
 * server actions and persistence logic without a live database. It supports the
 * chains the app actually uses:
 *
 *   from(t).select(cols, {count, head}).eq().gte()        -> { count }
 *   from(t).select("*").eq().eq().maybeSingle()/single()  -> { data }
 *   from(t).insert(payload).select("id").single()         -> { data: insertedRow }
 *   from(t).update(payload).eq().eq()                     -> { error }
 *   from(t).delete().eq().eq()                            -> { error }
 *   from(t).upsert(payload, opts)                         -> { error }
 *
 * Every write is recorded on `writes` so a test can assert what was persisted.
 * Reads/counts/inserted-rows/errors are configured per table.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export interface RecordedWrite {
  table: string;
  op: "insert" | "update" | "delete" | "upsert";
  payload?: unknown;
  filters: Array<[string, unknown]>;
}

export interface FakeConfig {
  /** Row returned by select().maybeSingle()/single() (or a list when awaited). */
  reads?: Record<string, unknown>;
  /** Count returned by select(_, { count, head }) queries. */
  counts?: Record<string, number>;
  /** Row returned by insert(...).select(...).single(). */
  inserted?: Record<string, unknown>;
  /** Inject an error keyed by `${table}:${op}`, e.g. "review_requests:update". */
  errors?: Record<string, { message: string }>;
  /**
   * Strict scope guard. For each table, the listed columns MUST appear as filters
   * (.eq/.gte) on every select/update/delete against that table, or the fake
   * throws. Use this to make a dropped `organization_id` (or `created_at`) scope
   * fail the test instead of silently passing. Not applied to insert/upsert,
   * where scope lives in the row payload.
   */
  requiredFilters?: Record<string, string[]>;
}

interface QueryResult {
  data: unknown;
  error: { message: string } | null;
  count: number | null;
}

class Builder {
  private op: "select" | "insert" | "update" | "delete" | "upsert" = "select";
  private payload: unknown;
  private wantsRow = false;
  private head = false;
  private count = false;
  private readonly filters: Array<[string, unknown]> = [];

  constructor(
    private readonly table: string,
    private readonly cfg: FakeConfig,
    private readonly writes: RecordedWrite[],
  ) {}

  select(_cols?: string, opts?: { count?: string; head?: boolean }): this {
    this.wantsRow = true;
    if (opts?.head) this.head = true;
    if (opts?.count) this.count = true;
    return this;
  }
  insert(payload: unknown): this {
    this.op = "insert";
    this.payload = payload;
    return this;
  }
  update(payload: unknown): this {
    this.op = "update";
    this.payload = payload;
    return this;
  }
  upsert(payload: unknown): this {
    this.op = "upsert";
    this.payload = payload;
    return this;
  }
  delete(): this {
    this.op = "delete";
    return this;
  }
  eq(col: string, val: unknown): this {
    this.filters.push([col, val]);
    return this;
  }
  gte(col: string, val: unknown): this {
    this.filters.push([col, val]);
    return this;
  }
  lte(): this {
    return this;
  }
  order(): this {
    return this;
  }
  limit(): this {
    return this;
  }
  maybeSingle(): Promise<QueryResult> {
    return Promise.resolve(this.compute());
  }
  single(): Promise<QueryResult> {
    return Promise.resolve(this.compute());
  }
  then<R1 = QueryResult, R2 = never>(
    onfulfilled?: ((value: QueryResult) => R1 | PromiseLike<R1>) | null,
    onrejected?: ((reason: unknown) => R2 | PromiseLike<R2>) | null,
  ): Promise<R1 | R2> {
    return Promise.resolve(this.compute()).then(onfulfilled, onrejected);
  }

  private errorFor(): { message: string } | null {
    return this.cfg.errors?.[`${this.table}:${this.op}`] ?? null;
  }

  private assertRequiredFilters(): void {
    if (this.op === "insert" || this.op === "upsert") return;
    const required = this.cfg.requiredFilters?.[this.table];
    if (!required) return;
    const present = new Set(this.filters.map(([col]) => col));
    for (const col of required) {
      if (!present.has(col)) {
        throw new Error(
          `Fake Supabase: ${this.op} on "${this.table}" is missing required scope filter ` +
            `.eq/.gte("${col}", …). A dropped scope filter must fail the test.`,
        );
      }
    }
  }

  private compute(): QueryResult {
    this.assertRequiredFilters();
    const error = this.errorFor();
    if (this.op === "select") {
      if (this.head || this.count) {
        return { data: null, error, count: this.cfg.counts?.[this.table] ?? 0 };
      }
      return { data: this.cfg.reads?.[this.table] ?? null, error, count: null };
    }
    this.writes.push({
      table: this.table,
      op: this.op,
      payload: this.payload,
      filters: this.filters,
    });
    if ((this.op === "insert" || this.op === "upsert") && this.wantsRow) {
      const row = this.cfg.inserted?.[this.table] ?? { id: `${this.table}_id` };
      return { data: row, error, count: null };
    }
    return { data: null, error, count: null };
  }
}

export interface FakeSupabase {
  client: { from(table: string): Builder };
  writes: RecordedWrite[];
}

export function createFakeSupabase(cfg: FakeConfig = {}): FakeSupabase {
  const writes: RecordedWrite[] = [];
  return {
    client: { from: (table: string) => new Builder(table, cfg, writes) },
    writes,
  };
}

/** Cast the fake to the Supabase client type for functions that accept one. */
export function asSupabase(fake: FakeSupabase): SupabaseClient<Database> {
  return fake.client as unknown as SupabaseClient<Database>;
}

/** Find the first recorded write to a table (optionally for a specific op). */
export function findWrite(
  fake: FakeSupabase,
  table: string,
  op?: RecordedWrite["op"],
): RecordedWrite | undefined {
  return fake.writes.find((w) => w.table === table && (!op || w.op === op));
}

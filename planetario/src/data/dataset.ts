import type { BodyData, BodyId, Interval, OrbitalElements, Quantity, Source } from './contracts.ts';

// Concrete envelope for the fields required in DATA-MODEL §3.
// No scientific qualification may be asserted by the Phase 3 inspection pipeline.
export interface DatasetDraft {
  readonly schemaVersion: '1.0';
  readonly version: string;
  readonly valid: Interval;
  readonly sources: readonly Source[];
  readonly bodies: Readonly<Record<BodyId, BodyData>>;
  readonly nodes: { readonly emb: { readonly id: 'emb'; readonly naifId: 3; readonly members: readonly ['earth', 'moon'] } };
  readonly orbits: Readonly<Record<'emb-sun' | 'mars-sun' | 'moon-earth', OrbitalElements>>;
  readonly constants: Readonly<Record<string, Quantity>>;
  readonly validationReport: { readonly status: 'unvalidated'; readonly reportId: null };
}

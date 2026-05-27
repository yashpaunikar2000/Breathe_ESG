# MODEL.md

## Data model overview

The prototype is built around a multi-tenant ingestion model that tracks the source of each row, the normalization layer, and review state for audit readiness.

### Core entities

- `Client`
  - Represents an enterprise customer.
  - Useful for multi-tenancy and logical separation of ingestion batches.

- `ImportBatch`
  - Represents a source ingestion event.
  - Stores `source_type`, `ingestion_method`, `external_id`, and raw metadata.
  - Allows grouping records by a specific ingestion and tracking source-of-truth.

- `EmissionRecord`
  - Represents a normalized row of emissions data.
  - Tracks `source_row_id`, `source_category`, `scope`, `activity_date`, `facility_code`, `origin`, `destination`, `mode`, `quantity`, `unit`, `normalized_quantity`, `normalized_unit`, `emission_kg_co2e`, `status`, and `locked_for_audit`.
  - Stores raw JSON in `raw_row` for audit and debugging.

## How it supports the requirements

- Multi-tenancy
  - All records and batches belong to a `Client`.
  - This makes it easy to build authorization later and partition data by customer.

- Scope 1/2/3 categorization
  - A dedicated `scope` field on `EmissionRecord` drives auditing and reporting.
  - SAP fuel/procurement rows are treated as `scope_1`, utility electricity as `scope_2`, and travel as `scope_3`.

- Source-of-truth tracking
  - `ImportBatch` captures the ingestion source, file metadata, and raw payload.
  - Each `EmissionRecord` references its `ImportBatch`.
  - `raw_row` retains the original row data for any post-hoc review.

- Unit normalization
  - The model records both `quantity`/`quantity_unit` and `normalized_quantity`/`normalized_unit`.
  - This supports later normalization to standard units when the source reporting units vary.

- Audit trail
  - `status`, `reviewed_at`, `reviewed_by`, and `locked_for_audit` provide a minimal review workflow.
  - `created_at`/`updated_at` capture change timing.

## Key design choices

- Treat the ingestion batch as the primary source-of-truth anchor.
- Keep records denormalized enough for review, but preserve raw payload for exact replication.
- Build a generic `EmissionRecord` rather than separate tables per source, because the core review and audit workflow is shared.

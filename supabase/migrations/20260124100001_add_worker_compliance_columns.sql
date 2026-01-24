-- Migration: Add compliance columns to workers table
-- Phase 03-01: Worker Management Foundation
-- Adds NDIS check and WWCC fields for compliance tracking (Option B: columns on workers table for MVP)

alter table workers add column ndis_check_number text;
alter table workers add column ndis_check_expiry date;
alter table workers add column wwcc_number text;
alter table workers add column wwcc_expiry date;

-- Partial indexes for compliance dashboard queries that filter by expiry date
create index idx_workers_ndis_expiry on workers(ndis_check_expiry) where ndis_check_expiry is not null;
create index idx_workers_wwcc_expiry on workers(wwcc_expiry) where wwcc_expiry is not null;

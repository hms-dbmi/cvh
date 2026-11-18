-- Copied from hms-dbmi/udi-yac dev/cfdb/build.sql (b4ec77b, nickakhmetov/cvh-data-exploration).
-- yac-packages.json describes the tables this builds: change them together.

-- Curate a cfdb (C2M2) dump into a star schema the YAC agent can serve.
-- Run by build_cfdb.py with the dump attached read-only as `src`; unqualified
-- tables are the output database. Plain SQL, so it ports to another engine.
--
-- C2M2 keys are (id_namespace, local_id), but local_id alone is unique in
-- every table here, so it is the key. Ontology codes are resolved to their
-- names, '' becomes NULL, and each child carries direct FKs to every parent
-- (the chat cross-filters along direct FKs only, no multi-hop).

CREATE OR REPLACE TABLE subjects AS
SELECT
  s.local_id AS subject_id,
  upper(s.submission) AS dcc,
  t.name AS species
FROM src.subject s
LEFT JOIN src.ncbi_taxonomy t ON t.id = s.taxonomy;

-- ponytail: a biosample pooled from several subjects keeps the min one
-- (94% have exactly one; subject_count says how many), so subject_id on
-- pooled rows is a representative, not the source. A link table if a demo
-- question needs the rest.
CREATE OR REPLACE TABLE biosamples AS
SELECT
  b.local_id AS biosample_id,
  upper(b.submission) AS dcc,
  a.name AS anatomy,
  NULLIF(x.biosample_type, '') AS biosample_type,
  coalesce(bs.subject_count, 0)::INTEGER AS subject_count,
  bs.subject_id
FROM src.biosample b
LEFT JOIN src.anatomy a ON a.id = b.anatomy
LEFT JOIN src.biosample_extra_encode x ON x.local_id = b.local_id
LEFT JOIN (
  SELECT biosample_local_id, min(subject_local_id) AS subject_id, count(*) AS subject_count
  FROM src.biosample_from_subject
  GROUP BY 1
) bs ON bs.biosample_local_id = b.local_id;

-- Every collection has at most one biosample and one anatomy row.
CREATE OR REPLACE TABLE collections AS
SELECT
  c.local_id AS collection_id,
  NULLIF(c.accession_id, '') AS accession,
  NULLIF(c.name, '') AS name,
  upper(c.submission) AS dcc,
  NULLIF(c.lab, '') AS lab,
  NULLIF(c.experiment_type, '') AS experiment_type,
  NULLIF(c.experiment_target, '') AS target,
  NULLIF(c.analyte_class, '') AS analyte_class,
  a.name AS anatomy,
  bic.biosample_id,
  b.subject_id
FROM src.collection c
LEFT JOIN src.collection_anatomy ca ON ca.collection_local_id = c.local_id
LEFT JOIN src.anatomy a ON a.id = ca.anatomy
LEFT JOIN (
  SELECT collection_local_id, min(biosample_local_id) AS biosample_id
  FROM src.biosample_in_collection
  GROUP BY 1
) bic ON bic.collection_local_id = c.local_id
LEFT JOIN biosamples b ON b.biosample_id = bic.biosample_id;

-- ponytail: a file in several collections keeps the min one (99.96% are in
-- exactly one).
-- species and anatomy are copied down onto files, so the commonest questions
-- ("files by species") need no join. species is ENCODE's own per-file organism
-- where it has one: a pooled biosample's min subject is the wrong species for
-- ~11% of ENCODE files, so it is also more accurate than joining to Subjects.
CREATE OR REPLACE TABLE files AS
SELECT
  f.local_id AS file_id,
  NULLIF(f.accession_id, '') AS accession,
  NULLIF(f.filename, '') AS filename,
  upper(f.submission) AS dcc,
  ff.name AS file_format,
  dt.name AS data_type,
  aty.name AS assay,
  NULLIF(f.output_type, '') AS output_type,
  NULLIF(f.genome_assembly, '') AS genome_assembly,
  NULLIF(f.status, '') AS status,
  f.size_in_bytes / 1e9 AS size_gb,
  year(f.creation_time)::INTEGER AS created_year,
  coalesce(NULLIF(x.organism, ''), s.species) AS species,
  c.anatomy,
  fic.collection_id,
  c.biosample_id,
  c.subject_id
FROM src.file f
LEFT JOIN src.file_format ff ON ff.id = f.file_format
LEFT JOIN src.data_type dt ON dt.id = f.data_type
LEFT JOIN src.assay_type aty ON aty.id = f.assay_type
LEFT JOIN src.file_extra_encode x ON x.local_id = f.local_id
LEFT JOIN (
  SELECT file_local_id, min(collection_local_id) AS collection_id
  FROM src.file_in_collection
  GROUP BY 1
) fic ON fic.file_local_id = f.local_id
LEFT JOIN collections c ON c.collection_id = fic.collection_id
LEFT JOIN subjects s ON s.subject_id = c.subject_id;

-- HallBook: One cover image per hall
-- Migration: 20261112_hall_image_unique_cover
--
-- Enforces at most one isCover=true image per hall.
-- Safe to rerun when the expected index already exists.
-- Review existing indexes before production execution.

BEGIN;

SET LOCAL lock_timeout = '10s';

LOCK TABLE "public"."hallImage" IN SHARE MODE;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM "public"."hallImage"
        WHERE "isCover" = true
        GROUP BY "hallId"
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION
            'Duplicate gallery cover images found';
    END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS
    "hallImage_one_cover_per_hall"
ON "public"."hallImage" ("hallId")
WHERE "isCover" = true;

DO $$
DECLARE
    index_is_valid boolean;
BEGIN
    SELECT
        i.indisunique
        AND i.indisvalid
        AND i.indisready
        AND i.indnkeyatts = 1
        AND i.indnatts = 1
        AND am.amname = 'btree'
        AND pg_get_indexdef(i.indexrelid, 1, true) = '"hallId"'
        AND regexp_replace(
            lower(pg_get_expr(i.indpred, i.indrelid)),
            '[()"\s]',
            '',
            'g'
        ) IN ('iscover', 'iscover=true', 'true=iscover')
    INTO index_is_valid
    FROM pg_index i
    JOIN pg_class idx ON idx.oid = i.indexrelid
    JOIN pg_namespace ns ON ns.oid = idx.relnamespace
    JOIN pg_am am ON am.oid = idx.relam
    WHERE ns.nspname = 'public'
      AND idx.relname = 'hallImage_one_cover_per_hall'
      AND i.indrelid = 'public."hallImage"'::regclass;

    IF index_is_valid IS DISTINCT FROM true THEN
        RAISE EXCEPTION 'INDEX_DEFINITION_INVALID';
    END IF;
END;
$$;

COMMIT;

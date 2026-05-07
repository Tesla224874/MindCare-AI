-- MindCare.AI local PostgreSQL bootstrap.
-- Run this as a PostgreSQL superuser, usually:
-- psql -U postgres -f packages/database/prisma/init-db.sql

DO
$do$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_catalog.pg_roles
    WHERE rolname = 'mindcare'
  ) THEN
    CREATE ROLE mindcare LOGIN PASSWORD 'mindcare';
  ELSE
    ALTER ROLE mindcare WITH LOGIN PASSWORD 'mindcare';
  END IF;
END
$do$;

SELECT 'CREATE DATABASE mindcare_ai OWNER mindcare'
WHERE NOT EXISTS (
  SELECT FROM pg_database WHERE datname = 'mindcare_ai'
)\gexec

GRANT ALL PRIVILEGES ON DATABASE mindcare_ai TO mindcare;

\connect mindcare_ai

CREATE SCHEMA IF NOT EXISTS public;
ALTER SCHEMA public OWNER TO mindcare;
GRANT ALL ON SCHEMA public TO mindcare;

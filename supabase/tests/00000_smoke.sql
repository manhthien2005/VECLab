BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

SELECT plan(3);

SELECT has_table('public', 'profiles', 'Table public.profiles should exist');
SELECT has_table('public', 'attempts', 'Table public.attempts should exist');
SELECT has_table('public', 'attempt_events', 'Table public.attempt_events should exist');

SELECT * FROM finish();

ROLLBACK;

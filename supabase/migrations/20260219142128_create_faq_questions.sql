/*
  # Create faq_questions table

  ## Summary
  Stores questions submitted by website visitors via the FAQ popup form.

  ## New Tables
  - `faq_questions`
    - `id` (uuid, primary key) — unique row identifier
    - `name` (text) — submitter's full name, required
    - `email` (text) — submitter's email address, required
    - `phone` (text, nullable) — optional phone number
    - `message` (text) — the question/message body, required
    - `created_at` (timestamptz) — submission timestamp, defaults to now()

  ## Security
  - RLS enabled
  - INSERT allowed for anonymous users (public form submission)
  - SELECT restricted to service role only (no client-side reads)
*/

CREATE TABLE IF NOT EXISTS faq_questions (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL DEFAULT '',
  email      text        NOT NULL DEFAULT '',
  phone      text,
  message    text        NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE faq_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a faq question"
  ON faq_questions
  FOR INSERT
  TO anon
  WITH CHECK (
    length(trim(name))    > 0 AND
    length(trim(email))   > 0 AND
    length(trim(message)) > 0
  );

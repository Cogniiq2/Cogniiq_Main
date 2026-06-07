CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text,
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'open',
  due_date date,
  due_time time,
  money_impact numeric,
  related_lead_id text,
  related_client_id text,
  source text,
  reason text,
  task_key text,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_tasks" ON public.tasks
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "insert_tasks" ON public.tasks
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "update_tasks" ON public.tasks
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "delete_tasks" ON public.tasks
  FOR DELETE TO anon, authenticated USING (true);

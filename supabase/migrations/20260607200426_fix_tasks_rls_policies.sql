DO $$
BEGIN
  -- Drop any existing policies first to avoid conflicts
  DROP POLICY IF EXISTS "select_tasks" ON public.tasks;
  DROP POLICY IF EXISTS "insert_tasks" ON public.tasks;
  DROP POLICY IF EXISTS "update_tasks" ON public.tasks;
  DROP POLICY IF EXISTS "delete_tasks" ON public.tasks;
END $$;

CREATE POLICY "select_tasks" ON public.tasks
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "insert_tasks" ON public.tasks
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "update_tasks" ON public.tasks
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "delete_tasks" ON public.tasks
  FOR DELETE TO anon, authenticated USING (true);

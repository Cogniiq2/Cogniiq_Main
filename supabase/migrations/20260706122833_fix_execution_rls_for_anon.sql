-- Drop existing policies
DROP POLICY IF EXISTS execution_days_all ON execution_days;
DROP POLICY IF EXISTS execution_tasks_all ON execution_tasks;

-- Create new policies allowing both anon and authenticated
CREATE POLICY "execution_days_all" ON execution_days
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "execution_tasks_all" ON execution_tasks
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);
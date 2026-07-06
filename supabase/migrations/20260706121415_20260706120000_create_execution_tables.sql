-- Execution OS tables for daily planning

CREATE TABLE execution_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_date date UNIQUE NOT NULL,
  title text NOT NULL DEFAULT 'Daily Execution Plan',
  plan_type text DEFAULT 'standard', -- focus_day, revenue_day, admin_day, standard
  total_points integer DEFAULT 0,
  completed_points integer DEFAULT 0,
  score_percent numeric(5,2) DEFAULT 0.00,
  total_tasks integer DEFAULT 0,
  completed_tasks integer DEFAULT 0,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE execution_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_day_id uuid NOT NULL REFERENCES execution_days(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category text DEFAULT 'general',
  priority text DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  points integer DEFAULT 1,
  is_non_negotiable boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  planned_start time,
  planned_end time,
  is_completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_execution_tasks_day ON execution_tasks(execution_day_id);
CREATE INDEX idx_execution_tasks_sort ON execution_tasks(execution_day_id, sort_order);
CREATE INDEX idx_execution_days_date ON execution_days(plan_date);

-- Enable RLS
ALTER TABLE execution_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE execution_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow all for authenticated users - admin only)
CREATE POLICY "execution_days_all" ON execution_days FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "execution_tasks_all" ON execution_tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Function to recalculate execution_day stats
CREATE OR REPLACE FUNCTION recalc_execution_day_stats(day_id uuid)
RETURNS void AS $$
DECLARE
  rec record;
BEGIN
  SELECT 
    COALESCE(SUM(points), 0) AS total_points,
    COALESCE(SUM(points) FILTER (WHERE is_completed), 0) AS completed_points,
    COUNT(*) AS total_tasks,
    COUNT(*) FILTER (WHERE is_completed) AS completed_tasks
  INTO rec
  FROM execution_tasks
  WHERE execution_day_id = day_id;

  UPDATE execution_days
  SET 
    total_points = rec.total_points,
    completed_points = rec.completed_points,
    total_tasks = rec.total_tasks,
    completed_tasks = rec.completed_tasks,
    score_percent = CASE WHEN rec.total_points > 0 THEN ROUND((rec.completed_points::numeric / rec.total_points) * 100, 2) ELSE 0 END,
    status = CASE 
      WHEN rec.completed_tasks = rec.total_tasks AND rec.total_tasks > 0 THEN 'completed'
      WHEN rec.completed_tasks > 0 THEN 'in_progress'
      ELSE 'pending'
    END,
    updated_at = now()
  WHERE id = day_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger on execution_tasks changes
CREATE OR REPLACE FUNCTION trigger_recalc_execution_day()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
    PERFORM recalc_execution_day_stats(
      COALESCE(NEW.execution_day_id, OLD.execution_day_id)
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_execution_tasks_recalc
AFTER INSERT OR UPDATE OR DELETE ON execution_tasks
FOR EACH ROW EXECUTE FUNCTION trigger_recalc_execution_day();

-- RPC: Generate daily execution plan
CREATE OR REPLACE FUNCTION generate_daily_execution_plan(target_date date)
RETURNS uuid AS $$
DECLARE
  day_id uuid;
  dow integer;
  day_name text;
BEGIN
  -- Check if day already exists
  SELECT id INTO day_id FROM execution_days WHERE plan_date = target_date;
  IF day_id IS NOT NULL THEN
    RETURN day_id;
  END IF;

  dow := EXTRACT(DOW FROM target_date);
  day_name := CASE dow
    WHEN 0 THEN 'Sunday'
    WHEN 1 THEN 'Monday'
    WHEN 2 THEN 'Tuesday'
    WHEN 3 THEN 'Wednesday'
    WHEN 4 THEN 'Thursday'
    WHEN 5 THEN 'Friday'
    WHEN 6 THEN 'Saturday'
  END;

  -- Create execution_day
  INSERT INTO execution_days (plan_date, title, plan_type)
  VALUES (target_date, 'Execution Plan — ' || day_name || ', ' || to_char(target_date, 'YYYY-MM-DD'), 
    CASE 
      WHEN dow IN (1, 3, 5) THEN 'focus_day'
      WHEN dow IN (2, 4) THEN 'revenue_day'
      WHEN dow = 0 OR dow = 6 THEN 'admin_day'
      ELSE 'standard'
    END
  )
  RETURNING id INTO day_id;

  -- Create default execution tasks (morning routine + core work)
  INSERT INTO execution_tasks (execution_day_id, title, description, category, priority, points, is_non_negotiable, sort_order, planned_start, planned_end)
  VALUES 
    (day_id, 'Morning Review', 'Review today''s priorities and yesterday''s outcomes', 'planning', 'high', 2, true, 1, '06:00', '06:30'),
    (day_id, 'Deep Work Block 1', 'Primary focus task — no interruptions', 'focus', 'critical', 5, true, 2, '07:00', '09:30'),
    (day_id, 'Email & Admin Clear', 'Process inbox and administrative tasks', 'admin', 'medium', 2, false, 3, '10:00', '11:00'),
    (day_id, 'Revenue Activity', 'Lead generation or sales follow-up', 'revenue', 'high', 4, true, 4, '11:00', '12:00'),
    (day_id, 'Deep Work Block 2', 'Secondary focus or project work', 'focus', 'high', 4, false, 5, '13:30', '15:30'),
    (day_id, 'Client Deliverables', 'Work on active client commitments', 'delivery', 'high', 3, false, 6, '15:30', '17:00'),
    (day_id, 'End-of-Day Closeout', 'Plan tomorrow, close open loops, document progress', 'planning', 'medium', 2, true, 7, '17:30', '18:00');

  RETURN day_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
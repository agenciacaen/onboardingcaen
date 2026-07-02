-- Track Rotina Module
-- Colunas da tabela (ex: "Dia 1", "Dia 2", "Sprint 1", etc.)
CREATE TABLE IF NOT EXISTS track_routine_columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  "order" INTEGER DEFAULT 0,
  color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Linhas da tabela (ex: "Revisar relatório", "Postar carrossel", etc.)
CREATE TABLE IF NOT EXISTS track_routine_rows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Checks (célula = interseção linha x coluna)
CREATE TABLE IF NOT EXISTS track_routine_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  column_id UUID NOT NULL REFERENCES track_routine_columns(id) ON DELETE CASCADE,
  row_id UUID NOT NULL REFERENCES track_routine_rows(id) ON DELETE CASCADE,
  checked BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(column_id, row_id)
);

ALTER TABLE track_routine_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE track_routine_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE track_routine_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage track columns"
  ON track_routine_columns FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'member')));

CREATE POLICY "Admins can manage track rows"
  ON track_routine_rows FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'member')));

CREATE POLICY "Admins can manage track checks"
  ON track_routine_checks FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'member')));

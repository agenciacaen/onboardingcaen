-- 1. Tabela de Contas Conectadas
CREATE TABLE IF NOT EXISTS meta_ad_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  ad_account_id TEXT NOT NULL,          -- ex: "act_123456789"
  ad_account_name TEXT,
  connected_by UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'disconnected')),
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, ad_account_id)
);

-- 2. Alteração na Tabela de Campanhas (Mapeamento de Fonte)
-- Adiciona campos para referenciar a origem dos dados
ALTER TABLE traffic_campaigns ADD COLUMN IF NOT EXISTS meta_account_id UUID REFERENCES meta_ad_accounts(id) ON DELETE SET NULL;
ALTER TABLE traffic_campaigns ADD COLUMN IF NOT EXISTS meta_campaign_id TEXT;
ALTER TABLE traffic_campaigns ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'meta', 'google', 'tiktok'));

-- 3. Habilitar RLS (Row Level Security) - Policies
ALTER TABLE meta_ad_accounts ENABLE ROW LEVEL SECURITY;

-- Agência (Admin/Members) pode ver e gerenciar todas
CREATE POLICY "Admins can view all meta accounts"
  ON meta_ad_accounts FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'member')));

CREATE POLICY "Admins can insert meta accounts"
  ON meta_ad_accounts FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'member')));

CREATE POLICY "Admins can update meta accounts"
  ON meta_ad_accounts FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'member')));

CREATE POLICY "Admins can delete meta accounts"
  ON meta_ad_accounts FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'member')));

-- Cliente só pode ver as suas próprias contas vinculadas (se precisar consultar)
CREATE POLICY "Clients can view their own meta accounts"
  ON meta_ad_accounts FOR SELECT
  USING (client_id = auth.uid());

-- Triggers para updated_at (opcional, assume que o moddatetime está ativo)
CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA extensions;

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON meta_ad_accounts
  FOR EACH ROW EXECUTE FUNCTION moddatetime (updated_at);

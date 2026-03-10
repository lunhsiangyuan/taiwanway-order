-- TaiwanWay 團購系統 — 初始 Schema
-- 三張表：orders、campaigns、campaign_entries

-- ============ Orders ============
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  pickup_time TEXT NOT NULL,
  note TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'ready', 'completed', 'cancelled')),
  payment_method TEXT
    CHECK (payment_method IS NULL OR payment_method IN ('zelle', 'venmo', 'cash')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_status ON orders (status);
CREATE INDEX idx_orders_created_at ON orders (created_at DESC);

-- ============ Campaigns ============
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title JSONB NOT NULL DEFAULT '{}',
  description JSONB NOT NULL DEFAULT '{}',
  image TEXT,
  unit_price NUMERIC(10, 2) NOT NULL,
  min_quantity INTEGER NOT NULL DEFAULT 1,
  max_quantity INTEGER,
  deadline TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'reached', 'closed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_campaigns_status ON campaigns (status);

-- ============ Campaign Entries ============
CREATE TABLE campaign_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  note TEXT,
  status TEXT NOT NULL DEFAULT 'joined'
    CHECK (status IN ('joined', 'confirmed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_campaign_entries_campaign ON campaign_entries (campaign_id);

-- ============ Row Level Security ============
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_entries ENABLE ROW LEVEL SECURITY;

-- anon 可以新增訂單和團購報名
CREATE POLICY "anon_insert_orders" ON orders
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon_insert_entries" ON campaign_entries
  FOR INSERT TO anon WITH CHECK (true);

-- anon 可以查看進行中的活動
CREATE POLICY "anon_read_campaigns" ON campaigns
  FOR SELECT TO anon USING (status IN ('active', 'reached'));

-- anon 可以讀取活動報名（用於計算進度）
CREATE POLICY "anon_read_entries" ON campaign_entries
  FOR SELECT TO anon USING (true);

-- service_role 全權限（預設已有，不需額外設定）

-- ============ Realtime（Phase 2 用） ============
-- ALTER PUBLICATION supabase_realtime ADD TABLE campaign_entries;

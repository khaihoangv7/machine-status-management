-- ============================================
-- PC Monitor Pro - Supabase Database Schema
-- ============================================
-- Chay SQL nay trong Supabase SQL Editor:
-- 1. Dang nhap Supabase Dashboard
-- 2. Vao SQL Editor
-- 3. Paste va chay toan bo code nay

-- Tao bang metrics
CREATE TABLE IF NOT EXISTS metrics (
    id BIGSERIAL PRIMARY KEY,
    
    -- Thong tin may
    computer_name VARCHAR(100) NOT NULL,
    local_ip VARCHAR(50),
    os VARCHAR(200),
    
    -- Thoi gian
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    date_only DATE DEFAULT CURRENT_DATE,  -- De dem records theo ngay
    
    -- System metrics
    uptime_hours DECIMAL(10,2) DEFAULT 0,
    num_processes INTEGER DEFAULT 0,
    cpu_percent DECIMAL(5,2) DEFAULT 0,
    cpu_cores INTEGER DEFAULT 0,
    
    -- RAM
    ram_total_gb DECIMAL(10,3) DEFAULT 0,
    ram_used_gb DECIMAL(10,3) DEFAULT 0,
    ram_percent DECIMAL(5,2) DEFAULT 0,
    
    -- Disk
    disk_total_gb DECIMAL(10,3) DEFAULT 0,
    disk_used_gb DECIMAL(10,3) DEFAULT 0,
    disk_percent DECIMAL(5,2) DEFAULT 0,
    
    -- Swap
    swap_used_gb DECIMAL(10,3) DEFAULT 0,
    
    -- Top processes
    top_ram_1 TEXT,
    top_ram_2 TEXT,
    top_ram_3 TEXT,
    top_ram_4 TEXT,
    top_ram_5 TEXT,
    top_cpu_1 TEXT,
    top_cpu_2 TEXT,
    top_cpu_3 TEXT,
    top_cpu_4 TEXT,
    top_cpu_5 TEXT,
    
    -- AI Analysis
    health_score INTEGER DEFAULT 100,
    error TEXT,
    
    -- Auto timestamp
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tao index de truy van nhanh hon
CREATE INDEX IF NOT EXISTS idx_metrics_computer ON metrics(computer_name);
CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON metrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_computer_time ON metrics(computer_name, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_date ON metrics(computer_name, date_only);

-- Bat Row Level Security (bao mat)
ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;

-- Tao policy cho phep INSERT tu collector
CREATE POLICY "Allow insert from collectors" ON metrics
    FOR INSERT
    WITH CHECK (true);

-- Tao policy cho phep SELECT (doc du lieu)
CREATE POLICY "Allow read for all" ON metrics
    FOR SELECT
    USING (true);

-- Tao policy cho phep DELETE (xoa du lieu cu)
CREATE POLICY "Allow delete old records" ON metrics
    FOR DELETE
    USING (true);

-- ============================================
-- Function tu dong xoa du lieu cu (> 7 ngay)
-- ============================================
CREATE OR REPLACE FUNCTION cleanup_old_metrics()
RETURNS void AS $$
BEGIN
    DELETE FROM metrics
    WHERE timestamp < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- View de lay du lieu moi nhat cua moi may
-- ============================================
CREATE OR REPLACE VIEW latest_metrics AS
SELECT DISTINCT ON (computer_name) *
FROM metrics
ORDER BY computer_name, timestamp DESC;

-- ============================================
-- HOAN TAT!
-- Sau khi chay xong, lay thong tin sau:
-- 1. Project URL: Settings > API > Project URL
-- 2. Anon Key: Settings > API > anon public key
-- ============================================

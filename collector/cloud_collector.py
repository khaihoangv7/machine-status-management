"""
PC Monitor Pro - Cloud Collector v3.0
- Thu thap moi 7 giay (co the thay doi)
- Tu dong xoa khi vuot 20 records/ngay/may
- Toi uu hieu nang cho may yeu
"""
import os
import sys
import time
import json
import platform
import socket
import urllib.request
import urllib.error
from datetime import datetime, timedelta
from pathlib import Path

try:
    import psutil
    HAS_PSUTIL = True
except ImportError:
    HAS_PSUTIL = False

# ============== CONFIGURATION ==============
SUPABASE_URL = "YOUR_SUPABASE_URL"
SUPABASE_KEY = "YOUR_SUPABASE_ANON_KEY"

COLLECT_INTERVAL = 7      # Thu thap moi 7 giay
MAX_RECORDS_PER_DAY = 20  # Toi da 20 records/ngay/may
TOP_N = 5                 # Top 5 processes
KEEP_DAYS = 3             # Chi giu 3 ngay gan nhat

# ============== LOAD CONFIG ==============

def get_exe_dir():
    """Lay thu muc chua file exe hoac py"""
    if getattr(sys, 'frozen', False):
        # Dang chay tu exe (PyInstaller)
        return os.path.dirname(sys.executable)
    else:
        # Dang chay tu .py
        return os.path.dirname(os.path.abspath(__file__))

def load_config():
    global SUPABASE_URL, SUPABASE_KEY, COLLECT_INTERVAL, MAX_RECORDS_PER_DAY
    
    exe_dir = get_exe_dir()
    config_path = os.path.join(exe_dir, "config.json")
    
    if os.path.exists(config_path):
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                config = json.load(f)
                SUPABASE_URL = config.get('SUPABASE_URL', SUPABASE_URL)
                SUPABASE_KEY = config.get('SUPABASE_KEY', SUPABASE_KEY)
                COLLECT_INTERVAL = config.get('COLLECT_INTERVAL', COLLECT_INTERVAL)
                MAX_RECORDS_PER_DAY = config.get('MAX_RECORDS_PER_DAY', MAX_RECORDS_PER_DAY)
                print(f"[OK] Config: interval={COLLECT_INTERVAL}s, max={MAX_RECORDS_PER_DAY}/day")
        except Exception as e:
            print(f"[WARN] Config error: {e}")
    else:
        print(f"[WARN] Config not found: {config_path}")

# ============== HELPERS ==============

def safe_hostname():
    name = platform.node() or socket.gethostname() or "UNKNOWN"
    return "".join(ch for ch in name if ch.isalnum() or ch in ("-", "_", "."))[:50]

def get_windows_version():
    """Detect Windows 11 correctly"""
    try:
        ver = platform.version()  # VD: 10.0.22631
        build = int(ver.split('.')[2]) if len(ver.split('.')) >= 3 else 0
        
        # Windows 11 co build number >= 22000
        if build >= 22000:
            return f"Windows 11 (Build {build})"
        elif os.name == 'nt':
            return f"Windows 10 (Build {build})"
        else:
            return platform.platform()[:100]
    except:
        return platform.platform()[:100]

def bytes_to_gb(b):
    return round(b / (1024 ** 3), 3)

def bytes_to_mb(b):
    return round(b / (1024 ** 2), 1)

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return "unknown"

def get_top_processes(top_n=5):
    if not HAS_PSUTIL:
        return [], []
    
    procs = []
    for p in psutil.process_iter(attrs=["pid", "name"]):
        try:
            procs.append(p)
        except:
            pass
    
    for p in procs:
        try:
            p.cpu_percent(None)
        except:
            pass
    
    time.sleep(0.1)
    
    ram_rows = []
    cpu_rows = []
    
    for p in procs:
        try:
            name = p.info.get("name") or f"pid={p.pid}"
            mem = p.memory_info().rss
            ram_rows.append((mem, name))
            cpu = p.cpu_percent(None)
            cpu_rows.append((cpu, name))
        except:
            pass
    
    ram_rows.sort(key=lambda x: x[0], reverse=True)
    cpu_rows.sort(key=lambda x: x[0], reverse=True)
    
    top_ram = [f"{name} ({bytes_to_mb(mem)} MB)" for mem, name in ram_rows[:top_n]]
    top_cpu = [f"{name} ({round(cpu, 1)}%)" for cpu, name in cpu_rows[:top_n]]
    
    return top_ram, top_cpu

# ============== DATA COLLECTION ==============

def collect_metrics():
    host = safe_hostname()
    now = datetime.utcnow()
    
    data = {
        "computer_name": host,
        "local_ip": get_local_ip(),
        "timestamp": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "date_only": now.strftime("%Y-%m-%d"),
        "os": get_windows_version(),
        "uptime_hours": 0,
        "num_processes": 0,
        "swap_used_gb": 0,
        "cpu_percent": 0,
        "cpu_cores": 0,
        "ram_total_gb": 0,
        "ram_used_gb": 0,
        "ram_percent": 0,
        "disk_total_gb": 0,
        "disk_used_gb": 0,
        "disk_percent": 0,
        "health_score": 100,
    }
    
    if not HAS_PSUTIL:
        data["error"] = "psutil_not_installed"
        return data
    
    try:
        boot_ts = psutil.boot_time()
        data["uptime_hours"] = round((time.time() - boot_ts) / 3600, 2)
        data["num_processes"] = len(psutil.pids())
        
        sm = psutil.swap_memory()
        data["swap_used_gb"] = bytes_to_gb(sm.used)
        
        data["cpu_percent"] = psutil.cpu_percent(interval=0.2)
        data["cpu_cores"] = psutil.cpu_count()
        
        vm = psutil.virtual_memory()
        data["ram_total_gb"] = bytes_to_gb(vm.total)
        data["ram_used_gb"] = bytes_to_gb(vm.used)
        data["ram_percent"] = vm.percent
        
        root = "C:\\" if os.name == "nt" else "/"
        du = psutil.disk_usage(root)
        data["disk_total_gb"] = bytes_to_gb(du.total)
        data["disk_used_gb"] = bytes_to_gb(du.used)
        data["disk_percent"] = du.percent
        
    except Exception as e:
        data["error"] = str(e)[:100]
    
    try:
        top_ram, top_cpu = get_top_processes(TOP_N)
        for i in range(1, TOP_N + 1):
            data[f"top_ram_{i}"] = top_ram[i-1] if i-1 < len(top_ram) else ""
            data[f"top_cpu_{i}"] = top_cpu[i-1] if i-1 < len(top_cpu) else ""
    except:
        pass
    
    cpu = data.get("cpu_percent", 0)
    ram = data.get("ram_percent", 0)
    disk = data.get("disk_percent", 0)
    
    score = 100
    if cpu > 80: score -= min(30, (cpu - 80) * 1.5)
    if ram > 85: score -= min(30, (ram - 85) * 2)
    if disk > 90: score -= min(20, (disk - 90) * 2)
    data["health_score"] = max(0, int(score))
    
    return data

# ============== SUPABASE API ==============

def supabase_get(endpoint):
    if SUPABASE_URL == "YOUR_SUPABASE_URL":
        return None
    
    url = f"{SUPABASE_URL}/rest/v1/{endpoint}"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
    }
    
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except:
        return None

def supabase_post(data):
    if SUPABASE_URL == "YOUR_SUPABASE_URL":
        return False
    
    url = f"{SUPABASE_URL}/rest/v1/metrics"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }
    
    try:
        json_data = json.dumps(data).encode('utf-8')
        req = urllib.request.Request(url, data=json_data, headers=headers, method='POST')
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status in [200, 201]
    except Exception as e:
        return False

def supabase_delete(endpoint):
    if SUPABASE_URL == "YOUR_SUPABASE_URL":
        return False
    
    url = f"{SUPABASE_URL}/rest/v1/{endpoint}"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
    }
    
    try:
        req = urllib.request.Request(url, headers=headers, method='DELETE')
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status in [200, 204]
    except:
        return False

def cleanup_excess_records(computer_name, date_only):
    """Xoa records cu khi vuot qua MAX_RECORDS_PER_DAY"""
    try:
        endpoint = f"metrics?computer_name=eq.{computer_name}&date_only=eq.{date_only}&select=id&order=id.asc"
        records = supabase_get(endpoint)
        
        if not records or len(records) <= MAX_RECORDS_PER_DAY:
            return 0
        
        to_delete = len(records) - MAX_RECORDS_PER_DAY
        deleted = 0
        
        for record in records[:to_delete]:
            record_id = record.get('id')
            if record_id and supabase_delete(f"metrics?id=eq.{record_id}"):
                deleted += 1
        
        return deleted
    except:
        return 0

def cleanup_old_days(computer_name):
    """
    Xoa du lieu ngay thu 4 tro di cua MAY HIEN TAI
    Chi giu lai 3 ngay gan nhat
    """
    try:
        # Lay danh sach cac ngay co du lieu cua may nay
        endpoint = f"metrics?computer_name=eq.{computer_name}&select=date_only&order=date_only.desc"
        records = supabase_get(endpoint)
        
        if not records:
            return 0
        
        # Lay danh sach ngay duy nhat
        unique_days = []
        for r in records:
            day = r.get('date_only')
            if day and day not in unique_days:
                unique_days.append(day)
        
        # Neu co nhieu hon 3 ngay, xoa cac ngay cu
        if len(unique_days) <= KEEP_DAYS:
            return 0
        
        # Cac ngay can xoa (tu ngay thu 4 tro di)
        days_to_delete = unique_days[KEEP_DAYS:]
        deleted = 0
        
        for day in days_to_delete:
            if supabase_delete(f"metrics?computer_name=eq.{computer_name}&date_only=eq.{day}"):
                deleted += 1
                print(f"[CLEANUP] Deleted data for {day} (keeping only {KEEP_DAYS} days)")
        
        return deleted
        
    except Exception as e:
        return 0

# ============== MAIN ==============

def run_collector():
    load_config()
    
    host = safe_hostname()
    
    print("=" * 55)
    print("  PC Monitor Pro - Cloud Collector v3.0")
    print("=" * 55)
    print(f"  Computer    : {host}")
    print(f"  Local IP    : {get_local_ip()}")
    print(f"  Interval    : {COLLECT_INTERVAL} seconds")
    print(f"  Max records : {MAX_RECORDS_PER_DAY}/day")
    print(f"  Keep days   : {KEEP_DAYS} (auto-delete day 4+)")
    print("=" * 55)
    
    if SUPABASE_URL == "YOUR_SUPABASE_URL":
        print("\n[ERROR] Chua cau hinh Supabase!")
        # Khong dung input() vi khi chay ngam khong co stdin
        sys.exit(1)
    
    cycle = 0
    
    while True:
        try:
            start = time.time()
            
            data = collect_metrics()
            success = supabase_post(data)
            
            ms = int((time.time() - start) * 1000)
            status = "OK" if success else "FAIL"
            print(f"[{status}] {data['timestamp'][:19]} | CPU:{data['cpu_percent']:5.1f}% | RAM:{data['ram_percent']:5.1f}% | Health:{data['health_score']:3d} | {ms}ms")
            
            cycle += 1
            if cycle >= 10:
                deleted = cleanup_excess_records(host, data['date_only'])
                if deleted > 0:
                    print(f"[CLEANUP] Deleted {deleted} old records (keeping {MAX_RECORDS_PER_DAY}/day)")
                cycle = 0
            
            # Cleanup old days moi 50 cycles (~6 phut)
            if cycle == 5:
                cleanup_old_days(host)
                
        except Exception as e:
            print(f"[ERROR] {e}")
        
        elapsed = time.time() - start
        time.sleep(max(0.1, COLLECT_INTERVAL - elapsed))

if __name__ == "__main__":
    run_collector()

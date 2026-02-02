"""
PC Monitor Pro - Cloud Dashboard v3.0
- Reads data from Supabase and displays on web
- Alert history with disk spike detection
- Can be deployed to Vercel/Render or run locally
"""
import os
import json
import urllib.request
import urllib.error
from datetime import datetime, timedelta
from flask import Flask, render_template, jsonify

app = Flask(__name__)

# ============== CONFIGURATION ==============
SUPABASE_URL = os.environ.get('SUPABASE_URL', 'YOUR_SUPABASE_URL')
SUPABASE_KEY = os.environ.get('SUPABASE_KEY', 'YOUR_SUPABASE_ANON_KEY')

# Alert history (in-memory, reset when server restarts)
alert_history = []
MAX_ALERT_HISTORY = 50

def load_config():
    """Load config from file if env vars not set"""
    global SUPABASE_URL, SUPABASE_KEY
    
    if SUPABASE_URL == 'YOUR_SUPABASE_URL':
        config_path = os.path.join(os.path.dirname(__file__), '..', 'collector', 'config.json')
        if os.path.exists(config_path):
            with open(config_path, 'r') as f:
                config = json.load(f)
                SUPABASE_URL = config.get('SUPABASE_URL', SUPABASE_URL)
                SUPABASE_KEY = config.get('SUPABASE_KEY', SUPABASE_KEY)

load_config()

# ============== SUPABASE API ==============

def supabase_request(endpoint, method='GET', params=None):
    """Make request to Supabase REST API"""
    if SUPABASE_URL == 'YOUR_SUPABASE_URL':
        return None
    
    url = f"{SUPABASE_URL}/rest/v1/{endpoint}"
    if params:
        url += '?' + '&'.join(f"{k}={v}" for k, v in params.items())
    
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }
    
    try:
        req = urllib.request.Request(url, headers=headers, method=method)
        with urllib.request.urlopen(req, timeout=10) as response:
            return json.loads(response.read().decode('utf-8'))
    except Exception as e:
        print(f"Supabase error: {e}")
        return None

def add_alert(computer_name, alert_type, message, severity='warning'):
    """Add alert to history"""
    global alert_history
    
    alert = {
        'id': len(alert_history) + 1,
        'computer_name': computer_name,
        'type': alert_type,
        'message': message,
        'severity': severity,
        'timestamp': datetime.utcnow().isoformat() + 'Z'
    }
    
    # Check if same alert exists in last 5 minutes (avoid duplicates)
    for existing in alert_history[-10:]:
        if (existing['computer_name'] == computer_name and 
            existing['type'] == alert_type and
            existing['message'] == message):
            return
    
    alert_history.append(alert)
    
    # Keep only last MAX_ALERT_HISTORY alerts
    if len(alert_history) > MAX_ALERT_HISTORY:
        alert_history = alert_history[-MAX_ALERT_HISTORY:]

def analyze_disk_trend(history):
    """
    Analyze disk usage trend from history (20 records)
    Returns: (is_increasing_fast, increase_rate)
    """
    if not history or len(history) < 3:
        return False, 0
    
    disk_values = []
    for record in history:
        disk = record.get('disk_percent')
        if disk is not None:
            disk_values.append(float(disk))
    
    if len(disk_values) < 3:
        return False, 0
    
    # Compare oldest vs newest
    oldest = disk_values[-1]  # history is sorted desc, so last is oldest
    newest = disk_values[0]
    
    increase = newest - oldest
    
    # Alert if increased more than 5% in recent records
    if increase > 5:
        return True, round(increase, 1)
    
    return False, round(increase, 1)

def get_all_machines():
    """Get all machines with latest data and analyze trends"""
    # Get latest 200 records (to have history for each machine)
    data = supabase_request('metrics', params={
        'select': '*',
        'order': 'timestamp.desc',
        'limit': '200'
    })
    
    if not data:
        return {}
    
    machines = {}
    for row in data:
        name = row.get('computer_name')
        if not name:
            continue
        
        if name not in machines:
            health = row.get('health_score', 0)
            try:
                last_update = datetime.fromisoformat(row['timestamp'].replace('Z', '+00:00'))
                now = datetime.now(last_update.tzinfo) if last_update.tzinfo else datetime.utcnow()
                is_online = (now - last_update.replace(tzinfo=None)).total_seconds() < 300
            except:
                is_online = False
            
            if not is_online:
                status = 'offline'
            elif health < 50:
                status = 'warning'
            else:
                status = 'online'
            
            machines[name] = {
                'name': name,
                'latest': row,
                'history': [row],
                'ai_analysis': {
                    'health_score': health,
                    'status': status,
                    'anomalies': [],
                    'critical_count': 0,
                    'warning_count': 0,
                    'disk_trend': None
                }
            }
        else:
            if len(machines[name]['history']) < 20:
                machines[name]['history'].append(row)
    
    # Analyze each machine
    for name, machine in machines.items():
        anomalies = get_anomalies(machine['latest'], machine['history'])
        machine['ai_analysis']['anomalies'] = anomalies
        
        for a in anomalies:
            if a.get('severity') == 'critical':
                machine['ai_analysis']['critical_count'] += 1
                add_alert(name, a['type'], a['message'], 'critical')
            elif a.get('severity') == 'warning':
                machine['ai_analysis']['warning_count'] += 1
                add_alert(name, a['type'], a['message'], 'warning')
    
    return machines

def get_anomalies(metrics, history=None):
    """Anomaly detection with disk trend analysis"""
    anomalies = []
    
    cpu = float(metrics.get('cpu_percent', 0))
    ram = float(metrics.get('ram_percent', 0))
    disk = float(metrics.get('disk_percent', 0))
    
    # CPU checks
    if cpu > 90:
        anomalies.append({
            'type': 'cpu_critical',
            'metric': 'cpu_percent',
            'value': cpu,
            'severity': 'critical',
            'message': f'CPU quá cao: {cpu}%'
        })
    elif cpu > 80:
        anomalies.append({
            'type': 'cpu_warning',
            'metric': 'cpu_percent',
            'value': cpu,
            'severity': 'warning',
            'message': f'CPU cao: {cpu}%'
        })
    
    # RAM checks
    if ram > 95:
        anomalies.append({
            'type': 'ram_critical',
            'metric': 'ram_percent',
            'value': ram,
            'severity': 'critical',
            'message': f'RAM quá cao: {ram}%'
        })
    elif ram > 85:
        anomalies.append({
            'type': 'ram_warning',
            'metric': 'ram_percent',
            'value': ram,
            'severity': 'warning',
            'message': f'RAM cao: {ram}%'
        })
    
    # Disk checks - threshold
    if disk > 98:
        anomalies.append({
            'type': 'disk_critical',
            'metric': 'disk_percent',
            'value': disk,
            'severity': 'critical',
            'message': f'Ổ đĩa đầy: {disk}%'
        })
    elif disk > 90:
        anomalies.append({
            'type': 'disk_warning',
            'metric': 'disk_percent',
            'value': disk,
            'severity': 'warning',
            'message': f'Ổ đĩa sắp đầy: {disk}%'
        })
    
    # Disk trend analysis (check if increasing fast)
    if history:
        is_fast, increase_rate = analyze_disk_trend(history)
        if is_fast and disk > 80:
            anomalies.append({
                'type': 'disk_increasing',
                'metric': 'disk_trend',
                'value': increase_rate,
                'severity': 'warning',
                'message': f'Ổ đĩa tăng nhanh: +{increase_rate}% gần đây, hiện tại {disk}%'
            })
    
    return anomalies

# ============== ROUTES ==============

@app.route('/')
def index():
    return render_template('dashboard.html')

@app.route('/api/all-machines')
def api_all_machines():
    machines = get_all_machines()
    
    total_alerts = sum(
        m['ai_analysis']['critical_count'] + m['ai_analysis']['warning_count']
        for m in machines.values()
    )
    
    return jsonify({
        'machines': machines,
        'total_alerts': total_alerts,
        'timestamp': datetime.utcnow().isoformat()
    })

@app.route('/api/alerts')
def api_alerts():
    """Get alert history"""
    # Return alerts sorted by newest first
    sorted_alerts = sorted(alert_history, key=lambda x: x['timestamp'], reverse=True)
    return jsonify({
        'alerts': sorted_alerts[:30],  # Return last 30 alerts
        'total': len(alert_history)
    })

@app.route('/api/health')
def api_health():
    machines = get_all_machines()
    
    summary = {
        'total': len(machines),
        'online': 0,
        'warning': 0,
        'offline': 0,
        'avg_cpu': 0,
        'avg_ram': 0
    }
    
    cpu_sum = ram_sum = 0
    online_count = 0
    
    for m in machines.values():
        status = m['ai_analysis'].get('status', 'offline')
        summary[status] = summary.get(status, 0) + 1
        
        if status != 'offline':
            cpu_sum += float(m['latest'].get('cpu_percent', 0))
            ram_sum += float(m['latest'].get('ram_percent', 0))
            online_count += 1
    
    if online_count > 0:
        summary['avg_cpu'] = round(cpu_sum / online_count, 1)
        summary['avg_ram'] = round(ram_sum / online_count, 1)
    
    return jsonify(summary)

@app.route('/api/status')
def api_status():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'supabase_configured': SUPABASE_URL != 'YOUR_SUPABASE_URL',
        'timestamp': datetime.utcnow().isoformat()
    })

# ============== MAIN ==============

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5555))
    debug = os.environ.get('DEBUG', 'false').lower() == 'true'
    
    print("=" * 50)
    print("  PC Monitor Pro - Cloud Dashboard v3.0")
    print("=" * 50)
    print(f"  URL: http://127.0.0.1:{port}")
    print(f"  Supabase: {'Configured' if SUPABASE_URL != 'YOUR_SUPABASE_URL' else 'NOT CONFIGURED!'}")
    print("=" * 50)
    
    import webbrowser
    import threading
    threading.Thread(target=lambda: (
        __import__('time').sleep(1.5),
        webbrowser.open(f'http://127.0.0.1:{port}')
    ), daemon=True).start()
    
    app.run(host='0.0.0.0', port=port, debug=debug)

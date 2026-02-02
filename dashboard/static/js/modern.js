/**
 * PC Fleet Monitor - Modern Dashboard JavaScript v3.0
 * Auto-refresh every 5 seconds
 * Alert history panel
 */

// Global state
let machinesData = {};
let filteredMachines = [];
let selectedMachine = null;
let viewMode = 'grid';
let historyChart = null;
let lastUpdateTime = null;
let alertsData = [];
let alertPanelOpen = false;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    loadAlerts();
    setInterval(loadData, 5000); // Refresh every 5 seconds
    setInterval(loadAlerts, 10000); // Refresh alerts every 10 seconds
    updateLastRefreshTimer();
    setInterval(updateLastRefreshTimer, 1000);
    
    // Close alert panel when clicking outside
    document.addEventListener('click', (e) => {
        const alertPanel = document.getElementById('alertPanel');
        const alertBtn = document.getElementById('alertBtn');
        if (alertPanel && alertPanelOpen && 
            !alertPanel.contains(e.target) && 
            !alertBtn.contains(e.target)) {
            closeAlertPanel();
        }
    });
});

// Update "last refresh" display
function updateLastRefreshTimer() {
    const el = document.getElementById('lastRefresh');
    if (el && lastUpdateTime) {
        const seconds = Math.floor((Date.now() - lastUpdateTime) / 1000);
        el.textContent = `${seconds}s ago`;
    }
}

// Load data from API
async function loadData() {
    try {
        const response = await fetch('/api/all-machines');
        const data = await response.json();
        machinesData = data.machines || {};
        lastUpdateTime = Date.now();
        updateDashboard();
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// Load alerts from API
async function loadAlerts() {
    try {
        const response = await fetch('/api/alerts');
        const data = await response.json();
        alertsData = data.alerts || [];
        updateAlertPanel();
    } catch (error) {
        console.error('Error loading alerts:', error);
    }
}

// Toggle alert panel
function toggleAlertPanel() {
    const panel = document.getElementById('alertPanel');
    if (alertPanelOpen) {
        closeAlertPanel();
    } else {
        openAlertPanel();
    }
}

function openAlertPanel() {
    const panel = document.getElementById('alertPanel');
    if (panel) {
        panel.classList.add('open');
        alertPanelOpen = true;
        loadAlerts();
    }
}

function closeAlertPanel() {
    const panel = document.getElementById('alertPanel');
    if (panel) {
        panel.classList.remove('open');
        alertPanelOpen = false;
    }
}

// Update alert panel content
function updateAlertPanel() {
    const container = document.getElementById('alertList');
    if (!container) return;
    
    if (alertsData.length === 0) {
        container.innerHTML = `
            <div class="alert-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                <span>Không có cảnh báo nào</span>
            </div>
        `;
        return;
    }
    
    container.innerHTML = alertsData.map(alert => `
        <div class="alert-item ${alert.severity}">
            <div class="alert-item-header">
                <span class="alert-machine">${alert.computer_name}</span>
                <span class="alert-time">${getTimeAgo(alert.timestamp)}</span>
            </div>
            <div class="alert-message">${alert.message}</div>
        </div>
    `).join('');
}

// Refresh data
function refreshData() {
    const btn = document.querySelector('.header-btn[onclick="refreshData()"]');
    if (btn) btn.classList.add('refreshing');
    
    loadData().finally(() => {
        if (btn) setTimeout(() => btn.classList.remove('refreshing'), 500);
    });
}

// Update entire dashboard
function updateDashboard() {
    filterDevices();
    updateSummary();
}

// Update summary cards
function updateSummary() {
    const machines = Object.values(machinesData);
    const total = machines.length;
    
    let online = 0, warning = 0, offline = 0;
    let totalCpu = 0, totalRam = 0, onlineCount = 0;
    let alertCount = 0;
    
    machines.forEach(machine => {
        const status = getMachineStatus(machine);
        if (status === 'online') {
            online++;
            onlineCount++;
            totalCpu += parseFloat(machine.latest?.cpu_percent || 0);
            totalRam += parseFloat(machine.latest?.ram_percent || 0);
        } else if (status === 'warning') {
            warning++;
            onlineCount++;
            totalCpu += parseFloat(machine.latest?.cpu_percent || 0);
            totalRam += parseFloat(machine.latest?.ram_percent || 0);
            alertCount++;
        } else {
            offline++;
            alertCount++;
        }
        
        // Count high resource usage as alerts
        const cpu = parseFloat(machine.latest?.cpu_percent || 0);
        const ram = parseFloat(machine.latest?.ram_percent || 0);
        const disk = parseFloat(machine.latest?.disk_percent || 0);
        if (cpu > 80 || ram > 85 || disk > 90) alertCount++;
    });
    
    document.getElementById('totalMachines').textContent = total;
    document.getElementById('onlineMachines').textContent = online;
    document.getElementById('warningMachines').textContent = warning;
    document.getElementById('offlineMachines').textContent = offline;
    document.getElementById('deviceCount').textContent = total;
    
    const avgCpu = onlineCount > 0 ? (totalCpu / onlineCount).toFixed(1) : 0;
    const avgRam = onlineCount > 0 ? (totalRam / onlineCount).toFixed(1) : 0;
    
    document.getElementById('avgCpu').textContent = avgCpu + '%';
    document.getElementById('avgRam').textContent = avgRam + '%';
    
    // Update alert badge
    const alertBadge = document.getElementById('alertBadge');
    alertBadge.textContent = alertCount;
    alertBadge.style.display = alertCount > 0 ? 'flex' : 'none';
}

// Get machine status (with AI analysis if available)
function getMachineStatus(machine) {
    if (!machine.latest) return 'offline';
    
    const lastUpdate = new Date(machine.latest.timestamp);
    const now = new Date();
    const diffMinutes = (now - lastUpdate) / (1000 * 60);
    
    // If last update was more than 2 minutes ago, consider offline (giảm từ 10 xuống 2)
    if (diffMinutes > 2) return 'offline';
    
    // Use AI analysis if available
    if (machine.ai_analysis) {
        const health = machine.ai_analysis.health_score;
        const critical = machine.ai_analysis.critical_count || 0;
        if (critical > 0 || health < 50) return 'warning';
        if (health >= 70) return 'online';
        return 'warning';
    }
    
    // Fallback to threshold check
    const cpu = parseFloat(machine.latest.cpu_percent || 0);
    const ram = parseFloat(machine.latest.ram_percent || 0);
    const disk = parseFloat(machine.latest.disk_percent || 0);
    
    if (cpu > 80 || ram > 85 || disk > 90) return 'warning';
    
    return 'online';
}

// Get AI health info
function getAIHealth(machine) {
    if (!machine.ai_analysis) return { score: 0, status: 'unknown', anomalies: [] };
    return {
        score: machine.ai_analysis.health_score || 0,
        status: machine.ai_analysis.status || 'unknown',
        anomalies: machine.ai_analysis.anomalies || []
    };
}

// Get time ago string with delay warning
function getTimeAgo(timestamp) {
    if (!timestamp) return 'Unknown';
    
    const lastUpdate = new Date(timestamp);
    const now = new Date();
    const diffMs = now - lastUpdate;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    // Hiển thị theo giây nếu dưới 2 phút
    if (diffSeconds < 10) return 'Vừa xong';
    if (diffSeconds < 60) return `${diffSeconds}s trước`;
    if (diffMinutes < 2) return `${diffMinutes}p ${diffSeconds % 60}s trước`;
    if (diffMinutes < 60) return `${diffMinutes} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return `${diffDays} ngày trước`;
}

// Check if machine has delay (> 30 seconds)
function hasDelay(timestamp) {
    if (!timestamp) return true;
    const lastUpdate = new Date(timestamp);
    const now = new Date();
    return (now - lastUpdate) > 30000; // 30 seconds
}

// Filter devices
function filterDevices() {
    const searchQuery = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    
    const machines = Object.entries(machinesData);
    
    filteredMachines = machines.filter(([name, machine]) => {
        // Search filter
        const matchSearch = name.toLowerCase().includes(searchQuery) ||
                          (machine.latest?.os || '').toLowerCase().includes(searchQuery);
        
        // Status filter
        const status = getMachineStatus(machine);
        const matchStatus = statusFilter === 'all' || status === statusFilter;
        
        return matchSearch && matchStatus;
    });
    
    renderDevices();
}

// Render devices based on view mode
function renderDevices() {
    if (viewMode === 'grid') {
        renderGridView();
        document.getElementById('devicesGrid').style.display = 'block';
        document.getElementById('devicesTable').style.display = 'none';
    } else {
        renderTableView();
        document.getElementById('devicesGrid').style.display = 'none';
        document.getElementById('devicesTable').style.display = 'block';
    }
    
    // Show/hide empty state
    const emptyState = document.getElementById('emptyState');
    if (filteredMachines.length === 0) {
        emptyState.style.display = 'flex';
    } else {
        emptyState.style.display = 'none';
    }
}

// Render grid view
function renderGridView() {
    const container = document.getElementById('devicesList');
    container.innerHTML = '';
    
    filteredMachines.forEach(([name, machine]) => {
        const card = createDeviceCard(name, machine);
        container.appendChild(card);
    });
}

// Create device card
function createDeviceCard(name, machine) {
    const status = getMachineStatus(machine);
    const latest = machine.latest || {};
    const isSelected = selectedMachine === name;
    
    const card = document.createElement('div');
    card.className = `device-card ${status} ${isSelected ? 'selected' : ''}`;
    card.onclick = () => openDetailPanel(name, machine);
    
    const cpu = parseFloat(latest.cpu_percent || 0);
    const ram = parseFloat(latest.ram_percent || 0);
    const disk = parseFloat(latest.disk_percent || 0);
    
    if (status === 'offline') {
        card.innerHTML = `
            <div class="device-card-header">
                <div class="device-info">
                    <div class="device-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                            <line x1="8" y1="21" x2="16" y2="21"/>
                            <line x1="12" y1="17" x2="12" y2="21"/>
                        </svg>
                    </div>
                    <div class="device-details">
                        <div class="device-name">${name}</div>
                        <div class="device-location">${getOSShort(latest.os)}</div>
                    </div>
                </div>
                <span class="status-badge offline">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    Offline
                </span>
            </div>
            <div class="device-offline-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>Offline</span>
                <span>${getTimeAgo(latest.timestamp)}</span>
            </div>
        `;
    } else {
        card.innerHTML = `
            <div class="device-card-header">
                <div class="device-info">
                    <div class="device-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                            <line x1="8" y1="21" x2="16" y2="21"/>
                            <line x1="12" y1="17" x2="12" y2="21"/>
                        </svg>
                    </div>
                    <div class="device-details">
                        <div class="device-name">${name}</div>
                        <div class="device-location">${getOSShort(latest.os)}</div>
                    </div>
                </div>
                <span class="status-badge ${status}">
                    ${status === 'online' ? `
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                            <polyline points="22 4 12 14.01 9 11.01"/>
                        </svg>
                        Online
                    ` : `
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                            <line x1="12" y1="9" x2="12" y2="13"/>
                            <line x1="12" y1="17" x2="12.01" y2="17"/>
                        </svg>
                        Warning
                    `}
                </span>
            </div>
            <div class="device-metrics">
                <div class="device-metric">
                    <div class="device-metric-header">
                        <span class="device-metric-label">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="4" y="4" width="16" height="16" rx="2" ry="2"/>
                                <rect x="9" y="9" width="6" height="6"/>
                            </svg>
                            CPU
                        </span>
                        <span class="device-metric-value ${cpu > 80 ? 'high' : ''}">${cpu.toFixed(1)}%</span>
                    </div>
                    <div class="device-metric-bar">
                        <div class="device-metric-fill cpu ${cpu > 80 ? 'high' : cpu > 60 ? 'warning' : ''}" style="width: ${Math.min(cpu, 100)}%"></div>
                    </div>
                </div>
                <div class="device-metric">
                    <div class="device-metric-header">
                        <span class="device-metric-label">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M6 19v-3M10 19v-3M14 19v-8M18 19V9"/>
                                <rect x="2" y="4" width="20" height="4" rx="1"/>
                            </svg>
                            RAM
                        </span>
                        <span class="device-metric-value ${ram > 85 ? 'high' : ''}">${ram.toFixed(1)}%</span>
                    </div>
                    <div class="device-metric-bar">
                        <div class="device-metric-fill ram ${ram > 85 ? 'high' : ram > 70 ? 'warning' : ''}" style="width: ${Math.min(ram, 100)}%"></div>
                    </div>
                </div>
                <div class="device-metric">
                    <div class="device-metric-header">
                        <span class="device-metric-label">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <ellipse cx="12" cy="5" rx="9" ry="3"/>
                                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
                                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
                            </svg>
                            Disk
                        </span>
                        <span class="device-metric-value ${disk > 90 ? 'high' : ''}">${disk.toFixed(1)}%</span>
                    </div>
                    <div class="device-metric-bar">
                        <div class="device-metric-fill disk ${disk > 90 ? 'high' : disk > 80 ? 'warning' : ''}" style="width: ${Math.min(disk, 100)}%"></div>
                    </div>
                </div>
            </div>
            <div class="device-footer">
                <div class="device-sparkline" id="sparkline-${name.replace(/[^a-zA-Z0-9]/g, '')}"></div>
                <span class="device-lastseen">${getTimeAgo(latest.timestamp)}</span>
            </div>
        `;
        
        // Draw sparkline after card is added
        setTimeout(() => drawSparkline(name, machine), 0);
    }
    
    return card;
}

// Get short OS name
function getOSShort(os) {
    if (!os) return 'Unknown';
    if (os.includes('Windows-10')) return 'Windows 10';
    if (os.includes('Windows-11')) return 'Windows 11';
    if (os.includes('Ubuntu')) return 'Ubuntu Linux';
    if (os.includes('Darwin') || os.includes('macOS')) return 'macOS';
    return os.substring(0, 20);
}

// Draw sparkline
function drawSparkline(name, machine) {
    const containerId = `sparkline-${name.replace(/[^a-zA-Z0-9]/g, '')}`;
    const container = document.getElementById(containerId);
    if (!container || !machine.history || machine.history.length < 2) return;
    
    const data = machine.history.slice(-10).map(h => parseFloat(h.cpu_percent || 0));
    const max = Math.max(...data, 100);
    const min = 0;
    const width = 60;
    const height = 24;
    
    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((val - min) / (max - min)) * height;
        return `${x},${y}`;
    }).join(' ');
    
    container.innerHTML = `
        <svg viewBox="0 0 ${width} ${height}" style="width: 100%; height: 100%;">
            <defs>
                <linearGradient id="sparkGrad-${containerId}" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.3"/>
                    <stop offset="100%" stop-color="#06b6d4" stop-opacity="0"/>
                </linearGradient>
            </defs>
            <polygon points="0,${height} ${points} ${width},${height}" fill="url(#sparkGrad-${containerId})"/>
            <polyline points="${points}" fill="none" stroke="#06b6d4" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    `;
}

// Render table view
function renderTableView() {
    const tbody = document.getElementById('devicesTableBody');
    tbody.innerHTML = '';
    
    filteredMachines.forEach(([name, machine]) => {
        const row = createTableRow(name, machine);
        tbody.appendChild(row);
    });
}

// Create table row
function createTableRow(name, machine) {
    const status = getMachineStatus(machine);
    const latest = machine.latest || {};
    const isSelected = selectedMachine === name;
    
    const cpu = parseFloat(latest.cpu_percent || 0);
    const ram = parseFloat(latest.ram_percent || 0);
    const disk = parseFloat(latest.disk_percent || 0);
    const uptime = parseFloat(latest.uptime_hours || 0);
    
    const row = document.createElement('tr');
    row.className = isSelected ? 'selected' : '';
    row.onclick = () => openDetailPanel(name, machine);
    
    row.innerHTML = `
        <td>
            <div class="table-device-info">
                <div class="table-device-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                        <line x1="8" y1="21" x2="16" y2="21"/>
                        <line x1="12" y1="17" x2="12" y2="21"/>
                    </svg>
                </div>
                <div>
                    <div class="table-device-name">${name}</div>
                    <div class="table-device-os">${getOSShort(latest.os)}</div>
                </div>
            </div>
        </td>
        <td>
            <span class="status-badge ${status}">
                ${status === 'online' ? 'Online' : status === 'warning' ? 'Warning' : 'Offline'}
            </span>
        </td>
        <td>
            <div class="table-metric">
                <span class="table-metric-value ${cpu > 80 ? 'high' : ''}">${cpu.toFixed(1)}%</span>
                <div class="table-metric-bar">
                    <div class="device-metric-fill cpu ${cpu > 80 ? 'high' : ''}" style="width: ${Math.min(cpu, 100)}%"></div>
                </div>
            </div>
        </td>
        <td>
            <div class="table-metric">
                <span class="table-metric-value ${ram > 85 ? 'high' : ''}">${ram.toFixed(1)}%</span>
                <div class="table-metric-bar">
                    <div class="device-metric-fill ram ${ram > 85 ? 'high' : ''}" style="width: ${Math.min(ram, 100)}%"></div>
                </div>
            </div>
        </td>
        <td>
            <div class="table-metric">
                <span class="table-metric-value ${disk > 90 ? 'high' : ''}">${disk.toFixed(1)}%</span>
                <div class="table-metric-bar">
                    <div class="device-metric-fill disk ${disk > 90 ? 'high' : ''}" style="width: ${Math.min(disk, 100)}%"></div>
                </div>
            </div>
        </td>
        <td>${formatUptime(uptime)}</td>
        <td>${getTimeAgo(latest.timestamp)}</td>
    `;
    
    return row;
}

// Format uptime
function formatUptime(hours) {
    if (!hours || hours === 0) return '--';
    const days = Math.floor(hours / 24);
    const hrs = Math.floor(hours % 24);
    if (days > 0) return `${days}d ${hrs}h`;
    return `${hrs}h`;
}

// Set view mode
function setViewMode(mode) {
    viewMode = mode;
    
    document.getElementById('gridViewBtn').classList.toggle('active', mode === 'grid');
    document.getElementById('listViewBtn').classList.toggle('active', mode === 'list');
    
    renderDevices();
}

// Open detail panel
function openDetailPanel(name, machine) {
    selectedMachine = name;
    
    const panel = document.getElementById('detailPanel');
    const overlay = document.getElementById('panelOverlay');
    
    panel.classList.add('active');
    overlay.classList.add('active');
    
    updateDetailPanel(name, machine);
    renderDevices(); // Update selection state
}

// Close detail panel
function closeDetailPanel() {
    selectedMachine = null;
    
    const panel = document.getElementById('detailPanel');
    const overlay = document.getElementById('panelOverlay');
    
    panel.classList.remove('active');
    overlay.classList.remove('active');
    
    renderDevices(); // Update selection state
}

// Update detail panel
function updateDetailPanel(name, machine) {
    const latest = machine.latest || {};
    const status = getMachineStatus(machine);
    
    // Header
    document.getElementById('panelDeviceName').textContent = name;
    document.getElementById('panelDeviceOS').textContent = latest.os || 'Unknown';
    
    // Status
    document.getElementById('panelStatus').innerHTML = `
        <span class="status-badge ${status}">
            ${status === 'online' ? 'Online' : status === 'warning' ? 'Warning' : 'Offline'}
        </span>
    `;
    
    // Info cards
    document.getElementById('panelProcesses').textContent = latest.num_processes || '0';
    document.getElementById('panelSwap').textContent = (parseFloat(latest.swap_used_gb || 0) * 1024).toFixed(0) + ' MB';
    document.getElementById('panelUptime').textContent = formatUptime(parseFloat(latest.uptime_hours || 0));
    
    // Metrics
    const cpu = parseFloat(latest.cpu_percent || 0);
    const ram = parseFloat(latest.ram_percent || 0);
    const disk = parseFloat(latest.disk_percent || 0);
    
    const ramUsed = parseFloat(latest.ram_used_gb || 0);
    const ramTotal = parseFloat(latest.ram_total_gb || 0);
    const diskUsed = parseFloat(latest.disk_used_gb || 0);
    const diskTotal = parseFloat(latest.disk_total_gb || 0);
    
    // CPU
    document.getElementById('panelCpuValue').textContent = cpu.toFixed(1) + '%';
    document.getElementById('panelCpuValue').className = `panel-metric-value cyan ${cpu > 80 ? 'high' : ''}`;
    document.getElementById('panelCpuBar').style.width = Math.min(cpu, 100) + '%';
    document.getElementById('panelCpuBar').className = `panel-metric-fill cyan ${cpu > 80 ? 'high' : ''}`;
    
    // RAM
    document.getElementById('panelRamValue').textContent = ram.toFixed(1) + '%';
    document.getElementById('panelRamValue').className = `panel-metric-value violet ${ram > 85 ? 'high' : ''}`;
    document.getElementById('panelRamBar').style.width = Math.min(ram, 100) + '%';
    document.getElementById('panelRamBar').className = `panel-metric-fill violet ${ram > 85 ? 'high' : ''}`;
    document.getElementById('panelRamUsed').textContent = ramUsed.toFixed(1) + ' GB used';
    document.getElementById('panelRamTotal').textContent = ramTotal.toFixed(1) + ' GB total';
    
    // Disk
    document.getElementById('panelDiskValue').textContent = disk.toFixed(1) + '%';
    document.getElementById('panelDiskValue').className = `panel-metric-value emerald ${disk > 90 ? 'high' : ''}`;
    document.getElementById('panelDiskBar').style.width = Math.min(disk, 100) + '%';
    document.getElementById('panelDiskBar').className = `panel-metric-fill emerald ${disk > 90 ? 'high' : ''}`;
    document.getElementById('panelDiskUsed').textContent = diskUsed.toFixed(0) + ' GB used';
    document.getElementById('panelDiskTotal').textContent = diskTotal.toFixed(0) + ' GB total';
    
    // History chart
    updateHistoryChart(machine);
    
    // Top processes
    updateTopProcesses(latest);
}

// Update history chart
function updateHistoryChart(machine) {
    const ctx = document.getElementById('panelHistoryChart').getContext('2d');
    
    if (historyChart) {
        historyChart.destroy();
    }
    
    const history = machine.history || [];
    const labels = history.map(h => {
        const time = h.timestamp ? h.timestamp.split(' ')[1] : '';
        return time ? time.substring(0, 5) : '';
    });
    
    const cpuData = history.map(h => parseFloat(h.cpu_percent || 0));
    const ramData = history.map(h => parseFloat(h.ram_percent || 0));
    
    historyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'CPU %',
                    data: cpuData,
                    borderColor: '#06b6d4',
                    backgroundColor: 'rgba(6, 182, 212, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    borderWidth: 2
                },
                {
                    label: 'RAM %',
                    data: ramData,
                    borderColor: '#8b5cf6',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#94a3b8',
                        usePointStyle: true,
                        padding: 15,
                        font: { size: 11 }
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(71, 85, 105, 0.3)' },
                    ticks: { color: '#64748b', font: { size: 10 } }
                },
                y: {
                    min: 0,
                    max: 100,
                    grid: { color: 'rgba(71, 85, 105, 0.3)' },
                    ticks: { color: '#64748b', font: { size: 10 } }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

// Update top processes
function updateTopProcesses(latest) {
    const ramContainer = document.getElementById('panelTopRam');
    const cpuContainer = document.getElementById('panelTopCpu');
    
    // Top RAM
    const topRam = [];
    for (let i = 1; i <= 5; i++) {
        const proc = latest[`top_ram_${i}`];
        if (proc) topRam.push(proc);
    }
    
    ramContainer.innerHTML = topRam.length > 0 
        ? topRam.map((proc, i) => `
            <div class="process-item">
                <span class="process-rank ram">${i + 1}</span>
                <span class="process-name">${proc}</span>
            </div>
        `).join('')
        : '<div class="process-item"><span class="process-name">No data</span></div>';
    
    // Top CPU
    const topCpu = [];
    for (let i = 1; i <= 5; i++) {
        const proc = latest[`top_cpu_${i}`];
        if (proc && !proc.includes('System Idle')) topCpu.push(proc);
    }
    
    cpuContainer.innerHTML = topCpu.length > 0 
        ? topCpu.map((proc, i) => `
            <div class="process-item">
                <span class="process-rank cpu">${i + 1}</span>
                <span class="process-name">${proc}</span>
            </div>
        `).join('')
        : '<div class="process-item"><span class="process-name">No data</span></div>';
}

// Keyboard shortcut to close panel
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && selectedMachine) {
        closeDetailPanel();
    }
});

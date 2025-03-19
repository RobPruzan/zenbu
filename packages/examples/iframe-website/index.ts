import { serve } from "bun";
const port = 4200;
serve({
  port: port,
  fetch(req) {
    return new Response(
      `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dashboard | Zenbu Analytics</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap">
  <style>
    :root {
      --primary: #0070f3;
      --primary-dark: #0060df;
      --secondary: #7928ca;
      --accent: #ff4d4f;
      --background: #000000;
      --card-bg: #111111;
      --card-hover: #1a1a1a;
      --border: #333333;
      --text: #ffffff;
      --text-secondary: #888888;
      --success: #0070f3;
      --warning: #f5a623;
      --error: #ff4d4f;
      --radius: 8px;
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background-color: var(--background);
      color: var(--text);
      line-height: 1.6;
    }
    
    .dashboard {
      display: grid;
      grid-template-columns: 240px 1fr;
      min-height: 100vh;
    }
    
    .sidebar {
      background-color: var(--card-bg);
      border-right: 1px solid var(--border);
      padding: 24px 16px;
    }
    
    .logo {
      display: flex;
      align-items: center;
      margin-bottom: 32px;
      padding-left: 8px;
    }
    
    .logo-icon {
      width: 32px;
      height: 32px;
      background-color: var(--primary);
      border-radius: 8px;
      margin-right: 12px;
    }
    
    .logo-text {
      font-weight: 600;
      font-size: 18px;
      color: var(--primary);
    }
    
    .nav-item {
      display: flex;
      align-items: center;
      padding: 10px 12px;
      margin-bottom: 4px;
      border-radius: var(--radius);
      color: var(--text-secondary);
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .nav-item:hover {
      background-color: var(--card-hover);
      color: var(--text);
    }
    
    .nav-item.active {
      background-color: rgba(0, 112, 243, 0.1);
      color: var(--primary);
    }
    
    .nav-icon {
      width: 18px;
      height: 18px;
      margin-right: 12px;
      opacity: 0.8;
    }
    
    .nav-section {
      margin-bottom: 24px;
    }
    
    .nav-section-title {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-secondary);
      margin: 16px 0 8px 12px;
    }
    
    .main-content {
      padding: 24px;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    
    .page-title {
      font-size: 24px;
      font-weight: 600;
    }
    
    .header-actions {
      display: flex;
      gap: 12px;
    }
    
    .search-bar {
      position: relative;
      margin-right: 16px;
    }
    
    .search-input {
      background-color: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 8px 16px 8px 36px;
      color: var(--text);
      font-size: 14px;
      width: 240px;
      transition: all 0.2s;
    }
    
    .search-input:focus {
      outline: none;
      border-color: var(--primary);
      width: 280px;
    }
    
    .search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      width: 16px;
      height: 16px;
      color: var(--text-secondary);
    }
    
    .button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background-color: var(--primary);
      color: white;
      border: none;
      border-radius: var(--radius);
      padding: 8px 16px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .button:hover {
      background-color: var(--primary-dark);
    }
    
    .button-icon {
      margin-right: 8px;
      width: 16px;
      height: 16px;
    }
    
    .button-secondary {
      background-color: var(--card-bg);
      border: 1px solid var(--border);
      color: var(--text);
    }
    
    .button-secondary:hover {
      background-color: var(--card-hover);
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
    
    .stat-card {
      background-color: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 20px;
    }
    
    .stat-title {
      font-size: 14px;
      color: var(--text-secondary);
      margin-bottom: 8px;
    }
    
    .stat-value {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 4px;
    }
    
    .stat-change {
      display: flex;
      align-items: center;
      font-size: 13px;
    }
    
    .stat-change.positive {
      color: #0070f3;
    }
    
    .stat-change.negative {
      color: var(--error);
    }
    
    .chart-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 16px;
      margin-bottom: 24px;
    }
    
    .chart-card {
      background-color: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 20px;
    }
    
    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    
    .chart-title {
      font-size: 16px;
      font-weight: 600;
    }
    
    .chart-actions {
      display: flex;
      gap: 8px;
    }
    
    .chart-tab {
      font-size: 13px;
      padding: 4px 12px;
      border-radius: 16px;
      cursor: pointer;
      color: var(--text-secondary);
    }
    
    .chart-tab.active {
      background-color: rgba(0, 112, 243, 0.1);
      color: var(--primary);
    }
    
    .chart-container {
      height: 240px;
      display: flex;
      align-items: flex-end;
      gap: 8px;
      padding-top: 20px;
    }
    
    .chart-bar {
      flex: 1;
      background-color: var(--primary);
      border-radius: 4px 4px 0 0;
      position: relative;
    }
    
    .chart-bar::after {
      content: attr(data-value);
      position: absolute;
      top: -20px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 11px;
      color: var(--text-secondary);
    }
    
    .chart-label {
      position: absolute;
      bottom: -24px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 11px;
      color: var(--text-secondary);
    }
    
    .table-card {
      background-color: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 20px;
      margin-bottom: 24px;
    }
    
    .table {
      width: 100%;
      border-collapse: collapse;
    }
    
    .table th {
      text-align: left;
      padding: 12px 16px;
      font-size: 13px;
      font-weight: 500;
      color: var(--text-secondary);
      border-bottom: 1px solid var(--border);
    }
    
    .table td {
      padding: 12px 16px;
      font-size: 14px;
      border-bottom: 1px solid var(--border);
    }
    
    .table tr:last-child td {
      border-bottom: none;
    }
    
    .status-badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }
    
    .status-active {
      background-color: rgba(0, 112, 243, 0.1);
      color: var(--success);
    }
    
    .status-pending {
      background-color: rgba(245, 166, 35, 0.1);
      color: var(--warning);
    }
    
    .status-failed {
      background-color: rgba(255, 77, 79, 0.1);
      color: var(--error);
    }
    
    .avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background-color: var(--card-hover);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      color: var(--primary);
      margin-right: 12px;
    }
    
    .user-info {
      display: flex;
      align-items: center;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      color: var(--text-secondary);
      font-size: 13px;
    }
  </style>
  <script src="http://localhost:42069"></script>
</head>
<body>
  <div class="dashboard">
    <aside class="sidebar">
      <div class="logo">
        <div class="logo-icon"></div>
        <div class="logo-text">Zenbu Analytics</div>
      </div>
      
      <div class="nav-section">
        <div class="nav-item active">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
          Dashboard
        </div>
        <div class="nav-item">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 20V10"></path>
            <path d="M18 20V4"></path>
            <path d="M6 20v-4"></path>
          </svg>
          Analytics
        </div>
        <div class="nav-item">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          Reports
        </div>
        <div class="nav-item">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
            <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"></path>
          </svg>
          Projects
        </div>
      </div>
      
      <div class="nav-section">
        <div class="nav-section-title">Settings</div>
        <div class="nav-item">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          Account
        </div>
        <div class="nav-item">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"></path>
          </svg>
          Settings
        </div>
        <div class="nav-item">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 01-3.46 0"></path>
          </svg>
          Notifications
        </div>
      </div>
      
      <div class="nav-section">
        <div class="nav-section-title">Support</div>
        <div class="nav-item">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"></path>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          Help Center
        </div>
        <div class="nav-item">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"></path>
          </svg>
          Contact Us
        </div>
      </div>
    </aside>
    
    <main class="main-content">
      <header class="header">
        <h1 class="page-title">Dashboard</h1>
        
        <div class="header-actions">
          <div class="search-bar">
            <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input type="text" class="search-input" placeholder="Search...">
          </div>
          
          <button class="button button-secondary">
            <svg class="button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14"></path>
              <path d="M5 12h14"></path>
            </svg>
            Filter
          </button>
          
          <button class="button">
            <svg class="button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14"></path>
              <path d="M5 12h14"></path>
            </svg>
            New Report
          </button>
        </div>
      </header>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-title">Total Users</div>
          <div class="stat-value">24,532</div>
          <div class="stat-change positive">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="18 15 12 9 6 15"></polyline>
            </svg>
            12.5% from last month
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-title">Active Sessions</div>
          <div class="stat-value">1,429</div>
          <div class="stat-change positive">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="18 15 12 9 6 15"></polyline>
            </svg>
            8.2% from last week
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-title">Conversion Rate</div>
          <div class="stat-value">3.42%</div>
          <div class="stat-change negative">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
            1.8% from last week
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-title">Avg. Session Duration</div>
          <div class="stat-value">4m 32s</div>
          <div class="stat-change positive">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="18 15 12 9 6 15"></polyline>
            </svg>
            12.3% from last month
          </div>
        </div>
      </div>
      
      <div class="chart-grid">
        <div class="chart-card">
          <div class="chart-header">
            <h3 class="chart-title">User Activity</h3>
            <div class="chart-actions">
              <div class="chart-tab active">Daily</div>
              <div class="chart-tab">Weekly</div>
              <div class="chart-tab">Monthly</div>
            </div>
          </div>
          
          <div class="chart-container">
            <div class="chart-bar" style="height: 40%;" data-value="423">
              <div class="chart-label">Mon</div>
            </div>
            <div class="chart-bar" style="height: 65%;" data-value="687">
              <div class="chart-label">Tue</div>
            </div>
            <div class="chart-bar" style="height: 85%;" data-value="892">
              <div class="chart-label">Wed</div>
            </div>
            <div class="chart-bar" style="height: 75%;" data-value="789">
              <div class="chart-label">Thu</div>
            </div>
            <div class="chart-bar" style="height: 90%;" data-value="954">
              <div class="chart-label">Fri</div>
            </div>
            <div class="chart-bar" style="height: 50%;" data-value="523">
              <div class="chart-label">Sat</div>
            </div>
            <div class="chart-bar" style="height: 35%;" data-value="345">
              <div class="chart-label">Sun</div>
            </div>
          </div>
        </div>
        
        <div class="chart-card">
          <div class="chart-header">
            <h3 class="chart-title">Traffic Sources</h3>
            <div class="chart-actions">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="1"></circle>
                <circle cx="19" cy="12" r="1"></circle>
                <circle cx="5" cy="12" r="1"></circle>
              </svg>
            </div>
          </div>
          
          <div style="padding: 20px 0;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
              <div>
                <div style="font-size: 13px; color: var(--text-secondary);">Direct</div>
                <div style="font-size: 16px; font-weight: 600;">42%</div>
              </div>
              <div style="width: 60%; height: 8px; background-color: var(--card-hover); border-radius: 4px; align-self: center;">
                <div style="width: 42%; height: 100%; background: linear-gradient(to right, var(--primary), var(--secondary)); border-radius: 4px;"></div>
              </div>
            </div>
            
            <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
              <div>
                <div style="font-size: 13px; color: var(--text-secondary);">Search</div>
                <div style="font-size: 16px; font-weight: 600;">28%</div>
              </div>
              <div style="width: 60%; height: 8px; background-color: var(--card-hover); border-radius: 4px; align-self: center;">
                <div style="width: 28%; height: 100%; background: linear-gradient(to right, var(--primary), var(--secondary)); border-radius: 4px;"></div>
              </div>
            </div>
            
            <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
              <div>
                <div style="font-size: 13px; color: var(--text-secondary);">Social</div>
                <div style="font-size: 16px; font-weight: 600;">18%</div>
              </div>
              <div style="width: 60%; height: 8px; background-color: var(--card-hover); border-radius: 4px; align-self: center;">
                <div style="width: 18%; height: 100%; background: linear-gradient(to right, var(--primary), var(--secondary)); border-radius: 4px;"></div>
              </div>
            </div>
            
            <div style="display: flex; justify-content: space-between;">
              <div>
                <div style="font-size: 13px; color: var(--text-secondary);">Referral</div>
                <div style="font-size: 16px; font-weight: 600;">12%</div>
              </div>
              <div style="width: 60%; height: 8px; background-color: var(--card-hover); border-radius: 4px; align-self: center;">
                <div style="width: 12%; height: 100%; background: linear-gradient(to right, var(--primary), var(--secondary)); border-radius: 4px;"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="table-card">
        <div class="chart-header">
          <h3 class="chart-title">Recent Activities</h3>
          <button class="button button-secondary">View All</button>
        </div>
        
        <table class="table">
          <thead>
            <tr>
              <th>User</th>
              <th>Activity</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <div class="user-info">
                  <div class="avatar">JD</div>
                  <div>John Doe</div>
                </div>
              </td>
              <td>Completed onboarding</td>
              <td><span class="status-badge status-active">Completed</span></td>
              <td>Today, 2:30 PM</td>
              <td>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="1"></circle>
                  <circle cx="19" cy="12" r="1"></circle>
                  <circle cx="5" cy="12" r="1"></circle>
                </svg>
              </td>
            </tr>
            <tr>
              <td>
                <div class="user-info">
                  <div class="avatar">AS</div>
                  <div>Alice Smith</div>
                </div>
              </td>
              <td>Created new project</td>
              <td><span class="status-badge status-active">Completed</span></td>
              <td>Today, 11:15 AM</td>
              <td>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="1"></circle>
                  <circle cx="19" cy="12" r="1"></circle>
                  <circle cx="5" cy="12" r="1"></circle>
                </svg>
              </td>
            </tr>
            <tr>
              <td>
                <div class="user-info">
                  <div class="avatar">RJ</div>
                  <div>Robert Johnson</div>
                </div>
              </td>
              <td>Payment processing</td>
              <td><span class="status-badge status-pending">Pending</span></td>
              <td>Yesterday, 3:45 PM</td>
              <td>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="1"></circle>
                  <circle cx="19" cy="12" r="1"></circle>
                  <circle cx="5" cy="12" r="1"></circle>
                </svg>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <div class="container">
    <h1>Welcome to the Demo Website</h1>
    <p>This is a simple website served by Bun.</p>
    
    <div class="card">
      <h2>About</h2>
      <p>This is a demonstration of a simple website that can be embedded in an iframe. It's built with Bun and serves static HTML content.</p>
      <button class="button">Learn More</button>
    </div>
    
    <div class="image-container">
      <img src="https://placekitten.com/600/300" alt="Sample Image">
    </div>
    
    <div class="card">
      <h2>Features</h2>
      <div class="feature-cards">
        <div class="feature-card">
          <h3>Fast Serving</h3>
          <p>Powered by Bun</p>
        </div>
        <div class="feature-card">
          <h3>Dark Mode</h3>
          <p>Easy on the eyes</p>
        </div>
        <div class="feature-card">
          <h3>Responsive</h3>
          <p>Works on all devices</p>
        </div>
        <div class="feature-card">
          <h3>Clean Layout</h3>
          <p>Simple and elegant</p>
        </div>
      </div>
    </div>
    
    <div class="card">
      <h2>Contact Us</h2>
      <p>Have questions about this demo?</p>
      <form>
        <input type="email" placeholder="Your email" style="width: 100%; padding: 8px; margin-bottom: 10px; background-color: #333; border: 1px solid #444; color: #e0e0e0; border-radius: 4px;">
        <textarea placeholder="Your message" style="width: 100%; padding: 8px; margin-bottom: 10px; background-color: #333; border: 1px solid #444; color: #e0e0e0; border-radius: 4px; min-height: 100px;"></textarea>
        <button class="button">Send Message</button>
      </form>
    </div>
    
    <div class="footer">
      <p>© 2023 Iframe Website Demo | Built with Bun</p>
    </div>
  </div>
</body>
</html>`,
      {
        headers: {
          "Content-Type": "text/html",
        },
      }
    );
  },
});

console.log(`Server running at http://localhost:${port}`);
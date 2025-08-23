// src/components/Reports.js - Enhanced Version with Charts
import React, { useState, useEffect, useRef } from 'react';
import SidebarLayout from '../../Layouts/SidebarLayout';
import Chart from 'chart.js/auto';

export default function Reports() {
  const [dateFilter, setDateFilter] = useState('monthly');
  const [isLoading, setIsLoading] = useState(false);
  
  // Chart refs
  const donutChartRef = useRef(null);
  const lineChartRef = useRef(null);
  const assetChartRef = useRef(null);
  const userChartRef = useRef(null);
  const progressChartRef = useRef(null);
  
  // Chart instances
  const chartInstances = useRef({});
  
  // Sample data for 6-month trend
  const workOrderTrends = [
    { month: 'Mar', count: 18 },
    { month: 'Apr', count: 22 },
    { month: 'May', count: 19 },
    { month: 'Jun', count: 25 },
    { month: 'Jul', count: 21 },
    { month: 'Aug', count: 23 }
  ];
  
  // TODO: Replace with actual API calls
  const [dashboardData, setDashboardData] = useState({
    overview: {
      totalWorkOrders: { current: 23, change: +12, trend: 'up' },
      totalAssets: { current: 18, change: -2, trend: 'down' },
      activeUsers: { current: 142, change: +8, trend: 'up' },
      completionRate: { current: 65, change: +5, trend: 'up' }
    },
    workOrders: {
      total: 23,
      completed: 15,
      inProgress: 3,
      pending: 5,
      overdue: 2,
      categories: [
        { name: 'Electrical', count: 8, completed: 6 },
        { name: 'Plumbing', count: 7, completed: 5 },
        { name: 'IT Support', count: 5, completed: 3 },
        { name: 'Maintenance', count: 3, completed: 1 }
      ]
    },
    assetMaintenance: {
      total: 18,
      scheduled: 12,
      overdue: 3,
      completed: 3,
      upcomingWeek: 5,
      criticalAssets: [
        { name: 'HVAC System A', status: 'overdue', days: 5 },
        { name: 'Generator B', status: 'due', days: 2 },
        { name: 'Fire Safety System', status: 'scheduled', days: 7 }
      ]
    },
    users: {
      total: 156,
      active: 142,
      inactive: 14,
      roles: {
        standard: 124,
        personnel: 24,
        admins: 8
      },
      recentActivity: [
        { user: 'John Smith', action: 'Created work order #WO-2024-001', time: '2h ago' },
        { user: 'Sarah Johnson', action: 'Completed asset maintenance', time: '4h ago' },
        { user: 'Mike Davis', action: 'Updated user profile', time: '6h ago' },
        { user: 'Lisa Wong', action: 'Approved maintenance request', time: '8h ago' },
        { user: 'Tom Brown', action: 'Generated report', time: '12h ago' }
      ]
    }
  });

  // Cleanup function for charts
  const destroyChart = (chartKey) => {
    if (chartInstances.current[chartKey]) {
      chartInstances.current[chartKey].destroy();
      delete chartInstances.current[chartKey];
    }
  };

  // Create Work Orders Donut Chart
  const createDonutChart = () => {
    destroyChart('donut');
    if (donutChartRef.current) {
      const ctx = donutChartRef.current.getContext('2d');
      chartInstances.current.donut = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Completed', 'In Progress', 'Pending', 'Overdue'],
          datasets: [{
            data: [
              dashboardData.workOrders.completed,
              dashboardData.workOrders.inProgress,
              dashboardData.workOrders.pending,
              dashboardData.workOrders.overdue
            ],
            backgroundColor: ['#28a745', '#ffc107', '#007bff', '#dc3545'],
            borderWidth: 2,
            borderColor: '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                font: { size: 10 },
                padding: 8
              }
            }
          },
          cutout: '60%'
        }
      });
    }
  };

  // Create Work Orders Trend Line Chart
  const createLineChart = () => {
    destroyChart('line');
    if (lineChartRef.current) {
      const ctx = lineChartRef.current.getContext('2d');
      chartInstances.current.line = new Chart(ctx, {
        type: 'line',
        data: {
          labels: workOrderTrends.map(item => item.month),
          datasets: [{
            label: 'Work Orders',
            data: workOrderTrends.map(item => item.count),
            borderColor: '#007bff',
            backgroundColor: 'rgba(0, 123, 255, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(0,0,0,0.1)'
              },
              ticks: {
                font: { size: 10 }
              }
            },
            x: {
              grid: {
                display: false
              },
              ticks: {
                font: { size: 10 }
              }
            }
          }
        }
      });
    }
  };

  // Create Asset Maintenance Bar Chart
  const createAssetChart = () => {
    destroyChart('asset');
    if (assetChartRef.current) {
      const ctx = assetChartRef.current.getContext('2d');
      chartInstances.current.asset = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Scheduled', 'Overdue', 'Completed'],
          datasets: [{
            data: [
              dashboardData.assetMaintenance.scheduled,
              dashboardData.assetMaintenance.overdue,
              dashboardData.assetMaintenance.completed
            ],
            backgroundColor: ['#007bff', '#dc3545', '#28a745'],
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(0,0,0,0.1)'
              },
              ticks: {
                font: { size: 10 }
              }
            },
            x: {
              grid: {
                display: false
              },
              ticks: {
                font: { size: 10 }
              }
            }
          }
        }
      });
    }
  };

  // Create User Activity Bar Chart
  const createUserChart = () => {
    destroyChart('user');
    if (userChartRef.current) {
      const ctx = userChartRef.current.getContext('2d');
      chartInstances.current.user = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Standard', 'Personnel', 'Admins'],
          datasets: [{
            data: [
              dashboardData.users.roles.standard,
              dashboardData.users.roles.personnel,
              dashboardData.users.roles.admins
            ],
            backgroundColor: ['#6c757d', '#17a2b8', '#ffc107'],
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(0,0,0,0.1)'
              },
              ticks: {
                font: { size: 10 }
              }
            },
            x: {
              grid: {
                display: false
              },
              ticks: {
                font: { size: 10 }
              }
            }
          }
        }
      });
    }
  };

  // Create Circular Progress Chart
  const createProgressChart = () => {
    destroyChart('progress');
    if (progressChartRef.current) {
      const ctx = progressChartRef.current.getContext('2d');
      const completionRate = dashboardData.overview.completionRate.current;
      
      chartInstances.current.progress = new Chart(ctx, {
        type: 'doughnut',
        data: {
          datasets: [{
            data: [completionRate, 100 - completionRate],
            backgroundColor: ['#28a745', '#e9ecef'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '80%',
          plugins: {
            legend: {
              display: false
            }
          }
        }
      });
    }
  };

  // Initialize all charts
  const initializeCharts = () => {
    setTimeout(() => {
      createDonutChart();
      createLineChart();
      createAssetChart();
      createUserChart();
      createProgressChart();
    }, 100);
  };

  // TODO: Replace with actual API call
  const fetchDashboardData = async (period) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(`Fetching data for period: ${period}`);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(dateFilter);
  }, [dateFilter]);

  useEffect(() => {
    if (!isLoading) {
      initializeCharts();
    }
    
    // Cleanup on unmount
    return () => {
      Object.keys(chartInstances.current).forEach(key => {
        destroyChart(key);
      });
    };
  }, [isLoading, dashboardData]);

  const exportReport = async (format) => {
    try {
      alert(`Exporting ${format.toUpperCase()} report for ${dateFilter} period - Backend integration needed`);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const getTrendIcon = (trend) => {
    if (trend === 'up') return '↗️';
    if (trend === 'down') return '↘️';
    return '→';
  };

  const getTrendColor = (trend) => {
    if (trend === 'up') return 'text-success';
    if (trend === 'down') return 'text-danger';
    return 'text-muted';
  };

  return (
    <SidebarLayout role="admin">
      {/* Compact Header */}
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div>
          <h4 className="mb-0">Dashboard Reports</h4>
          <small className="text-muted">Facility management overview</small>
        </div>
        <div className="d-flex gap-1">
          <select 
            className="form-select form-select-sm" 
            style={{width: '120px', fontSize: '12px'}}
            value={dateFilter} 
            onChange={(e) => setDateFilter(e.target.value)}
            disabled={isLoading}
          >
            <option value="daily">Today</option>
            <option value="weekly">Week</option>
            <option value="monthly">Month</option>
            <option value="quarterly">Quarter</option>
            <option value="yearly">Year</option>
          </select>
          <button 
            className="btn btn-success btn-sm px-2" 
            onClick={() => exportReport('csv')}
            disabled={isLoading}
            style={{fontSize: '11px'}}
          >
            📊 CSV
          </button>
          <button 
            className="btn btn-danger btn-sm px-2" 
            onClick={() => exportReport('pdf')}
            disabled={isLoading}
            style={{fontSize: '11px'}}
          >
            📄 PDF
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-2">
          <div className="spinner-border spinner-border-sm text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <small className="d-block mt-1 text-muted">Loading...</small>
        </div>
      )}

      {!isLoading && (
        <>
          {/* Enhanced KPI Row with Circular Progress */}
          <div className="row g-1 mb-1">
            <div className="col-lg-3 col-md-6 col-sm-12">
              <div className="card border border-tertiary bg-light">
                <div className="card-body p-2 text-center">
                  <div className="d-flex justify-content-between align-items-start mb-1">
                    <span className="badge bg-primary" style={{fontSize: '9px'}}>Work Orders</span>
                    <span className={getTrendColor(dashboardData.overview.totalWorkOrders.trend)} style={{fontSize: '12px'}}>
                      {getTrendIcon(dashboardData.overview.totalWorkOrders.trend)}
                    </span>
                  </div>
                  <h3 className="mb-0">{dashboardData.overview.totalWorkOrders.current}</h3>
                  <small className={getTrendColor(dashboardData.overview.totalWorkOrders.trend)} style={{fontSize: '10px'}}>
                    {dashboardData.overview.totalWorkOrders.change > 0 ? '+' : ''}
                    {dashboardData.overview.totalWorkOrders.change} vs last period
                  </small>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-md-6 col-sm-12">
              <div className="card border border-tertiary bg-light">
                <div className="card-body p-2 text-center">
                  <div className="d-flex justify-content-between align-items-start mb-1">
                    <span className="badge bg-warning text-dark" style={{fontSize: '9px'}}>Assets</span>
                    <span className={getTrendColor(dashboardData.overview.totalAssets.trend)} style={{fontSize: '12px'}}>
                      {getTrendIcon(dashboardData.overview.totalAssets.trend)}
                    </span>
                  </div>
                  <h3 className="mb-0">{dashboardData.overview.totalAssets.current}</h3>
                  <small className={getTrendColor(dashboardData.overview.totalAssets.trend)} style={{fontSize: '10px'}}>
                    {dashboardData.overview.totalAssets.change > 0 ? '+' : ''}
                    {dashboardData.overview.totalAssets.change} vs last period
                  </small>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-md-6 col-sm-12">
              <div className="card border border-tertiary bg-light">
                <div className="card-body p-2 text-center">
                  <div className="d-flex justify-content-between align-items-start mb-1">
                    <span className="badge bg-info" style={{fontSize: '9px'}}>Active Users</span>
                    <span className={getTrendColor(dashboardData.overview.activeUsers.trend)} style={{fontSize: '12px'}}>
                      {getTrendIcon(dashboardData.overview.activeUsers.trend)}
                    </span>
                  </div>
                  <h3 className="mb-0">{dashboardData.overview.activeUsers.current}</h3>
                  <small className={getTrendColor(dashboardData.overview.activeUsers.trend)} style={{fontSize: '10px'}}>
                    {dashboardData.overview.activeUsers.change > 0 ? '+' : ''}
                    {dashboardData.overview.activeUsers.change} vs last period
                  </small>
                </div>
              </div>
            </div>
            
            {/* Enhanced Completion Rate with Circular Progress */}
            <div className="col-lg-3 col-md-6 col-sm-12">
              <div className="card border border-tertiary bg-light">
                <div className="card-body p-2">
                  <div className="row align-items-center">
                    <div className="col-6 text-center">
                      <div className="d-flex justify-content-between align-items-start mb-1">
                        <span className="badge bg-success" style={{fontSize: '9px'}}>Completion</span>
                        <span className={getTrendColor(dashboardData.overview.completionRate.trend)} style={{fontSize: '12px'}}>
                          {getTrendIcon(dashboardData.overview.completionRate.trend)}
                        </span>
                      </div>
                      <h3 className="mb-0">{dashboardData.overview.completionRate.current}%</h3>
                      <small className={getTrendColor(dashboardData.overview.completionRate.trend)} style={{fontSize: '10px'}}>
                        {dashboardData.overview.completionRate.change > 0 ? '+' : ''}
                        {dashboardData.overview.completionRate.change}% vs last period
                      </small>
                    </div>
                    <div className="col-6 position-relative">
                      <div style={{width: '80px', height: '80px', margin: '0 auto', position: 'relative'}}>
                        <canvas ref={progressChartRef}></canvas>
                        <div className="position-absolute top-50 start-50 translate-middle text-center">
                          <div className="fw-bold text-success" style={{fontSize: '16px'}}>
                            {dashboardData.overview.completionRate.current}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="row g-1 mb-1">
            {/* Work Orders Donut Chart */}
            <div className="col-lg-6 col-md-12 col-sm-12">
<div className="card border border-primary" style={{backgroundColor: '#fafafa', height: '250px', borderRadius: '12px'}}>
                <div className="card-header bg-transparent border-0 py-1">
                  <h6 className="mb-0 text-center" style={{fontSize: '12px'}}>🔧 Work Orders Status</h6>
                </div>
                <div className="card-body p-1 d-flex align-items-center">
                 <div style={{height: '140px', width: '100%'}}>
                    <canvas ref={donutChartRef}></canvas>
                  </div>
                </div>
              </div>
            </div>

            {/* Work Orders Trend Line Chart */}
           <div className="col-lg-6 col-md-12 col-sm-12">
<div className="card border border-primary" style={{backgroundColor: '#fafafa', height: '250px'}}>
                <div className="card-header bg-transparent border-0 py-1">
                  <h6 className="mb-0 text-center" style={{fontSize: '12px'}}>📈 6-Month Trend</h6>
                </div>
                <div className="card-body p-1 d-flex align-items-center">
                 <div style={{height: '140px', width: '100%'}}>
                    <canvas ref={lineChartRef}></canvas>
                  </div>
                </div>
              </div>
            </div>

            {/* Asset Maintenance Bar Chart */}
            <div className="col-lg-6 col-md-12 col-sm-12">
<div className="card border border-secondary" style={{backgroundColor: '#fafafa', height: '250px'}}>
                <div className="card-header bg-transparent border-0 py-1">
                  <h6 className="mb-0 text-center" style={{fontSize: '12px'}}>🏭 Asset Maintenance</h6>
                </div>
                <div className="card-body p-1 d-flex align-items-center">
                  <div style={{height: '140px', width: '100%'}}>
                    <canvas ref={assetChartRef}></canvas>
                  </div>
                </div>
              </div>
            </div>

            {/* User Activity Bar Chart */}
            <div className="col-lg-6 col-md-12 col-sm-12">
<div className="card border border-secondary" style={{backgroundColor: '#fafafa', height: '250px'}}>
                <div className="card-header bg-transparent border-0 py-1">
                  <h6 className="mb-0 text-center" style={{fontSize: '12px'}}>👥 Users by Role</h6>
                </div>
                <div className="card-body p-1 d-flex align-items-center">
                  <div style={{height: '140px', width: '100%'}}>
                    <canvas ref={userChartRef}></canvas>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Main Content - 3 Column Layout (Simplified) */}
          <div className="row g-2">
            {/* Work Orders - Simplified */}
            <div className="col-lg-4 mb-1">
              <div className="card border border-secondary h-100" style={{backgroundColor: '#fafafa'}}>
                <div className="card-header bg-transparent border-0 py-2 d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">🔧 Work Orders Details</h6>
                  <button className="btn btn-outline-primary btn-sm py-0 px-2" style={{fontSize: '10px'}}>View All</button>
                </div>
                <div className="card-body py-1">
                  {/* Categories Table */}
                  <small className="fw-medium d-block mb-1">By Category</small>
                  <div className="table-responsive">
                    <table className="table table-sm table-borderless mb-0" style={{fontSize: '11px'}}>
                      <tbody>
                        {dashboardData.workOrders.categories.map((category, index) => (
                          <tr key={index}>
                            <td className="py-1 px-0">{category.name}</td>
                            <td className="py-1 px-0 text-end">{category.completed}/{category.count}</td>
                            <td className="py-1 px-0" width="50">
                              <div className="progress" style={{height: '4px'}}>
                                <div 
                                  className="progress-bar bg-primary" 
                                  style={{ width: `${(category.completed / category.count) * 100}%` }}
                                ></div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Asset Maintenance - Simplified */}
            <div className="col-lg-4 mb-1">
              <div className="card border border-secondary  h-100" style={{backgroundColor: '#fafafa'}}>
                <div className="card-header bg-transparent border-0 py-2 d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">🏭 Critical Assets</h6>
                  <button className="btn btn-outline-primary btn-sm py-0 px-2" style={{fontSize: '10px'}}>Manage</button>
                </div>
                <div className="card-body py-1">
                  {/* Critical Assets Table */}
                  <div className="table-responsive">
                    <table className="table table-sm table-borderless mb-0" style={{fontSize: '11px'}}>
                      <tbody>
                        {dashboardData.assetMaintenance.criticalAssets.map((asset, index) => (
                          <tr key={index}>
                            <td className="py-1 px-0">{asset.name}</td>
                            <td className="py-1 px-0 text-end">
                              <span className={`badge ${
                                asset.status === 'overdue' ? 'bg-danger' : 
                                asset.status === 'due' ? 'bg-warning text-dark' : 'bg-info'
                              }`} style={{fontSize: '9px'}}>
                                {asset.status === 'overdue' ? `${asset.days}d overdue` : 
                                 asset.status === 'due' ? `${asset.days}d due` : `${asset.days}d scheduled`}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="col-lg-4 mb-1">
              <div className="card border border-secondary  h-100" style={{backgroundColor: '#fafafa'}}>
                <div className="card-header bg-transparent border-0 py-2">
                  <h6 className="mb-0">👥 Recent Activity</h6>
                </div>
                <div className="card-body py-1">
                  <div style={{maxHeight: '120px', overflowY: 'auto'}}>
                    {dashboardData.users.recentActivity.map((activity, index) => (
                      <div key={index} className="d-flex justify-content-between py-1 border-bottom" style={{fontSize: '10px'}}>
                        <div className="flex-grow-1">
                          <div className="fw-medium">{activity.user}</div>
                          <div className="text-muted">{activity.action}</div>
                        </div>
                        <small className="text-muted ms-2">{activity.time}</small>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </SidebarLayout>
  );
}
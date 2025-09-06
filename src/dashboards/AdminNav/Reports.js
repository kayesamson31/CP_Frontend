// src/components/Reports.js - Simple Admin Reports
import React, { useState, useEffect, useRef } from 'react';
import SidebarLayout from '../../Layouts/SidebarLayout';
import Chart from 'chart.js/auto';

export default function Reports() {
  const [period, setPeriod] = useState('monthly');
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  
  // Chart refs
  const workOrderChartRef = useRef(null);
  const categoryChartRef = useRef(null);
  const chartInstances = useRef({});

  // Mock data - Replace with your API calls
  const mockData = {
    totals: {
      workOrders: 156,
      assets: {
        operational: 89,
        underMaintenance: 12,
        retired: 5
      },
      maintenanceSchedules: 34,
      users: {
        standard: 45,
        personnel: 18,
        admin: 7
      },
      exportedCSV: 23
    },
    workOrderCategories: [
      { name: 'HVAC', count: 42, color: '#FF6B6B' },
      { name: 'Electrical', count: 38, color: '#4ECDC4' },
      { name: 'Plumbing', count: 29, color: '#45B7D1' },
      { name: 'Carpentry/Structural', count: 21, color: '#96CEB4' },
      { name: 'Masonry/Civil Works', count: 15, color: '#FFEAA7' },
      { name: 'Painting/Finishing', count: 8, color: '#DDA0DD' },
      { name: 'Groundskeeping', count: 3, color: '#98D8C8' }
    ]
  };

  // Cleanup charts
  const destroyChart = (chartKey) => {
    if (chartInstances.current[chartKey]) {
      chartInstances.current[chartKey].destroy();
      delete chartInstances.current[chartKey];
    }
  };

  // Create Work Orders by Period Chart
  const createWorkOrderChart = () => {
    destroyChart('workOrder');
    if (!workOrderChartRef.current) return;

    const ctx = workOrderChartRef.current.getContext('2d');
    const labels = period === 'monthly' ? 
      ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'] :
      period === 'weekly' ? 
      ['Week 1', 'Week 2', 'Week 3', 'Week 4'] :
      ['2022', '2023', '2024'];
    
    const data = period === 'monthly' ? 
      [25, 30, 28, 35, 20, 18] :
      period === 'weekly' ? 
      [38, 42, 35, 41] :
      [145, 168, 156];

    chartInstances.current.workOrder = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Work Orders',
          data,
          borderColor: '#4ECDC4',
          backgroundColor: 'rgba(78, 205, 196, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
  legend: { display: false },
  title: {
    display: true,
    text: 'Work Orders Request',
    font: {
      size: 16,
      weight: 'bold'
    },
    padding: {
      top: 10,
      bottom: 20
    }
  }
},
  scales: {
    y: { beginAtZero: true }
  }
}
    });
  };

  // Create Category Chart
  const createCategoryChart = () => {
    destroyChart('category');
    if (!categoryChartRef.current || !mockData.workOrderCategories) return;

    const ctx = categoryChartRef.current.getContext('2d');
    
    chartInstances.current.category = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: mockData.workOrderCategories.map(cat => cat.name),
        datasets: [{
          data: mockData.workOrderCategories.map(cat => cat.count),
          backgroundColor: mockData.workOrderCategories.map(cat => cat.color),
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { fontSize: 10, padding: 10 }
          }
        },
        cutout: '60%'
      }
    });
  };

  // Initialize charts
  useEffect(() => {
    if (!isLoading) {
      setTimeout(() => {
        createWorkOrderChart();
        createCategoryChart();
      }, 100);
    }

    return () => {
      Object.keys(chartInstances.current).forEach(key => {
        destroyChart(key);
      });
    };
  }, [period, isLoading]);

  // Fetch data (simulate API call)
  const fetchReportData = async (selectedPeriod) => {
    setIsLoading(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    setReportData(mockData);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchReportData(period);
  }, [period]);

  // Export function
  const exportCSV = () => {
    const csvData = [
      ['Report Type', 'Count'],
      ['Work Orders', mockData.totals.workOrders],
      ['Operational Assets', mockData.totals.assets.operational],
      ['Under Maintenance', mockData.totals.assets.underMaintenance],
      ['Retired Assets', mockData.totals.assets.retired],
      ['Maintenance Schedules', mockData.totals.maintenanceSchedules],
      ['Standard Users', mockData.totals.users.standard],
      ['Personnel', mockData.totals.users.personnel],
      ['Admin Officials', mockData.totals.users.admin],
      ...mockData.workOrderCategories.map(cat => [cat.name, cat.count])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin_report_${period}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  if (isLoading) {
    return (
      <SidebarLayout role="admin">
        <div className="d-flex justify-content-center align-items-center" style={{height: '400px'}}>
          <div className="text-center">
            <div className="spinner-border text-primary" role="status"></div>
            <div className="mt-2">Loading reports...</div>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout role="admin">
      <div className="container-fluid">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h2 className="mb-1">Reports</h2>
                <p className="text-muted mb-0">Comprehensive facility management overview</p>
              </div>
              <div className="d-flex gap-2 align-items-center">
                <select 
                  className="form-select"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  style={{ width: '150px' }}
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
                <button 
                  className="btn btn-success"
                  onClick={exportCSV}
                >
                  Export CSV
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="row g-3 mb-4">
          {/* Work Orders */}
          <div className="col-md-3">
          <div className="card h-100" style={{
  border: '1px solid #dee2e6',
  borderRadius: '8px',
  boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
}}>
              <div className="card-body text-center py-2">
                <h4 className="text-primary mb-1">{mockData.totals.workOrders}</h4>
                <p className="card-text text-muted">Work Order Requests</p>
              </div>
            </div>
          </div>

          {/* Asset Records */}
          <div className="col-md-3">
           <div className="card h-100" style={{
  border: '1px solid #dee2e6',
  borderRadius: '8px',
  boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
}}>
             <div className="card-body text-center py-2">
                <h4 className="text-success mb-1">
                  {mockData.totals.assets.operational + mockData.totals.assets.underMaintenance + mockData.totals.assets.retired}
                </h4>
                <p className="card-text text-muted">Total Assets</p>
                <small className="text-muted">
                  {mockData.totals.assets.operational} operational, {mockData.totals.assets.underMaintenance} maintenance, {mockData.totals.assets.retired} retired
                </small>
              </div>
            </div>
          </div>

          {/* Maintenance Schedules */}
          <div className="col-md-3">
         <div className="card h-100" style={{
  border: '1px solid #dee2e6',
  borderRadius: '8px',
  boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
}}>
              <div className="card-body text-center py-2">
                <h4 className="text-warning mb-1">{mockData.totals.maintenanceSchedules}</h4>
                <p className="card-text text-muted">Maintenance Schedules</p>
              </div>
            </div>
          </div>

          {/* Users */}
          <div className="col-md-3">
           <div className="card h-100" style={{
  border: '1px solid #dee2e6',
  borderRadius: '8px',
  boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
}}>
              <div className="card-body text-center py-2">             
                <h4 className="text-info mb-1">
                  {mockData.totals.users.standard + mockData.totals.users.personnel + mockData.totals.users.admin}
                </h4>
                <p className="card-text text-muted">Total Users</p>
                <small className="text-muted">
                  {mockData.totals.users.admin} admin, {mockData.totals.users.personnel} personnel, {mockData.totals.users.standard} standard
                </small>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="row g-3 mb-4">
          {/* Work Orders Trend */}
          <div className="col-md-12">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-transparent border-0">
              </div>
              <div className="card-body">
                <div style={{ height: '300px' }}>
                  <canvas ref={workOrderChartRef}></canvas>
                </div>
              </div>
            </div>
          </div>

         
        </div>

        {/* Detailed Categories Table */}
        <div className="row">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-transparent border-0 d-flex justify-content-between align-items-center">
                <h5 className="mb-0">📊 Work Order Categories Breakdown</h5>
                <small className="text-muted">Total CSV Exports: {mockData.totals.exportedCSV}</small>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th className="text-center">Total Requests</th>
                        <th className="text-center">Percentage</th>
                        <th>Progress</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockData.workOrderCategories.map((category, index) => {
                        const percentage = ((category.count / mockData.totals.workOrders) * 100).toFixed(1);
                        return (
                          <tr key={index}>
                            <td>
                              <div className="d-flex align-items-center">
                                <div 
                                  className="rounded-circle me-2"
                                  style={{ width: '12px', height: '12px', backgroundColor: category.color }}
                                ></div>
                                {category.name}
                              </div>
                            </td>
                            <td className="text-center fw-bold">{category.count}</td>
                            <td className="text-center">{percentage}%</td>
                            <td>
                              <div className="progress" style={{ height: '8px' }}>
                                <div 
                                  className="progress-bar"
                                  style={{ 
                                    width: `${percentage}%`,
                                    backgroundColor: category.color
                                  }}
                                ></div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
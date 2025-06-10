// Biến lưu trữ các biểu đồ
let charts = {
    applicants: null,
    applicationStatus: null,
    jobPosts: null,
    topCategories: null
};

// Hàm khởi tạo biểu đồ mới
function initChart(canvasId, config) {
    // Lấy canvas cũ
    const oldCanvas = document.getElementById(canvasId);
    if (!oldCanvas) return null;

    // Tạo canvas mới thay thế canvas cũ
    const newCanvas = document.createElement('canvas');
    newCanvas.id = canvasId;
    oldCanvas.parentNode.replaceChild(newCanvas, oldCanvas);

    // Khởi tạo biểu đồ mới
    return new Chart(newCanvas.getContext('2d'), config);
}

// Hàm hủy tất cả biểu đồ
function destroyCharts() {
    Object.values(charts).forEach(chart => {
        if (chart) {
            chart.destroy();
        }
    });
    charts = {
        applicants: null,
        applicationStatus: null,
        jobPosts: null,
        topCategories: null
    };
}

// Hàm tạo dữ liệu mẫu cho biểu đồ theo thời gian
function generateTimeSeriesData(days) {
    const data = [];
    const labels = [];
    const currentDate = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(currentDate);
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString('vi-VN'));
        data.push(0);
    }
    
    return { labels, data };
}

// Hàm cập nhật biểu đồ số lượng ứng viên theo thời gian
function updateApplicantsChart(days, applicationsData) {
    const { labels, data } = generateTimeSeriesData(days);

    // Cập nhật số liệu từ dữ liệu thực
    applicationsData.forEach(app => {
        const appDate = new Date(app.appliedAt).toLocaleDateString('vi-VN');
        const index = labels.indexOf(appDate);
        if (index !== -1) {
            data[index]++;
        }
    });

    const config = {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Số lượng ứng viên',
                data: data,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    };

    charts.applicants = initChart('applicantsChart', config);
}

// Hàm cập nhật biểu đồ tỷ lệ trạng thái ứng viên
function updateApplicationStatusChart(applicationsData) {
    const statusCounts = {
        pending: 0,
        accepted: 0,
        rejected: 0
    };
    
    applicationsData.forEach(app => {
        statusCounts[app.status]++;
    });

    const config = {
        type: 'doughnut',
        data: {
            labels: ['Chờ duyệt', 'Đã duyệt', 'Từ chối'],
            datasets: [{
                data: [statusCounts.pending, statusCounts.accepted, statusCounts.rejected],
                backgroundColor: [
                    'rgb(255, 205, 86)',
                    'rgb(75, 192, 192)',
                    'rgb(255, 99, 132)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    };

    charts.applicationStatus = initChart('applicationStatusChart', config);
}

// Hàm cập nhật biểu đồ số tin đăng theo thời gian
function updateJobPostsChart(days, jobsData) {
    const { labels, data } = generateTimeSeriesData(days);

    jobsData.forEach(job => {
        const jobDate = new Date(job.createdAt).toLocaleDateString('vi-VN');
        const index = labels.indexOf(jobDate);
        if (index !== -1) {
            data[index]++;
        }
    });

    const config = {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Số tin đăng',
                data: data,
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgb(54, 162, 235)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    };

    charts.jobPosts = initChart('jobPostsChart', config);
}

// Hàm cập nhật biểu đồ top ngành nghề
function updateTopCategoriesChart(jobsData, applicationsData) {
    const categoryApplications = {};
    
    applicationsData.forEach(app => {
        const job = jobsData.find(j => j.id === app.jobId);
        if (job) {
            categoryApplications[job.category] = (categoryApplications[job.category] || 0) + 1;
        }
    });

    const sortedCategories = Object.entries(categoryApplications)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);

    const config = {
        type: 'bar',
        data: {
            labels: sortedCategories.map(([category]) => category),
            datasets: [{
                label: 'Số lượng ứng viên',
                data: sortedCategories.map(([,count]) => count),
                backgroundColor: 'rgba(153, 102, 255, 0.5)',
                borderColor: 'rgb(153, 102, 255)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    };

    charts.topCategories = initChart('topCategoriesChart', config);
}

// Hàm chính để load và hiển thị báo cáo
async function loadReports(userId) {
    const { database, ref, query, orderByChild, equalTo, get } = window.firebase;
    
    try {
        // Hủy tất cả biểu đồ cũ
        destroyCharts();
        
        // Lấy thời gian từ bộ lọc
        const timeRangeFilter = document.getElementById('timeRangeFilter');
        const days = parseInt(timeRangeFilter.value);
        
        // ... rest of the loadReports function remains the same ...
    } catch (error) {
        console.error('Error loading reports:', error);
        Swal.fire({
            icon: 'error',
            title: 'Lỗi!',
            text: 'Không thể tải dữ liệu báo cáo.'
        });
    }
}

// ... rest of the code ...
document.addEventListener('DOMContentLoaded', function() {
    // Toggle sidebar on mobile
    const sidebarToggleBtn = document.querySelector('.sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (sidebarToggleBtn) {
        sidebarToggleBtn.addEventListener('click', function() {
            sidebar.classList.toggle('show');
        });
    }
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', function(event) {
        if (window.innerWidth < 768 && 
            sidebar.classList.contains('show') && 
            !sidebar.contains(event.target) && 
            event.target !== sidebarToggleBtn) {
            sidebar.classList.remove('show');
        }
    });
    
    // Toggle dropdown menus in sidebar
    const dropdownToggles = document.querySelectorAll('.sidebar-dropdown-toggle');
    
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            const parent = this.closest('.nav-item');
            const dropdown = parent.querySelector('.sidebar-dropdown');
            
            // Close all other dropdowns
            document.querySelectorAll('.sidebar-dropdown.show').forEach(item => {
                if (!parent.contains(item)) {
                    item.classList.remove('show');
                    const parentToggle = item.closest('.nav-item').querySelector('.sidebar-dropdown-toggle');
                    parentToggle.classList.remove('active');
                    parentToggle.querySelector('.dropdown-icon').classList.remove('fa-chevron-down');
                    parentToggle.querySelector('.dropdown-icon').classList.add('fa-chevron-right');
                }
            });
            
            // Toggle current dropdown
            dropdown.classList.toggle('show');
            this.classList.toggle('active');
            
            // Toggle icon
            const icon = this.querySelector('.dropdown-icon');
            if (dropdown.classList.contains('show')) {
                icon.classList.remove('fa-chevron-right');
                icon.classList.add('fa-chevron-down');
            } else {
                icon.classList.remove('fa-chevron-down');
                icon.classList.add('fa-chevron-right');
            }
        });
    });
    
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function(tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Initialize popovers
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(function(popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });
    
    // Initialize charts if they exist
    if (typeof Chart !== 'undefined') {
        // Users Chart
        const usersChartElement = document.getElementById('usersChart');
        if (usersChartElement) {
            new Chart(usersChartElement, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                    datasets: [{
                        label: 'New Users',
                        data: [65, 59, 80, 81, 56, 55, 40, 70, 75, 82, 90, 100],
                        fill: false,
                        borderColor: '#3B82F6',
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
        
        // Videos Chart
        const videosChartElement = document.getElementById('videosChart');
        if (videosChartElement) {
            new Chart(videosChartElement, {
                type: 'bar',
                data: {
                    labels: ['60s', '70s', '80s', '90s', '2000s', '2010s', '2020s'],
                    datasets: [{
                        label: 'Videos by Decade',
                        data: [12, 19, 3, 5, 2, 3, 7],
                        backgroundColor: [
                            '#EC4899',
                            '#8B5CF6',
                            '#3B82F6',
                            '#10B981',
                            '#F59E0B',
                            '#EF4444',
                            '#6B7280'
                        ],
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
        }
    }
});
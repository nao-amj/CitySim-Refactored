// assumes Chart.js loaded globally via <script> in index.html

export class DataDashboard {
    constructor(city) {
        this.city = city;
        this.container = document.getElementById('data-dashboard-container');
        this.chart = null;
    }

    show() {
        this.container.classList.remove('hidden');
        this.container.innerHTML = `
            <h2><i class="fas fa-chart-line"></i> データダッシュボード</h2>
            <canvas id="dashboard-chart"></canvas>
            <button id="close-dashboard" class="btn">閉じる</button>
        `;
        document.getElementById('close-dashboard').addEventListener('click', () => this.hide());
        const ctx = document.getElementById('dashboard-chart').getContext('2d');
        // Use recorded statistics from the city model
        const stats = this.city.statistics || {};
        // Prepare labels and datasets from statistics.population and statistics.funds
        const labels = (stats.population || []).map(entry => entry.year);
        const popData = (stats.population || []).map(entry => entry.value);
        const fundsData = (stats.funds || []).map(entry => entry.value);
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    { label: '人口', data: popData, borderColor: '#3498db', fill: false },
                    { label: '資金', data: fundsData, borderColor: '#2ecc71', fill: false }
                ]
            },
            options: { responsive: true }
        });
    }

    hide() {
        if (this.chart) this.chart.destroy();
        this.container.classList.add('hidden');
        this.container.innerHTML = '';
    }
}
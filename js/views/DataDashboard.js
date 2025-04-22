import { Chart } from 'chart.js';

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
        const labels = this.city.history.map(h => h.timestamp);
        const popData = this.city.history.map(h => h.population);
        const fundsData = this.city.history.map(h => h.funds);
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
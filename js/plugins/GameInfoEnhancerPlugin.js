// js/plugins/GameInfoEnhancerPlugin.js
(function() {
  const plugin = {
    name: 'GameInfoEnhancerPlugin',
    enabled: true,
    init(context) {
      const { uiController, city } = context;
      // Create overlay container
      const overlay = document.createElement('div');
      overlay.id = 'info-enhancer-overlay';
      overlay.className = 'hidden';
      overlay.style = 'position:fixed;top:0;left:0;width:100%;height:100%;' +
        'background:rgba(0,0,0,0.7);display:flex;justify-content:center;align-items:flex-start;overflow:auto;z-index:1200;padding-top:60px;';
      // Build panel
      const panel = document.createElement('div');
      panel.style = 'background:#fff;padding:20px;border-radius:6px;max-width:800px;width:90%;';
      panel.innerHTML = `
        <h2><i class="fas fa-info-circle"></i> ゲーム情報強化パネル</h2>
        <canvas id="pie-districts-chart" style="width:100%;height:200px;margin-bottom:20px;"></canvas>
        <canvas id="pie-buildings-chart" style="width:100%;height:200px;margin-bottom:20px;"></canvas>
        <canvas id="line-metrics-chart" style="width:100%;height:200px;margin-bottom:20px;"></canvas>
        <button id="close-info-enhancer" class="btn btn-secondary">閉じる</button>
      `;
      overlay.appendChild(panel);
      document.body.appendChild(overlay);
      document.getElementById('close-info-enhancer').onclick = () => overlay.classList.add('hidden');

      // Add button to stats-actions
      const statsActions = document.getElementById('stats-actions');
      if (statsActions) {
        const btn = document.createElement('button');
        btn.className = 'action-btn tap-highlight';
        btn.id = 'open-info-enhancer';
        btn.innerHTML = '<i class="fas fa-chart-pie"></i><span>情報パネル</span>';
        statsActions.appendChild(btn);
        btn.addEventListener('click', () => {
          overlay.classList.remove('hidden');
          renderCharts();
        });
      }

      function renderCharts() {
        // Districts breakdown
        const distro = city.districts.reduce((acc, d) => {
          acc[d.type] = (acc[d.type] || 0) + 1;
          return acc;
        }, {});
        new Chart(document.getElementById('pie-districts-chart').getContext('2d'), {
          type: 'pie',
          data: {
            labels: Object.keys(distro),
            datasets: [{ data: Object.values(distro), backgroundColor: ['#3498db','#f1c40f','#e74c3c','#9b59b6','#2ecc71'] }]
          }
        });
        // Buildings breakdown
        const bld = city.buildings;
        new Chart(document.getElementById('pie-buildings-chart').getContext('2d'), {
          type: 'doughnut',
          data: {
            labels: Object.keys(bld),
            datasets: [{ data: Object.values(bld), backgroundColor: ['#3498db','#f39c12','#95a5a6','#9b59b6','#2ecc71','#e74c3c'] }]
          }
        });
        // Metrics trends
        const stats = city.statistics || {};
        const types = ['population','funds','happiness','environment','education'];
        const labels = (stats[types[0]]||[]).map(e=>e.year);
        const datasets = types.map((t,i)=>({
          label:t,
          data:(stats[t]||[]).map(e=>e.value),
          borderColor:['#e74c3c','#3498db','#2ecc71','#f1c40f','#9b59b6'][i],
          fill:false
        }));
        new Chart(document.getElementById('line-metrics-chart').getContext('2d'), {
          type: 'line',
          data:{ labels, datasets },
          options:{ responsive:true }
        });
      }
    }
  };
  window.pluginRegistry = window.pluginRegistry || [];
  window.pluginRegistry.push(plugin);
})();
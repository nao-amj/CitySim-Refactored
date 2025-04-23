// js/plugins/PuzzleMinigamePlugin.js
(function() {
  const plugin = {
    name: 'PuzzleMinigamePlugin',
    enabled: true,
    init(context) {
      const { uiController, city } = context;
      // Create overlay container
      const overlay = document.createElement('div');
      overlay.id = 'puzzle-overlay';
      overlay.className = 'hidden';
      overlay.style = 'position:fixed;top:0;left:0;width:100%;height:100%;' +
        'background:rgba(0,0,0,0.5);display:flex;justify-content:center;align-items:center;z-index:1100;';
      // Build puzzle UI
      const boardSize = 3;
      let tiles = [];
      const panel = document.createElement('div');
      panel.style = 'background:#fff;padding:20px;border-radius:8px;';
      const grid = document.createElement('div');
      grid.style = 'display:grid;grid-template-columns:repeat(3,60px);grid-gap:5px;';
      // Initialize tiles
      for (let i = 0; i < boardSize*boardSize; i++) tiles.push(i);
      function render() {
        grid.innerHTML = '';
        tiles.forEach((n, idx) => {
          const btn = document.createElement('button');
          btn.style = 'width:60px;height:60px;font-size:1.2rem;';
          btn.textContent = n ? n : '';
          btn.onclick = () => move(idx);
          grid.appendChild(btn);
        });
      }
      function move(idx) {
        const empty = tiles.indexOf(0);
        const r1 = Math.floor(idx/boardSize), c1 = idx%boardSize;
        const r2 = Math.floor(empty/boardSize), c2 = empty%boardSize;
        if (Math.abs(r1-r2)+Math.abs(c1-c2)===1) {
          [tiles[idx], tiles[empty]] = [tiles[empty], tiles[idx]];
          render();
          if (tiles.every((v,i)=>v===i)) {
            city.funds += 500;
            uiController.addEventToLog({ title:'パズルクリア', message:'報酬¥500を獲得', type:'event-success', icon:'star' });
            overlay.classList.add('hidden');
          }
        }
      }
      // Reset button
      const resetBtn = document.createElement('button');
      resetBtn.textContent = '再シャッフル';
      resetBtn.style='margin-top:10px;';
      resetBtn.onclick = () => {
        tiles = tiles.sort(()=>Math.random()-0.5);
        render();
      };
      // Close button
      const closeBtn = document.createElement('button');
      closeBtn.textContent = '閉じる';
      closeBtn.style='margin-top:10px;margin-left:10px;';
      closeBtn.onclick = () => overlay.classList.add('hidden');
      panel.appendChild(grid);
      panel.appendChild(resetBtn);
      panel.appendChild(closeBtn);
      overlay.appendChild(panel);
      document.body.appendChild(overlay);
      // Add button to stats-actions
      const statsActions = document.getElementById('stats-actions');
      if (statsActions) {
        const btn = document.createElement('button');
        btn.className='action-btn tap-highlight';
        btn.id='open-puzzle';
        btn.innerHTML='<i class="fas fa-puzzle-piece"></i><span>パズル</span>';
        statsActions.appendChild(btn);
        btn.addEventListener('click', () => {
          // shuffle then show
          tiles = tiles.sort(()=>Math.random()-0.5);
          render();
          overlay.classList.remove('hidden');
        });
      }
    }
  };
  window.pluginRegistry = window.pluginRegistry || [];
  window.pluginRegistry.push(plugin);
})();
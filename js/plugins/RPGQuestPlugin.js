// js/plugins/RPGQuestPlugin.js
(function() {
  const plugin = {
    name: 'RPGQuestPlugin',
    enabled: true,
    init(context) {
      const { uiController, city } = context;
      // Create overlay
      const overlay = document.createElement('div');
      overlay.id = 'rpg-quest-overlay';
      overlay.className = 'hidden';
      overlay.innerHTML = `
        <div class="dialog-content">
          <h2>旅人の依頼</h2>
          <p>旅人: "助けてくれませんか？報酬は¥1000です。受けますか？"</p>
          <button id="rpg-yes" class="btn btn-primary">はい</button>
          <button id="rpg-no" class="btn btn-secondary">いいえ</button>
        </div>
      `;
      overlay.style = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:1100;';
      document.body.appendChild(overlay);
      // Add button to stats-actions
      const statsActions = document.getElementById('stats-actions');
      if (statsActions) {
        const btn = document.createElement('button');
        btn.className = 'action-btn tap-highlight';
        btn.id = 'open-rpg-quest';
        btn.innerHTML = `<i class="fas fa-dragon"></i><span>RPGクエスト</span>`;
        statsActions.appendChild(btn);
        btn.addEventListener('click', () => {
          overlay.classList.remove('hidden');
        });
      }
      // Handle choice
      overlay.addEventListener('click', e => {
        if (e.target.id === 'rpg-yes') {
          city.funds += 1000;
          uiController.addEventToLog({ title: 'クエスト完了', message: '報酬を受け取りました: ¥1000', type: 'event-success', icon: 'coins' });
          overlay.classList.add('hidden');
        } else if (e.target.id === 'rpg-no') {
          uiController.addEventToLog({ title: 'クエスト辞退', message: '旅人に丁重にお断りしました。', type: 'event-info', icon: 'user-times' });
          overlay.classList.add('hidden');
        }
      });
    }
  };
  window.pluginRegistry = window.pluginRegistry || [];
  window.pluginRegistry.push(plugin);
})();
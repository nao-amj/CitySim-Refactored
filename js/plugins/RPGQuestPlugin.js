// js/plugins/RPGQuestPlugin.js
(function() {
  const plugin = {
    name: 'RPGQuestPlugin',
    enabled: true,
    init(context) {
      const { uiController, city } = context;
      // Quest definitions
      const quests = [
        { title: '狼の退治', description: '近隣の森に現れた狼を退治してください。報酬: ¥1500、幸福度+2%', reward: 1500, effects: { happiness: 2 } },
        { title: '橋の修復', description: '壊れた橋を修理してください。報酬: ¥1000、環境+1%', reward: 1000, effects: { environment: 1 } },
        { title: '迷子の子猫捜索', description: '迷子の子猫を探してください。報酬: ¥500、幸福度+5%', reward: 500, effects: { happiness: 5 } },
        { title: '古文書の調査', description: '廃墟で古文書を調査してください。報酬: ¥2000、教育+3%', reward: 2000, effects: { education: 3 } }
      ];
      // Create overlay
      const overlay = document.createElement('div');
      overlay.id = 'rpg-quest-overlay';
      overlay.className = 'hidden';
      overlay.style = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:1100;';
      const dialog = document.createElement('div');
      dialog.className = 'dialog-content';
      overlay.appendChild(dialog);
      document.body.appendChild(overlay);
      // Add trigger button
      const btn = document.createElement('button');
      btn.className = 'action-btn tap-highlight';
      btn.innerHTML = '<i class="fas fa-dragon"></i><span>RPGクエスト</span>';
      document.getElementById('stats-actions').appendChild(btn);
      btn.addEventListener('click', () => showQuest());
      function showQuest() {
        const q = quests[Math.floor(Math.random()*quests.length)];
        dialog.innerHTML = `
          <h2>${q.title}</h2>
          <p>${q.description}</p>
          <button id="quest-accept" class="btn btn-primary">受諾</button>
          <button id="quest-decline" class="btn btn-secondary">辞退</button>
        `;
        document.getElementById('quest-accept').onclick = () => {
          city.funds += q.reward;
          if (city.population !== undefined && q.effects.population) city.population += q.effects.population;
          if (city.happiness !== undefined && q.effects.happiness) city.happiness = Math.min(100, city.happiness + q.effects.happiness);
          if (city.environment !== undefined && q.effects.environment) city.environment = Math.min(100, city.environment + q.effects.environment);
          if (city.education !== undefined && q.effects.education) city.education = Math.min(100, city.education + q.effects.education);
          city.events.emit('change', { type:'questComplete', city });
          uiController.addEventToLog({ title: 'クエストクリア', message: `報酬: ¥${q.reward}`, type: 'event-success', icon: 'award' });
          overlay.classList.add('hidden');
        };
        document.getElementById('quest-decline').onclick = () => {
          uiController.addEventToLog({ title: 'クエスト辞退', message: '旅人の依頼を断りました。', type: 'event-warning', icon: 'user-times' });
          overlay.classList.add('hidden');
        };
        overlay.classList.remove('hidden');
      }
    }
  };
  window.pluginRegistry = window.pluginRegistry || [];
  window.pluginRegistry.push(plugin);
})();
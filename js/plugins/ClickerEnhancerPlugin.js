// js/plugins/ClickerEnhancerPlugin.js
// 資金稼ぎモード（クリッカー）向けに建物と実績を追加するプラグイン
(function() {
  const plugin = {
    name: 'ClickerEnhancerPlugin',
    enabled: true,
    init({ city, uiController, gameController, eventSystem }) {
      // 既存のGameConfigを参照して、クリッカー用に追加要素を登録
      const cfg = window.GameConfig && window.GameConfig.CLICKER;
      if (cfg) {
        // 新建物 "TECH_STARTUP"
        cfg.BUILDINGS.TECH_STARTUP = {
          name: 'Tech Startup',
          description: '最先端テック企業: 全収入 +50%',
          effects: { fundMultiplier: 0.5 },
          cost: 50000,
          icon: 'microchip'
        };
        // 新建物 "TRADING_CENTER"
        cfg.BUILDINGS.TRADING_CENTER = {
          name: 'Trading Center',
          description: '貿易センター: 自動収入 +¥500/秒',
          effects: { autoFunds: 500 },
          cost: 100000,
          icon: 'chart-line'
        };
        // 新実績 "INVESTOR"
        cfg.ACHIEVEMENTS.INVESTOR = {
          name: 'Investor',
          description: '累計資金 ¥100,000 達成: 全収入 +10%',
          requirement: { totalFunds: 100000 },
          bonus: { fundMultiplier: 0.1 }
        };
        // 新実績 "TYCOON"
        cfg.ACHIEVEMENTS.TYCOON = {
          name: 'Tycoon',
          description: '累計資金 ¥500,000 達成: 全収入 +25%',
          requirement: { totalFunds: 500000 },
          bonus: { fundMultiplier: 0.25 }
        };
      }
      // クリッカーモード開始時に再描画
      eventSystem.events.on('clickerInitialized', () => {
        // 再描画（コントローラに依存）
        setTimeout(() => {
          if (window.EnhancedClickerController) {
            // UI更新要求
            uiController.addEventToLog({
              title: 'Clicker Enhancer',
              message: '新しい建物と実績が追加されました！',
              type: 'event-info',
              icon: 'info-circle'
            });
          }
        }, 100);
      });
    }
  };
  window.pluginRegistry = window.pluginRegistry || [];
  window.pluginRegistry.push(plugin);
})();
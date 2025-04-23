// js/plugins/ClickerUpgradesPlugin.js
(function() {
  const plugin = {
    name: 'ClickerUpgradesPlugin',
    enabled: true,
    init({ uiController, eventSystem }) {
      // 既存のクリッカー設定にアップグレードを追加
      const cfg = window.ClickerConfig || (window.GameConfig && window.GameConfig.CLICKER);
      const upgrades = cfg && cfg.UPGRADES;
      if (upgrades) {
        // 10個のプラグインアップグレードを定義
        for (let i = 1; i <= 10; i++) {
          const id = `PLUGIN_UPGRADE_${i}`;
          upgrades[id] = {
            name: `プラグイン アップグレード ${i}`,
            cost: 1000 * i,
            icon: 'star',
            effect: { clickMultiplier: 0.01 * i },
            description: `クリック価値 +${i}%`,
            requirement: {}
          };
        }
      }
      // クリッカー初期化後に通知
      if (eventSystem && eventSystem.on) {
        eventSystem.on('clickerInitialized', () => {
          uiController.addEventToLog({
            title: 'アップグレード追加',
            message: 'プラグインで10件のアップグレードを追加しました。',
            type: 'event-info',
            icon: 'puzzle-piece'
          });
        });
      }
    }
  };
  window.pluginRegistry = window.pluginRegistry || [];
  window.pluginRegistry.push(plugin);
})();
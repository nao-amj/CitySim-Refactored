# プラグイン仕様 (Plugin Specification)

本プラグイン機構では、外部スクリプトを簡単にCitySimに組み込むことができます。

## 1. プラグイン登録方法
1. プラグインファイルを `js/plugins/` ディレクトリ内に作成します。
2. プラグイン本体は即時実行関数 (IIFE) で定義し、`window.pluginRegistry` にオブジェクトを `push` します。
3. 例（`clickerRapidPlugin.js`）:
   ```js
   (function() {
     const plugin = {
       name: 'SamplePlugin',
       init(context) {
         // 初期化処理
       }
     };
     window.pluginRegistry = window.pluginRegistry || [];
     window.pluginRegistry.push(plugin);
   })();
   ```

## 2. HTMLへの組み込み
`index.html` で `<script src="js/plugins/xxx.js" data-plugin></script>` と記述し、プラグインスクリプトをロードします。

```html
<!-- プラグインスクリプトの読み込み -->
<script src="js/plugins/clickerRapidPlugin.js" data-plugin></script>
``` 

`data-plugin` 属性はオプションですが、後続の自動検出で利用できます。

## 3. 初期化とコンテキスト
`PluginManager` が起動時に以下の共通オブジェクトをプラグインの `init(context)` に渡します。

```js
{
  city,         // Cityモデルオブジェクト
  timeManager,  // 時間管理サービス
  eventSystem,  // ゲーム内イベントシステム
  gameController,
  uiController
}
```

プラグインは `context.uiController` などから自由にAPIを呼び出し、イベント登録やレンダリングを行えます。

## 4. プラグインAPI例
- `context.city.events.on('change', handler)` で都市データ変更を監視
- `context.uiController.events.on('actionSelected', handler)` でユーザー操作を拡張
- `context.gameController.events.on('gameModeChanged', handler)` でゲームモード切替を検知

## 5. 無効化機能
`window.pluginRegistry` の各プラグインに `enabled: boolean` プロパティを持たせることで、`PluginManagerView` から ON/OFF 制御が可能です。

## 6. 注意事項
- プラグインの互換性検証はプラグイン制作者の責任です。
- 最新バージョンのCitySim APIに合わせて調整してください。

---
READMEにリンクを記載し、プラグイン仕様を確認できるようにしてください。

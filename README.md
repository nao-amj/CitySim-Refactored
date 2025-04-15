# CitySim - リファクタリング版

本リポジトリは、オリジナルの[CitySim](https://github.com/nao-amj/CitySim)をモジュール化、コード分割し、より保守性が高く拡張しやすい形に再設計したバージョンです。

## 主な改善点

- **モジュラー設計**: 機能ごとにクラスとモジュールに分割
- **クリーンアーキテクチャ**: MVC（Model-View-Controller）パターンの採用
- **拡張性の向上**: 新機能追加がより簡単に
- **データ管理の統一**: 一貫したデータフロー
- **設定とロジックの分離**: ゲームのルールとUI処理の明確な分離

## ディレクトリ構造

```
/
├── index.html          # メインHTMLファイル
├── assets/             # 画像、フォントなどの静的アセット
├── styles/             # CSSファイル
├── js/                 # JavaScriptファイル
│   ├── main.js         # アプリケーションのエントリーポイント
│   ├── config/         # ゲーム設定とデータ定義
│   ├── models/         # データモデル
│   ├── views/          # UI表示関連
│   ├── controllers/    # ビジネスロジック
│   ├── services/       # ユーティリティとサービス
│   └── events/         # イベントシステム
└── tests/              # テストファイル（将来的に）
```

## プレイ方法

[https://nao-amj.github.io/CitySim-Refactored](https://nao-amj.github.io/CitySim-Refactored) にアクセスしてプレイできます。

## 機能拡張のしやすさ

本リファクタリング版では、以下のような機能拡張が容易になっています：

1. 新しい建物タイプの追加
2. 新しいイベントの実装
3. 追加の政策オプション
4. グラフィカルな都市表示機能
5. セーブ＆ロード機能の実装

## ライセンス

MIT License

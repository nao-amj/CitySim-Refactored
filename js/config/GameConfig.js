/**
 * CitySim - ゲーム設定
 * ゲームのバランス調整、初期値、定数を一元管理
 */

export const GameConfig = {
    // バージョン設定
    VERSION: '2.0.0',
    
    // デバッグモード設定
    DEBUG_MODE: false,
    
    // 基本ゲーム設定
    INITIAL_YEAR: 2025,
    INITIAL_POPULATION: 0,
    INITIAL_FUNDS: 1000,
    INITIAL_HAPPINESS: 50,
    INITIAL_ENVIRONMENT: 70,
    INITIAL_EDUCATION: 60,
    INITIAL_TAX_RATE: 0.1, // 10%
    
    // 時間関連設定
    TIME_SCALE: 1, // リアルタイム1秒 = ゲーム内何時間
    YEAR_LENGTH_DAYS: 30 * 12, // 1年は360日（単純化）
    
    // イベント関連設定
    EVENT_CHANCE: 0.4, // イベント発生確率（1日ごとのチェック）
    MAX_EVENTS_HISTORY: 100, // 保存するイベント履歴の最大数
    
    // 建物関連設定
    BUILDINGS: {
        HOUSE: {
            name: "住宅",
            icon: "home",
            cost: 100,
            effects: {
                population: 10,
                happiness: 1,
                environment: -2
            },
            description: "住民が住む基本的な建物。人口と幸福度を増加させますが、環境への小さな影響があります。"
        },
        FACTORY: {
            name: "工場",
            icon: "industry",
            cost: 200,
            effects: {
                funds: 50,
                population: 5,
                environment: -5,
                happiness: -2
            },
            description: "雇用と収入を生み出す産業施設。環境と幸福度に影響します。"
        },
        ROAD: {
            name: "道路",
            icon: "road",
            cost: 50,
            effects: {
                happiness: 3,
                environment: -1
            },
            description: "都市の交通を改善し、市民の移動をスムーズにします。幸福度を向上させますが、環境への軽微な影響があります。"
        },
        SCHOOL: {
            name: "学校",
            icon: "graduation-cap",
            cost: 300,
            effects: {
                education: 15,
                happiness: 5
            },
            description: "教育水準を向上させ、市民の幸福度も増加させます。将来的な都市発展に重要です。"
        },
        PARK: {
            name: "公園",
            icon: "tree",
            cost: 150,
            effects: {
                environment: 10,
                happiness: 8
            },
            description: "緑豊かな公共空間。環境と幸福度を大きく向上させます。"
        },
        HOSPITAL: {
            name: "病院",
            icon: "hospital",
            cost: 350,
            effects: {
                happiness: 10,
                population: 8
            },
            description: "市民の健康を守り、幸福度を上げます。人口の増加にも貢献します。"
        },
        // 新しいクリッカー用の建物
        COIN_MINT: {
            name: "コイン工場",
            icon: "coins",
            cost: 50,
            effects: {
                clickMultiplier: 0.1, // クリック当たりの資金が10%増加
                autoFunds: 1 // 1秒あたり1の自動収入
            },
            description: "クリック1回あたりの収入を増やし、少額の自動収入をもたらします。"
        },
        BANK: {
            name: "銀行",
            icon: "landmark",
            cost: 300,
            effects: {
                autoFunds: 10, // 1秒あたり10の自動収入
                fundStorage: 500 // 資金保管容量を500増加
            },
            description: "自動的に収入を生み出し、資金の保管容量を増やします。"
        },
        INVESTMENT_FIRM: {
            name: "投資会社",
            icon: "chart-line",
            cost: 1000,
            effects: {
                fundMultiplier: 0.05, // 全ての収入源から5%増加
                autoFunds: 25
            },
            description: "すべての収入を5%増加させ、自動的に資金を生み出します。"
        }
    },
    
    // クリッカーゲームモード設定
    CLICKER: {
        BASE_CLICK_VALUE: 1, // クリック1回あたりの基本獲得資金
        AUTO_FUNDS_INTERVAL: 1000, // ミリ秒単位での自動収入間隔
        UNLOCK_THRESHOLDS: {
            COIN_MINT: 50, // コイン工場の解放に必要な合計獲得資金
            BANK: 500, // 銀行の解放に必要な合計獲得資金
            INVESTMENT_FIRM: 2000 // 投資会社の解放に必要な合計獲得資金
        },
        // コンボマルチプライヤー設定
        COMBO: {
            BONUS_RATE: 0.05,   // コンボ1回あたり5%増加
            DURATION: 3000      // 最後のクリック後3秒でコンボリセット
        },
        UPGRADES: {
            BETTER_TOOLS: {
                name: "改良ツール",
                cost: 100,
                effect: {
                    clickMultiplier: 0.5 // クリック価値が50%増加
                },
                description: "クリックごとの収入を50%増加させます。"
            },
            EFFICIENT_PROCESS: {
                name: "効率的な工程",
                cost: 500,
                effect: {
                    autoFundsMultiplier: 0.3 // 自動収入が30%増加
                },
                description: "自動収入を30%増加させます。"
            },
            ADVANCED_ECONOMY: {
                name: "先進経済",
                cost: 2000,
                effect: {
                    allMultiplier: 0.2 // すべての収入が20%増加
                },
                description: "すべての収入源からの収入を20%増加させます。"
            }
        },
        ACHIEVEMENTS: {
            FIRST_STEPS: {
                name: "最初の一歩",
                requirement: { totalClicks: 10 },
                bonus: { clickMultiplier: 0.1 },
                description: "10回クリックする"
            },
            DEDICATED_MAYOR: {
                name: "献身的な市長",
                requirement: { totalClicks: 100 },
                bonus: { clickMultiplier: 0.2 },
                description: "100回クリックする"
            },
            FINANCIAL_GENIUS: {
                name: "財政の天才",
                requirement: { totalFunds: 10000 },
                bonus: { fundMultiplier: 0.1 },
                description: "総資金額10,000に到達する"
            }
        },
        // 転生（プレステージ）機能設定
        PRESTIGE: {
            THRESHOLD: 100000,      // 転生可能になる総獲得資金
            BONUS_RATE: 0.1         // 転生ごとの永久ボーナス倍率（全収入 +10%）
        },
        // イベントボーナス（期間限定2倍）
        EVENT_BONUS: {
            CHANCE: 0.1,       // 期間発生確率（インターバルごと）
            INTERVAL: 60000,   // チャック間隔（ミリ秒）
            DURATION: 10000,   // 持続時間（ミリ秒）
            MULTIPLIER: 2      // 収入倍率
        },
        // モバイル最適化版クリッカーの利用設定
        MOBILE_OPTIMIZED_ENABLED: true
    },
    
    // 政策関連設定
    POLICIES: {
        TAX_EFFECT_MULTIPLIER: 20, // 税率が幸福度に与える影響の強さ
        TAX_NEUTRAL_POINT: 0.2, // この税率では幸福度変化なし
        TAX_MIN: 0,
        TAX_MAX: 0.5,
        POPULATION_GROWTH_FACTOR: 5 // 住宅と幸福度に基づく人口自然増加の係数
    },
    
    // チュートリアル設定
    TUTORIAL: {
        STEPS: [
            {
                title: "住宅建設",
                icon: "home",
                message: "住宅を建設して、市民を増やしましょう。人口が増えると税収も増えます。<strong>コスト: ¥100</strong>"
            },
            {
                title: "工場建設",
                icon: "industry",
                message: "工場を建設して、雇用を創出しましょう。しかし、環境への影響に注意してください。<strong>コスト: ¥200</strong>"
            },
            {
                title: "道路建設",
                icon: "road",
                message: "道路を建設して、都市のインフラを整備しましょう。移動がスムーズになります。<strong>コスト: ¥50</strong>"
            },
            {
                title: "税率設定",
                icon: "percentage",
                message: "税率を調整して、収入と市民の幸福度のバランスを取りましょう。高すぎると市民は不満を持ちます。"
            },
            {
                title: "年の進行",
                icon: "calendar-plus",
                message: "「次の年へ」ボタンでゲーム内時間を進めます。税収が入り、人口やメトリクスが更新されます。"
            },
            {
                title: "地区システム",
                icon: "map-marked-alt",
                message: "地区を作成して、都市を効率的に管理しましょう。地区ごとに特化した機能を持たせることができます。"
            },
            {
                title: "クリッカーモード",
                icon: "coins",
                message: "資金を素早く稼ぎたい場合は、クリッカーモードを活用しましょう。都市アイコンをクリックして資金を獲得できます。"
            }
        ],
        STORAGE_KEY: 'citysim-tutorial-shown'
    },
    
    // ストレージ関連
    STORAGE: {
        SAVE_KEY: 'citysim-save-data',
        AUTO_SAVE_INTERVAL: 5 * 60 * 1000 // 5分ごとに自動保存
    },
    
    // UI関連
    UI: {
        MAX_NOTIFICATIONS: 3, // 固定表示エリアに表示する通知の最大数
        NOTIFICATION_DURATION: 5000 // ポップアップ通知の表示時間(ms)
    }
};

export const GameText = {
    // 各種テキストメッセージ
    ACTION_LABELS: {
        BUILD_HOUSE: "住宅建設",
        BUILD_FACTORY: "工場建設",
        BUILD_ROAD: "道路建設",
        BUILD_SCHOOL: "学校建設",
        BUILD_PARK: "公園建設",
        BUILD_HOSPITAL: "病院建設",
        SET_TAX: "税率設定",
        NEXT_YEAR: "次の年へ",
        LOAN: "融資",
        TRADE: "貿易",
        EDUCATION_POLICY: "教育投資",
        ENVIRONMENT_POLICY: "環境政策",
        CLICKER_MODE: "クリッカーモード",
        CITY_MANAGEMENT: "都市管理",
        BUILD_DISTRICT: "地区建設"
    },
    
    // イベント効果のメッセージテンプレート
    EVENT_EFFECTS: {
        POPULATION_GAIN: "人口が<strong>{amount}人</strong>増加しました",
        POPULATION_LOSS: "人口が<strong>{amount}人</strong>減少しました",
        FUNDS_GAIN: "<strong>¥{amount}</strong>の資金を獲得しました",
        FUNDS_LOSS: "<strong>¥{amount}</strong>の資金を失いました",
        HAPPINESS_GAIN: "幸福度が<strong>{amount}%</strong>上昇しました",
        HAPPINESS_LOSS: "幸福度が<strong>{amount}%</strong>低下しました",
        ENVIRONMENT_GAIN: "環境が<strong>{amount}%</strong>改善しました",
        ENVIRONMENT_LOSS: "環境が<strong>{amount}%</strong>悪化しました",
        EDUCATION_GAIN: "教育水準が<strong>{amount}%</strong>向上しました",
        EDUCATION_LOSS: "教育水準が<strong>{amount}%</strong>低下しました"
    },
    
    // ゲームイベントメッセージ
    WELCOME_MESSAGE: {
        TITLE: "CitySim へようこそ！",
        CONTENT: "新しい都市の市長に就任しました。都市を発展させましょう。\n\n<strong>使用可能なアクション:</strong>\n• <strong>建設タブ</strong>: 住宅、工場、道路を建設\n• <strong>経済タブ</strong>: 税率設定、融資、貿易\n• <strong>政策タブ</strong>: 年の進行、教育投資、環境政策\n• <strong>地区タブ</strong>: 地区の作成と管理\n• <strong>クリッカー</strong>: 都市アイコンをクリックして素早く資金を稼ぐ\n\nさあ、都市開発を始めましょう！"
    },
    
    // クリッカーモードのテキスト
    CLICKER: {
        TITLE: "資金稼ぎモード",
        DESCRIPTION: "都市アイコンをクリックして資金を稼ぎましょう！建物を購入すると自動的に資金が増えます。",
        CLICK_VALUE: "クリック価値: ¥{value}",
        AUTO_INCOME: "自動収入: ¥{value}/秒",
        TOTAL_EARNED: "総獲得資金: ¥{value}",
        TOTAL_CLICKS: "総クリック数: {value}回",
        UNLOCK_MESSAGE: "新しい建物「{building}」がアンロックされました！",
        ACHIEVEMENT_UNLOCKED: "実績解除: {name}"
    },
    
    // ヒントメッセージ
    TIPS: [
        "税率を低くすると人口が増えやすくなります",
        "環境が悪化すると幸福度が下がります",
        "定期的に道路を建設すると都市の効率が上がります",
        "工場は収入源ですが、環境に悪影響を与えます",
        "住宅を増やすことで人口と税収を増やせます",
        "資金は常に余裕を持っておきましょう。予期せぬイベントで使うことがあります",
        "幸福度が高いと人口増加率が上がります",
        "スペースキーでゲームの一時停止/再開ができます",
        "数字キー1-7でアクションをショートカット操作できます",
        "教育への投資は長期的な発展につながります",
        "地区を専門化させることで、特定の分野に特化した地区を作れます",
        "クリッカーモードを活用して素早く資金を稼ぎましょう",
        "建物のアップグレードは大きな効果をもたらします",
        "統計グラフで都市の成長を確認しましょう",
        "実績を解除すると永続的なボーナスが得られます"
    ]
};

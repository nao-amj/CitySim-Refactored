/**
 * CitySim - ゲーム設定
 * ゲームのバランス調整、初期値、定数を一元管理
 */

export const GameConfig = {
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
        }
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
        ENVIRONMENT_POLICY: "環境政策"
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
        CONTENT: "新しい都市の市長に就任しました。都市を発展させましょう。\n\n<strong>使用可能なアクション:</strong>\n• <strong>建設タブ</strong>: 住宅、工場、道路を建設\n• <strong>経済タブ</strong>: 税率設定、融資、貿易\n• <strong>政策タブ</strong>: 年の進行、教育投資、環境政策\n\nさあ、都市開発を始めましょう！"
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
        "教育への投資は長期的な発展につながります"
    ]
};

/**
 * CitySim - クリッカーモード設定
 * クリッカーモードのバランス調整、設定を一元管理
 */

export const ClickerConfig = {
    // 基本設定
    BASE_CLICK_VALUE: 1,         // クリック1回あたりの基本獲得資金
    AUTO_FUNDS_INTERVAL: 1000,   // ミリ秒単位での自動収入間隔
    
    // 建物アンロック閾値
    UNLOCK_THRESHOLDS: {
        COIN_MINT: 50,           // コイン工場の解放に必要な合計獲得資金
        BANK: 500,               // 銀行の解放に必要な合計獲得資金
        INVESTMENT_FIRM: 2000,   // 投資会社の解放に必要な合計獲得資金
        TECH_STARTUP: 10000,     // テック企業の解放に必要な合計獲得資金
        TRADING_CENTER: 50000    // 貿易センターの解放に必要な合計獲得資金
    },
    
    // 建物設定
    BUILDINGS: {
        COIN_MINT: {
            name: "コイン工場",
            icon: "coins",
            cost: 50,
            baseCost: 50,
            costMultiplier: 1.1,  // 購入ごとのコスト増加率
            effects: {
                clickMultiplier: 0.1,  // クリック当たりの資金が10%増加
                autoFunds: 1           // 1秒あたり1の自動収入
            },
            description: "クリック1回あたりの収入を増やし、少額の自動収入をもたらします。"
        },
        BANK: {
            name: "銀行",
            icon: "landmark",
            cost: 300,
            baseCost: 300,
            costMultiplier: 1.12,
            effects: {
                autoFunds: 10,         // 1秒あたり10の自動収入
                fundStorage: 500       // 資金保管容量を500増加
            },
            description: "自動的に収入を生み出し、資金の保管容量を増やします。"
        },
        INVESTMENT_FIRM: {
            name: "投資会社",
            icon: "chart-line",
            cost: 1000,
            baseCost: 1000,
            costMultiplier: 1.15,
            effects: {
                fundMultiplier: 0.05,  // 全ての収入源から5%増加
                autoFunds: 25
            },
            description: "すべての収入を5%増加させ、自動的に資金を生み出します。"
        },
        TECH_STARTUP: {
            name: "テック企業",
            icon: "laptop-code",
            cost: 5000,
            baseCost: 5000,
            costMultiplier: 1.18,
            effects: {
                clickMultiplier: 0.3,
                autoFunds: 100,
                fundMultiplier: 0.02
            },
            description: "クリック価値を大幅に向上させ、大きな自動収入を生み出します。"
        },
        TRADING_CENTER: {
            name: "貿易センター",
            icon: "globe-asia",
            cost: 25000,
            baseCost: 25000,
            costMultiplier: 1.2,
            effects: {
                autoFunds: 500,
                fundMultiplier: 0.1
            },
            description: "国際的な取引で大量の資金を生み出します。すべての収入源を強化します。"
        }
    },
    
    // アップグレード設定
    UPGRADES: {
        BETTER_TOOLS: {
            name: "改良ツール",
            cost: 100,
            icon: "tools",
            effect: {
                clickMultiplier: 0.5    // クリック価値が50%増加
            },
            description: "クリックごとの収入を50%増加させます。",
            requirement: { totalClicks: 20 }
        },
        EFFICIENT_PROCESS: {
            name: "効率的な工程",
            cost: 500,
            icon: "cogs",
            effect: {
                autoFundsMultiplier: 0.3    // 自動収入が30%増加
            },
            description: "自動収入を30%増加させます。",
            requirement: { totalFunds: 1000 }
        },
        ADVANCED_ECONOMY: {
            name: "先進経済",
            cost: 2000,
            icon: "chart-line",
            effect: {
                allMultiplier: 0.2    // すべての収入が20%増加
            },
            description: "すべての収入源からの収入を20%増加させます。",
            requirement: { buildings: { INVESTMENT_FIRM: 1 } }
        },
        DIGITAL_CURRENCY: {
            name: "デジタル通貨",
            cost: 5000,
            icon: "money-bill-wave",
            effect: {
                clickMultiplier: 1.0,     // クリック価値が2倍
                autoFundsMultiplier: 0.2  // 自動収入が20%増加
            },
            description: "最先端の通貨システムで、クリック価値が2倍になり、自動収入も増加します。",
            requirement: { buildings: { TECH_STARTUP: 1 } }
        },
        GLOBAL_NETWORK: {
            name: "グローバルネットワーク",
            cost: 20000,
            icon: "project-diagram",
            effect: {
                allMultiplier: 0.5    // すべての収入が50%増加
            },
            description: "世界的なビジネスネットワークを構築し、すべての収入を50%増加させます。",
            requirement: { buildings: { TRADING_CENTER: 1 } }
        },
        CLICK_AUTOMATION: {
            name: "クリック自動化",
            cost: 10000,
            icon: "robot",
            effect: {
                autoClick: 1    // 1秒あたり1回の自動クリック
            },
            description: "1秒ごとに自動的にクリックします。クリックによる収入をそのまま獲得できます。",
            requirement: { totalClicks: 1000 }
        }
    },
    
    // 実績設定
    ACHIEVEMENTS: {
        FIRST_STEPS: {
            name: "最初の一歩",
            icon: "baby",
            requirement: { totalClicks: 10 },
            bonus: { clickMultiplier: 0.1 },
            description: "10回クリックする"
        },
        DEDICATED_MAYOR: {
            name: "献身的な市長",
            icon: "user-tie",
            requirement: { totalClicks: 100 },
            bonus: { clickMultiplier: 0.2 },
            description: "100回クリックする"
        },
        CLICK_MASTER: {
            name: "クリックマスター",
            icon: "hand-pointer",
            requirement: { totalClicks: 1000 },
            bonus: { clickMultiplier: 0.5 },
            description: "1000回クリックする"
        },
        FINANCIAL_GENIUS: {
            name: "財政の天才",
            icon: "donate",
            requirement: { totalFunds: 10000 },
            bonus: { fundMultiplier: 0.1 },
            description: "総資金額10,000に到達する"
        },
        ECONOMIC_EMPIRE: {
            name: "経済帝国",
            icon: "crown",
            requirement: { totalFunds: 100000 },
            bonus: { fundMultiplier: 0.2, allMultiplier: 0.1 },
            description: "総資金額100,000に到達する"
        },
        BUILDING_COLLECTOR: {
            name: "建物収集家",
            icon: "building",
            requirement: { 
                buildings: { 
                    COIN_MINT: 10, 
                    BANK: 5, 
                    INVESTMENT_FIRM: 3 
                } 
            },
            bonus: { autoFundsMultiplier: 0.2 },
            description: "コイン工場を10個、銀行を5個、投資会社を3個建設する"
        },
        UPGRADE_ENTHUSIAST: {
            name: "アップグレード愛好家",
            icon: "arrow-up",
            requirement: { upgrades: 3 },  // 3種類のアップグレードを購入
            bonus: { allMultiplier: 0.15 },
            description: "3種類のアップグレードを購入する"
        },
        TECH_PIONEER: {
            name: "技術開拓者",
            icon: "microchip",
            requirement: { buildings: { TECH_STARTUP: 3 } },
            bonus: { clickMultiplier: 0.3, autoFundsMultiplier: 0.2 },
            description: "テック企業を3つ建設する"
        },
        GLOBAL_TRADER: {
            name: "グローバルトレーダー",
            icon: "globe",
            requirement: { buildings: { TRADING_CENTER: 2 } },
            bonus: { fundMultiplier: 0.3 },
            description: "貿易センターを2つ建設する"
        }
    },
    
    // 特殊アビリティ設定
    SPECIAL_ABILITIES: {
        GOLD_RUSH: {
            name: "ゴールドラッシュ",
            icon: "meteor",
            cooldown: 300,      // 秒単位での使用間隔
            duration: 30,       // 秒単位での効果時間
            effect: {
                clickMultiplier: 5.0,    // クリック価値が5倍
                visualEffect: "goldRain"
            },
            description: "一定時間、クリック価値が5倍になります。"
        },
        MARKET_BOOM: {
            name: "マーケットブーム",
            icon: "chart-line",
            cooldown: 600,
            duration: 45,
            effect: {
                autoFundsMultiplier: 3.0,    // 自動収入が3倍
                visualEffect: "graphUp"
            },
            description: "一定時間、自動収入が3倍になります。",
            requirement: { buildings: { INVESTMENT_FIRM: 2 } }
        },
        TAX_HOLIDAY: {
            name: "税金優遇",
            icon: "piggy-bank",
            cooldown: 1800,
            duration: 60,
            effect: {
                allMultiplier: 2.0,      // すべての収入が2倍
                visualEffect: "coins"
            },
            description: "一定時間、すべての収入源からの資金が2倍になります。",
            requirement: { buildings: { BANK: 5 } }
        }
    }
};

export const ClickerText = {
    TITLE: "資金稼ぎモード",
    DESCRIPTION: "都市アイコンをクリックして資金を稼ぎましょう！建物を購入すると自動的に資金が増えます。",
    CLICK_VALUE: "クリック価値: ¥{value}",
    AUTO_INCOME: "自動収入: ¥{value}/秒",
    TOTAL_EARNED: "総獲得資金: ¥{value}",
    TOTAL_CLICKS: "総クリック数: {value}回",
    UNLOCK_MESSAGE: "新しい建物「{building}」がアンロックされました！",
    ACHIEVEMENT_UNLOCKED: "実績解除: {name}",
    SPECIAL_ABILITY_ACTIVATED: "{name}を発動！（効果時間: {duration}秒）",
    SPECIAL_ABILITY_READY: "{name}が使用可能になりました！",
    SPECIAL_ABILITY_COOLDOWN: "{name}のクールダウン: {time}秒",
    BUY_MAX: "最大購入",
    STATS_TAB: "統計",
    BUILDINGS_TAB: "建物",
    UPGRADES_TAB: "アップグレード",
    ACHIEVEMENTS_TAB: "実績",
    ABILITIES_TAB: "特殊能力",
    AUTO_CLICK: "自動クリック: {value}/秒",
    NO_BUILDINGS: "まだ建物はアンロックされていません。資金を稼いで新しい建物をアンロックしましょう！",
    NO_UPGRADES: "まだアップグレードはアンロックされていません。条件を満たすとアンロックされます。",
    NO_ABILITIES: "まだ特殊能力はアンロックされていません。さらに都市を発展させましょう！",
    UPGRADE_ITEM_FORMAT: "{name} - ¥{cost}",
    BUILDING_ITEM_FORMAT: "{name} ({count}) - ¥{cost}",
    COST_LABEL: "コスト: ¥{cost}",
    PURCHASED: "購入済み",
    UNLOCKED: "達成済み",
    LOCKED: "ロック中"
};

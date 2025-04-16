/**
 * CitySim - ClickerModel クラス
 * クリッカーゲームの機能とデータを管理
 */

import { GameConfig } from '../config/GameConfig.js';
import { EventEmitter } from '../services/EventEmitter.js';

export class ClickerModel {
    /**
     * クリッカーモデルの初期化
     * @param {City} city - 都市モデル
     */
    constructor(city) {
        this.city = city;
        this.events = new EventEmitter();
        
        // 基本プロパティの初期化
        this.clickValue = GameConfig.CLICKER.BASE_CLICK_VALUE; // クリック当たりの獲得資金
        this.autoFundsPerSecond = 0; // 自動収入（1秒あたり）
        this.totalClicks = 0; // 総クリック数
        this.totalEarned = 0; // 総獲得資金
        
        // 乗数の初期化
        this.clickMultiplier = 1.0; // クリック価値の乗数
        this.autoFundsMultiplier = 1.0; // 自動収入の乗数
        this.allMultiplier = 1.0; // 全ての収入の乗数
        
        // 所有建物の初期化
        this.buildings = {
            COIN_MINT: 0,
            BANK: 0,
            INVESTMENT_FIRM: 0
        };
        
        // アップグレードの初期化
        this.upgrades = {
            BETTER_TOOLS: false,
            EFFICIENT_PROCESS: false,
            ADVANCED_ECONOMY: false
        };
        
        // 実績の初期化
        this.achievements = {
            FIRST_STEPS: false,
            DEDICATED_MAYOR: false,
            FINANCIAL_GENIUS: false
        };
        
        // アンロック状態の初期化
        this.unlocked = {
            COIN_MINT: false,
            BANK: false,
            INVESTMENT_FIRM: false
        };
        
        // タイマーの初期化
        this.autoFundsTimer = null;
    }
    
    /**
     * クリックで資金を獲得する
     * @returns {number} - 獲得した資金
     */
    click() {
        // クリック数を増加
        this.totalClicks++;
        
        // 実績のチェック
        this._checkAchievements();
        
        // アンロック状態の確認
        this._checkUnlocks();
        
        // クリック価値の計算
        const baseValue = this.clickValue * this.clickMultiplier;
        const finalValue = baseValue * this.allMultiplier;
        const roundedValue = Math.floor(finalValue);
        
        // 資金を増加
        this.city.funds += roundedValue;
        this.totalEarned += roundedValue;
        
        // クリックイベントを発行
        this.events.emit('click', {
            value: roundedValue,
            totalClicks: this.totalClicks,
            totalEarned: this.totalEarned
        });
        
        return roundedValue;
    }
    
    /**
     * 自動収入を処理する
     * @returns {number} - 獲得した資金
     */
    processAutoFunds() {
        if (this.autoFundsPerSecond <= 0) return 0;
        
        // 自動収入の計算
        const baseValue = this.autoFundsPerSecond * this.autoFundsMultiplier;
        const finalValue = baseValue * this.allMultiplier;
        const roundedValue = Math.floor(finalValue);
        
        // 資金を増加
        this.city.funds += roundedValue;
        this.totalEarned += roundedValue;
        
        // アンロック状態の確認
        this._checkUnlocks();
        
        // 実績のチェック
        this._checkAchievements();
        
        // 自動収入イベントを発行
        this.events.emit('autoFunds', {
            value: roundedValue,
            totalEarned: this.totalEarned
        });
        
        return roundedValue;
    }
    
    /**
     * 自動収入タイマーを開始する
     */
    startAutoFunds() {
        if (this.autoFundsTimer) {
            clearInterval(this.autoFundsTimer);
        }
        
        this.autoFundsTimer = setInterval(() => {
            this.processAutoFunds();
        }, GameConfig.CLICKER.AUTO_FUNDS_INTERVAL);
    }
    
    /**
     * 自動収入タイマーを停止する
     */
    stopAutoFunds() {
        if (this.autoFundsTimer) {
            clearInterval(this.autoFundsTimer);
            this.autoFundsTimer = null;
        }
    }
    
    /**
     * 建物を購入する
     * @param {string} buildingType - 建物タイプ
     * @returns {Object} - 購入結果
     */
    buyBuilding(buildingType) {
        // 建物設定の取得
        const buildingConfig = GameConfig.BUILDINGS[buildingType];
        if (!buildingConfig) {
            return {
                success: false,
                message: `未知の建物タイプです: ${buildingType}`
            };
        }
        
        // アンロック状態の確認
        if (!this.unlocked[buildingType] && this.unlocked.hasOwnProperty(buildingType)) {
            return {
                success: false,
                message: `この建物はまだアンロックされていません。`
            };
        }
        
        // 購入コストの計算（所有数に応じて上昇）
        const ownedCount = this.buildings[buildingType] || 0;
        const cost = Math.floor(buildingConfig.cost * Math.pow(1.15, ownedCount));
        
        // 資金不足チェック
        if (this.city.funds < cost) {
            return {
                success: false,
                message: `資金が足りません。必要金額: ¥${cost} | 現在の資金: ¥${this.city.funds.toLocaleString()}`
            };
        }
        
        // 購入処理
        this.city.funds -= cost;
        this.buildings[buildingType] = (this.buildings[buildingType] || 0) + 1;
        
        // 効果の適用
        this._applyBuildingEffects(buildingType, buildingConfig.effects);
        
        // 変更を通知
        this.events.emit('buildingPurchased', {
            type: buildingType,
            count: this.buildings[buildingType],
            cost: cost,
            effects: buildingConfig.effects
        });
        
        return {
            success: true,
            message: `${buildingConfig.name}を購入しました。残りの資金: ¥${this.city.funds.toLocaleString()}`,
            newCount: this.buildings[buildingType]
        };
    }
    
    /**
     * アップグレードを購入する
     * @param {string} upgradeType - アップグレードタイプ
     * @returns {Object} - 購入結果
     */
    buyUpgrade(upgradeType) {
        // アップグレード設定の取得
        const upgradeConfig = GameConfig.CLICKER.UPGRADES[upgradeType];
        if (!upgradeConfig) {
            return {
                success: false,
                message: `未知のアップグレードタイプです: ${upgradeType}`
            };
        }
        
        // 既に購入済みかチェック
        if (this.upgrades[upgradeType]) {
            return {
                success: false,
                message: `このアップグレードは既に購入済みです。`
            };
        }
        
        // 資金不足チェック
        if (this.city.funds < upgradeConfig.cost) {
            return {
                success: false,
                message: `資金が足りません。必要金額: ¥${upgradeConfig.cost} | 現在の資金: ¥${this.city.funds.toLocaleString()}`
            };
        }
        
        // 購入処理
        this.city.funds -= upgradeConfig.cost;
        this.upgrades[upgradeType] = true;
        
        // 効果の適用
        this._applyUpgradeEffects(upgradeType, upgradeConfig.effect);
        
        // 変更を通知
        this.events.emit('upgradePurchased', {
            type: upgradeType,
            cost: upgradeConfig.cost,
            effect: upgradeConfig.effect
        });
        
        return {
            success: true,
            message: `${upgradeConfig.name}を購入しました。残りの資金: ¥${this.city.funds.toLocaleString()}`
        };
    }
    
    /**
     * 現在のクリッカーの状態を取得する
     * @returns {Object} - 状態データ
     */
    getStatus() {
        return {
            clickValue: this._calculateClickValue(),
            autoFundsPerSecond: this._calculateAutoFundsValue(),
            totalClicks: this.totalClicks,
            totalEarned: this.totalEarned,
            buildings: {...this.buildings},
            upgrades: {...this.upgrades},
            achievements: {...this.achievements},
            unlocked: {...this.unlocked}
        };
    }
    
    /**
     * クリッカーの状態をシリアライズする
     * @returns {Object} - シリアライズされたデータ
     */
    serialize() {
        return {
            clickValue: this.clickValue,
            autoFundsPerSecond: this.autoFundsPerSecond,
            totalClicks: this.totalClicks,
            totalEarned: this.totalEarned,
            clickMultiplier: this.clickMultiplier,
            autoFundsMultiplier: this.autoFundsMultiplier,
            allMultiplier: this.allMultiplier,
            buildings: {...this.buildings},
            upgrades: {...this.upgrades},
            achievements: {...this.achievements},
            unlocked: {...this.unlocked}
        };
    }
    
    /**
     * シリアライズされたデータから状態を復元する
     * @param {Object} data - シリアライズされたデータ
     */
    deserialize(data) {
        if (!data) return;
        
        this.clickValue = data.clickValue || this.clickValue;
        this.autoFundsPerSecond = data.autoFundsPerSecond || this.autoFundsPerSecond;
        this.totalClicks = data.totalClicks || this.totalClicks;
        this.totalEarned = data.totalEarned || this.totalEarned;
        this.clickMultiplier = data.clickMultiplier || this.clickMultiplier;
        this.autoFundsMultiplier = data.autoFundsMultiplier || this.autoFundsMultiplier;
        this.allMultiplier = data.allMultiplier || this.allMultiplier;
        
        if (data.buildings) {
            this.buildings = {...data.buildings};
        }
        
        if (data.upgrades) {
            this.upgrades = {...data.upgrades};
        }
        
        if (data.achievements) {
            this.achievements = {...data.achievements};
        }
        
        if (data.unlocked) {
            this.unlocked = {...data.unlocked};
        }
        
        // アンロック状態の再確認
        this._checkUnlocks();
    }
    
    /**
     * 建物の効果を適用する（プライベートメソッド）
     * @param {string} type - 建物タイプ
     * @param {Object} effects - 建物の効果
     * @private
     */
    _applyBuildingEffects(type, effects) {
        if (effects.clickMultiplier) {
            this.clickMultiplier += effects.clickMultiplier;
        }
        
        if (effects.autoFunds) {
            this.autoFundsPerSecond += effects.autoFunds;
        }
        
        if (effects.fundMultiplier) {
            this.allMultiplier += effects.fundMultiplier;
        }
    }
    
    /**
     * アップグレードの効果を適用する（プライベートメソッド）
     * @param {string} type - アップグレードタイプ
     * @param {Object} effect - アップグレードの効果
     * @private
     */
    _applyUpgradeEffects(type, effect) {
        if (effect.clickMultiplier) {
            this.clickMultiplier += effect.clickMultiplier;
        }
        
        if (effect.autoFundsMultiplier) {
            this.autoFundsMultiplier += effect.autoFundsMultiplier;
        }
        
        if (effect.allMultiplier) {
            this.allMultiplier += effect.allMultiplier;
        }
    }
    
    /**
     * 実績の効果を適用する（プライベートメソッド）
     * @param {string} achievementType - 実績タイプ
     * @param {Object} bonus - 実績のボーナス効果
     * @private
     */
    _applyAchievementBonus(achievementType, bonus) {
        if (bonus.clickMultiplier) {
            this.clickMultiplier += bonus.clickMultiplier;
        }
        
        if (bonus.autoFundsMultiplier) {
            this.autoFundsMultiplier += bonus.autoFundsMultiplier;
        }
        
        if (bonus.fundMultiplier) {
            this.allMultiplier += bonus.fundMultiplier;
        }
    }
    
    /**
     * 実績の達成状況をチェックする（プライベートメソッド）
     * @private
     */
    _checkAchievements() {
        const achievements = GameConfig.CLICKER.ACHIEVEMENTS;
        
        for (const [key, achievement] of Object.entries(achievements)) {
            // 既に達成済みならスキップ
            if (this.achievements[key]) continue;
            
            let achieved = false;
            
            // 条件の確認
            if (achievement.requirement.totalClicks && this.totalClicks >= achievement.requirement.totalClicks) {
                achieved = true;
            }
            
            if (achievement.requirement.totalFunds && this.totalEarned >= achievement.requirement.totalFunds) {
                achieved = true;
            }
            
            if (achieved) {
                // 実績を解除
                this.achievements[key] = true;
                
                // ボーナス効果を適用
                if (achievement.bonus) {
                    this._applyAchievementBonus(key, achievement.bonus);
                }
                
                // 実績解除イベントを発行
                this.events.emit('achievementUnlocked', {
                    achievement: key,
                    name: achievement.name,
                    description: achievement.description,
                    bonus: achievement.bonus
                });
            }
        }
    }
    
    /**
     * 建物のアンロック状態をチェックする（プライベートメソッド）
     * @private
     */
    _checkUnlocks() {
        const thresholds = GameConfig.CLICKER.UNLOCK_THRESHOLDS;
        
        for (const [key, threshold] of Object.entries(thresholds)) {
            // 既にアンロック済みならスキップ
            if (this.unlocked[key]) continue;
            
            // 閾値の確認
            if (this.totalEarned >= threshold) {
                // アンロック
                this.unlocked[key] = true;
                
                // アンロックイベントを発行
                const buildingConfig = GameConfig.BUILDINGS[key];
                if (buildingConfig) {
                    this.events.emit('buildingUnlocked', {
                        type: key,
                        name: buildingConfig.name,
                        cost: buildingConfig.cost,
                        effects: buildingConfig.effects
                    });
                }
            }
        }
    }
    
    /**
     * 現在のクリック価値を計算する（プライベートメソッド）
     * @returns {number} - クリック価値
     * @private
     */
    _calculateClickValue() {
        const baseValue = this.clickValue * this.clickMultiplier;
        return Math.floor(baseValue * this.allMultiplier);
    }
    
    /**
     * 現在の自動収入価値を計算する（プライベートメソッド）
     * @returns {number} - 自動収入
     * @private
     */
    _calculateAutoFundsValue() {
        const baseValue = this.autoFundsPerSecond * this.autoFundsMultiplier;
        return Math.floor(baseValue * this.allMultiplier);
    }
}

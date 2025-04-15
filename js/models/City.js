/**
 * CitySim - City クラス
 * ゲームの主要データモデル
 */

import { GameConfig } from '../config/GameConfig.js';
import { Building } from './Building.js';
import { EventEmitter } from '../services/EventEmitter.js';

export class City {
    /**
     * 都市の初期化
     * @param {Object} options - 初期化オプション
     */
    constructor(options = {}) {
        // 基本プロパティの初期化
        this.name = options.name || 'New City';
        this.year = options.year || GameConfig.INITIAL_YEAR;
        this.population = options.population || GameConfig.INITIAL_POPULATION;
        this.funds = options.funds || GameConfig.INITIAL_FUNDS;
        this.happiness = options.happiness || GameConfig.INITIAL_HAPPINESS;
        this.environment = options.environment || GameConfig.INITIAL_ENVIRONMENT;
        this.education = options.education || GameConfig.INITIAL_EDUCATION;
        this.taxRate = options.taxRate || GameConfig.INITIAL_TAX_RATE;
        
        // 建物の初期化
        this.buildings = {
            house: options.buildings?.house || 0,
            factory: options.buildings?.factory || 0,
            road: options.buildings?.road || 0,
            school: options.buildings?.school || 0,
            park: options.buildings?.park || 0,
            hospital: options.buildings?.hospital || 0
        };
        
        // タイムスタンプの初期化
        this.createdAt = options.createdAt || new Date();
        this.lastUpdated = options.lastUpdated || new Date();
        
        // イベントエミッターの初期化
        this.events = new EventEmitter();
    }
    
    /**
     * 建物を建設する
     * @param {string} type - 建物タイプ
     * @returns {Object} - 建設結果（成功/失敗とメッセージ）
     */
    buildStructure(type) {
        // 建物設定の取得
        const buildingConfig = GameConfig.BUILDINGS[type.toUpperCase()];
        if (!buildingConfig) {
            return {
                success: false,
                message: `未知の建物タイプです: ${type}`
            };
        }
        
        // 建設コストの確認
        if (this.funds < buildingConfig.cost) {
            return {
                success: false,
                message: `資金が足りません。必要金額: ¥${buildingConfig.cost} | 現在の資金: ¥${this.funds.toLocaleString()}`
            };
        }
        
        // 建物の建設
        this.funds -= buildingConfig.cost;
        this.buildings[type.toLowerCase()]++;
        
        // 建物の効果を適用
        this._applyBuildingEffects(type.toLowerCase(), buildingConfig.effects);
        
        // 変更を通知
        this._notifyChange({
            type: 'build',
            buildingType: type,
            cost: buildingConfig.cost
        });
        
        return {
            success: true,
            message: `新しい${buildingConfig.name}が建設されました。残りの資金: ¥${this.funds.toLocaleString()}`
        };
    }
    
    /**
     * 税率を設定する
     * @param {number} rate - 新しい税率 (0.0〜0.5)
     * @returns {Object} - 結果（成功/失敗とメッセージ）
     */
    setTaxRate(rate) {
        // 入力値の検証
        if (typeof rate !== 'number' || isNaN(rate) || rate < GameConfig.POLICIES.TAX_MIN || rate > GameConfig.POLICIES.TAX_MAX) {
            return {
                success: false,
                message: `税率は${GameConfig.POLICIES.TAX_MIN * 100}%から${GameConfig.POLICIES.TAX_MAX * 100}%の間で設定してください。`
            };
        }
        
        const oldRate = this.taxRate;
        this.taxRate = rate;
        
        // 変更を通知
        this._notifyChange({
            type: 'taxChange',
            oldRate,
            newRate: rate
        });
        
        return {
            success: true,
            message: `税率が ${(rate * 100).toFixed(1)}% に設定されました。${rate > 0.15 ? '警告: 高い税率は市民の幸福度に悪影響を与える可能性があります。' : ''}`
        };
    }
    
    /**
     * 次の年に進める
     * @returns {Object} - 年度更新の結果
     */
    advanceYear() {
        const oldYear = this.year;
        this.year++;
        
        // 税収と工場収入を計算
        const taxIncome = Math.floor(this.population * 10 * this.taxRate);
        const factoryIncome = this.buildings.factory * GameConfig.BUILDINGS.FACTORY.effects.funds;
        const totalIncome = taxIncome + factoryIncome;
        
        // 収入を追加
        this.funds += totalIncome;
        
        // 年ごとの自然変動を適用
        this._applyYearlyChanges();
        
        // 変更を通知
        this._notifyChange({
            type: 'yearEnd',
            oldYear,
            newYear: this.year,
            taxIncome,
            factoryIncome,
            totalIncome
        });
        
        return {
            success: true,
            year: this.year,
            taxIncome,
            factoryIncome,
            totalIncome
        };
    }
    
    /**
     * イベントの影響を適用する
     * @param {Object} event - 適用するイベント
     * @returns {Object} - 適用結果
     */
    applyEvent(event) {
        const effects = event.effects;
        const appliedEffects = {};
        
        // 基本指標への効果を適用
        if (effects.population) {
            this.population = Math.max(0, this.population + effects.population);
            appliedEffects.population = effects.population;
        }
        
        if (effects.funds) {
            this.funds = Math.max(0, this.funds + effects.funds);
            appliedEffects.funds = effects.funds;
        }
        
        if (effects.happiness) {
            this.happiness = Math.min(100, Math.max(0, this.happiness + effects.happiness));
            appliedEffects.happiness = effects.happiness;
        }
        
        if (effects.environment) {
            this.environment = Math.min(100, Math.max(0, this.environment + effects.environment));
            appliedEffects.environment = effects.environment;
        }
        
        if (effects.education) {
            this.education = Math.min(100, Math.max(0, this.education + effects.education));
            appliedEffects.education = effects.education;
        }
        
        // 建物への効果を適用
        if (effects.buildings) {
            Object.entries(effects.buildings).forEach(([buildingType, change]) => {
                this.buildings[buildingType] = Math.max(0, this.buildings[buildingType] + change);
                if (!appliedEffects.buildings) appliedEffects.buildings = {};
                appliedEffects.buildings[buildingType] = change;
            });
        }
        
        // 変更を通知
        this._notifyChange({
            type: 'event',
            event: event.id,
            effects: appliedEffects
        });
        
        return {
            success: true,
            effects: appliedEffects
        };
    }
    
    /**
     * 現在の都市の状態をシリアライズする
     * @returns {Object} - シリアライズされた都市データ
     */
    serialize() {
        return {
            name: this.name,
            year: this.year,
            population: this.population,
            funds: this.funds,
            happiness: this.happiness,
            environment: this.environment,
            education: this.education,
            taxRate: this.taxRate,
            buildings: { ...this.buildings },
            createdAt: this.createdAt.toISOString(),
            lastUpdated: new Date().toISOString()
        };
    }
    
    /**
     * シリアライズされたデータから都市を復元する
     * @param {Object} data - シリアライズされたデータ
     * @returns {City} - 復元された都市インスタンス
     */
    static deserialize(data) {
        return new City({
            ...data,
            createdAt: new Date(data.createdAt),
            lastUpdated: new Date(data.lastUpdated)
        });
    }
    
    /**
     * 年ごとの自然変動を適用する（プライベートメソッド）
     */
    _applyYearlyChanges() {
        // 人口自然増加（住宅と幸福度に基づく）
        const populationGrowth = Math.floor(
            this.buildings.house * (this.happiness / 100) * GameConfig.POLICIES.POPULATION_GROWTH_FACTOR
        );
        
        if (populationGrowth > 0) {
            this.population += populationGrowth;
            
            // 人口増加イベントを発行
            this.events.emit('populationGrowth', {
                amount: populationGrowth,
                newPopulation: this.population
            });
        }
        
        // 環境の自然回復（工場数に反比例）
        if (this.buildings.factory === 0) {
            this.environment = Math.min(100, this.environment + 5);
        } else {
            const environmentRecovery = Math.max(0, 5 - Math.floor(this.buildings.factory / 2));
            this.environment = Math.min(100, this.environment + environmentRecovery);
        }
        
        // 税率に基づく幸福度変動
        const taxEffect = Math.floor((GameConfig.POLICIES.TAX_NEUTRAL_POINT - this.taxRate) * GameConfig.POLICIES.TAX_EFFECT_MULTIPLIER);
        this.happiness = Math.min(100, Math.max(0, this.happiness + taxEffect));
        
        if (this.taxRate > 0.15 && taxEffect < 0) {
            // 高税率不満イベントを発行
            this.events.emit('taxDispleasure', {
                taxRate: this.taxRate,
                happinessChange: taxEffect
            });
        }
    }
    
    /**
     * 建物の効果を適用する（プライベートメソッド）
     * @param {string} type - 建物タイプ
     * @param {Object} effects - 建物の効果
     */
    _applyBuildingEffects(type, effects) {
        if (effects.population) {
            this.population += effects.population;
        }
        
        if (effects.happiness) {
            this.happiness = Math.min(100, Math.max(0, this.happiness + effects.happiness));
        }
        
        if (effects.environment) {
            this.environment = Math.min(100, Math.max(0, this.environment + effects.environment));
        }
        
        if (effects.education) {
            this.education = Math.min(100, Math.max(0, this.education + effects.education));
        }
    }
    
    /**
     * 変更を通知する（プライベートメソッド）
     * @param {Object} detail - 変更の詳細
     */
    _notifyChange(detail) {
        this.lastUpdated = new Date();
        this.events.emit('change', {
            ...detail,
            city: this
        });
    }
}

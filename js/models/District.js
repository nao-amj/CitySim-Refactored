/**
 * CitySim - District クラス
 * 都市内の地区を表現するモデル
 */

import { GameConfig } from '../config/GameConfig.js';
import { EventEmitter } from '../services/EventEmitter.js';

export class District {
    /**
     * 地区の初期化
     * @param {Object} options - 初期化オプション
     */
    constructor(options = {}) {
        // 基本プロパティの初期化
        this.id = options.id || `district_${Date.now()}`;
        this.name = options.name || '新しい地区';
        this.type = options.type || 'residential'; // 地区タイプ: residential, commercial, industrial, education, eco
        this.level = options.level || 1;
        this.size = options.size || 1; // 地区の大きさ（1〜5）
        this.buildings = options.buildings || {};
        this.position = options.position || { x: 0, y: 0 }; // マップ上の位置
        this.specialization = options.specialization || null; // 地区の特殊化（任意）
        this.createdAt = options.createdAt || new Date();
        
        // メトリクス
        this.metrics = {
            population: options.metrics?.population || 0,
            happiness: options.metrics?.happiness || 50,
            environment: options.metrics?.environment || 50,
            education: options.metrics?.education || 0,
            income: options.metrics?.income || 0
        };
        
        // ステータス効果
        this.effects = options.effects || this._getDefaultEffects();
        
        // イベントエミッターの初期化
        this.events = new EventEmitter();
    }
    
    /**
     * 地区にビルディングを追加する
     * @param {string} buildingType - 建物タイプ
     * @param {number} count - 追加する数（デフォルト: 1）
     * @returns {boolean} - 追加が成功したかどうか
     */
    addBuilding(buildingType, count = 1) {
        // 建物のタイプが地区タイプと互換性があるか確認
        if (!this._isCompatibleBuilding(buildingType)) {
            return false;
        }
        
        // 建物を追加
        if (!this.buildings[buildingType]) {
            this.buildings[buildingType] = 0;
        }
        
        this.buildings[buildingType] += count;
        
        // 効果を更新
        this._updateEffects();
        
        // 変更を通知
        this._notifyChange({
            type: 'buildingAdded',
            buildingType,
            count
        });
        
        return true;
    }
    
    /**
     * 地区を次のレベルにアップグレードする
     * @returns {Object} - アップグレード結果
     */
    upgrade() {
        // 最大レベルチェック
        if (this.level >= GameConfig.DISTRICTS.MAX_LEVEL) {
            return {
                success: false,
                message: 'この地区はすでに最大レベルです。'
            };
        }
        
        // アップグレード条件チェック
        const levelConfig = GameConfig.DISTRICTS.UPGRADE_REQUIREMENTS[this.level];
        if (levelConfig) {
            // 条件チェックを実装（必要に応じて）
        }
        
        // レベルを上げる
        this.level++;
        
        // 効果を更新
        this._updateEffects();
        
        // 変更を通知
        this._notifyChange({
            type: 'levelUp',
            newLevel: this.level
        });
        
        return {
            success: true,
            message: `地区が次のレベルにアップグレードされました（レベル ${this.level}）。`,
            level: this.level
        };
    }
    
    /**
     * 地区の専門化を設定する
     * @param {string} specialization - 専門化の種類
     * @returns {Object} - 専門化の結果
     */
    setSpecialization(specialization) {
        // 専門化が地区タイプに互換性があるか確認
        if (!this._isCompatibleSpecialization(specialization)) {
            return {
                success: false,
                message: 'この専門化はこの地区タイプでは使用できません。'
            };
        }
        
        this.specialization = specialization;
        
        // 効果を更新
        this._updateEffects();
        
        // 変更を通知
        this._notifyChange({
            type: 'specializationChanged',
            specialization
        });
        
        return {
            success: true,
            message: `地区の専門化が「${specialization}」に設定されました。`,
            specialization
        };
    }
    
    /**
     * 都市の統計に対する地区の貢献度を取得する
     * @returns {Object} - 貢献度
     */
    getContribution() {
        return {
            population: this.metrics.population,
            happiness: this.effects.happiness || 0,
            environment: this.effects.environment || 0,
            education: this.effects.education || 0,
            income: this.metrics.income,
            buildings: { ...this.buildings }
        };
    }
    
    /**
     * 時間経過による地区の更新
     * @param {Object} cityState - 都市の現在の状態
     * @returns {Object} - 更新された効果
     */
    update(cityState) {
        // 地区の人口の更新
        this._updatePopulation(cityState);
        
        // 地区の収入の更新
        this._updateIncome(cityState);
        
        // 環境影響の更新
        this._updateEnvironment(cityState);
        
        // 変更を通知
        this._notifyChange({
            type: 'update',
            metrics: { ...this.metrics }
        });
        
        return this.effects;
    }
    
    /**
     * 地区データをシリアライズする
     * @returns {Object} - シリアライズされたデータ
     */
    serialize() {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            level: this.level,
            size: this.size,
            buildings: { ...this.buildings },
            position: { ...this.position },
            specialization: this.specialization,
            metrics: { ...this.metrics },
            effects: { ...this.effects },
            createdAt: this.createdAt.toISOString()
        };
    }
    
    /**
     * シリアライズされたデータから地区インスタンスを復元する
     * @param {Object} data - シリアライズされたデータ
     * @returns {District} - 復元された地区インスタンス
     */
    static deserialize(data) {
        return new District({
            ...data,
            createdAt: new Date(data.createdAt)
        });
    }
    
    /**
     * 地区タイプに基づいたデフォルト効果を取得する（プライベートメソッド）
     * @returns {Object} - デフォルト効果
     * @private
     */
    _getDefaultEffects() {
        switch (this.type) {
            case 'residential':
                return {
                    population: 10 * this.level,
                    happiness: 2 * this.level,
                    environment: 0
                };
            case 'commercial':
                return {
                    population: 0,
                    happiness: 3 * this.level,
                    income: 20 * this.level,
                    environment: -1 * this.level
                };
            case 'industrial':
                return {
                    population: 0,
                    happiness: -1 * this.level,
                    income: 50 * this.level,
                    environment: -5 * this.level
                };
            case 'education':
                return {
                    population: 0,
                    happiness: 3 * this.level,
                    education: 10 * this.level,
                    environment: 1 * this.level
                };
            case 'eco':
                return {
                    population: 0,
                    happiness: 5 * this.level,
                    environment: 10 * this.level
                };
            default:
                return {};
        }
    }
    
    /**
     * 建物タイプが地区タイプと互換性があるか確認する（プライベートメソッド）
     * @param {string} buildingType - 建物タイプ
     * @returns {boolean} - 互換性があるかどうか
     * @private
     */
    _isCompatibleBuilding(buildingType) {
        const compatibilityMap = {
            residential: ['house', 'road', 'park'],
            commercial: ['road', 'park'],
            industrial: ['factory', 'road'],
            education: ['school', 'road', 'park'],
            eco: ['park', 'road']
        };
        
        return compatibilityMap[this.type]?.includes(buildingType) || false;
    }
    
    /**
     * 専門化が地区タイプと互換性があるか確認する（プライベートメソッド）
     * @param {string} specialization - 専門化
     * @returns {boolean} - 互換性があるかどうか
     * @private
     */
    _isCompatibleSpecialization(specialization) {
        const compatibilityMap = {
            residential: ['luxury', 'affordable', 'mixed'],
            commercial: ['tourism', 'shopping', 'office'],
            industrial: ['tech', 'manufacturing', 'logistics'],
            education: ['elementary', 'highschool', 'university'],
            eco: ['conservation', 'recreation', 'renewable']
        };
        
        return compatibilityMap[this.type]?.includes(specialization) || false;
    }
    
    /**
     * 地区の効果を更新する（プライベートメソッド）
     * @private
     */
    _updateEffects() {
        // 基本効果を取得
        const baseEffects = this._getDefaultEffects();
        
        // 建物効果を追加
        const buildingEffects = this._calculateBuildingEffects();
        
        // 専門化効果を追加
        const specializationEffects = this._calculateSpecializationEffects();
        
        // 効果を結合
        this.effects = {
            population: (baseEffects.population || 0) + (buildingEffects.population || 0) + (specializationEffects.population || 0),
            happiness: (baseEffects.happiness || 0) + (buildingEffects.happiness || 0) + (specializationEffects.happiness || 0),
            environment: (baseEffects.environment || 0) + (buildingEffects.environment || 0) + (specializationEffects.environment || 0),
            education: (baseEffects.education || 0) + (buildingEffects.education || 0) + (specializationEffects.education || 0),
            income: (baseEffects.income || 0) + (buildingEffects.income || 0) + (specializationEffects.income || 0)
        };
    }
    
    /**
     * 建物の効果を計算する（プライベートメソッド）
     * @returns {Object} - 建物効果
     * @private
     */
    _calculateBuildingEffects() {
        let effects = {
            population: 0,
            happiness: 0,
            environment: 0,
            education: 0,
            income: 0
        };
        
        // 建物タイプごとに効果を集計
        Object.entries(this.buildings).forEach(([type, count]) => {
            const buildingConfig = GameConfig.BUILDINGS[type.toUpperCase()];
            if (!buildingConfig) return;
            
            // 建物の効果を加算
            if (buildingConfig.effects.population) {
                effects.population += buildingConfig.effects.population * count;
            }
            
            if (buildingConfig.effects.happiness) {
                effects.happiness += buildingConfig.effects.happiness * count;
            }
            
            if (buildingConfig.effects.environment) {
                effects.environment += buildingConfig.effects.environment * count;
            }
            
            if (buildingConfig.effects.education) {
                effects.education += buildingConfig.effects.education * count;
            }
            
            if (buildingConfig.effects.funds) {
                effects.income += buildingConfig.effects.funds * count;
            }
        });
        
        return effects;
    }
    
    /**
     * 専門化の効果を計算する（プライベートメソッド）
     * @returns {Object} - 専門化効果
     * @private
     */
    _calculateSpecializationEffects() {
        if (!this.specialization) {
            return {};
        }
        
        // 専門化タイプに応じた効果を返す
        const specializationConfig = GameConfig.DISTRICTS.SPECIALIZATIONS[this.type]?.[this.specialization];
        return specializationConfig?.effects || {};
    }
    
    /**
     * 地区の人口を更新する（プライベートメソッド）
     * @param {Object} cityState - 都市の現在の状態
     * @private
     */
    _updatePopulation(cityState) {
        if (this.type !== 'residential') return;
        
        // 住宅の数に基づいて人口キャパシティを計算
        const houseCount = this.buildings.house || 0;
        const populationCapacity = houseCount * 10 * this.level; // 住宅1件あたり10人、レベルで倍率
        
        // 現在の幸福度と環境に基づいた成長率を計算
        const growthRate = ((cityState.happiness / 100) * 0.7 + (cityState.environment / 100) * 0.3) * 0.05;
        
        // 人口成長の計算（キャパシティに達するまで）
        if (this.metrics.population < populationCapacity) {
            const growth = Math.floor(this.metrics.population * growthRate) + 1;
            this.metrics.population = Math.min(this.metrics.population + growth, populationCapacity);
        }
    }
    
    /**
     * 地区の収入を更新する（プライベートメソッド）
     * @param {Object} cityState - 都市の現在の状態
     * @private
     */
    _updateIncome(cityState) {
        // 地区タイプに応じた基本収入を計算
        let baseIncome = 0;
        
        switch (this.type) {
            case 'commercial':
                // 商業地区は人口と幸福度の影響を受ける
                baseIncome = 20 * this.level * (cityState.population / 100 + 1) * (cityState.happiness / 100 + 0.5);
                break;
            case 'industrial':
                // 工業地区は工場数と人口の影響を受ける
                const factoryCount = this.buildings.factory || 0;
                baseIncome = 50 * factoryCount * this.level;
                break;
            default:
                // その他の地区はレベルに応じた少額の収入
                baseIncome = 5 * this.level;
        }
        
        // 教育レベルによるボーナス
        const educationBonus = 1 + (cityState.education / 100) * 0.5;
        
        // 最終収入を設定
        this.metrics.income = Math.floor(baseIncome * educationBonus);
    }
    
    /**
     * 地区の環境影響を更新する（プライベートメソッド）
     * @param {Object} cityState - 都市の現在の状態
     * @private
     */
    _updateEnvironment(cityState) {
        // 各地区タイプの環境基本値を設定
        const baseEnvironmentEffects = {
            residential: -1,
            commercial: -2,
            industrial: -5,
            education: 1,
            eco: 5
        };
        
        // 環境効果の計算
        const environmentEffect = baseEnvironmentEffects[this.type] * this.level;
        
        // 公園による効果
        const parkCount = this.buildings.park || 0;
        const parkEffect = parkCount * 3;
        
        // 環境効果を地区に設定
        this.effects.environment = environmentEffect + parkEffect;
    }
    
    /**
     * 変更を通知する（プライベートメソッド）
     * @param {Object} detail - 変更の詳細
     * @private
     */
    _notifyChange(detail) {
        this.events.emit('change', {
            ...detail,
            district: this
        });
    }
}

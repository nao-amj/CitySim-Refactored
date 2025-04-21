/**
 * CitySim - City クラス
 * ゲームの主要データモデル
 */

import { GameConfig } from '../config/GameConfig.js';
import { DistrictsConfig } from '../config/DistrictsConfig.js';
import { Building } from './Building.js';
import { District } from './District.js';
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
        
        // 地区の初期化
        this.districts = options.districts || [];
        
        // 統計データの初期化
        this.statistics = options.statistics || {
            population: [],
            funds: [],
            happiness: [],
            environment: [],
            education: []
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
     * @param {string|null} districtId - 地区ID（省略可）
     * @returns {Object} - 建設結果（成功/失敗とメッセージ）
     */
    buildStructure(type, districtId = null) {
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
        
        // 特定の地区に建設する場合
        if (districtId) {
            const district = this.districts.find(d => d.id === districtId);
            if (!district) {
                return {
                    success: false,
                    message: `指定された地区が見つかりません: ${districtId}`
                };
            }
            
            // 地区と建物の互換性をチェック
            if (!district._isCompatibleBuilding(type.toLowerCase())) {
                return {
                    success: false,
                    message: `${buildingConfig.name}はこの地区タイプ（${district.type}）では建設できません。`
                };
            }
            
            // 建物を地区に追加
            this.funds -= buildingConfig.cost;
            district.addBuilding(type.toLowerCase());
            
            // 変更を通知
            this._notifyChange({
                type: 'build',
                buildingType: type,
                districtId: districtId,
                cost: buildingConfig.cost
            });
            
            return {
                success: true,
                message: `新しい${buildingConfig.name}が「${district.name}」地区に建設されました。残りの資金: ¥${this.funds.toLocaleString()}`
            };
        }
        
        // 通常の建設（地区を指定しない場合）
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
     * 地区を作成する
     * @param {string} type - 地区タイプ
     * @param {Object} options - オプション（名前、位置など）
     * @returns {Object} - 作成結果
     */
    createDistrict(type, options = {}) {
        // 地区タイプの確認
        const districtConfig = DistrictsConfig.TYPES[type.toUpperCase()];
        if (!districtConfig) {
            return {
                success: false,
                message: `未知の地区タイプです: ${type}`
            };
        }
        
        // 地区数上限のチェック
        if (this.districts.length >= DistrictsConfig.MAX_DISTRICTS) {
            return {
                success: false,
                message: `地区の最大数（${DistrictsConfig.MAX_DISTRICTS}）に達しています。`
            };
        }
        
        // 資金チェック（型を数値化）
        const currentFunds = Number(this.funds);
        const requiredCost = Number(districtConfig.cost);
        if (currentFunds < requiredCost) {
            return {
                success: false,
                message: `資金が足りません。必要金額: ¥${requiredCost} | 現在の資金: ¥${currentFunds.toLocaleString()}`
            };
        }

        // 地区の作成
        const districtName = options.name || `${districtConfig.name} ${this.districts.length + 1}`;
        const district = new District({
            name: districtName,
            type: districtConfig.id,
            position: options.position || { x: 0, y: 0 }
        });
        
        // 資金を引く
        this.funds = currentFunds - requiredCost;
        
        // 地区を追加
        this.districts.push(district);
        
        // 地区の変更イベントをリッスン
        district.events.on('change', (detail) => {
            this._handleDistrictChange(detail);
        });
        
        // 変更を通知
        this._notifyChange({
            type: 'districtCreated',
            district: district,
            cost: districtConfig.cost
        });
        
        return {
            success: true,
            message: `新しい地区「${districtName}」が作成されました。残りの資金: ¥${this.funds.toLocaleString()}`,
            district: district
        };
    }
    
    /**
     * 地区を取得する
     * @param {string} districtId - 地区ID
     * @returns {District|null} - 地区オブジェクトまたはnull
     */
    getDistrict(districtId) {
        return this.districts.find(d => d.id === districtId) || null;
    }
    
    /**
     * 全ての地区を取得する
     * @param {string|null} type - フィルタリングする地区タイプ（オプション）
     * @returns {Array} - 地区の配列
     */
    getAllDistricts(type = null) {
        if (type) {
            return this.districts.filter(d => d.type === type);
        }
        return [...this.districts];
    }
    
    /**
     * 地区をアップグレードする
     * @param {string} districtId - 地区ID
     * @returns {Object} - アップグレード結果
     */
    upgradeDistrict(districtId) {
        const district = this.getDistrict(districtId);
        if (!district) {
            return {
                success: false,
                message: `指定された地区が見つかりません: ${districtId}`
            };
        }
        
        // アップグレード要件のチェック
        const level = district.level;
        const requirements = DistrictsConfig.UPGRADE_REQUIREMENTS[level];
        
        if (requirements) {
            // 資金チェック
            if (this.funds < requirements.funds) {
                return {
                    success: false,
                    message: `資金が足りません。必要金額: ¥${requirements.funds} | 現在の資金: ¥${this.funds.toLocaleString()}`
                };
            }
            
            // 人口チェック
            if (this.population < requirements.population) {
                return {
                    success: false,
                    message: `人口が足りません。必要人口: ${requirements.population}人 | 現在の人口: ${this.population}人`
                };
            }
        }
        
        // 資金を引く
        if (requirements) {
            this.funds -= requirements.funds;
        }
        
        // アップグレード実行
        const result = district.upgrade();
        
        if (result.success) {
            // 変更を通知
            this._notifyChange({
                type: 'districtUpgraded',
                districtId: districtId,
                newLevel: result.level
            });
        }
        
        return result;
    }
    
    /**
     * 地区の専門化を設定する
     * @param {string} districtId - 地区ID
     * @param {string} specialization - 専門化タイプ
     * @returns {Object} - 設定結果
     */
    setDistrictSpecialization(districtId, specialization) {
        const district = this.getDistrict(districtId);
        if (!district) {
            return {
                success: false,
                message: `指定された地区が見つかりません: ${districtId}`
            };
        }
        
        // 専門化の設定
        const result = district.setSpecialization(specialization);
        
        if (result.success) {
            // 変更を通知
            this._notifyChange({
                type: 'districtSpecialized',
                districtId: districtId,
                specialization: specialization
            });
        }
        
        return result;
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
        
        // 地区からの人口・収入を集計
        this._updateDistrictsContribution();
        
        // 税収と工場収入を計算
        const taxIncome = Math.floor(this.population * 10 * this.taxRate);
        
        // 地区からの収入とレガシー工場収入を計算
        let districtIncome = 0;
        this.districts.forEach(district => {
            districtIncome += district.metrics.income;
        });
        
        const factoryIncome = this.buildings.factory * GameConfig.BUILDINGS.FACTORY.effects.funds;
        const totalIncome = taxIncome + factoryIncome + districtIncome;
        
        // 収入を追加
        this.funds += totalIncome;
        
        // 年ごとの自然変動を適用
        this._applyYearlyChanges();
        
        // 統計データを記録
        this._recordStatistics();
        
        // 変更を通知
        this._notifyChange({
            type: 'yearEnd',
            oldYear,
            newYear: this.year,
            taxIncome,
            factoryIncome,
            districtIncome,
            totalIncome
        });
        
        return {
            success: true,
            year: this.year,
            taxIncome,
            factoryIncome,
            districtIncome,
            totalIncome
        };
    }
    
    /**
     * イベントの影響を適用する
     * @param {Object} event - 適用するイベント
     * @param {string|null} districtId - 特定の地区に適用する場合はその地区ID
     * @returns {Object} - 適用結果
     */
    applyEvent(event, districtId = null) {
        const effects = event.effects;
        const appliedEffects = {};
        
        // 特定の地区に適用する場合
        if (districtId) {
            const district = this.getDistrict(districtId);
            if (!district) {
                return {
                    success: false,
                    message: `指定された地区が見つかりません: ${districtId}`
                };
            }
            
            // イベント効果を地区に適用（地区モデル側で処理）
            // ここでは簡略化のため、直接効果を設定
            for (const [key, value] of Object.entries(effects)) {
                if (district.metrics[key] !== undefined) {
                    district.metrics[key] = Math.max(0, district.metrics[key] + value);
                    appliedEffects[key] = value;
                }
            }
            
            // 変更を通知
            this._notifyChange({
                type: 'districtEvent',
                districtId,
                event: event.id,
                effects: appliedEffects
            });
            
            return {
                success: true,
                effects: appliedEffects
            };
        }
        
        // 都市全体に適用（従来の実装）
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
        // 地区データのシリアライズ
        const serializedDistricts = this.districts.map(district => district.serialize());
        
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
            districts: serializedDistricts,
            statistics: { ...this.statistics },
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
        // 地区データの復元
        let districts = [];
        if (data.districts && Array.isArray(data.districts)) {
            districts = data.districts.map(districtData => District.deserialize(districtData));
        }
        
        return new City({
            ...data,
            districts,
            createdAt: new Date(data.createdAt),
            lastUpdated: new Date(data.lastUpdated)
        });
    }
    
    /**
     * 年ごとの自然変動を適用する（プライベートメソッド）
     * @private
     */
    _applyYearlyChanges() {
        // 地区ごとの更新
        this.districts.forEach(district => {
            district.update(this);
        });
        
        // レガシーな人口自然増加（住宅と幸福度に基づく）（地区がない場合の互換性のため）
        if (this.districts.length === 0) {
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
        }
        
        // 環境の自然回復（工場数と地区環境影響に反比例）
        let environmentImpact = 0;
        
        // 地区からの環境影響を集計
        this.districts.forEach(district => {
            environmentImpact += district.effects.environment || 0;
        });
        
        // レガシーな工場影響（地区がない場合）
        if (this.districts.length === 0 && this.buildings.factory > 0) {
            const environmentRecovery = Math.max(0, 5 - Math.floor(this.buildings.factory / 2));
            this.environment = Math.min(100, this.environment + environmentRecovery);
        } else {
            // 環境を更新
            this.environment = Math.min(100, Math.max(0, this.environment + (environmentImpact / 10) + 1));
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
     * @private
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
        
        // 資金効果（工場など）
        if (effects.funds) {
            // 建設時には適用せず、年ごとの収入として計算
        }
    }
    
    /**
     * 地区からの貢献を更新する（プライベートメソッド）
     * @private
     */
    _updateDistrictsContribution() {
        if (this.districts.length === 0) return;
        
        // 地区からの人口とメトリクスを集計
        let totalPopulationFromDistricts = 0;
        let totalHappinessEffect = 0;
        let totalEducationEffect = 0;
        
        this.districts.forEach(district => {
            const contribution = district.getContribution();
            
            totalPopulationFromDistricts += contribution.population;
            totalHappinessEffect += contribution.happiness;
            totalEducationEffect += contribution.education;
            
            // 各地区の個別のアップデートはdistrict.update()で実行済み
        });
        
        // 人口の更新（地区からの人口で上書き）
        this.population = totalPopulationFromDistricts;
        
        // 幸福度と教育への影響（効果の平均を適用）
        if (this.districts.length > 0) {
            const avgHappinessEffect = totalHappinessEffect / this.districts.length;
            const avgEducationEffect = totalEducationEffect / this.districts.length;
            
            this.happiness = Math.min(100, Math.max(0, this.happiness + avgHappinessEffect / 5));
            this.education = Math.min(100, Math.max(0, this.education + avgEducationEffect / 5));
        }
    }
    
    /**
     * 地区の変更を処理する（プライベートメソッド）
     * @param {Object} detail - 変更の詳細
     * @private
     */
    _handleDistrictChange(detail) {
        // 地区の変更を都市に反映
        // ここでは簡略化のため、都市全体の変更通知のみ行う
        this._notifyChange({
            type: 'districtChanged',
            district: detail.district,
            changeType: detail.type
        });
    }
    
    /**
     * 統計データを記録する（プライベートメソッド）
     * @private
     */
    _recordStatistics() {
        // 現在の年と主要指標を記録
        const currentStats = {
            year: this.year,
            value: null
        };
        
        // 統計データが大きくなりすぎないように、最大50件までに制限
        const MAX_STATS_HISTORY = 50;
        
        // 人口統計
        currentStats.value = this.population;
        this.statistics.population.push({...currentStats});
        if (this.statistics.population.length > MAX_STATS_HISTORY) {
            this.statistics.population.shift();
        }
        
        // 資金統計
        currentStats.value = this.funds;
        this.statistics.funds.push({...currentStats});
        if (this.statistics.funds.length > MAX_STATS_HISTORY) {
            this.statistics.funds.shift();
        }
        
        // 幸福度統計
        currentStats.value = this.happiness;
        this.statistics.happiness.push({...currentStats});
        if (this.statistics.happiness.length > MAX_STATS_HISTORY) {
            this.statistics.happiness.shift();
        }
        
        // 環境統計
        currentStats.value = this.environment;
        this.statistics.environment.push({...currentStats});
        if (this.statistics.environment.length > MAX_STATS_HISTORY) {
            this.statistics.environment.shift();
        }
        
        // 教育統計
        currentStats.value = this.education;
        this.statistics.education.push({...currentStats});
        if (this.statistics.education.length > MAX_STATS_HISTORY) {
            this.statistics.education.shift();
        }
    }
    
    /**
     * 変更を通知する（プライベートメソッド）
     * @param {Object} detail - 変更の詳細
     * @private
     */
    _notifyChange(detail) {
        this.lastUpdated = new Date();
        this.events.emit('change', {
            ...detail,
            city: this
        });
    }
}

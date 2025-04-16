/**
 * CitySim - GameController クラス
 * ゲームロジックの中心的な制御を担当
 */

import { GameConfig } from '../config/GameConfig.js';
import { DistrictsConfig } from '../config/DistrictsConfig.js';
import { BuildingFactory } from '../models/Building.js';
import { EventEmitter } from '../services/EventEmitter.js';

export class GameController {
    /**
     * ゲームコントローラーの初期化
     * @param {City} city - 都市モデル
     * @param {TimeManager} timeManager - 時間管理クラス
     * @param {EventSystem} eventSystem - イベントシステム
     * @param {UIController} uiController - UIコントローラー
     */
    constructor(city, timeManager, eventSystem, uiController) {
        this.city = city;
        this.timeManager = timeManager;
        this.eventSystem = eventSystem;
        this.uiController = uiController;
        this.events = new EventEmitter();
        
        // セーブデータロード試行
        this.loaded = false;
        
        // UIコントローラーからのイベントをリッスン
        this._setupUIEventListeners();
    }
    
    /**
     * ゲームを開始する
     */
    start() {
        console.log('Game starting...');
        
        // 時間マネージャーを開始
        this.timeManager.start();
        
        // UIの初期化
        this.uiController.updateAllStatDisplays();
        
        // ゲーム開始通知
        this.events.emit('gameStarted', {
            city: this.city,
            timestamp: new Date()
        });
    }
    
    /**
     * 建物を建設する
     * @param {string} type - 建物タイプ
     * @param {string|null} districtId - 地区ID（オプション）
     * @returns {Object} - 建設結果
     */
    buildStructure(type, districtId = null) {
        return this.city.buildStructure(type, districtId);
    }
    
    /**
     * 地区を作成する
     * @param {string} type - 地区タイプ
     * @param {Object} options - オプション（名前、位置など）
     * @returns {Object} - 作成結果
     */
    createDistrict(type, options = {}) {
        return this.city.createDistrict(type, options);
    }
    
    /**
     * 地区をアップグレードする
     * @param {string} districtId - 地区ID
     * @returns {Object} - アップグレード結果
     */
    upgradeDistrict(districtId) {
        return this.city.upgradeDistrict(districtId);
    }
    
    /**
     * 地区の専門化を設定する
     * @param {string} districtId - 地区ID
     * @param {string|null} specialization - 専門化タイプ（nullで解除）
     * @returns {Object} - 設定結果
     */
    setDistrictSpecialization(districtId, specialization) {
        return this.city.setDistrictSpecialization(districtId, specialization);
    }
    
    /**
     * 税率を設定する
     * @param {number} rate - 新しい税率
     * @returns {Object} - 設定結果
     */
    setTaxRate(rate) {
        return this.city.setTaxRate(rate);
    }
    
    /**
     * 次の年に進める
     * @returns {Object} - 年度更新の結果
     */
    advanceYear() {
        return this.city.advanceYear();
    }
    
    /**
     * 税率設定ダイアログを表示する
     */
    showTaxRateDialog() {
        const currentRate = (this.city.taxRate * 100).toFixed(1);
        const newRateStr = prompt('新しい税率を入力してください（パーセント）:', currentRate);
        
        if (newRateStr === null) return; // キャンセルされた
        
        const newRate = parseFloat(newRateStr) / 100;
        
        // 有効な数値かチェック
        if (isNaN(newRate) || newRate < GameConfig.POLICIES.TAX_MIN || newRate > GameConfig.POLICIES.TAX_MAX) {
            alert(`税率は${GameConfig.POLICIES.TAX_MIN * 100}%から${GameConfig.POLICIES.TAX_MAX * 100}%の間で設定してください。`);
            return;
        }
        
        // 税率を設定
        this.setTaxRate(newRate);
    }
    
    /**
     * UIイベントリスナーを設定する
     * @private
     */
    _setupUIEventListeners() {
        // 建設リクエスト
        this.uiController.events.on('buildRequest', (data) => {
            const result = this.buildStructure(data.type);
            
            if (!result.success) {
                // 失敗した場合はエラーメッセージを表示
                this.uiController.addEventToLog({
                    title: '建設失敗',
                    message: result.message,
                    type: 'event-danger',
                    icon: 'exclamation-circle'
                });
            }
        });
        
        // 地区内建設リクエスト
        this.uiController.events.on('buildInDistrictRequest', (data) => {
            const result = this.buildStructure(data.type, data.districtId);
            
            if (!result.success) {
                // 失敗した場合はエラーメッセージを表示
                this.uiController.addEventToLog({
                    title: '建設失敗',
                    message: result.message,
                    type: 'event-danger',
                    icon: 'exclamation-circle'
                });
            }
        });
        
        // 地区作成リクエスト
        this.uiController.events.on('createDistrictRequest', (data) => {
            const result = this.createDistrict(data.type, {
                name: data.name,
                position: data.position || { x: 0, y: 0 }
            });
            
            if (!result.success) {
                // 失敗した場合はエラーメッセージを表示
                this.uiController.addEventToLog({
                    title: '地区作成失敗',
                    message: result.message,
                    type: 'event-danger',
                    icon: 'exclamation-circle'
                });
            }
        });
        
        // 地区アップグレードリクエスト
        this.uiController.events.on('upgradeDistrictRequest', (data) => {
            const result = this.upgradeDistrict(data.districtId);
            
            if (!result.success) {
                // 失敗した場合はエラーメッセージを表示
                this.uiController.addEventToLog({
                    title: '地区アップグレード失敗',
                    message: result.message,
                    type: 'event-danger',
                    icon: 'exclamation-circle'
                });
            }
        });
        
        // 地区専門化設定リクエスト
        this.uiController.events.on('setDistrictSpecializationRequest', (data) => {
            // specialization が null の場合は専門化解除
            const result = this.setDistrictSpecialization(data.districtId, data.specialization);
            
            if (!result.success) {
                // 失敗した場合はエラーメッセージを表示
                this.uiController.addEventToLog({
                    title: '専門化設定失敗',
                    message: result.message,
                    type: 'event-danger',
                    icon: 'exclamation-circle'
                });
            }
        });
        
        // 税率設定リクエスト
        this.uiController.events.on('taxRateRequest', () => {
            this.showTaxRateDialog();
        });
        
        // 次の年へリクエスト
        this.uiController.events.on('nextYearRequest', () => {
            this.advanceYear();
        });
        
        // イベントシステムからのイベント通知
        this.eventSystem.events.on('eventTriggered', (data) => {
            // UIにイベントを表示
            this.uiController.addEventToLog({
                title: data.event.title,
                message: data.event.message,
                type: data.event.type,
                icon: data.event.icon
            });
        });
        
        // 都市からの人口増加通知
        this.city.events.on('populationGrowth', (data) => {
            this.uiController.addEventToLog({
                title: '人口増加',
                message: `新しい市民が <strong>${data.amount}人</strong> 移住してきました。<br>現在の人口: <strong>${data.newPopulation}人</strong>`,
                type: 'event-success',
                icon: 'users'
            });
        });
        
        // 都市からの税率不満通知
        this.city.events.on('taxDispleasure', (data) => {
            this.uiController.addEventToLog({
                title: '高税率への不満',
                message: `市民は現在の税率 <strong>${(data.taxRate * 100).toFixed(1)}%</strong> に不満を持っています。<br>幸福度が <strong>${Math.abs(data.happinessChange)}%</strong> 低下しました。`,
                type: 'event-warning',
                icon: 'frown'
            });
        });
        
        // 時間マネージャーからの年変更通知
        this.timeManager.events.on('yearChanged', (data) => {
            // 自動で年度更新（オプション機能）
            if (GameConfig.AUTO_ADVANCE_YEAR) {
                this.advanceYear();
            }
        });
        
        // 地区関連のランダムイベント（拡張）
        this.timeManager.events.on('monthChanged', () => {
            // 地区がある場合のみ実行
            if (this.city.districts.length > 0) {
                this._checkDistrictRandomEvents();
            }
        });
    }
    
    /**
     * 地区関連のランダムイベントをチェックする
     * @private
     */
    _checkDistrictRandomEvents() {
        // イベント発生確率（30%）
        const eventChance = 0.3;
        
        if (Math.random() > eventChance) {
            return;
        }
        
        // ランダムに地区を選択
        const districts = this.city.getAllDistricts();
        if (districts.length === 0) return;
        
        const randomDistrict = districts[Math.floor(Math.random() * districts.length)];
        
        // イベントタイプを決定（成長または衰退）
        const isPositive = Math.random() > 0.3; // 70%の確率で良いイベント
        
        const eventConfig = isPositive ? 
            DistrictsConfig.EVENTS.DISTRICT_GROWTH : 
            DistrictsConfig.EVENTS.DISTRICT_DECLINE;
        
        // イベント効果を作成
        const event = {
            id: eventConfig.id,
            title: `${randomDistrict.name}地区: ${eventConfig.title}`,
            message: eventConfig.description,
            type: isPositive ? 'event-success' : 'event-warning',
            icon: eventConfig.icon,
            effects: { ...eventConfig.effects }
        };
        
        // レベルに応じて効果を調整
        for (const [key, value] of Object.entries(event.effects)) {
            event.effects[key] = value * randomDistrict.level;
        }
        
        // イベントを適用
        this.city.applyEvent(event, randomDistrict.id);
        
        // イベントを通知
        this.uiController.addEventToLog({
            title: event.title,
            message: `「${randomDistrict.name}」地区で${event.message}`,
            type: event.type,
            icon: event.icon
        });
    }
    
    /**
     * 保存データを読み込む
     * @param {SaveManager} saveManager - セーブマネージャー
     * @returns {Object} - 読み込み結果
     */
    loadGame(saveManager) {
        if (!saveManager) {
            return {
                success: false,
                message: 'セーブマネージャーが提供されていません。'
            };
        }
        
        const result = saveManager.loadGame();
        
        if (result.success) {
            // 読み込んだデータでモデルを更新
            this.city = result.city;
            
            if (result.timeManager) {
                // 時間マネージャーのプロパティを更新
                this.timeManager.setTime({
                    hour: result.timeManager.hour,
                    day: result.timeManager.day,
                    month: result.timeManager.month,
                    year: result.timeManager.year
                });
                
                if (result.timeManager.paused) {
                    this.timeManager.pause();
                } else {
                    this.timeManager.resume();
                }
            }
            
            // UIを更新
            this.uiController.updateAllStatDisplays();
            this.uiController.updateClock();
            
            // 読み込み完了通知
            this.loaded = true;
            this.events.emit('gameLoaded', {
                city: this.city,
                timestamp: new Date(),
                saveTimestamp: new Date(result.timestamp)
            });
            
            // 読み込み完了メッセージを表示
            this.uiController.addEventToLog({
                title: 'ゲームデータ読み込み完了',
                message: `${new Date(result.timestamp).toLocaleString()}のセーブデータを読み込みました。`,
                type: 'event-success',
                icon: 'save'
            });
        } else {
            // 読み込み失敗メッセージを表示
            this.uiController.addEventToLog({
                title: 'ゲームデータ読み込み失敗',
                message: result.message,
                type: 'event-danger',
                icon: 'exclamation-triangle'
            });
        }
        
        return result;
    }
    
    /**
     * ゲームを保存する
     * @param {SaveManager} saveManager - セーブマネージャー
     * @param {string} saveType - 保存タイプ
     * @returns {Object} - 保存結果
     */
    saveGame(saveManager, saveType = 'manual') {
        if (!saveManager) {
            return {
                success: false,
                message: 'セーブマネージャーが提供されていません。'
            };
        }
        
        const result = saveManager.saveGame(saveType);
        
        if (result.success && saveType === 'manual') {
            // 保存完了メッセージを表示（自動保存では表示しない）
            this.uiController.addEventToLog({
                title: 'ゲームデータ保存完了',
                message: result.message,
                type: 'event-success',
                icon: 'save'
            });
        } else if (!result.success) {
            // 保存失敗メッセージを表示
            this.uiController.addEventToLog({
                title: 'ゲームデータ保存失敗',
                message: result.message,
                type: 'event-danger',
                icon: 'exclamation-triangle'
            });
        }
        
        return result;
    }
    
    /**
     * 統計データをエクスポートする（新機能）
     * @returns {Object} - エクスポート結果
     */
    exportStatistics() {
        if (!this.city.statistics) {
            return {
                success: false,
                message: '統計データがありません。'
            };
        }
        
        try {
            // 統計データをJSON文字列に変換
            const statsData = JSON.stringify(this.city.statistics, null, 2);
            
            // Blobを作成してダウンロード
            const blob = new Blob([statsData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `citysim-stats-${this.city.name}-${this.city.year}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            return {
                success: true,
                message: '統計データのエクスポートが完了しました。'
            };
        } catch (error) {
            console.error('Statistics export error:', error);
            return {
                success: false,
                message: `統計データのエクスポートに失敗しました: ${error.message}`
            };
        }
    }
    
    /**
     * デバッグモードを切り替える
     */
    toggleDebugMode() {
        GameConfig.DEBUG_MODE = !GameConfig.DEBUG_MODE;
        
        if (GameConfig.DEBUG_MODE) {
            console.log('Debug mode enabled');
            
            // デバッグ用にグローバル変数を設定
            window.game = {
                controller: this,
                city: this.city,
                timeManager: this.timeManager,
                eventSystem: this.eventSystem,
                uiController: this.uiController
            };
            
            this.uiController.addEventToLog({
                title: 'デバッグモード有効化',
                message: 'コンソールで window.game からゲームオブジェクトにアクセスできます。',
                type: 'event-system',
                icon: 'bug'
            });
        } else {
            console.log('Debug mode disabled');
            
            // デバッグ用グローバル変数を削除
            delete window.game;
            
            this.uiController.addEventToLog({
                title: 'デバッグモード無効化',
                message: 'デバッグモードを無効にしました。',
                type: 'event-system',
                icon: 'bug'
            });
        }
        
        return GameConfig.DEBUG_MODE;
    }
}

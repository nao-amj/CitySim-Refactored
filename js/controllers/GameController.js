/**
 * CitySim - GameController クラス
 * ゲームロジックの中心的な制御を担当
 */

import { GameConfig } from '../config/GameConfig.js';
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
     * @returns {Object} - 建設結果
     */
    buildStructure(type) {
        return this.city.buildStructure(type);
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

/**
 * CitySim - EventSystem クラス
 * ゲーム内でのイベント発生を管理
 */

import { GameConfig } from '../config/GameConfig.js';
import { EventsConfig, getAllEvents, getValidEvents } from '../config/EventsConfig.js';
import { EventEmitter } from '../services/EventEmitter.js';

export class EventSystem {
    /**
     * イベントシステムの初期化
     * @param {City} city - 都市モデル
     * @param {TimeManager} timeManager - 時間管理クラス
     */
    constructor(city, timeManager) {
        this.city = city;
        this.timeManager = timeManager;
        this.events = new EventEmitter();
        
        // イベント履歴
        this.eventHistory = [];
        this.maxHistorySize = GameConfig.EVENT_CHANCE;
        
        // 時間変化イベントの監視を開始
        this._setupTimeEvents();
    }
    
    /**
     * ランダムイベントの発生をチェックする
     * @returns {Object|null} - 発生したイベント、またはnull
     */
    checkRandomEvent() {
        // イベント発生確率によるスキップ
        if (Math.random() > GameConfig.EVENT_CHANCE) {
            return null;
        }
        
        // 現在の都市の状態に基づいてイベントをフィルタリング
        const availableEvents = getValidEvents(this.city);
        
        if (availableEvents.length === 0) {
            return null;
        }
        
        // 重み付けされた確率でイベントを選択
        const event = this._selectWeightedEvent(availableEvents);
        
        if (!event) {
            return null;
        }
        
        // イベントを発生させる
        this._triggerEvent(event);
        
        return event;
    }
    
    /**
     * 特定タイプのイベントを強制的に発生させる
     * @param {string} eventId - 発生させるイベントID
     * @returns {Object|null} - 発生したイベント、またはnull
     */
    triggerSpecificEvent(eventId) {
        // すべてのイベント定義から指定されたIDを検索
        const event = getAllEvents().find(e => e.id === eventId);
        
        if (!event) {
            console.error(`指定されたイベントIDが見つかりません: ${eventId}`);
            return null;
        }
        
        // イベントを発生させる
        this._triggerEvent(event);
        
        return event;
    }
    
    /**
     * イベント履歴を取得する
     * @param {number} limit - 取得する履歴の数
     * @returns {Array} - イベント履歴
     */
    getEventHistory(limit = -1) {
        if (limit < 0) {
            return [...this.eventHistory];
        }
        
        return this.eventHistory.slice(0, limit);
    }
    
    /**
     * イベント履歴をクリアする
     */
    clearEventHistory() {
        this.eventHistory = [];
        this.events.emit('historyCleared', {
            timestamp: new Date()
        });
    }
    
    /**
     * 時間変化イベントの監視を設定する
     * @private
     */
    _setupTimeEvents() {
        // 日が変わるたびにランダムイベントをチェック
        this.timeManager.events.on('dayChanged', () => {
            this.checkRandomEvent();
        });
        
        // 月が変わるたびに特別イベントを発生させる可能性
        this.timeManager.events.on('monthChanged', () => {
            // 例: 月に一度特別なイベントの発生確率を上げる
            const specialEventChance = 0.3; // 30%の確率
            
            if (Math.random() < specialEventChance) {
                // 環境イベントや経済イベントなど特定カテゴリのイベントを選択
                const eventTypes = [
                    EventsConfig.ECONOMIC_EVENTS,
                    EventsConfig.ENVIRONMENTAL_EVENTS
                ];
                
                const selectedType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
                const validEvents = selectedType.filter(event => {
                    // 条件がない場合は常に有効
                    if (!event.conditions || Object.keys(event.conditions).length === 0) {
                        return true;
                    }
                    
                    // 各条件をチェック
                    return this._checkEventConditions(event.conditions);
                });
                
                if (validEvents.length > 0) {
                    const event = validEvents[Math.floor(Math.random() * validEvents.length)];
                    this._triggerEvent(event);
                }
            }
        });
    }
    
    /**
     * イベントの条件をチェックする
     * @param {Object} conditions - イベント条件
     * @returns {boolean} - 条件を満たすかどうか
     * @private
     */
    _checkEventConditions(conditions) {
        return Object.entries(conditions).every(([key, condition]) => {
            // 建物条件の特別チェック
            if (key === 'buildings') {
                return Object.entries(condition).every(([buildingType, requirement]) => {
                    const buildingCount = this.city.buildings?.[buildingType] || 0;
                    if (typeof requirement === 'object') {
                        // min/max条件のチェック
                        if (requirement.min !== undefined && buildingCount < requirement.min) return false;
                        if (requirement.max !== undefined && buildingCount > requirement.max) return false;
                        return true;
                    }
                    // 単純な数値比較
                    return buildingCount >= requirement;
                });
            }
            
            // 基本的な数値条件のチェック
            const value = this.city[key];
            if (typeof condition === 'object') {
                if (condition.min !== undefined && value < condition.min) return false;
                if (condition.max !== undefined && value > condition.max) return false;
                return true;
            }
            
            // 単純な数値比較
            return value >= condition;
        });
    }
    
    /**
     * 重み付けされた確率でイベントを選択する
     * @param {Array} availableEvents - 選択可能なイベント配列
     * @returns {Object|null} - 選択されたイベント、またはnull
     * @private
     */
    _selectWeightedEvent(availableEvents) {
        if (availableEvents.length === 0) {
            return null;
        }
        
        // 各イベントの重み付け
        const eventWithWeights = availableEvents.map(event => {
            let weight = event.probability || 0.05; // デフォルト確率
            
            // イベントカテゴリによる重み付け
            if (EventsConfig.NATURAL_DISASTERS.includes(event)) {
                weight *= EventsConfig.TYPE_WEIGHTS.NATURAL_DISASTERS;
            } else if (EventsConfig.ECONOMIC_EVENTS.includes(event)) {
                weight *= EventsConfig.TYPE_WEIGHTS.ECONOMIC_EVENTS;
            } else if (EventsConfig.SOCIAL_EVENTS.includes(event)) {
                weight *= EventsConfig.TYPE_WEIGHTS.SOCIAL_EVENTS;
            } else if (EventsConfig.ENVIRONMENTAL_EVENTS.includes(event)) {
                weight *= EventsConfig.TYPE_WEIGHTS.ENVIRONMENTAL_EVENTS;
            }
            
            return { event, weight };
        });
        
        // 総重みを計算
        const totalWeight = eventWithWeights.reduce((sum, event) => sum + event.weight, 0);
        
        // 確率に基づいてイベントを選択
        let random = Math.random() * totalWeight;
        
        for (const { event, weight } of eventWithWeights) {
            random -= weight;
            if (random <= 0) {
                return event;
            }
        }
        
        // 念のためのフォールバック
        return eventWithWeights[0].event;
    }
    
    /**
     * イベントを発生させる
     * @param {Object} event - 発生させるイベント
     * @private
     */
    _triggerEvent(event) {
        // イベントの効果を都市に適用
        const result = this.city.applyEvent(event);
        
        // イベントを履歴に追加
        const eventRecord = {
            id: event.id,
            title: event.title,
            message: event.message,
            type: event.type,
            icon: event.icon,
            timestamp: new Date(),
            gameTime: this.timeManager.getLogTimeString(),
            effects: result.effects
        };
        
        this.eventHistory.unshift(eventRecord);
        
        // 履歴のサイズを制限
        if (this.eventHistory.length > this.maxHistorySize) {
            this.eventHistory.pop();
        }
        
        // イベント発生を通知
        this.events.emit('eventTriggered', {
            event: eventRecord,
            city: this.city
        });
    }
}

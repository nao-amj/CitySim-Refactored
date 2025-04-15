/**
 * CitySim - SaveManager クラス
 * ゲームデータの保存と読み込みを担当
 */

import { GameConfig } from '../config/GameConfig.js';
import { City } from '../models/City.js';
import { TimeManager } from './TimeManager.js';
import { EventEmitter } from './EventEmitter.js';

export class SaveManager {
    /**
     * セーブマネージャーの初期化
     * @param {City} city - 都市モデル
     * @param {TimeManager} timeManager - 時間管理クラス
     */
    constructor(city, timeManager) {
        this.city = city;
        this.timeManager = timeManager;
        this.autoSaveInterval = null;
        this.events = new EventEmitter();
        
        // ストレージキー
        this.saveKey = GameConfig.STORAGE.SAVE_KEY;
    }
    
    /**
     * 自動保存を開始する
     */
    startAutoSave() {
        // 既存の自動保存をクリア
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
        
        // 新しい自動保存インターバルを設定
        this.autoSaveInterval = setInterval(() => {
            this.saveGame('auto');
        }, GameConfig.STORAGE.AUTO_SAVE_INTERVAL);
        
        // イベント発火
        this.events.emit('autoSaveStarted', {
            interval: GameConfig.STORAGE.AUTO_SAVE_INTERVAL
        });
    }
    
    /**
     * 自動保存を停止する
     */
    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
            
            // イベント発火
            this.events.emit('autoSaveStopped', {
                timestamp: new Date()
            });
        }
    }
    
    /**
     * ゲームを保存する
     * @param {string} saveType - 保存タイプ（'manual', 'auto'）
     * @returns {Object} - 保存結果
     */
    saveGame(saveType = 'manual') {
        try {
            // 保存するデータを準備
            const saveData = {
                city: this.city.serialize(),
                timeManager: this.timeManager ? this.timeManager.serialize() : null,
                saveType,
                timestamp: new Date().toISOString(),
                version: '1.0.0' // データバージョン (将来の互換性のため)
            };
            
            // データをストレージに保存
            localStorage.setItem(this.saveKey, JSON.stringify(saveData));
            
            // イベント発火
            this.events.emit('gameSaved', {
                saveType,
                timestamp: new Date()
            });
            
            return {
                success: true,
                message: `ゲームが${saveType === 'auto' ? '自動' : '手動'}で保存されました。`,
                timestamp: new Date()
            };
        } catch (error) {
            console.error('ゲームの保存中にエラーが発生しました:', error);
            
            // イベント発火
            this.events.emit('saveError', {
                error,
                saveType,
                timestamp: new Date()
            });
            
            return {
                success: false,
                message: 'ゲームの保存中にエラーが発生しました。',
                error
            };
        }
    }
    
    /**
     * ゲームを読み込む
     * @returns {Object} - 読み込み結果
     */
    loadGame() {
        try {
            // ストレージからデータを取得
            const savedData = localStorage.getItem(this.saveKey);
            
            if (!savedData) {
                return {
                    success: false,
                    message: '保存されたゲームデータが見つかりませんでした。'
                };
            }
            
            // JSONデータをパース
            const saveData = JSON.parse(savedData);
            
            // バージョンの確認（将来的にデータ互換性の問題に対応するため）
            if (saveData.version !== '1.0.0') {
                console.warn('異なるバージョンのセーブデータを読み込みます。互換性の問題が発生する可能性があります。');
            }
            
            // 復元した都市と時間マネージャーを返す
            const restoredCity = City.deserialize(saveData.city);
            const restoredTimeManager = saveData.timeManager 
                ? TimeManager.deserialize(saveData.timeManager)
                : null;
            
            // イベント発火
            this.events.emit('gameLoaded', {
                timestamp: new Date(),
                saveTimestamp: new Date(saveData.timestamp)
            });
            
            return {
                success: true,
                message: 'ゲームデータを正常に読み込みました。',
                city: restoredCity,
                timeManager: restoredTimeManager,
                timestamp: saveData.timestamp
            };
        } catch (error) {
            console.error('ゲームデータの読み込み中にエラーが発生しました:', error);
            
            // イベント発火
            this.events.emit('loadError', {
                error,
                timestamp: new Date()
            });
            
            return {
                success: false,
                message: 'ゲームデータの読み込み中にエラーが発生しました。',
                error
            };
        }
    }
    
    /**
     * 保存されたゲームがあるか確認する
     * @returns {boolean} - 保存されたゲームがあるか
     */
    hasSavedGame() {
        return !!localStorage.getItem(this.saveKey);
    }
    
    /**
     * 保存データの情報を取得する（読み込まずに）
     * @returns {Object|null} - 保存データの情報、またはnull
     */
    getSaveInfo() {
        try {
            const savedData = localStorage.getItem(this.saveKey);
            
            if (!savedData) {
                return null;
            }
            
            const saveData = JSON.parse(savedData);
            
            return {
                timestamp: saveData.timestamp,
                saveType: saveData.saveType,
                version: saveData.version,
                cityName: saveData.city.name,
                year: saveData.city.year,
                population: saveData.city.population
            };
        } catch (error) {
            console.error('セーブデータ情報の取得中にエラーが発生しました:', error);
            return null;
        }
    }
    
    /**
     * 保存データを削除する
     * @returns {Object} - 削除結果
     */
    deleteSave() {
        try {
            localStorage.removeItem(this.saveKey);
            
            // イベント発火
            this.events.emit('saveDeleted', {
                timestamp: new Date()
            });
            
            return {
                success: true,
                message: '保存データが削除されました。'
            };
        } catch (error) {
            console.error('保存データの削除中にエラーが発生しました:', error);
            
            return {
                success: false,
                message: '保存データの削除中にエラーが発生しました。',
                error
            };
        }
    }
    
    /**
     * 保存されたデータをエクスポートする
     * @returns {string} - エクスポートされたデータ文字列
     */
    exportSave() {
        try {
            const savedData = localStorage.getItem(this.saveKey);
            
            if (!savedData) {
                throw new Error('保存されたゲームデータが見つかりませんでした。');
            }
            
            // Base64エンコードしてエクスポート（簡易的な方法）
            return btoa(savedData);
        } catch (error) {
            console.error('セーブデータのエクスポート中にエラーが発生しました:', error);
            throw error;
        }
    }
    
    /**
     * エクスポートされたデータをインポートする
     * @param {string} exportedData - エクスポートされたデータ文字列
     * @returns {Object} - インポート結果
     */
    importSave(exportedData) {
        try {
            // Base64デコード
            const savedData = atob(exportedData);
            
            // JSONとして正しいか検証
            const saveData = JSON.parse(savedData);
            
            // 必要なプロパティがあるか確認
            if (!saveData.city || !saveData.timestamp || !saveData.version) {
                throw new Error('無効なセーブデータです。');
            }
            
            // ストレージに保存
            localStorage.setItem(this.saveKey, savedData);
            
            // イベント発火
            this.events.emit('saveImported', {
                timestamp: new Date(),
                saveTimestamp: new Date(saveData.timestamp)
            });
            
            return {
                success: true,
                message: 'セーブデータを正常にインポートしました。',
                timestamp: saveData.timestamp
            };
        } catch (error) {
            console.error('セーブデータのインポート中にエラーが発生しました:', error);
            
            // イベント発火
            this.events.emit('importError', {
                error,
                timestamp: new Date()
            });
            
            return {
                success: false,
                message: '無効なセーブデータです。正しくエクスポートされたデータを使用してください。',
                error
            };
        }
    }
}

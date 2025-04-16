/**
 * CitySim - SaveManager クラス
 * ゲームデータの保存と読み込みを担当
 */

import { GameConfig } from '../config/GameConfig.js';
import { City } from '../models/City.js';

export class SaveManager {
    /**
     * セーブマネージャーの初期化
     * @param {City} city - 都市モデル
     * @param {TimeManager} timeManager - 時間管理クラス（オプション）
     */
    constructor(city, timeManager = null) {
        this.city = city;
        this.timeManager = timeManager;
        this.storageKey = GameConfig.STORAGE.SAVE_KEY;
        this.autoSaveInterval = GameConfig.STORAGE.AUTO_SAVE_INTERVAL;
        this.autoSaveTimerId = null;
        
        // 自動保存の開始
        if (this.autoSaveInterval > 0) {
            this.startAutoSave();
        }
    }
    
    /**
     * ゲームデータを保存する
     * @param {string} saveType - 保存タイプ（'manual'または'auto'）
     * @returns {Object} - 保存結果
     */
    saveGame(saveType = 'manual') {
        try {
            // 都市データの取得
            const cityData = this.city.serialize();
            
            // 時間マネージャーのデータを追加（存在する場合）
            let timeData = null;
            if (this.timeManager) {
                timeData = {
                    hour: this.timeManager.hour,
                    day: this.timeManager.day,
                    month: this.timeManager.month,
                    year: this.timeManager.year,
                    paused: this.timeManager.paused
                };
            }
            
            // 保存データの作成
            const saveData = {
                version: GameConfig.VERSION || '1.0.0',
                timestamp: new Date().toISOString(),
                city: cityData,
                timeManager: timeData
            };
            
            // ローカルストレージに保存
            localStorage.setItem(this.storageKey, JSON.stringify(saveData));
            
            console.log(`Game saved (${saveType}):`, saveData);
            
            return {
                success: true,
                message: `ゲームデータを保存しました。(${saveType === 'manual' ? '手動' : '自動'})`,
                timestamp: saveData.timestamp
            };
        } catch (error) {
            console.error('Save error:', error);
            return {
                success: false,
                message: `保存に失敗しました: ${error.message}`
            };
        }
    }
    
    /**
     * ゲームデータを読み込む
     * @returns {Object} - 読み込み結果
     */
    loadGame() {
        try {
            // ローカルストレージからデータを取得
            const savedData = localStorage.getItem(this.storageKey);
            
            if (!savedData) {
                return {
                    success: false,
                    message: '保存されたゲームデータが見つかりません。'
                };
            }
            
            // JSONデータをパース
            const saveData = JSON.parse(savedData);
            
            // バージョンチェック（必要に応じて）
            const currentVersion = GameConfig.VERSION || '1.0.0';
            if (saveData.version && saveData.version !== currentVersion) {
                console.warn(`Save data version mismatch: ${saveData.version} vs ${currentVersion}`);
                // 必要に応じてマイグレーション処理をここに追加
            }
            
            // 都市データを復元
            const city = City.deserialize(saveData.city);
            
            // 結果を返す
            return {
                success: true,
                message: '保存されたゲームデータを読み込みました。',
                city: city,
                timeManager: saveData.timeManager,
                timestamp: saveData.timestamp
            };
        } catch (error) {
            console.error('Load error:', error);
            return {
                success: false,
                message: `読み込みに失敗しました: ${error.message}`
            };
        }
    }
    
    /**
     * 自動保存を開始する
     */
    startAutoSave() {
        // 既存のタイマーがあれば停止
        if (this.autoSaveTimerId) {
            this.stopAutoSave();
        }
        
        // 新しいタイマーを設定
        this.autoSaveTimerId = setInterval(() => {
            this.saveGame('auto');
        }, this.autoSaveInterval);
        
        console.log(`Auto-save started (interval: ${this.autoSaveInterval / 1000}s)`);
    }
    
    /**
     * 自動保存を停止する
     */
    stopAutoSave() {
        if (this.autoSaveTimerId) {
            clearInterval(this.autoSaveTimerId);
            this.autoSaveTimerId = null;
            console.log('Auto-save stopped');
        }
    }
    
    /**
     * 保存データをデータURLとしてエクスポートする
     * @returns {Object} - エクスポート結果
     */
    exportSaveData() {
        try {
            // 現在のセーブデータを取得
            const saveData = localStorage.getItem(this.storageKey);
            
            if (!saveData) {
                return {
                    success: false,
                    message: '保存されたゲームデータが見つかりません。'
                };
            }
            
            // データURLの作成
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(saveData);
            
            // ダウンロードリンクの作成と自動クリック
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", `citysim-save-${Date.now()}.json`);
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
            
            return {
                success: true,
                message: 'セーブデータをエクスポートしました。'
            };
        } catch (error) {
            console.error('Export error:', error);
            return {
                success: false,
                message: `エクスポートに失敗しました: ${error.message}`
            };
        }
    }
    
    /**
     * エクスポートされたセーブデータをインポートする
     * @param {string} fileContent - インポートするファイルの内容
     * @returns {Object} - インポート結果
     */
    importSaveData(fileContent) {
        try {
            // JSONデータのパース
            const saveData = JSON.parse(fileContent);
            
            // バージョンチェック（必要に応じて）
            const currentVersion = GameConfig.VERSION || '1.0.0';
            if (saveData.version && saveData.version !== currentVersion) {
                console.warn(`Import data version mismatch: ${saveData.version} vs ${currentVersion}`);
                // 必要に応じてマイグレーション処理をここに追加
            }
            
            // ローカルストレージに保存
            localStorage.setItem(this.storageKey, fileContent);
            
            return {
                success: true,
                message: 'セーブデータをインポートしました。ゲームを再読み込みしてください。'
            };
        } catch (error) {
            console.error('Import error:', error);
            return {
                success: false,
                message: `インポートに失敗しました: ${error.message}`
            };
        }
    }
}

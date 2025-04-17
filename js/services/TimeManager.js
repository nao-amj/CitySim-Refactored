/**
 * CitySim - TimeManager クラス
 * ゲーム内時間の管理を担当
 */

import { GameConfig } from '../config/GameConfig.js';
import { EventEmitter } from './EventEmitter.js';

export class TimeManager {
    /**
     * 時間管理クラスの初期化
     * @param {Object} options - 初期化オプション
     */
    constructor(options = {}) {
        // 基本時間プロパティ
        this.hour = options.hour || 0;
        this.day = options.day || 1;
        this.month = options.month || 1;
        this.year = options.year || GameConfig.INITIAL_YEAR;
        
        // 時間スケール（リアルタイム1秒 = ゲーム内何時間）
        this.timeScale = options.timeScale || GameConfig.TIME_SCALE;
        
        // 進行状態
        this.paused = options.paused || false;
        this.interval = null;
        this.progressBarInterval = null;
        
        // イベントエミッター
        this.events = new EventEmitter();
    }
    
    /**
     * ゲーム時間を開始する
     */
    start() {
        if (this.interval) {
            clearInterval(this.interval);
        }
        
        this.paused = false;
        this.interval = setInterval(() => this.tick(), 1000);
        this._startProgressBar();
        
        this.events.emit('timeStarted', {
            currentTime: this.getFormattedTime(),
            timestamp: new Date()
        });
    }
    
    /**
     * ゲーム時間を一時停止する
     */
    pause() {
        this.paused = true;
        
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        
        if (this.progressBarInterval) {
            clearInterval(this.progressBarInterval);
            this.progressBarInterval = null;
        }
        
        this.events.emit('timePaused', {
            currentTime: this.getFormattedTime(),
            timestamp: new Date()
        });
    }
    
    /**
     * 一時停止されたゲーム時間を再開する
     */
    resume() {
        if (!this.paused) return;
        
        this.paused = false;
        this.interval = setInterval(() => this.tick(), 1000);
        this._startProgressBar();
        
        this.events.emit('timeResumed', {
            currentTime: this.getFormattedTime(),
            timestamp: new Date()
        });
    }
    
    /**
     * ゲーム時間を1単位進める
     * @returns {Object} - 更新された時間情報
     */
    tick() {
        if (this.paused) return;
        
        // 時間を進める
        this.hour += this.timeScale;
        
        // 24時間で日付が変わる
        if (this.hour >= 24) {
            this.hour = 0;
            this.day++;
            
            this.events.emit('dayChanged', {
                day: this.day,
                month: this.month,
                year: this.year
            });
            
            // 月末チェック（簡易的に30日/月とする）
            if (this.day > 30) {
                this.day = 1;
                this.month++;
                
                this.events.emit('monthChanged', {
                    month: this.month,
                    year: this.year
                });
                
                // 年末チェック
                if (this.month > 12) {
                    this.month = 1;
                    this.year++;
                    
                    this.events.emit('yearChanged', {
                        year: this.year
                    });
                }
            }
        }
        
        // 更新イベントを発火
        this.events.emit('tick', {
            hour: this.hour,
            day: this.day,
            month: this.month,
            year: this.year,
            formattedTime: this.getFormattedTime()
        });
        
        return {
            hour: this.hour,
            day: this.day,
            month: this.month,
            year: this.year
        };
    }
    
    /**
     * 時間を特定の値に設定する
     * @param {Object} time - 設定する時間オブジェクト
     */
    setTime(time) {
        if (time.hour !== undefined) this.hour = time.hour;
        if (time.day !== undefined) this.day = time.day;
        if (time.month !== undefined) this.month = time.month;
        if (time.year !== undefined) this.year = time.year;
        
        this.events.emit('timeSet', {
            hour: this.hour,
            day: this.day,
            month: this.month,
            year: this.year,
            formattedTime: this.getFormattedTime()
        });
    }
    
    /**
     * 時間スケールを設定する
     * @param {number} scale - 新しい時間スケール
     */
    setTimeScale(scale) {
        this.timeScale = scale;
        
        this.events.emit('timeScaleChanged', {
            timeScale: this.timeScale
        });
        
        // インターバルをリスタート
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = setInterval(() => this.tick(), 1000);
        }
    }
    
    /**
     * 現在の時間を取得する
     * @returns {Object} - 現在の時間オブジェクト
     */
    getCurrentTime() {
        return {
            hour: this.hour,
            day: this.day,
            month: this.month,
            year: this.year
        };
    }
    
    /**
     * 現在の時間を取得する (getTimeの互換性用エイリアス)
     * @returns {Object} - 現在の時間オブジェクト
     */
    getTime() {
        return this.getCurrentTime();
    }
    
    /**
     * フォーマットされた時間文字列を取得する
     * @returns {string} - フォーマットされた時間
     */
    getFormattedTime() {
        const formattedHour = this.hour.toString().padStart(2, '0');
        const formattedDay = this.day.toString().padStart(2, '0');
        const formattedMonth = this.month.toString().padStart(2, '0');
        return `${this.year}/${formattedMonth}/${formattedDay} ${formattedHour}:00`;
    }
    
    /**
     * ログ出力用の時間文字列を取得する
     * @returns {string} - ログ出力用時間文字列
     */
    getLogTimeString() {
        const formattedHour = this.hour.toString().padStart(2, '0');
        const formattedDay = this.day.toString().padStart(2, '0');
        const formattedMonth = this.month.toString().padStart(2, '0');
        return `${formattedMonth}/${formattedDay} ${formattedHour}:00`;
    }
    
    /**
     * 時間進行状況のプログレスバーを開始する
     */
    _startProgressBar() {
        const progressBar = document.getElementById('time-progress-bar');
        if (!progressBar) return;
        
        // 既存のインターバルをクリア
        if (this.progressBarInterval) {
            clearInterval(this.progressBarInterval);
        }
        
        // プログレスバーをリセット
        progressBar.style.width = '0%';
        
        // 徐々にプログレスバーを進める（24秒間で100%）
        setTimeout(() => {
            if (this.paused) return;
            progressBar.style.width = '100%';
        }, 100);
        
        // 24秒ごとにプログレスバーをリセット
        this.progressBarInterval = setInterval(() => {
            if (this.paused) return;
            progressBar.style.width = '0%';
            setTimeout(() => {
                if (this.paused) return;
                progressBar.style.width = '100%';
            }, 100);
        }, 24000);
    }
    
    /**
     * 時間マネージャーの状態をシリアライズする
     * @returns {Object} - シリアライズされた状態
     */
    serialize() {
        return {
            hour: this.hour,
            day: this.day,
            month: this.month,
            year: this.year,
            timeScale: this.timeScale,
            paused: this.paused
        };
    }
    
    /**
     * シリアライズされたデータから時間マネージャーを復元する
     * @param {Object} data - シリアライズされたデータ
     * @returns {TimeManager} - 復元された時間マネージャー
     */
    static deserialize(data) {
        return new TimeManager(data);
    }
}
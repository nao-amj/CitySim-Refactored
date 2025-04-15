/**
 * CitySim - EventEmitter クラス
 * イベント駆動設計のための簡易的なイベントエミッター
 */

export class EventEmitter {
    constructor() {
        // イベントリスナーを保持するオブジェクト
        this.listeners = {};
    }
    
    /**
     * イベントリスナーを登録する
     * @param {string} event - イベント名
     * @param {Function} callback - コールバック関数
     * @return {Function} - リスナー登録解除用の関数
     */
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        
        this.listeners[event].push(callback);
        
        // リスナー登録解除関数を返す
        return () => this.off(event, callback);
    }
    
    /**
     * 一度だけ実行されるイベントリスナーを登録する
     * @param {string} event - イベント名
     * @param {Function} callback - コールバック関数
     * @return {Function} - リスナー登録解除用の関数
     */
    once(event, callback) {
        const onceWrapper = (...args) => {
            this.off(event, onceWrapper);
            callback.apply(this, args);
        };
        
        return this.on(event, onceWrapper);
    }
    
    /**
     * イベントリスナーを解除する
     * @param {string} event - イベント名
     * @param {Function} callback - 解除するコールバック関数
     */
    off(event, callback) {
        if (!this.listeners[event]) {
            return;
        }
        
        this.listeners[event] = this.listeners[event].filter(
            listener => listener !== callback
        );
    }
    
    /**
     * すべてのリスナーを解除する
     * @param {string} [event] - 指定した場合、そのイベントのリスナーのみを解除
     */
    offAll(event) {
        if (event) {
            this.listeners[event] = [];
        } else {
            this.listeners = {};
        }
    }
    
    /**
     * イベントを発火する
     * @param {string} event - イベント名
     * @param {any} data - イベントに渡すデータ
     */
    emit(event, data) {
        if (!this.listeners[event]) {
            return;
        }
        
        // 安全のためにコピーを作成（emit中にリスナーが変更される可能性があるため）
        const callbacks = [...this.listeners[event]];
        callbacks.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`EventEmitter: イベント ${event} のコールバック実行中にエラーが発生しました`, error);
            }
        });
    }
    
    /**
     * イベントリスナーの数を取得する
     * @param {string} event - イベント名
     * @return {number} - リスナーの数
     */
    listenerCount(event) {
        if (!this.listeners[event]) {
            return 0;
        }
        
        return this.listeners[event].length;
    }
}

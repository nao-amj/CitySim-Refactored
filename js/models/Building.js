/**
 * CitySim - Building クラス
 * 建物の基本クラス
 */

import { GameConfig } from '../config/GameConfig.js';

export class Building {
    /**
     * 建物の初期化
     * @param {string} type - 建物タイプ
     * @param {Object} options - 追加オプション
     */
    constructor(type, options = {}) {
        // 建物タイプの検証
        if (!GameConfig.BUILDINGS[type.toUpperCase()]) {
            throw new Error(`未知の建物タイプです: ${type}`);
        }
        
        // 建物タイプ（小文字）
        this.type = type.toLowerCase();
        
        // 建物設定の取得
        const config = GameConfig.BUILDINGS[type.toUpperCase()];
        
        // プロパティの設定
        this.name = config.name;
        this.icon = config.icon;
        this.cost = config.cost;
        this.effects = { ...config.effects };
        this.description = config.description;
        
        // 追加オプションの適用
        Object.assign(this, options);
        
        // 建設時刻
        this.builtAt = options.builtAt || new Date();
        
        // 一意なID
        this.id = options.id || `${this.type}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    }
    
    /**
     * 建物の効果を取得する
     * @returns {Object} - 建物の効果
     */
    getEffects() {
        return { ...this.effects };
    }
    
    /**
     * 建物情報をシリアライズする
     * @returns {Object} - シリアライズされた建物データ
     */
    serialize() {
        return {
            id: this.id,
            type: this.type,
            builtAt: this.builtAt.toISOString()
        };
    }
    
    /**
     * シリアライズされたデータから建物を復元する
     * @param {Object} data - シリアライズされたデータ
     * @returns {Building} - 復元された建物インスタンス
     */
    static deserialize(data) {
        return new Building(data.type, {
            id: data.id,
            builtAt: new Date(data.builtAt)
        });
    }
    
    /**
     * 建物のHTMLエレメントを生成する
     * @returns {HTMLElement} - 建物を表すHTMLエレメント
     */
    createElement() {
        const element = document.createElement('div');
        element.className = `building ${this.type}`;
        element.innerHTML = `
            <div class="building-icon">
                <i class="fas fa-${this.icon}"></i>
            </div>
            <div class="building-info">
                <span class="building-name">${this.name}</span>
                <span class="building-description">${this.description}</span>
            </div>
        `;
        return element;
    }
}

/**
 * 住宅クラス
 */
export class House extends Building {
    constructor(options = {}) {
        super('HOUSE', options);
    }
}

/**
 * 工場クラス
 */
export class Factory extends Building {
    constructor(options = {}) {
        super('FACTORY', options);
    }
}

/**
 * 道路クラス
 */
export class Road extends Building {
    constructor(options = {}) {
        super('ROAD', options);
    }
}

/**
 * 学校クラス
 */
export class School extends Building {
    constructor(options = {}) {
        super('SCHOOL', options);
    }
}

/**
 * 公園クラス
 */
export class Park extends Building {
    constructor(options = {}) {
        super('PARK', options);
    }
}

/**
 * 病院クラス
 */
export class Hospital extends Building {
    constructor(options = {}) {
        super('HOSPITAL', options);
    }
}

/**
 * 建物ファクトリー
 * タイプに基づいて適切な建物インスタンスを生成
 */
export class BuildingFactory {
    /**
     * 建物を作成する
     * @param {string} type - 建物タイプ
     * @param {Object} options - オプション
     * @returns {Building} - 建物インスタンス
     */
    static create(type, options = {}) {
        switch (type.toUpperCase()) {
            case 'HOUSE':
                return new House(options);
            case 'FACTORY':
                return new Factory(options);
            case 'ROAD':
                return new Road(options);
            case 'SCHOOL':
                return new School(options);
            case 'PARK':
                return new Park(options);
            case 'HOSPITAL':
                return new Hospital(options);
            default:
                return new Building(type, options);
        }
    }
}

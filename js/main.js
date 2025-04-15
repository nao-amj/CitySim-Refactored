/**
 * CitySim - メインエントリーポイント
 * アプリケーションの初期化と起動を担当
 */

// モジュールのインポート
import { GameConfig } from './config/GameConfig.js';
import { City } from './models/City.js';
import { GameController } from './controllers/GameController.js';
import { UIController } from './controllers/UIController.js';
import { EventSystem } from './events/EventSystem.js';
import { TimeManager } from './services/TimeManager.js';
import { SaveManager } from './services/SaveManager.js';

// DOMが読み込まれた後にゲームを初期化
document.addEventListener('DOMContentLoaded', () => {
    console.log('CitySim starting...');
    
    // ゲームインスタンスの初期化
    initGame();
});

/**
 * ゲームを初期化する関数
 */
function initGame() {
    // 都市モデルの作成
    const city = new City({
        name: 'New City',
        year: GameConfig.INITIAL_YEAR,
        population: GameConfig.INITIAL_POPULATION,
        funds: GameConfig.INITIAL_FUNDS,
        happiness: GameConfig.INITIAL_HAPPINESS,
        environment: GameConfig.INITIAL_ENVIRONMENT,
        education: GameConfig.INITIAL_EDUCATION,
        taxRate: GameConfig.INITIAL_TAX_RATE
    });
    
    // 各サービスの初期化
    const timeManager = new TimeManager();
    const eventSystem = new EventSystem(city, timeManager);
    const saveManager = new SaveManager(city);
    
    // コントローラーの初期化
    const uiController = new UIController(city, timeManager);
    const gameController = new GameController(city, timeManager, eventSystem, uiController);
    
    // ゲームの開始
    gameController.start();
    
    // グローバルでのデバッグアクセス（開発時のみ）
    if (GameConfig.DEBUG_MODE) {
        window.game = {
            city,
            timeManager,
            eventSystem,
            gameController,
            uiController
        };
    }
}

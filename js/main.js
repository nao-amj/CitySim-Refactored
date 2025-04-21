/**
 * CitySim - メインエントリーポイント
 * アプリケーションの初期化と起動を担当
 */

// モジュールのインポート
import Application from './bootstrap/Application.js';
import { GameConfig } from './config/GameConfig.js';
import { City } from './models/City.js';
import { GameController } from './controllers/GameController.js';
import { UIController } from './controllers/UIController.js';
import { EventSystem } from './events/EventSystem.js';
import { TimeManager } from './services/TimeManager.js';
import { SaveManager } from './services/SaveManager.js';
import { TutorialController } from './controllers/TutorialController.js';
import { ClickerGameComponent } from './components/ClickerGameComponent.js';

// DOMContentLoaded: bootstrap application
document.addEventListener('DOMContentLoaded', () => {
  console.log('CitySim starting...');
  const app = new Application();
  // create core instances
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
  // register services
  const timeManager = new TimeManager();
  const eventSystem = new EventSystem(city, timeManager);
  const saveManager = new SaveManager(city, timeManager);
  app.registerService('timeManager', timeManager);
  app.registerService('eventSystem', eventSystem);
  app.registerService('saveManager', saveManager);
  // register controllers
  const uiController = new UIController(city, timeManager);
  const gameController = new GameController(city, timeManager, eventSystem, uiController);
  const tutorialController = new TutorialController();
  app.registerController('uiController', uiController);
  app.registerController('gameController', gameController);
  app.registerController('tutorialController', tutorialController);
  // register components
  const clickerComp = new ClickerGameComponent(city, uiController);
  app.registerComponent('clickerGame', clickerComp);
  // lifecycle: init and start
  app.init();
  // load saved game
  gameController.loadGame(saveManager);
  app.start();
  // auto-save on unload
  window.addEventListener('beforeunload', () => saveManager.saveGame('auto'));
  // debug global
  if (GameConfig.DEBUG_MODE) {
    window.game = { city, timeManager, eventSystem, gameController, uiController, saveManager, tutorialController };
  }
});

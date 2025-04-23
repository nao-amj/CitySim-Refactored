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
import { DataDashboard } from './views/DataDashboard.js';
import { ScenarioEditor } from './views/ScenarioEditor.js';
import { PluginManager } from './services/PluginManager.js';
import { PluginManagerView } from './views/PluginManagerView.js';

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
  // setup ClickerGameComponent (manually show/hide via game mode)
  const clickerComp = new ClickerGameComponent(city, uiController);

  // Subscribe UIController to eventSystem for notifications
  eventSystem.events.on('eventTriggered', ({ event }) => {
    uiController.addEventToLog(event);
    uiController.addFixedEvent(event);
  });

  // lifecycle: init and start
  app.init();
  // load saved game
  gameController.loadGame(saveManager);
  app.start();
  // Plugin Manager UI
  const pluginManagerView = new PluginManagerView();
  // Instantiate new features
  const dataDashboard = new DataDashboard(city);
  const scenarioEditor = new ScenarioEditor(city);
  // Bind Plugin Manager
  // Initialize plugins
  PluginManager.initializeAll({ city, timeManager, eventSystem, gameController, uiController });

  // Show/hide clicker overlay on mode change
  gameController.events.on('gameModeChanged', ({ mode }) => {
    if (mode === 'clicker') {
      clickerComp.show();
    } else {
      clickerComp.hide();
    }
  });
  // Also handle UIController actionSelected for clicker mode
  uiController.events.on('actionSelected', ({ action }) => {
    if (action === 'clicker_mode') {
      clickerComp.show();
    }
  });
  // Bind Data Dashboard and Scenario Editor
  uiController.events.on('open_data_dashboard', () => dataDashboard.show());
  uiController.events.on('open_scenario_editor', () => scenarioEditor.show());
  // Bind Plugin Manager
  uiController.events.on('open_plugin_manager', () => pluginManagerView.show());

  // auto-save on unload
  window.addEventListener('beforeunload', () => saveManager.saveGame('auto'));
  // debug global
  if (GameConfig.DEBUG_MODE) {
    window.game = { city, timeManager, eventSystem, gameController, uiController, saveManager, tutorialController };
  }
});

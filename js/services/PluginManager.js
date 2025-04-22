// js/services/PluginManager.js
/**
 * PluginManager - loads and initializes plugins declared via <script data-plugin>
 * Plugins should register themselves by pushing to window.pluginRegistry via registerPlugin(plugin)
 */
window.pluginRegistry = window.pluginRegistry || [];

export class PluginManager {
    /**
     * Initialize all registered plugins and pass shared context
     * @param {Object} context - shared services and controllers
     */
    static initializeAll(context) {
        if (!window.pluginRegistry || !Array.isArray(window.pluginRegistry)) return;
        window.pluginRegistry.forEach(plugin => {
            try {
                if (typeof plugin.init === 'function') {
                    plugin.init(context);
                    console.log(`Plugin initialized: ${plugin.name || 'unknown'}`);
                }
            } catch (err) {
                console.error(`Error initializing plugin ${plugin.name || 'unknown'}:`, err);
            }
        });
    }
}

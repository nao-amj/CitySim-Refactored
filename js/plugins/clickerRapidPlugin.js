// js/plugins/clickerRapidPlugin.js
// Plugin to enable rapid clicking on PC by handling mousedown events
(function() {
    // Register plugin
    const plugin = {
        name: 'RapidClickerPlugin',
        init() {
            const target = document.getElementById('clicker-target');
            if (!target) return;
            // Use mousedown for faster response on PC
            target.addEventListener('mousedown', e => {
                e.preventDefault();
                // Dispatch a click event to trigger the clicker logic
                target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            });
        }
    };
    window.pluginRegistry = window.pluginRegistry || [];
    window.pluginRegistry.push(plugin);
})();
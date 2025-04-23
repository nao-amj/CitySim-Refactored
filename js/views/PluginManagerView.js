// js/views/PluginManagerView.js

export class PluginManagerView {
    constructor() {
        this.container = document.getElementById('plugin-manager-container');
    }

    show() {
        this.container.classList.remove('hidden');
        const registry = window.pluginRegistry || [];
        let html = `
            <div class="plugin-manager">
                <h2>プラグイン管理</h2>
                <ul class="plugin-list">
        `;
        registry.forEach((plugin, idx) => {
            const name = plugin.name || `plugin${idx}`;
            const enabled = plugin.enabled !== false;
            html += `
                    <li>
                        <label>
                            <input type="checkbox" data-plugin-index="${idx}" ${enabled ? 'checked' : ''}/> ${name}
                        </label>
                    </li>
            `;
        });
        html += `
                </ul>
                <button id="close-plugin-manager" class="btn">閉じる</button>
            </div>
        `;
        this.container.innerHTML = html;
        document.getElementById('close-plugin-manager').addEventListener('click', () => this.hide());
        this.container.querySelectorAll('input[data-plugin-index]').forEach(input => {
            input.addEventListener('change', e => {
                const idx = e.target.getAttribute('data-plugin-index');
                const plugin = window.pluginRegistry[idx];
                plugin.enabled = e.target.checked;
                alert(`${plugin.name || 'plugin'} を ${e.target.checked ? '有効' : '無効'} にしました`);
            });
        });
    }

    hide() {
        this.container.classList.add('hidden');
        this.container.innerHTML = '';
    }
}
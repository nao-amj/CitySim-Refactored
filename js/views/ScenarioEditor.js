export class ScenarioEditor {
    constructor(city) {
        this.city = city;
        this.container = document.getElementById('scenario-editor-container');
    }

    show() {
        this.container.classList.remove('hidden');
        this.container.innerHTML = `
        <div class="scenario-editor">
            <h2>シナリオエディタ</h2>
            <label>初期人口: <input id="scenario-population" type="number" value="${this.city.population}"/></label>
            <label>初期資金: <input id="scenario-funds" type="number" value="${this.city.funds}"/></label>
            <label>初期幸福度: <input id="scenario-happiness" type="number" value="${this.city.happiness}"/></label>
            <label>初期環境: <input id="scenario-environment" type="number" value="${this.city.environment}"/></label>
            <div class="buttons">
                <button id="apply-scenario">適用</button>
                <button id="export-scenario">エクスポート</button>
                <button id="close-scenario">閉じる</button>
            </div>
        </div>
        `;
        this._bindEvents();
    }

    hide() {
        this.container.classList.add('hidden');
        this.container.innerHTML = '';
    }

    _bindEvents() {
        document.getElementById('close-scenario').addEventListener('click', () => this.hide());
        document.getElementById('apply-scenario').addEventListener('click', () => {
            this.city.population = +document.getElementById('scenario-population').value;
            this.city.funds = +document.getElementById('scenario-funds').value;
            this.city.happiness = +document.getElementById('scenario-happiness').value;
            this.city.environment = +document.getElementById('scenario-environment').value;
            this.hide();
        });
        document.getElementById('export-scenario').addEventListener('click', () => {
            const scenario = {
                population: this.city.population,
                funds: this.city.funds,
                happiness: this.city.happiness,
                environment: this.city.environment
            };
            const blob = new Blob([JSON.stringify(scenario, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'scenario.json';
            a.click();
            URL.revokeObjectURL(url);
        });
    }
}
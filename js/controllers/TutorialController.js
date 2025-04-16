/**
 * CitySim - TutorialController クラス
 * チュートリアルの表示と管理を担当
 */

import { GameConfig } from '../config/GameConfig.js';
import { EventEmitter } from '../services/EventEmitter.js';

export class TutorialController {
    /**
     * チュートリアルコントローラーの初期化
     */
    constructor() {
        this.currentStep = 0;
        this.totalSteps = GameConfig.TUTORIAL.STEPS.length;
        this.tutorialShown = false;
        this.events = new EventEmitter();
        
        // DOM要素
        this.elements = {
            overlay: document.getElementById('tutorial-overlay'),
            steps: document.getElementById('tutorial-steps'),
            closeButton: document.getElementById('close-tutorial'),
            buttonsContainer: document.querySelector('.tutorial-buttons'),
            nextButton: null
        };
        
        // 初期化
        this._initialize();
        
        // 「次へ」ボタンの作成
        this._createNextButton();
    }
    
    /**
     * 初期化処理
     * @private
     */
    _initialize() {
        // チュートリアルが既に表示されたかどうかをチェック
        this.tutorialShown = localStorage.getItem(GameConfig.TUTORIAL.STORAGE_KEY) === 'true';
        
        // 閉じるボタンのイベントリスナー
        if (this.elements.closeButton) {
            this.elements.closeButton.addEventListener('click', () => this.hideTutorial());
        }
        
        // 初回起動時は自動的にチュートリアルを表示
        if (!this.tutorialShown) {
            this.showTutorial();
        } else {
            this.hideTutorial(false); // イベント発火なし
        }
    }
    
    /**
     * 「次へ」ボタンを作成
     * @private
     */
    _createNextButton() {
        if (!this.elements.buttonsContainer) {
            console.error('Tutorial buttons container not found');
            return;
        }
        
        const nextButton = document.createElement('button');
        nextButton.id = 'next-tutorial';
        nextButton.className = 'tutorial-btn next-btn';
        nextButton.textContent = '次へ';
        nextButton.style.marginRight = '10px';
        
        nextButton.addEventListener('click', () => this.nextStep());
        
        // ボタンコンテナの先頭に挿入
        if (this.elements.closeButton) {
            this.elements.buttonsContainer.insertBefore(nextButton, this.elements.closeButton);
        } else {
            this.elements.buttonsContainer.appendChild(nextButton);
        }
        
        this.elements.nextButton = nextButton;
    }
    
    /**
     * チュートリアルを表示
     */
    showTutorial() {
        if (!this.elements.overlay) return;
        
        // 最初のステップを表示
        this.currentStep = 0;
        this._renderCurrentStep();
        
        // オーバーレイを表示
        this.elements.overlay.style.display = 'flex';
        
        // ボタンテキストを更新
        if (this.elements.closeButton) {
            this.elements.closeButton.textContent = 'スキップ';
        }
        
        // 次へボタンを表示
        if (this.elements.nextButton) {
            this.elements.nextButton.style.display = 'inline-block';
        }
        
        // イベント発火
        this.events.emit('tutorialStarted', {
            timestamp: new Date()
        });
    }
    
    /**
     * チュートリアルを非表示
     * @param {boolean} emitEvent - イベントを発火するかどうか
     */
    hideTutorial(emitEvent = true) {
        if (!this.elements.overlay) return;
        
        // オーバーレイを非表示
        this.elements.overlay.style.display = 'none';
        
        // チュートリアル表示済みフラグを保存
        localStorage.setItem(GameConfig.TUTORIAL.STORAGE_KEY, 'true');
        this.tutorialShown = true;
        
        // イベント発火
        if (emitEvent) {
            this.events.emit('tutorialCompleted', {
                timestamp: new Date()
            });
        }
    }
    
    /**
     * 次のステップに進む
     */
    nextStep() {
        if (this.currentStep < this.totalSteps - 1) {
            this.currentStep++;
            this._renderCurrentStep();
            
            // 最後のステップならボタンテキストを変更
            if (this.currentStep === this.totalSteps - 1) {
                if (this.elements.nextButton) {
                    this.elements.nextButton.style.display = 'none';
                }
                if (this.elements.closeButton) {
                    this.elements.closeButton.textContent = '始める';
                }
            }
            
            // イベント発火
            this.events.emit('tutorialStepChanged', {
                currentStep: this.currentStep,
                totalSteps: this.totalSteps
            });
        } else {
            // 最後のステップから進む場合はチュートリアルを閉じる
            this.hideTutorial();
        }
    }
    
    /**
     * 現在のステップを表示
     * @private
     */
    _renderCurrentStep() {
        if (!this.elements.steps) return;
        
        // ステップコンテナをクリア
        this.elements.steps.innerHTML = '';
        
        // ステップ番号を表示
        const stepCounter = document.createElement('div');
        stepCounter.className = 'step-counter';
        stepCounter.textContent = `ステップ ${this.currentStep + 1}/${this.totalSteps}`;
        this.elements.steps.appendChild(stepCounter);
        
        // 現在のステップを取得
        const step = GameConfig.TUTORIAL.STEPS[this.currentStep];
        
        // ステップを表示
        const stepElement = document.createElement('div');
        stepElement.className = 'tutorial-step';
        stepElement.innerHTML = `
            <h3><i class="fas fa-${step.icon}"></i> ${step.title}</h3>
            <p>${step.message}</p>
        `;
        
        this.elements.steps.appendChild(stepElement);
    }
}

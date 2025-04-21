/**
 * CitySim - TutorialController クラス
 * ゲームチュートリアルの制御を担当
 */

import { GameConfig, GameText } from '../config/GameConfig.js';
import { EventEmitter } from '../services/EventEmitter.js';

export class TutorialController {
    /**
     * チュートリアルコントローラーの初期化
     */
    constructor() {
        this.events = new EventEmitter();
        this.currentStep = 0;
        this.steps = GameConfig.TUTORIAL.STEPS;
        this.isActive = false;
        
        // DOM要素への参照
        this.tutorialOverlay = document.getElementById('tutorial-overlay');
        this.tutorialSteps = document.getElementById('tutorial-steps');
        this.tutorialButtons = document.querySelector('.tutorial-buttons');
    }
   
    /**
     * Application lifecycle init
     * @param {Application} app
     */
    init(app) {
        this._init();
    }

    /**
     * 初期化処理
     * @private
     */
    _init() {
        // ローカルストレージからチュートリアル表示済みかをチェック
        const isTutorialCompleted = localStorage.getItem(GameConfig.TUTORIAL.STORAGE_KEY) === 'true';
        
        if (!isTutorialCompleted) {
            this._showTutorial();
        }
        
        // チュートリアルスキップボタンのイベントリスナー
        const closeButton = document.getElementById('close-tutorial');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                this._completeTutorial();
            });
        }
    }
    
    /**
     * チュートリアルを表示する
     * @private
     */
    _showTutorial() {
        if (!this.tutorialOverlay || !this.tutorialSteps) return;
        
        this.isActive = true;
        this.currentStep = 0;
        
        // ステップを表示
        this._renderSteps();
        
        // ボタンを設定
        this._renderButtons();
        
        // オーバーレイを表示
        this.tutorialOverlay.style.display = 'flex';
        
        // イベント発火
        this.events.emit('tutorialStarted', {
            step: this.currentStep,
            totalSteps: this.steps.length
        });
    }
    
    /**
     * チュートリアルステップを描画する
     * @private
     */
    _renderSteps() {
        if (!this.tutorialSteps) return;
        
        this.tutorialSteps.innerHTML = '';
        
        // 現在のステップを強調表示
        const currentStep = this.steps[this.currentStep];
        
        // ステップの描画
        for (let i = 0; i < this.steps.length; i++) {
            const step = this.steps[i];
            const stepElement = document.createElement('div');
            stepElement.className = `tutorial-step ${i === this.currentStep ? 'active' : i < this.currentStep ? 'completed' : ''}`;
            
            stepElement.innerHTML = `
                <div class="step-number">${i + 1}</div>
                <div class="step-icon"><i class="fas fa-${step.icon}"></i></div>
                <div class="step-content">
                    <h3>${step.title}</h3>
                    <p>${i === this.currentStep ? step.message : ''}</p>
                </div>
            `;
            
            this.tutorialSteps.appendChild(stepElement);
        }
    }
    
    /**
     * チュートリアルボタンを描画する
     * @private
     */
    _renderButtons() {
        if (!this.tutorialButtons) return;
        
        this.tutorialButtons.innerHTML = '';
        
        // スキップボタン
        const skipButton = document.createElement('button');
        skipButton.id = 'close-tutorial';
        skipButton.className = 'tutorial-btn tutorial-btn-secondary';
        skipButton.textContent = 'スキップ';
        skipButton.addEventListener('click', () => {
            this._completeTutorial();
        });
        
        // 前へボタン（最初のステップ以外で表示）
        if (this.currentStep > 0) {
            const prevButton = document.createElement('button');
            prevButton.id = 'prev-tutorial';
            prevButton.className = 'tutorial-btn';
            prevButton.textContent = '前へ';
            prevButton.addEventListener('click', () => {
                this._prevStep();
            });
            this.tutorialButtons.appendChild(prevButton);
        }
        
        // 次へボタン
        if (this.currentStep < this.steps.length - 1) {
            const nextButton = document.createElement('button');
            nextButton.id = 'next-tutorial';
            nextButton.className = 'tutorial-btn tutorial-btn-primary';
            nextButton.textContent = '次へ';
            nextButton.addEventListener('click', () => {
                this._nextStep();
            });
            this.tutorialButtons.appendChild(nextButton);
        } else {
            // 最後のステップでは「完了」ボタン
            const doneButton = document.createElement('button');
            doneButton.id = 'complete-tutorial';
            doneButton.className = 'tutorial-btn tutorial-btn-primary';
            doneButton.textContent = '完了';
            doneButton.addEventListener('click', () => {
                this._completeTutorial();
            });
            this.tutorialButtons.appendChild(doneButton);
        }
        
        this.tutorialButtons.appendChild(skipButton);
    }
    
    /**
     * 次のステップに進む
     * @private
     */
    _nextStep() {
        if (this.currentStep < this.steps.length - 1) {
            this.currentStep++;
            this._renderSteps();
            this._renderButtons();
            
            // イベント発火
            this.events.emit('tutorialStepChanged', {
                step: this.currentStep,
                totalSteps: this.steps.length,
                direction: 'next'
            });
        }
    }
    
    /**
     * 前のステップに戻る
     * @private
     */
    _prevStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this._renderSteps();
            this._renderButtons();
            
            // イベント発火
            this.events.emit('tutorialStepChanged', {
                step: this.currentStep,
                totalSteps: this.steps.length,
                direction: 'prev'
            });
        }
    }
    
    /**
     * チュートリアルを完了する
     * @private
     */
    _completeTutorial() {
        if (!this.tutorialOverlay) return;
        
        this.isActive = false;
        
        // チュートリアルオーバーレイを非表示
        this.tutorialOverlay.style.display = 'none';
        
        // ローカルストレージに完了を記録
        localStorage.setItem(GameConfig.TUTORIAL.STORAGE_KEY, 'true');
        
        // イベント発火
        this.events.emit('tutorialCompleted', {
            completedStep: this.currentStep,
            totalSteps: this.steps.length
        });
    }
    
    /**
     * チュートリアルをリセットする（開発用）
     */
    resetTutorial() {
        localStorage.removeItem(GameConfig.TUTORIAL.STORAGE_KEY);
        this.currentStep = 0;
        this._showTutorial();
        
        return {
            success: true,
            message: 'チュートリアルがリセットされました。'
        };
    }
    
    /**
     * 特定のステップを表示する
     * @param {number} stepIndex - 表示するステップのインデックス
     */
    showStep(stepIndex) {
        if (stepIndex >= 0 && stepIndex < this.steps.length) {
            this.currentStep = stepIndex;
            
            if (!this.isActive) {
                this._showTutorial();
            } else {
                this._renderSteps();
                this._renderButtons();
            }
            
            // イベント発火
            this.events.emit('tutorialStepChanged', {
                step: this.currentStep,
                totalSteps: this.steps.length,
                direction: 'jump'
            });
            
            return {
                success: true,
                message: `チュートリアルステップ ${stepIndex + 1} を表示しています。`
            };
        }
        
        return {
            success: false,
            message: `ステップインデックス ${stepIndex} は無効です。有効な範囲: 0-${this.steps.length - 1}`
        };
    }
}
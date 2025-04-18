/**
 * Enhanced CitySim - ClickerController class
 * Controls the clicker game mode with improved animations and feedback
 */

import { GameConfig, GameText } from '../config/GameConfig.js';
import { EventEmitter } from '../services/EventEmitter.js';

export class EnhancedClickerController {
    /**
     * Initialize clicker controller
     * @param {City} city - City model
     * @param {UIController} uiController - UI controller
     */
    constructor(city, uiController) {
        this.city = city;
        this.uiController = uiController;
        this.events = new EventEmitter();
        
        // Document reference (default is current document, can be set for iframe usage)
        this.document = document;
        
        // Clicker status
        this.state = {
            totalClicks: 0,
            totalFunds: 0,
            clickValue: GameConfig.CLICKER.BASE_CLICK_VALUE,
            autoFunds: 0,
            clickMultiplier: 1,
            autoFundsMultiplier: 1,
            allMultiplier: 1,
            upgrades: {},
            buildings: {},
            achievements: {},
            unlocked: {
                COIN_MINT: false,
                BANK: false,
                INVESTMENT_FIRM: false
            }
        };
        
        // Initialization status
        this.initialized = false;
        
        // Clicker UI elements
        this.clickerElement = null;
        this.clickerTarget = null;
        this.clickerStats = null;
        this.buildingsContainer = null;
        this.upgradesContainer = null;
        this.achievementsContainer = null;
        
        // Auto income timer
        this.autoIncomeTimer = null;
        
        // Sound effects
        this.sounds = {
            click: null,
            purchase: null,
            achievement: null,
            unlock: null
        };
        
        // Particles system
        this.particles = [];
        this.particleColors = ['#3498db', '#f39c12', '#2ecc71', '#9b59b6'];
        
        // Animation frame for particles
        this.animationFrame = null;
        
        // Link clicker data to city model
        if (!this.city.clickerData) {
            this.city.clickerData = this.state;
        } else {
            this.state = this.city.clickerData;
        }
    }
    
    /**
     * Set document for iframe support
     * @param {Document} doc - Document object
     */
    setDocument(doc) {
        this.document = doc;
        this.initialized = false;
        this._initialize();
    }
    
    /**
     * Initialize clicker UI
     * @private
     */
    _initialize() {
        if (this.initialized) return;
        
        // Create clicker UI
        this._createClickerUI();
        
        // Setup event listeners
        this._setupEventListeners();
        
        // Start auto income timer
        this._startAutoIncome();
        
        // Preload sounds
        this._preloadSounds();
        
        this.initialized = true;
        
        // Emit initialization completed event
        this.events.emit('clickerInitialized', {
            state: { ...this.state }
        });
    }
    
    /**
     * Preload sound effects
     * @private
     */
    _preloadSounds() {
        // Check if AudioContext is available
        if (window.AudioContext || window.webkitAudioContext) {
            // Implementation can be added here if needed
            console.log("Audio is available for sound effects");
        }
    }
    
    /**
     * Create clicker UI
     * @private
     */
    _createClickerUI() {
        // Find clicker container
        this.clickerElement = this.document.getElementById('clicker-container');
        if (!this.clickerElement) {
            console.error('Clicker container not found in document');
            return;
        }
        
        // Save UI references
        this.clickerTarget = this.document.getElementById('clicker-target');
        this.clickerStats = this.document.getElementById('clicker-stats');
        this.buildingsContainer = this.document.getElementById('clicker-buildings');
        this.upgradesContainer = this.document.getElementById('clicker-upgrades');
        this.achievementsContainer = this.document.getElementById('clicker-achievements');
        
        // Render buildings, upgrades, and achievements
        this._renderBuildings();
        this._renderUpgrades();
        this._renderAchievements();
        this._updateStats();
        
        // Canvas for particles (optional)
        const particleCanvas = this.document.createElement('canvas');
        particleCanvas.id = 'particle-canvas';
        particleCanvas.style.position = 'absolute';
        particleCanvas.style.top = '0';
        particleCanvas.style.left = '0';
        particleCanvas.style.width = '100%';
        particleCanvas.style.height = '100%';
        particleCanvas.style.pointerEvents = 'none';
        particleCanvas.style.zIndex = '5';
        this.clickerElement.appendChild(particleCanvas);
        
        // Resize canvas
        particleCanvas.width = this.clickerElement.offsetWidth || 800;
        particleCanvas.height = this.clickerElement.offsetHeight || 600;
        this.particleCanvas = particleCanvas;
        this.particleContext = particleCanvas.getContext('2d');
        
        // Handle window resize for canvas
        this.document.defaultView.addEventListener('resize', () => {
            if (this.particleCanvas) {
                this.particleCanvas.width = this.clickerElement.offsetWidth || 800;
                this.particleCanvas.height = this.clickerElement.offsetHeight || 600;
            }
        });
    }
    
    /**
     * Setup event listeners
     * @private
     */
    _setupEventListeners() {
        // Click target event listener
        if (this.clickerTarget) {
            this.clickerTarget.addEventListener('click', (e) => {
                this._handleClick(e);
            });
            
            // Click animation
            this.clickerTarget.addEventListener('mousedown', () => {
                this.clickerTarget.classList.add('clicked');
            });
            
            this.clickerTarget.addEventListener('mouseup', () => {
                this.clickerTarget.classList.remove('clicked');
            });
            
            this.clickerTarget.addEventListener('mouseleave', () => {
                this.clickerTarget.classList.remove('clicked');
            });
            
            // Touch device support
            this.clickerTarget.addEventListener('touchstart', () => {
                this.clickerTarget.classList.add('clicked');
            });
            
            this.clickerTarget.addEventListener('touchend', () => {
                this.clickerTarget.classList.remove('clicked');
            });
        }
        
        // Exit button event listener
        const exitButton = this.document.getElementById('clicker-exit');
        if (exitButton) {
            exitButton.addEventListener('click', () => {
                this.hide();
                // Emit exit clicker event
                this.events.emit('exitClicker', {
                    state: { ...this.state }
                });
            });
        }
        
        // Add keyboard shortcuts
        this.document.addEventListener('keydown', (e) => {
            // Only process when clicker is visible
            if (this.clickerElement && !this.clickerElement.classList.contains('hidden')) {
                // Escape key to exit
                if (e.key === 'Escape') {
                    this.hide();
                    this.events.emit('exitClicker', {
                        state: { ...this.state }
                    });
                }
                
                // Space key to click
                if (e.key === ' ' && this.clickerTarget) {
                    e.preventDefault();
                    this._handleClick({
                        clientX: this.clickerTarget.getBoundingClientRect().left + this.clickerTarget.offsetWidth / 2,
                        clientY: this.clickerTarget.getBoundingClientRect().top + this.clickerTarget.offsetHeight / 2
                    });
                    this.clickerTarget.classList.add('clicked');
                    setTimeout(() => {
                        this.clickerTarget.classList.remove('clicked');
                    }, 100);
                }
            }
        });
    }
    
    /**
     * Handle click from component
     * @param {Event} e - Click event
     * @public - Called from ClickerGameComponent
     */
    handleClickFromComponent(e) {
        this._handleClick(e);
    }
    
    /**
     * Handle click
     * @param {Event} e - Click event
     * @private
     */
    _handleClick(e) {
        // Update click count
        this.state.totalClicks++;
        
        // Calculate earned funds
        const clickEffect = this.state.clickValue * this.state.clickMultiplier * this.state.allMultiplier;
        const fundsGained = Math.floor(clickEffect);
        
        // Add funds
        this.city.funds += fundsGained;
        this.state.totalFunds += fundsGained;
        
        // Check building unlocks
        this._checkBuildingUnlocks();
        
        // Check achievements
        this._checkAchievements();
        
        // Update UI
        this._updateStats();
        
        // Generate particles
        if (e && e.clientX && e.clientY) {
            this._createParticles(e.clientX, e.clientY, fundsGained > 10 ? 10 : fundsGained);
        } else if (this.clickerTarget) {
            const rect = this.clickerTarget.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;
            this._createParticles(x, y, fundsGained > 10 ? 10 : fundsGained);
        }
        
        // Emit click event
        this.events.emit('click', {
            totalClicks: this.state.totalClicks,
            fundsGained,
            totalFunds: this.state.totalFunds
        });
        
        // Show click effect
        this._showClickEffect(fundsGained);
    }
    
    /**
     * Create particles
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} count - Number of particles
     * @private
     */
    _createParticles(x, y, count) {
        if (!this.particleContext) return;
        
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 3;
            const size = 5 + Math.random() * 5;
            const life = 30 + Math.random() * 30;
            const color = this.particleColors[Math.floor(Math.random() * this.particleColors.length)];
            
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1,  // slight upward bias
                size,
                color,
                life,
                opacity: 1
            });
        }
        
        // Start animation if not already running
        if (!this.animationFrame) {
            this.animationFrame = requestAnimationFrame(() => this._animateParticles());
        }
    }
    
    /**
     * Animate particles
     * @private
     */
    _animateParticles() {
        if (!this.particleContext || !this.particleCanvas) {
            this.animationFrame = null;
            return;
        }
        
        // Clear canvas
        this.particleContext.clearRect(0, 0, this.particleCanvas.width, this.particleCanvas.height);
        
        // Update and draw particles
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            
            // Update position
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1;  // gravity
            p.life--;
            p.opacity = p.life / 60;
            
            // Draw particle
            this.particleContext.beginPath();
            this.particleContext.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.particleContext.fillStyle = p.color + Math.floor(p.opacity * 255).toString(16).padStart(2, '0');
            this.particleContext.fill();
        }
        
        // Remove dead particles
        this.particles = this.particles.filter(p => p.life > 0);
        
        // Continue animation if there are particles
        if (this.particles.length > 0) {
            this.animationFrame = requestAnimationFrame(() => this._animateParticles());
        } else {
            this.animationFrame = null;
        }
    }
    
    /**
     * Show click effect
     * @param {number} amount - Amount gained
     * @private
     */
    _showClickEffect(amount) {
        if (!this.clickerTarget) return;
        
        // Create effect element
        const effect = this.document.createElement('div');
        effect.className = 'click-effect';
        effect.textContent = `+¥${amount}`;
        
        // Random position within target
        const targetRect = this.clickerTarget.getBoundingClientRect();
        const x = Math.random() * (targetRect.width - 40);
        const y = Math.random() * (targetRect.height - 20);
        
        effect.style.left = `${x}px`;
        effect.style.top = `${y}px`;
        
        // Add element
        this.clickerTarget.appendChild(effect);
        
        // Remove element after animation
        setTimeout(() => {
            if (effect.parentNode) {
                effect.parentNode.removeChild(effect);
            }
        }, 1500);
    }
    
    /**
     * Start auto income processing
     * @private
     */
    _startAutoIncome() {
        // Clear existing timer
        if (this.autoIncomeTimer) {
            clearInterval(this.autoIncomeTimer);
        }
        
        // Set auto income timer
        this.autoIncomeTimer = setInterval(() => {
            if (this.state.autoFunds > 0) {
                // Calculate auto income
                const autoIncome = Math.floor(
                    this.state.autoFunds * this.state.autoFundsMultiplier * this.state.allMultiplier
                );
                
                // Add funds
                this.city.funds += autoIncome;
                this.state.totalFunds += autoIncome;
                
                // Check building unlocks
                this._checkBuildingUnlocks();
                
                // Check achievements
                this._checkAchievements();
                
                // Update UI
                this._updateStats();
                
                // Emit auto income event
                this.events.emit('autoIncome', {
                    autoIncome,
                    totalFunds: this.state.totalFunds
                });
                
                // Show subtle auto income indicator
                this._showAutoIncomeIndicator(autoIncome);
            }
        }, GameConfig.CLICKER.AUTO_FUNDS_INTERVAL);
    }
    
    /**
     * Show auto income indicator
     * @param {number} amount - Amount gained
     * @private
     */
    _showAutoIncomeIndicator(amount) {
        // Find auto income stat element
        const autoIncomeEl = this.document.getElementById('auto-income');
        if (!autoIncomeEl) return;
        
        // Add highlight class
        autoIncomeEl.classList.add('income-highlight');
        
        // Create mini indicator
        const indicator = this.document.createElement('div');
        indicator.className = 'mini-indicator';
        indicator.textContent = `+¥${amount}`;
        indicator.style.position = 'absolute';
        indicator.style.right = '10px';
        indicator.style.color = '#2ecc71';
        indicator.style.fontSize = '0.8rem';
        indicator.style.fontWeight = 'bold';
        indicator.style.opacity = '0';
        indicator.style.transform = 'translateY(0)';
        indicator.style.transition = 'all 1s ease-out';
        autoIncomeEl.parentNode.style.position = 'relative';
        autoIncomeEl.parentNode.appendChild(indicator);
        
        // Animate indicator
        setTimeout(() => {
            indicator.style.opacity = '1';
            indicator.style.transform = 'translateY(-15px)';
        }, 10);
        
        // Remove highlight and indicator
        setTimeout(() => {
            autoIncomeEl.classList.remove('income-highlight');
            indicator.style.opacity = '0';
            
            setTimeout(() => {
                if (indicator.parentNode) {
                    indicator.parentNode.removeChild(indicator);
                }
            }, 1000);
        }, 1000);
    }
    
    /**
     * Check building unlock status
     * @private
     */
    _checkBuildingUnlocks() {
        // Coin Mint unlock
        if (!this.state.unlocked.COIN_MINT && this.state.totalFunds >= GameConfig.CLICKER.UNLOCK_THRESHOLDS.COIN_MINT) {
            this.state.unlocked.COIN_MINT = true;
            this._renderBuildings();
            
            // Emit unlock event
            this.events.emit('buildingUnlocked', {
                building: 'COIN_MINT',
                totalFunds: this.state.totalFunds
            });
            
            // Show notification
            this._showUnlockNotification('COIN_MINT');
        }
        
        // Bank unlock
        if (!this.state.unlocked.BANK && this.state.totalFunds >= GameConfig.CLICKER.UNLOCK_THRESHOLDS.BANK) {
            this.state.unlocked.BANK = true;
            this._renderBuildings();
            
            // Emit unlock event
            this.events.emit('buildingUnlocked', {
                building: 'BANK',
                totalFunds: this.state.totalFunds
            });
            
            // Show notification
            this._showUnlockNotification('BANK');
        }
        
        // Investment Firm unlock
        if (!this.state.unlocked.INVESTMENT_FIRM && this.state.totalFunds >= GameConfig.CLICKER.UNLOCK_THRESHOLDS.INVESTMENT_FIRM) {
            this.state.unlocked.INVESTMENT_FIRM = true;
            this._renderBuildings();
            
            // Emit unlock event
            this.events.emit('buildingUnlocked', {
                building: 'INVESTMENT_FIRM',
                totalFunds: this.state.totalFunds
            });
            
            // Show notification
            this._showUnlockNotification('INVESTMENT_FIRM');
        }
    }
    
    /**
     * Show building unlock notification
     * @param {string} buildingType - Building type
     * @private
     */
    _showUnlockNotification(buildingType) {
        // Add to game log
        this.uiController.addEventToLog({
            title: '新しい建物がアンロック',
            message: GameText.CLICKER.UNLOCK_MESSAGE.replace('{building}', GameConfig.BUILDINGS[buildingType].name),
            type: 'event-success',
            icon: 'unlock'
        });
        
        // Visual indicator in the UI
        const buildingsHeader = this.buildingsContainer?.parentElement?.querySelector('h3');
        if (buildingsHeader) {
            // Create notification indicator
            const notification = this.document.createElement('span');
            notification.className = 'unlock-notification';
            notification.innerHTML = '新着！';
            notification.style.backgroundColor = '#f39c12';
            notification.style.color = 'white';
            notification.style.padding = '0.2rem 0.5rem';
            notification.style.borderRadius = '10px';
            notification.style.fontSize = '0.7rem';
            notification.style.fontWeight = 'bold';
            notification.style.marginLeft = '10px';
            notification.style.animation = 'pulse 2s infinite';
            
            buildingsHeader.appendChild(notification);
            
            // Remove after 5 seconds
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 5000);
        }
    }
    
    /**
     * Check achievement status
     * @private
     */
    _checkAchievements() {
        // First Steps
        if (!this.state.achievements.FIRST_STEPS && this.state.totalClicks >= GameConfig.CLICKER.ACHIEVEMENTS.FIRST_STEPS.requirement.totalClicks) {
            this.state.achievements.FIRST_STEPS = true;
            
            // Apply bonus
            this.state.clickMultiplier += GameConfig.CLICKER.ACHIEVEMENTS.FIRST_STEPS.bonus.clickMultiplier;
            
            this._renderAchievements();
            
            // Emit achievement unlocked event
            this.events.emit('achievementUnlocked', {
                achievement: 'FIRST_STEPS',
                bonus: GameConfig.CLICKER.ACHIEVEMENTS.FIRST_STEPS.bonus
            });
            
            // Show notification
            this._showAchievementNotification('FIRST_STEPS');
        }
        
        // Dedicated Mayor
        if (!this.state.achievements.DEDICATED_MAYOR && this.state.totalClicks >= GameConfig.CLICKER.ACHIEVEMENTS.DEDICATED_MAYOR.requirement.totalClicks) {
            this.state.achievements.DEDICATED_MAYOR = true;
            
            // Apply bonus
            this.state.clickMultiplier += GameConfig.CLICKER.ACHIEVEMENTS.DEDICATED_MAYOR.bonus.clickMultiplier;
            
            this._renderAchievements();
            
            // Emit achievement unlocked event
            this.events.emit('achievementUnlocked', {
                achievement: 'DEDICATED_MAYOR',
                bonus: GameConfig.CLICKER.ACHIEVEMENTS.DEDICATED_MAYOR.bonus
            });
            
            // Show notification
            this._showAchievementNotification('DEDICATED_MAYOR');
        }
        
        // Financial Genius
        if (!this.state.achievements.FINANCIAL_GENIUS && this.state.totalFunds >= GameConfig.CLICKER.ACHIEVEMENTS.FINANCIAL_GENIUS.requirement.totalFunds) {
            this.state.achievements.FINANCIAL_GENIUS = true;
            
            // Apply bonus
            this.state.allMultiplier += GameConfig.CLICKER.ACHIEVEMENTS.FINANCIAL_GENIUS.bonus.fundMultiplier;
            
            this._renderAchievements();
            
            // Emit achievement unlocked event
            this.events.emit('achievementUnlocked', {
                achievement: 'FINANCIAL_GENIUS',
                bonus: GameConfig.CLICKER.ACHIEVEMENTS.FINANCIAL_GENIUS.bonus
            });
            
            // Show notification
            this._showAchievementNotification('FINANCIAL_GENIUS');
        }
    }
    
    /**
     * Show achievement notification
     * @param {string} achievementId - Achievement ID
     * @private
     */
    _showAchievementNotification(achievementId) {
        const achievement = GameConfig.CLICKER.ACHIEVEMENTS[achievementId];
        
        // Add to game log
        this.uiController.addEventToLog({
            title: '実績解除',
            message: GameText.CLICKER.ACHIEVEMENT_UNLOCKED.replace('{name}', achievement.name),
            type: 'event-success',
            icon: 'trophy'
        });
        
        // Visual effect in achievement section
        const achievementItem = this.achievementsContainer?.querySelector(`[data-achievement="${achievementId}"]`);
        if (achievementItem) {
            // Add unlocked class and animation
            achievementItem.classList.add('unlocked', 'achievement-unlocked-animation');
            
            // Remove animation class after animation completes
            setTimeout(() => {
                achievementItem.classList.remove('achievement-unlocked-animation');
            }, 2000);
        }
        
        // Trophy animation overlay
        const trophyOverlay = this.document.createElement('div');
        trophyOverlay.className = 'trophy-overlay';
        trophyOverlay.innerHTML = `
            <div class="trophy-container">
                <i class="fas fa-trophy"></i>
                <div class="trophy-text">
                    <h3>実績解除!</h3>
                    <p>${achievement.name}</p>
                </div>
            </div>
        `;
        
        // Style trophy overlay
        Object.assign(trophyOverlay.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: '2000',
            opacity: '0',
            transition: 'opacity 0.5s',
            pointerEvents: 'none'
        });
        
        // Style trophy container
        const trophyContainer = trophyOverlay.querySelector('.trophy-container');
        Object.assign(trophyContainer.style, {
            backgroundColor: 'white',
            borderRadius: '15px',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
            transform: 'scale(0.8)',
            transition: 'transform 0.5s',
            maxWidth: '80%'
        });
        
        // Style trophy icon
        const trophyIcon = trophyOverlay.querySelector('.fa-trophy');
        Object.assign(trophyIcon.style, {
            fontSize: '3rem',
            color: '#f39c12',
            textShadow: '0 2px 10px rgba(243, 156, 18, 0.5)'
        });
        
        // Add to body
        this.document.body.appendChild(trophyOverlay);
        
        // Animate in
        setTimeout(() => {
            trophyOverlay.style.opacity = '1';
            trophyContainer.style.transform = 'scale(1)';
        }, 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            trophyOverlay.style.opacity = '0';
            setTimeout(() => {
                if (trophyOverlay.parentNode) {
                    trophyOverlay.parentNode.removeChild(trophyOverlay);
                }
            }, 500);
        }, 3000);
    }
    
    /**
     * Buy building
     * @param {string} buildingType - Building type
     * @private
     */
    _buyBuilding(buildingType) {
        const building = GameConfig.BUILDINGS[buildingType];
        if (!building) return;
        
        // Check funds
        if (this.city.funds < building.cost) {
            // Show insufficient funds message
            const button = this.document.querySelector(`[data-building="${buildingType}"]`);
            if (button) {
                // Red flash effect
                button.classList.add('insufficient-funds');
                setTimeout(() => {
                    button.classList.remove('insufficient-funds');
                }, 500);
            }
            
            this.uiController.addEventToLog({
                title: '建物購入失敗',
                message: `資金が足りません。必要資金: ¥${building.cost.toLocaleString()} | 現在の資金: ¥${this.city.funds.toLocaleString()}`,
                type: 'event-danger',
                icon: 'exclamation-circle'
            });
            return;
        }
        
        // Spend funds
        this.city.funds -= building.cost;
        
        // Add building
        if (!this.state.buildings[buildingType]) {
            this.state.buildings[buildingType] = 0;
        }
        this.state.buildings[buildingType]++;
        
        // Apply effects
        if (building.effects.clickMultiplier) {
            this.state.clickMultiplier += building.effects.clickMultiplier;
        }
        
        if (building.effects.autoFunds) {
            this.state.autoFunds += building.effects.autoFunds;
        }
        
        if (building.effects.fundMultiplier) {
            this.state.allMultiplier += building.effects.fundMultiplier;
        }
        
        // Update UI
        this._renderBuildings();
        this._updateStats();
        
        // Emit purchase event
        this.events.emit('buildingPurchased', {
            type: buildingType,
            cost: building.cost,
            count: this.state.buildings[buildingType]
        });
        
        // Show purchase animation
        this._showPurchaseAnimation(buildingType);
        
        // Show notification
        this.uiController.addEventToLog({
            title: '建物購入',
            message: `${building.name}を購入しました。残りの資金: ¥${this.city.funds.toLocaleString()}`,
            type: 'event-success',
            icon: building.icon
        });
    }
    
    /**
     * Show purchase animation
     * @param {string} itemType - Item type
     * @private
     */
    _showPurchaseAnimation(itemType) {
        // Find the stats element to animate
        let statToAnimate;
        let effectType;
        
        if (GameConfig.BUILDINGS[itemType]?.effects.clickMultiplier) {
            statToAnimate = this.document.getElementById('click-value');
            effectType = 'click';
        } else if (GameConfig.BUILDINGS[itemType]?.effects.autoFunds) {
            statToAnimate = this.document.getElementById('auto-income');
            effectType = 'auto';
        } else if (GameConfig.BUILDINGS[itemType]?.effects.fundMultiplier) {
            statToAnimate = this.document.getElementById('click-value');
            effectType = 'all';
        }
        
        if (statToAnimate) {
            // Add highlight class
            statToAnimate.classList.add(effectType === 'click' ? 'click-highlight' : effectType === 'auto' ? 'auto-highlight' : 'all-highlight');
            
            // Remove highlight after animation
            setTimeout(() => {
                statToAnimate.classList.remove('click-highlight', 'auto-highlight', 'all-highlight');
            }, 1000);
        }
    }
    
    /**
     * Buy upgrade
     * @param {string} upgradeId - Upgrade ID
     * @private
     */
    _buyUpgrade(upgradeId) {
        const upgrade = GameConfig.CLICKER.UPGRADES[upgradeId];
        if (!upgrade) return;
        
        // Check if already purchased
        if (this.state.upgrades[upgradeId]) {
            return;
        }
        
        // Check funds
        if (this.city.funds < upgrade.cost) {
            // Show insufficient funds message
            const button = this.document.querySelector(`[data-upgrade="${upgradeId}"]`);
            if (button) {
                // Red flash effect
                button.classList.add('insufficient-funds');
                setTimeout(() => {
                    button.classList.remove('insufficient-funds');
                }, 500);
            }
            
            this.uiController.addEventToLog({
                title: 'アップグレード購入失敗',
                message: `資金が足りません。必要資金: ¥${upgrade.cost.toLocaleString()} | 現在の資金: ¥${this.city.funds.toLocaleString()}`,
                type: 'event-danger',
                icon: 'exclamation-circle'
            });
            return;
        }
        
        // Spend funds
        this.city.funds -= upgrade.cost;
        
        // Purchase upgrade
        this.state.upgrades[upgradeId] = true;
        
        // Apply effects
        if (upgrade.effect.clickMultiplier) {
            this.state.clickMultiplier += upgrade.effect.clickMultiplier;
        }
        
        if (upgrade.effect.autoFundsMultiplier) {
            this.state.autoFundsMultiplier += upgrade.effect.autoFundsMultiplier;
        }
        
        if (upgrade.effect.allMultiplier) {
            this.state.allMultiplier += upgrade.effect.allMultiplier;
        }
        
        // Update UI
        this._renderUpgrades();
        this._updateStats();
        
        // Emit purchase event
        this.events.emit('upgradePurchased', {
            id: upgradeId,
            cost: upgrade.cost,
            effect: upgrade.effect
        });
        
        // Show purchase animation
        this._showUpgradePurchaseAnimation(upgradeId);
        
        // Show notification
        this.uiController.addEventToLog({
            title: 'アップグレード購入',
            message: `${upgrade.name}を購入しました。残りの資金: ¥${this.city.funds.toLocaleString()}`,
            type: 'event-success',
            icon: 'arrow-up'
        });
    }
    
    /**
     * Show upgrade purchase animation
     * @param {string} upgradeId - Upgrade ID
     * @private
     */
    _showUpgradePurchaseAnimation(upgradeId) {
        // Find the stats element to animate based on upgrade type
        let statToAnimate;
        let effectType;
        
        if (upgradeId === 'BETTER_TOOLS') {
            statToAnimate = this.document.getElementById('click-value');
            effectType = 'click';
        } else if (upgradeId === 'EFFICIENT_PROCESS') {
            statToAnimate = this.document.getElementById('auto-income');
            effectType = 'auto';
        } else if (upgradeId === 'ADVANCED_ECONOMY') {
            statToAnimate = this.document.getElementById('total-earned');
            effectType = 'all';
        }
        
        if (statToAnimate) {
            // Add highlight class with stronger effect
            statToAnimate.classList.add(effectType === 'click' ? 'click-highlight-strong' : effectType === 'auto' ? 'auto-highlight-strong' : 'all-highlight-strong');
            
            // Remove highlight after animation
            setTimeout(() => {
                statToAnimate.classList.remove('click-highlight-strong', 'auto-highlight-strong', 'all-highlight-strong');
            }, 1500);
        }
        
        // Find the upgrade item
        const upgradeItem = this.document.querySelector(`[data-upgrade="${upgradeId}"]`)?.closest('.clicker-item');
        if (upgradeItem) {
            // Add purchased class with animation
            upgradeItem.classList.add('purchased', 'purchase-animation');
            
            // Remove animation class after it completes
            setTimeout(() => {
                upgradeItem.classList.remove('purchase-animation');
            }, 1000);
        }
    }
    
    /**
     * Update clicker stats
     * @private
     */
    _updateStats() {
        if (!this.clickerStats) return;
        
        // Update click value
        const clickValueEl = this.document.getElementById('click-value');
        if (clickValueEl) {
            const effectiveClickValue = this.state.clickValue * this.state.clickMultiplier * this.state.allMultiplier;
            clickValueEl.textContent = GameText.CLICKER.CLICK_VALUE.replace('{value}', Math.floor(effectiveClickValue));
        }
        
        // Update auto income
        const autoIncomeEl = this.document.getElementById('auto-income');
        if (autoIncomeEl) {
            const effectiveAutoIncome = this.state.autoFunds * this.state.autoFundsMultiplier * this.state.allMultiplier;
            autoIncomeEl.textContent = GameText.CLICKER.AUTO_INCOME.replace('{value}', Math.floor(effectiveAutoIncome));
        }
        
        // Update total earned funds
        const totalEarnedEl = this.document.getElementById('total-earned');
        if (totalEarnedEl) {
            totalEarnedEl.textContent = GameText.CLICKER.TOTAL_EARNED.replace('{value}', this.state.totalFunds.toLocaleString());
        }
        
        // Update total clicks
        const totalClicksEl = this.document.getElementById('total-clicks');
        if (totalClicksEl) {
            totalClicksEl.textContent = GameText.CLICKER.TOTAL_CLICKS.replace('{value}', this.state.totalClicks.toLocaleString());
        }
        
        // Update achievement progress bars
        this._updateAchievementProgress();
        
        // Update UI controller stats display
        if (this.uiController) {
            this.uiController.updateAllStatDisplays();
        }
    }
    
    /**
     * Update achievement progress bars
     * @private
     */
    _updateAchievementProgress() {
        // First Steps progress
        const firstStepsProgress = this.document.querySelector('[data-achievement="FIRST_STEPS"] .progress-fill');
        const firstStepsText = this.document.querySelector('[data-achievement="FIRST_STEPS"] .clicker-item-progress span');
        
        if (firstStepsProgress && firstStepsText) {
            const requirement = GameConfig.CLICKER.ACHIEVEMENTS.FIRST_STEPS.requirement.totalClicks;
            const progress = Math.min(100, (this.state.totalClicks / requirement) * 100);
            
            firstStepsProgress.style.width = `${progress}%`;
            firstStepsText.textContent = `${this.state.totalClicks} / ${requirement}`;
        }
        
        // Dedicated Mayor progress
        const dedicatedMayorProgress = this.document.querySelector('[data-achievement="DEDICATED_MAYOR"] .progress-fill');
        const dedicatedMayorText = this.document.querySelector('[data-achievement="DEDICATED_MAYOR"] .clicker-item-progress span');
        
        if (dedicatedMayorProgress && dedicatedMayorText) {
            const requirement = GameConfig.CLICKER.ACHIEVEMENTS.DEDICATED_MAYOR.requirement.totalClicks;
            const progress = Math.min(100, (this.state.totalClicks / requirement) * 100);
            
            dedicatedMayorProgress.style.width = `${progress}%`;
            dedicatedMayorText.textContent = `${this.state.totalClicks} / ${requirement}`;
        }
        
        // Financial Genius progress
        const financialGeniusProgress = this.document.querySelector('[data-achievement="FINANCIAL_GENIUS"] .progress-fill');
        const financialGeniusText = this.document.querySelector('[data-achievement="FINANCIAL_GENIUS"] .clicker-item-progress span');
        
        if (financialGeniusProgress && financialGeniusText) {
            const requirement = GameConfig.CLICKER.ACHIEVEMENTS.FINANCIAL_GENIUS.requirement.totalFunds;
            const progress = Math.min(100, (this.state.totalFunds / requirement) * 100);
            
            financialGeniusProgress.style.width = `${progress}%`;
            financialGeniusText.textContent = `¥${this.state.totalFunds.toLocaleString()} / ¥${requirement.toLocaleString()}`;
        }
    }
    
    /**
     * Render buildings list
     * @private
     */
    _renderBuildings() {
        if (!this.buildingsContainer) return;
        
        this.buildingsContainer.innerHTML = '';
        
        // Coin Mint
        if (this.state.unlocked.COIN_MINT) {
            const coinMint = GameConfig.BUILDINGS.COIN_MINT;
            const count = this.state.buildings.COIN_MINT || 0;
            
            const buildingEl = this.document.createElement('div');
            buildingEl.className = 'clicker-item';
            buildingEl.setAttribute('data-building-container', 'COIN_MINT');
            buildingEl.innerHTML = `
                <div class="clicker-item-icon"><i class="fas fa-${coinMint.icon}"></i></div>
                <div class="clicker-item-info">
                    <div class="clicker-item-name">${coinMint.name} <span class="clicker-item-count">(${count})</span></div>
                    <div class="clicker-item-desc">${coinMint.description}</div>
                    <div class="clicker-item-effect">
                        <span>クリック +${(coinMint.effects.clickMultiplier * 100)}%</span>
                        <span>自動収入 +¥${coinMint.effects.autoFunds}/秒</span>
                    </div>
                </div>
                <button class="clicker-item-btn" data-building="COIN_MINT">
                    <span>購入</span>
                    <span class="clicker-item-cost">¥${coinMint.cost}</span>
                </button>
            `;
            
            this.buildingsContainer.appendChild(buildingEl);
        }
        
        // Bank
        if (this.state.unlocked.BANK) {
            const bank = GameConfig.BUILDINGS.BANK;
            const count = this.state.buildings.BANK || 0;
            
            const buildingEl = this.document.createElement('div');
            buildingEl.className = 'clicker-item';
            buildingEl.setAttribute('data-building-container', 'BANK');
            buildingEl.innerHTML = `
                <div class="clicker-item-icon"><i class="fas fa-${bank.icon}"></i></div>
                <div class="clicker-item-info">
                    <div class="clicker-item-name">${bank.name} <span class="clicker-item-count">(${count})</span></div>
                    <div class="clicker-item-desc">${bank.description}</div>
                    <div class="clicker-item-effect">
                        <span>自動収入 +¥${bank.effects.autoFunds}/秒</span>
                        <span>資金保管 +¥${bank.effects.fundStorage}</span>
                    </div>
                </div>
                <button class="clicker-item-btn" data-building="BANK">
                    <span>購入</span>
                    <span class="clicker-item-cost">¥${bank.cost}</span>
                </button>
            `;
            
            this.buildingsContainer.appendChild(buildingEl);
        }
        
        // Investment Firm
        if (this.state.unlocked.INVESTMENT_FIRM) {
            const investmentFirm = GameConfig.BUILDINGS.INVESTMENT_FIRM;
            const count = this.state.buildings.INVESTMENT_FIRM || 0;
            
            const buildingEl = this.document.createElement('div');
            buildingEl.className = 'clicker-item';
            buildingEl.setAttribute('data-building-container', 'INVESTMENT_FIRM');
            buildingEl.innerHTML = `
                <div class="clicker-item-icon"><i class="fas fa-${investmentFirm.icon}"></i></div>
                <div class="clicker-item-info">
                    <div class="clicker-item-name">${investmentFirm.name} <span class="clicker-item-count">(${count})</span></div>
                    <div class="clicker-item-desc">${investmentFirm.description}</div>
                    <div class="clicker-item-effect">
                        <span>全収入 +${(investmentFirm.effects.fundMultiplier * 100)}%</span>
                        <span>自動収入 +¥${investmentFirm.effects.autoFunds}/秒</span>
                    </div>
                </div>
                <button class="clicker-item-btn" data-building="INVESTMENT_FIRM">
                    <span>購入</span>
                    <span class="clicker-item-cost">¥${investmentFirm.cost}</span>
                </button>
            `;
            
            this.buildingsContainer.appendChild(buildingEl);
        }
        
        // No unlocked buildings
        if (this.buildingsContainer.children.length === 0) {
            this.buildingsContainer.innerHTML = `
                <div class="clicker-empty">
                    <p>まだ建物はアンロックされていません。</p>
                    <p>資金を稼いで新しい建物をアンロックしましょう！</p>
                </div>
            `;
        }
        
        // Building purchase button event listeners
        const buildingButtons = this.buildingsContainer.querySelectorAll('.clicker-item-btn');
        buildingButtons.forEach(button => {
            button.addEventListener('click', () => {
                const buildingType = button.getAttribute('data-building');
                this._buyBuilding(buildingType);
            });
        });
    }
    
    /**
     * Render upgrades list
     * @private
     */
    _renderUpgrades() {
        if (!this.upgradesContainer) return;
        
        this.upgradesContainer.innerHTML = '';
        
        // Better Tools
        const betterToolsId = 'BETTER_TOOLS';
        const betterTools = GameConfig.CLICKER.UPGRADES.BETTER_TOOLS;
        const betterToolsPurchased = this.state.upgrades[betterToolsId];
        
        const betterToolsEl = this.document.createElement('div');
        betterToolsEl.className = `clicker-item ${betterToolsPurchased ? 'purchased' : ''}`;
        betterToolsEl.setAttribute('data-upgrade-container', betterToolsId);
        betterToolsEl.innerHTML = `
            <div class="clicker-item-icon"><i class="fas fa-tools"></i></div>
            <div class="clicker-item-info">
                <div class="clicker-item-name">${betterTools.name} ${betterToolsPurchased ? '<span class="purchased-tag">購入済み</span>' : ''}</div>
                <div class="clicker-item-desc">${betterTools.description}</div>
                <div class="clicker-item-effect">
                    <span>クリック価値 +${(betterTools.effect.clickMultiplier * 100)}%</span>
                </div>
            </div>
            ${betterToolsPurchased ? '' : `
                <button class="clicker-item-btn" data-upgrade="${betterToolsId}">
                    <span>購入</span>
                    <span class="clicker-item-cost">¥${betterTools.cost}</span>
                </button>
            `}
        `;
        
        this.upgradesContainer.appendChild(betterToolsEl);
        
        // Efficient Process
        const efficientProcessId = 'EFFICIENT_PROCESS';
        const efficientProcess = GameConfig.CLICKER.UPGRADES.EFFICIENT_PROCESS;
        const efficientProcessPurchased = this.state.upgrades[efficientProcessId];
        
        const efficientProcessEl = this.document.createElement('div');
        efficientProcessEl.className = `clicker-item ${efficientProcessPurchased ? 'purchased' : ''}`;
        efficientProcessEl.setAttribute('data-upgrade-container', efficientProcessId);
        efficientProcessEl.innerHTML = `
            <div class="clicker-item-icon"><i class="fas fa-cogs"></i></div>
            <div class="clicker-item-info">
                <div class="clicker-item-name">${efficientProcess.name} ${efficientProcessPurchased ? '<span class="purchased-tag">購入済み</span>' : ''}</div>
                <div class="clicker-item-desc">${efficientProcess.description}</div>
                <div class="clicker-item-effect">
                    <span>自動収入 +${(efficientProcess.effect.autoFundsMultiplier * 100)}%</span>
                </div>
            </div>
            ${efficientProcessPurchased ? '' : `
                <button class="clicker-item-btn" data-upgrade="${efficientProcessId}">
                    <span>購入</span>
                    <span class="clicker-item-cost">¥${efficientProcess.cost}</span>
                </button>
            `}
        `;
        
        this.upgradesContainer.appendChild(efficientProcessEl);
        
        // Advanced Economy
        const advancedEconomyId = 'ADVANCED_ECONOMY';
        const advancedEconomy = GameConfig.CLICKER.UPGRADES.ADVANCED_ECONOMY;
        const advancedEconomyPurchased = this.state.upgrades[advancedEconomyId];
        
        const advancedEconomyEl = this.document.createElement('div');
        advancedEconomyEl.className = `clicker-item ${advancedEconomyPurchased ? 'purchased' : ''}`;
        advancedEconomyEl.setAttribute('data-upgrade-container', advancedEconomyId);
        advancedEconomyEl.innerHTML = `
            <div class="clicker-item-icon"><i class="fas fa-chart-line"></i></div>
            <div class="clicker-item-info">
                <div class="clicker-item-name">${advancedEconomy.name} ${advancedEconomyPurchased ? '<span class="purchased-tag">購入済み</span>' : ''}</div>
                <div class="clicker-item-desc">${advancedEconomy.description}</div>
                <div class="clicker-item-effect">
                    <span>全収入 +${(advancedEconomy.effect.allMultiplier * 100)}%</span>
                </div>
            </div>
            ${advancedEconomyPurchased ? '' : `
                <button class="clicker-item-btn" data-upgrade="${advancedEconomyId}">
                    <span>購入</span>
                    <span class="clicker-item-cost">¥${advancedEconomy.cost}</span>
                </button>
            `}
        `;
        
        this.upgradesContainer.appendChild(advancedEconomyEl);
        
        // Upgrade purchase button event listeners
        const upgradeButtons = this.upgradesContainer.querySelectorAll('.clicker-item-btn');
        upgradeButtons.forEach(button => {
            button.addEventListener('click', () => {
                const upgradeId = button.getAttribute('data-upgrade');
                this._buyUpgrade(upgradeId);
            });
        });
    }
    
    /**
     * Render achievements list
     * @private
     */
    _renderAchievements() {
        if (!this.achievementsContainer) return;
        
        this.achievementsContainer.innerHTML = '';
        
        // First Steps
        const firstStepsId = 'FIRST_STEPS';
        const firstSteps = GameConfig.CLICKER.ACHIEVEMENTS.FIRST_STEPS;
        const firstStepsUnlocked = this.state.achievements[firstStepsId];
        
        const firstStepsEl = this.document.createElement('div');
        firstStepsEl.className = `clicker-item ${firstStepsUnlocked ? 'unlocked' : ''}`;
        firstStepsEl.setAttribute('data-achievement', firstStepsId);
        firstStepsEl.innerHTML = `
            <div class="clicker-item-icon"><i class="fas fa-baby"></i></div>
            <div class="clicker-item-info">
                <div class="clicker-item-name">${firstSteps.name} ${firstStepsUnlocked ? '<span class="unlocked-tag">達成済み</span>' : ''}</div>
                <div class="clicker-item-desc">${firstSteps.description}</div>
                <div class="clicker-item-effect">
                    <span>クリック価値 +${(firstSteps.bonus.clickMultiplier * 100)}%</span>
                </div>
                <div class="clicker-item-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${Math.min(100, (this.state.totalClicks / firstSteps.requirement.totalClicks) * 100)}%"></div>
                    </div>
                    <span>${this.state.totalClicks} / ${firstSteps.requirement.totalClicks}</span>
                </div>
            </div>
        `;
        
        this.achievementsContainer.appendChild(firstStepsEl);
        
        // Dedicated Mayor
        const dedicatedMayorId = 'DEDICATED_MAYOR';
        const dedicatedMayor = GameConfig.CLICKER.ACHIEVEMENTS.DEDICATED_MAYOR;
        const dedicatedMayorUnlocked = this.state.achievements[dedicatedMayorId];
        
        const dedicatedMayorEl = this.document.createElement('div');
        dedicatedMayorEl.className = `clicker-item ${dedicatedMayorUnlocked ? 'unlocked' : ''}`;
        dedicatedMayorEl.setAttribute('data-achievement', dedicatedMayorId);
        dedicatedMayorEl.innerHTML = `
            <div class="clicker-item-icon"><i class="fas fa-user-tie"></i></div>
            <div class="clicker-item-info">
                <div class="clicker-item-name">${dedicatedMayor.name} ${dedicatedMayorUnlocked ? '<span class="unlocked-tag">達成済み</span>' : ''}</div>
                <div class="clicker-item-desc">${dedicatedMayor.description}</div>
                <div class="clicker-item-effect">
                    <span>クリック価値 +${(dedicatedMayor.bonus.clickMultiplier * 100)}%</span>
                </div>
                <div class="clicker-item-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${Math.min(100, (this.state.totalClicks / dedicatedMayor.requirement.totalClicks) * 100)}%"></div>
                    </div>
                    <span>${this.state.totalClicks} / ${dedicatedMayor.requirement.totalClicks}</span>
                </div>
            </div>
        `;
        
        this.achievementsContainer.appendChild(dedicatedMayorEl);
        
        // Financial Genius
        const financialGeniusId = 'FINANCIAL_GENIUS';
        const financialGenius = GameConfig.CLICKER.ACHIEVEMENTS.FINANCIAL_GENIUS;
        const financialGeniusUnlocked = this.state.achievements[financialGeniusId];
        
        const financialGeniusEl = this.document.createElement('div');
        financialGeniusEl.className = `clicker-item ${financialGeniusUnlocked ? 'unlocked' : ''}`;
        financialGeniusEl.setAttribute('data-achievement', financialGeniusId);
        financialGeniusEl.innerHTML = `
            <div class="clicker-item-icon"><i class="fas fa-donate"></i></div>
            <div class="clicker-item-info">
                <div class="clicker-item-name">${financialGenius.name} ${financialGeniusUnlocked ? '<span class="unlocked-tag">達成済み</span>' : ''}</div>
                <div class="clicker-item-desc">${financialGenius.description}</div>
                <div class="clicker-item-effect">
                    <span>全収入 +${(financialGenius.bonus.fundMultiplier * 100)}%</span>
                </div>
                <div class="clicker-item-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${Math.min(100, (this.state.totalFunds / financialGenius.requirement.totalFunds) * 100)}%"></div>
                    </div>
                    <span>¥${this.state.totalFunds.toLocaleString()} / ¥${financialGenius.requirement.totalFunds.toLocaleString()}</span>
                </div>
            </div>
        `;
        
        this.achievementsContainer.appendChild(financialGeniusEl);
    }
    
    /**
     * Show clicker UI
     */
    show() {
        // Show UI (initialization handled via setDocument)
        if (this.clickerElement) {
            this.clickerElement.classList.remove('hidden');
            // Add entrance animation
            this.clickerElement.style.animation = 'none';
            void this.clickerElement.offsetHeight; // Force reflow
            this.clickerElement.style.animation = 'fadeInScale 0.3s forwards';
        }
        // Emit shown event
        this.events.emit('shown', {
            state: { ...this.state }
        });
    }
    
    /**
     * Hide clicker UI
     */
    hide() {
        if (this.clickerElement) {
            // Add exit animation
            this.clickerElement.style.animation = 'fadeOutScale 0.3s forwards';
            
            // Actually hide after animation completes
            setTimeout(() => {
                this.clickerElement.classList.add('hidden');
            }, 300);
        }
        
        // Emit hidden event
        this.events.emit('hidden', {
            state: { ...this.state }
        });
    }
    
    /**
     * Save state
     * @param {SaveManager} saveManager - Save manager
     */
    saveState(saveManager) {
        if (!saveManager) return;
        
        // Link clicker data to city model
        this.city.clickerData = { ...this.state };
    }
    
    /**
     * Load state
     * @param {SaveManager} saveManager - Save manager
     */
    loadState(saveManager) {
        if (!saveManager) return;
        
        // Load clicker data from city model
        if (this.city.clickerData) {
            this.state = { ...this.city.clickerData };
        }
        
        // Update UI
        if (this.initialized) {
            this._renderBuildings();
            this._renderUpgrades();
            this._renderAchievements();
            this._updateStats();
        }
    }
}
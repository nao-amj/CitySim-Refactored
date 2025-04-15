/**
 * CitySim - イベント設定
 * ゲーム内で発生する様々なイベントの定義
 */

export const EventsConfig = {
    // 自然災害イベント
    NATURAL_DISASTERS: [
        {
            id: 'earthquake',
            title: '地震発生！',
            message: '市内で地震が発生しました。被害の修復が必要です。',
            type: 'event-danger',
            icon: 'globe-asia',
            probability: 0.03,
            conditions: {},
            effects: {
                population: -15,
                funds: -200,
                happiness: -10,
                buildings: {
                    house: -1
                }
            }
        },
        {
            id: 'fire',
            title: '市内で火災発生！',
            message: '消防署が被害を最小限に抑えました。',
            type: 'event-danger',
            icon: 'fire',
            probability: 0.04,
            conditions: {},
            effects: {
                population: -10,
                happiness: -5
            }
        },
        {
            id: 'flood',
            title: '洪水発生！',
            message: '豪雨による洪水が市内の一部地域を襲いました。',
            type: 'event-danger',
            icon: 'water',
            probability: 0.04,
            conditions: {},
            effects: {
                funds: -150,
                happiness: -8,
                environment: -5
            }
        },
        {
            id: 'heatwave',
            title: '猛暑到来',
            message: '記録的な猛暑が市民の健康に影響を与えています。',
            type: 'event-warning',
            icon: 'temperature-high',
            probability: 0.05,
            conditions: {},
            effects: {
                happiness: -5,
                funds: -50
            }
        },
        {
            id: 'storm',
            title: '嵐による道路損傷',
            message: '修理作業が進行中です。',
            type: 'event-warning',
            icon: 'cloud-showers-heavy',
            probability: 0.05,
            conditions: {
                buildings: {
                    road: { min: 1 }
                }
            },
            effects: {
                buildings: {
                    road: -1
                },
                funds: -50,
                happiness: -2
            }
        },
        {
            id: 'blackout',
            title: '停電発生！',
            message: '市内で停電が発生しています。',
            type: 'event-danger',
            icon: 'bolt',
            probability: 0.04,
            conditions: {
                population: { min: 30 }
            },
            effects: {
                happiness: -10,
                funds: -50
            }
        }
    ],
    
    // 経済イベント
    ECONOMIC_EVENTS: [
        {
            id: 'new_factory',
            title: '新工場がオープン！',
            message: '雇用が増加し、経済が活性化しました。',
            type: 'event-success',
            icon: 'industry',
            probability: 0.05,
            conditions: {
                buildings: {
                    factory: { min: 1 }
                }
            },
            effects: {
                funds: 500,
                buildings: {
                    factory: 1
                },
                population: 15,
                environment: -3
            }
        },
        {
            id: 'tourism_boom',
            title: '観光客が増加！',
            message: '地域経済が活性化しています。',
            type: 'event-success',
            icon: 'suitcase',
            probability: 0.06,
            conditions: {
                buildings: {
                    house: { min: 5 },
                    road: { min: 3 }
                }
            },
            effects: {
                funds: 300,
                happiness: 5
            }
        },
        {
            id: 'investors',
            title: '投資家の関心',
            message: '外部の投資家たちがあなたの都市に興味を示しています。',
            type: 'event-success',
            icon: 'hand-holding-usd',
            probability: 0.05,
            conditions: {
                buildings: {
                    factory: { min: 2 }
                }
            },
            effects: {
                funds: 400,
                buildings: {
                    factory: 1
                }
            }
        },
        {
            id: 'water_shortage',
            title: '水不足！',
            message: '市内で水不足が発生しています。',
            type: 'event-warning',
            icon: 'tint-slash',
            probability: 0.05,
            conditions: {
                population: { min: 40 }
            },
            effects: {
                happiness: -5,
                environment: -3
            }
        }
    ],
    
    // 社会イベント
    SOCIAL_EVENTS: [
        {
            id: 'cultural_festival',
            title: '文化フェスティバル',
            message: '市民主導の文化イベントが盛大に開催されました。',
            type: 'event-success',
            icon: 'music',
            probability: 0.07,
            conditions: {
                population: { min: 50 }
            },
            effects: {
                happiness: 8,
                funds: 100
            }
        },
        {
            id: 'volunteer',
            title: '市民ボランティア活動',
            message: '市民たちが環境美化に取り組んでいます。',
            type: 'event-success',
            icon: 'hands-helping',
            probability: 0.08,
            conditions: {},
            effects: {
                environment: 5,
                happiness: 3
            }
        },
        {
            id: 'new_park',
            title: '新しい公園がオープン！',
            message: '市民の幸福度が上昇しました。',
            type: 'event-success',
            icon: 'tree',
            probability: 0.06,
            conditions: {
                funds: { min: 150 }
            },
            effects: {
                happiness: 10,
                environment: 5,
                funds: -150,
                buildings: {
                    park: 1
                }
            }
        },
        {
            id: 'new_school',
            title: '新しい学校が完成！',
            message: '教育レベルが向上しました。',
            type: 'event-success',
            icon: 'graduation-cap',
            probability: 0.05,
            conditions: {
                funds: { min: 200 },
                population: { min: 30 }
            },
            effects: {
                education: 10,
                happiness: 5,
                funds: -200,
                buildings: {
                    school: 1
                }
            }
        },
        {
            id: 'new_hospital',
            title: '新病院がオープン！',
            message: '市民の健康と幸福度が向上しました。',
            type: 'event-success',
            icon: 'hospital',
            probability: 0.05,
            conditions: {
                funds: { min: 250 },
                population: { min: 50 }
            },
            effects: {
                happiness: 5,
                population: 10,
                funds: -250,
                buildings: {
                    hospital: 1
                }
            }
        }
    ],
    
    // 環境イベント
    ENVIRONMENTAL_EVENTS: [
        {
            id: 'environmental_movement',
            title: '環境保護運動',
            message: '環境保護団体が活動を始め、環境意識が高まっています。',
            type: 'event-info',
            icon: 'leaf',
            probability: 0.06,
            conditions: {
                environment: { max: 50 }
            },
            effects: {
                environment: 7,
                happiness: 2
            }
        },
        {
            id: 'air_pollution',
            title: '深刻な大気汚染',
            message: '工場からの排出ガスによる大気汚染が深刻化しています。',
            type: 'event-warning',
            icon: 'smog',
            probability: 0.06,
            conditions: {
                buildings: {
                    factory: { min: 3 }
                },
                environment: { max: 60 }
            },
            effects: {
                environment: -10,
                happiness: -5,
                population: -5
            }
        },
        {
            id: 'environmental_award',
            title: '環境賞を受賞',
            message: '持続可能な都市開発が評価されました。',
            type: 'event-success',
            icon: 'award',
            probability: 0.05,
            conditions: {
                environment: { min: 70 }
            },
            effects: {
                funds: 200,
                happiness: 5
            }
        }
    ],
    
    // イベントタイプごとの重み付け（発生確率調整用）
    TYPE_WEIGHTS: {
        NATURAL_DISASTERS: 1,
        ECONOMIC_EVENTS: 1.2,
        SOCIAL_EVENTS: 1.5,
        ENVIRONMENTAL_EVENTS: 1.3
    }
};

// すべてのイベントを単一の配列として結合する関数
export function getAllEvents() {
    return [
        ...EventsConfig.NATURAL_DISASTERS,
        ...EventsConfig.ECONOMIC_EVENTS,
        ...EventsConfig.SOCIAL_EVENTS,
        ...EventsConfig.ENVIRONMENTAL_EVENTS
    ];
}

// 指定した条件を満たすイベントのみをフィルタリングする関数
export function getValidEvents(cityState) {
    return getAllEvents().filter(event => {
        // 条件が指定されていない場合は常に有効
        if (!event.conditions || Object.keys(event.conditions).length === 0) {
            return true;
        }
        
        // すべての条件を確認
        return Object.entries(event.conditions).every(([key, condition]) => {
            // 建物条件の特別チェック
            if (key === 'buildings') {
                return Object.entries(condition).every(([buildingType, requirement]) => {
                    const buildingCount = cityState.buildings?.[buildingType] || 0;
                    if (typeof requirement === 'object') {
                        // min/max条件のチェック
                        if (requirement.min !== undefined && buildingCount < requirement.min) return false;
                        if (requirement.max !== undefined && buildingCount > requirement.max) return false;
                        return true;
                    }
                    // 単純な数値比較
                    return buildingCount >= requirement;
                });
            }
            
            // 基本的な数値条件のチェック
            const value = cityState[key];
            if (typeof condition === 'object') {
                if (condition.min !== undefined && value < condition.min) return false;
                if (condition.max !== undefined && value > condition.max) return false;
                return true;
            }
            
            // 単純な数値比較
            return value >= condition;
        });
    });
}

/**
 * CitySim - 地区設定
 * 地区システムのバランス調整、タイプ、専門化などを一元管理
 */

export const DistrictsConfig = {
    // 基本設定
    MAX_LEVEL: 5,
    INITIAL_DISTRICT_SIZE: 1,
    MAX_DISTRICT_SIZE: 5,
    MAX_DISTRICTS: 10, // 都市あたりの最大地区数

    // 地区タイプ
    TYPES: {
        RESIDENTIAL: {
            id: "residential",
            name: "住宅地区",
            icon: "home",
            description: "住民が住む地域です。人口の増加に貢献します。",
            cost: 300,
            effects: {
                population: 10,
                happiness: 2,
                environment: 0
            }
        },
        COMMERCIAL: {
            id: "commercial",
            name: "商業地区",
            icon: "shopping-cart",
            description: "店舗やオフィスが集まる地域です。収入を増加させます。",
            cost: 500,
            effects: {
                population: 0,
                happiness: 3,
                income: 20,
                environment: -1
            }
        },
        INDUSTRIAL: {
            id: "industrial",
            name: "工業地区",
            icon: "industry",
            description: "工場や産業施設が集まる地域です。高い収入をもたらしますが、環境に悪影響があります。",
            cost: 700,
            effects: {
                population: 0,
                happiness: -1,
                income: 50,
                environment: -5
            }
        },
        EDUCATION: {
            id: "education",
            name: "教育地区",
            icon: "graduation-cap",
            description: "学校や大学などの教育施設が集まる地域です。教育水準を向上させます。",
            cost: 600,
            effects: {
                population: 0,
                happiness: 3,
                education: 10,
                environment: 1
            }
        },
        ECO: {
            id: "eco",
            name: "環境保全地区",
            icon: "leaf",
            description: "公園や自然保護区域です。環境と幸福度を向上させます。",
            cost: 400,
            effects: {
                population: 0,
                happiness: 5,
                environment: 10
            }
        }
    },

    // 地区のアップグレード要件
    UPGRADE_REQUIREMENTS: {
        1: {
            funds: 200,
            population: 0
        },
        2: {
            funds: 500,
            population: 50
        },
        3: {
            funds: 1000,
            population: 100
        },
        4: {
            funds: 2000,
            population: 200
        }
    },

    // 地区の専門化
    SPECIALIZATIONS: {
        // 住宅地区の専門化
        residential: {
            luxury: {
                name: "高級住宅",
                icon: "gem",
                description: "富裕層向けの高級住宅地区です。",
                effects: {
                    happiness: 5,
                    environment: 2,
                    income: 10,
                    population: -5
                }
            },
            affordable: {
                name: "庶民向け住宅",
                icon: "users",
                description: "一般市民向けの手頃な住宅地区です。",
                effects: {
                    happiness: 2,
                    environment: -1,
                    income: -5,
                    population: 10
                }
            },
            mixed: {
                name: "混合住宅",
                icon: "building",
                description: "様々な所得層向けの多様な住宅地区です。",
                effects: {
                    happiness: 3,
                    environment: 0,
                    income: 3,
                    population: 5
                }
            }
        },
        
        // 商業地区の専門化
        commercial: {
            tourism: {
                name: "観光商業",
                icon: "suitcase",
                description: "観光客向けの商業地区です。",
                effects: {
                    happiness: 5,
                    environment: 0,
                    income: 15
                }
            },
            shopping: {
                name: "ショッピング",
                icon: "store",
                description: "小売店が集まる商業地区です。",
                effects: {
                    happiness: 4,
                    environment: -1,
                    income: 10
                }
            },
            office: {
                name: "オフィス",
                icon: "briefcase",
                description: "オフィスビルが集まる商業地区です。",
                effects: {
                    happiness: 2,
                    environment: 1,
                    income: 20,
                    education: 2
                }
            }
        },
        
        // 工業地区の専門化
        industrial: {
            tech: {
                name: "ハイテク産業",
                icon: "microchip",
                description: "先端技術を扱う工業地区です。",
                effects: {
                    happiness: 2,
                    environment: -2,
                    income: 30,
                    education: 5
                }
            },
            manufacturing: {
                name: "製造業",
                icon: "cogs",
                description: "製品を製造する工業地区です。",
                effects: {
                    happiness: -2,
                    environment: -5,
                    income: 40
                }
            },
            logistics: {
                name: "物流",
                icon: "truck",
                description: "貨物と配送を扱う工業地区です。",
                effects: {
                    happiness: -1,
                    environment: -3,
                    income: 25
                }
            }
        },
        
        // 教育地区の専門化
        education: {
            elementary: {
                name: "初等教育",
                icon: "school",
                description: "幼稚園や小学校が集まる教育地区です。",
                effects: {
                    happiness: 3,
                    education: 5,
                    environment: 2
                }
            },
            highschool: {
                name: "中等教育",
                icon: "book",
                description: "中学校や高校が集まる教育地区です。",
                effects: {
                    happiness: 2,
                    education: 10,
                    environment: 1
                }
            },
            university: {
                name: "高等教育",
                icon: "university",
                description: "大学やカレッジが集まる教育地区です。",
                effects: {
                    happiness: 5,
                    education: 15,
                    environment: 3,
                    income: 10
                }
            }
        },
        
        // 環境保全地区の専門化
        eco: {
            conservation: {
                name: "自然保護",
                icon: "mountain",
                description: "自然環境を保護する地区です。",
                effects: {
                    happiness: 3,
                    environment: 15
                }
            },
            recreation: {
                name: "レクリエーション",
                icon: "volleyball-ball",
                description: "レジャー施設や公園が集まる地区です。",
                effects: {
                    happiness: 8,
                    environment: 5,
                    income: 5
                }
            },
            renewable: {
                name: "再生可能エネルギー",
                icon: "solar-panel",
                description: "太陽光や風力などの再生可能エネルギー施設が集まる地区です。",
                effects: {
                    happiness: 2,
                    environment: 10,
                    income: 8
                }
            }
        }
    },
    
    // 地区イベント
    EVENTS: {
        DISTRICT_GROWTH: {
            id: "district_growth",
            title: "地区の発展",
            icon: "chart-line",
            description: "地区が自然に発展し、効果が向上しました。",
            effects: {
                happiness: 2,
                environment: 1
            }
        },
        DISTRICT_DECLINE: {
            id: "district_decline",
            title: "地区の衰退",
            icon: "chart-line-down",
            description: "地区が衰退し、効果が低下しました。",
            effects: {
                happiness: -2,
                environment: -1
            }
        }
    }
};

// 地区タイプを配列で取得する関数
export function getDistrictTypes() {
    return Object.values(DistrictsConfig.TYPES);
}

// 特定の地区タイプの専門化を取得する関数
export function getSpecializations(districtType) {
    return DistrictsConfig.SPECIALIZATIONS[districtType] || {};
}

// すべての地区専門化を取得する関数
export function getAllSpecializations() {
    const result = {};
    
    Object.entries(DistrictsConfig.SPECIALIZATIONS).forEach(([districtType, specializations]) => {
        result[districtType] = Object.values(specializations);
    });
    
    return result;
}

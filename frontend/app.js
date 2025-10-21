const { useState, useEffect } = React;

// 检查两个数组是否有交集
const hasIntersection = (arr1, arr2) => {
    const set1 = new Set(arr1);
    for (let item of arr2) {
        if (set1.has(item)) {
            return true;
        }
    }
    return false;
};

// 检查 subset 是否是 set 的子集
const isSubset = (set, subset) => {
    for (let elem of subset) {
        if (!set.has(elem)) {
            return false;
        }
    }
    return true;
};


const App = () => {
    const [allDrugs, setAllDrugs] = useState([]);
    const [interactions, setInteractions] = useState([]);
    const [userDrugs, setUserDrugs] = useState([]);
    const [risk, setRisk] = useState(null);

    // 1. 加载数据
    useEffect(() => {
        // 在Web环境中，我们使用 fetch 来加载本地的 JSON 文件
        // 注意：这需要在一个 Web Server 环境下运行，直接打开本地 HTML 文件会因安全策略失败
        const fetchData = async () => {
            try {
                const drugsRes = await fetch('../data/drugs.json');
                const drugsData = await drugsRes.json();
                setAllDrugs(drugsData);

                const interactionsRes = await fetch('../data/interactions.json');
                const interactionsData = await interactionsRes.json();
                setInteractions(interactionsData);
            } catch (error) {
                console.error("加载数据失败:", error);
                alert("加载药品数据失败！请确保您是通过 Live Server 运行，而不是直接打开 HTML 文件。");
            }
        };
        fetchData();
    }, []);

    // 2. 当用户用药列表变化时，重新计算风险
    useEffect(() => {
        if (userDrugs.length < 2) {
            setRisk(null); // 少于2种药，无相互作用
            return;
        }

        const userDrugIds = new Set(userDrugs.map(d => d.id));
        let detectedRisk = null;

        for (const interaction of interactions) {
            const interactionDrugIds = new Set(interaction.drugs);
            
            // 检查用户的药物是否包含了风险组合
            if (isSubset(userDrugIds, interactionDrugIds)) {
                // 优先显示最严重的风险
                if (!detectedRisk || interaction.risk_level === 'red') {
                    detectedRisk = interaction;
                }
            }
        }
        setRisk(detectedRisk);

    }, [userDrugs, interactions]);

    // 3. 事件处理函数
    const addDrug = (drug) => {
        // 防止重复添加
        if (!userDrugs.find(d => d.id === drug.id)) {
            setUserDrugs([...userDrugs, drug]);
        }
    };

    const removeDrug = (drugId) => {
        setUserDrugs(userDrugs.filter(d => d.id !== drugId));
    };

    return (
        <div>
            <h1>知药 - 智能用药管理平台</h1>
            <div className="container">
                {/* 药品库 */}
                <div className="panel">
                    <h2>药品库</h2>
                    <ul className="drug-list">
                        {allDrugs.map(drug => (
                            <li key={drug.id} className="drug-item">
                                <span>{drug.name} ({drug.id})</span>
                                <button onClick={() => addDrug(drug)}>+</button>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* 我的用药 */}
                <div className="panel">
                    <h2>我的用药</h2>
                    <ul className="drug-list">
                        {userDrugs.length > 0 ? userDrugs.map(drug => (
                            <li key={drug.id} className="drug-item">
                                <span>{drug.name}</span>
                                <button className="remove-btn" onClick={() => removeDrug(drug.id)}>移除</button>
                            </li>
                        )) : <p>请从左侧药品库添加药品</p>}
                    </ul>
                </div>
            </div>

            {/* 风险提示 */}
            <div className={`risk-alert ${risk ? risk.risk_level : 'safe'}`}>
                <h3>风险评估</h3>
                {risk ? (
                    <p>{risk.description}</p>
                ) : (
                    <p>✅ 当前用药方案未发现已知的相互作用风险。</p>
                )}
            </div>
        </div>
    );
};

ReactDOM.render(<App />, document.getElementById('root'));

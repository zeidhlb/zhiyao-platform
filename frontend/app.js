const { useState, useEffect } = React;

// 检查 subset 是否是 set 的子集
const isSubset = (set, subset) => {
    for (let elem of subset) {
        if (!set.has(elem)) {
            return false;
        }
    }
    return true;
};

// 健康追踪组件
const HealthTracker = () => {
    const [bloodPressure, setBloodPressure] = useState('');
    const [bloodSugar, setBloodSugar] = useState('');
    const [feelings, setFeelings] = useState('');

    return (
        <div className="health-tracker">
            <h2>用药反馈与健康追踪</h2>
            <div className="form-group">
                <label htmlFor="blood-pressure">血压 (mmHg)</label>
                <input 
                    id="blood-pressure"
                    type="text" 
                    value={bloodPressure} 
                    onChange={(e) => setBloodPressure(e.target.value)}
                    placeholder="例如: 120/80"
                />
            </div>
            <div className="form-group">
                <label htmlFor="blood-sugar">血糖 (mmol/L)</label>
                <input 
                    id="blood-sugar"
                    type="text" 
                    value={bloodSugar} 
                    onChange={(e) => setBloodSugar(e.target.value)}
                    placeholder="例如: 5.6"
                />
            </div>
            <div className="form-group">
                <label htmlFor="feelings">主观感受</label>
                <textarea 
                    id="feelings"
                    value={feelings} 
                    onChange={(e) => setFeelings(e.target.value)}
                    placeholder="例如: 今天感觉精力充沛，没有头晕。"
                ></textarea>
            </div>
            {/* 未来可以增加保存按钮，将数据发送到后端 */}
        </div>
    );
};

// 主应用组件
const App = () => {
    const [allDrugs, setAllDrugs] = useState([]);
    const [interactions, setInteractions] = useState([]);
    const [userDrugs, setUserDrugs] = useState([]);
    const [risk, setRisk] = useState(null);

    // 1. 加载数据
    useEffect(() => {
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
            setRisk(null);
            return;
        }

        const userDrugIds = new Set(userDrugs.map(d => d.id));
        let detectedRisk = null;

        for (const interaction of interactions) {
            const interactionDrugIds = new Set(interaction.drugs);
            
            if (isSubset(userDrugIds, interactionDrugIds)) {
                if (!detectedRisk || interaction.risk_level === 'red') {
                    detectedRisk = interaction;
                }
            }
        }
        setRisk(detectedRisk);

    }, [userDrugs, interactions]);

    // 3. 事件处理函数
    const addDrug = (drug) => {
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

            {/* 新增的健康追踪模块 */}
            <HealthTracker />
        </div>
    );
};

ReactDOM.render(<App />, document.getElementById('root'));

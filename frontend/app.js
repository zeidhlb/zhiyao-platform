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

// --- 核心逻辑：从医嘱生成计划 ---
const generatePlan = (drugs) => {
    // 假设的用餐时间
    const mealTimes = { breakfast: 8, lunch: 12, dinner: 18 };
    let plan = [];

    drugs.forEach(drug => {
        const instruction = drug.instruction || '';
        
        // 规则解析
        if (instruction.includes('每日一次')) {
            if (instruction.includes('餐前')) {
                plan.push({ time: '07:30', task: `服用 ${drug.name}` });
            } else { // 默认餐后
                plan.push({ time: '08:30', task: `服用 ${drug.name}` });
            }
        } else if (instruction.includes('一日两次') || instruction.includes('早晚各一次')) {
             plan.push({ time: '08:30', task: `服用 ${drug.name}` });
             plan.push({ time: '18:30', task: `服用 ${drug.name}` });
        } else if (instruction.includes('每6-8小时')) {
            plan.push({ time: '08:00', task: `服用 ${drug.name}` });
            plan.push({ time: '15:00', task: `服用 ${drug.name}` });
            plan.push({ time: '22:00', task: `服用 ${drug.name}` });
        }
    });

    // 按时间排序并返回
    return plan.sort((a, b) => a.time.localeCompare(b.time));
};


// --- UI 组件 ---

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
        </div>
    );
};

// 用药计划组件
const MedicationPlan = ({ plan }) => {
    return (
        <div className="medication-plan">
            <h2>今日用药计划</h2>
            {plan.length > 0 ? (
                <ul className="plan-list">
                    {plan.map((item, index) => (
                        <li key={index} className="plan-item">
                            <div className="plan-time">{item.time}</div>
                            <div className="plan-task">{item.task}</div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>暂无用药计划。请从药品库添加您的用药。</p>
            )}
        </div>
    );
};

// OCR 图片识别组件
const OcrReader = ({ onOcrComplete }) => {
    const [ocrImage, setOcrImage] = useState(null);
    const [ocrStatus, setOcrStatus] = useState('待命');
    const [ocrProgress, setOcrProgress] = useState(0);
    const [ocrResult, setOcrResult] = useState('');

    const handleImageChange = (event) => {
        setOcrImage(event.target.files[0]);
        setOcrResult('');
        setOcrStatus('已选择图片');
    };

    const performOcr = async () => {
        if (!ocrImage) {
            alert('请先选择一张图片！');
            return;
        }
        setOcrStatus('正在识别...');
        setOcrProgress(0);

        const { data: { text } } = await Tesseract.recognize(
            ocrImage,
            'chi_sim', // 使用简体中文语言包
            {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        setOcrProgress(Math.round(m.progress * 100));
                    }
                }
            }
        );
        
        setOcrStatus('识别完成');
        setOcrResult(text);
        onOcrComplete(text); // 将识别结果传递给父组件
    };

    return (
        <div className="ocr-reader panel">
            <h2>OCR 处方/药盒识别</h2>
            <p>上传处方或药盒的图片，系统将自动识别药品名称并添加到“我的用药”中。</p>
            <div className="form-group">
                <input type="file" accept="image/*" onChange={handleImageChange} />
            </div>
            <button onClick={performOcr} disabled={!ocrImage || ocrStatus.includes('正在')}>开始识别</button>
            
            {ocrStatus.includes('正在') && (
                <div className="progress-bar">
                    <div className="progress" style={{ width: `${ocrProgress}%` }}>
                        {ocrProgress}%
                    </div>
                </div>
            )}

            {ocrResult && (
                <div className="ocr-result">
                    <h4>识别出的文本：</h4>
                    <p>{ocrResult}</p>
                </div>
            )}
        </div>
    );
};


// 主应用组件
const App = () => {
    const [allDrugs, setAllDrugs] = useState([]);
    const [interactions, setInteractions] = useState([]);
    const [userDrugs, setUserDrugs] = useState([]);
    const [risk, setRisk] = useState(null);
    const [plan, setPlan] = useState([]);

    // 1. 加载数据
    useEffect(() => {
        const fetchData = async () => {
            try {
                const drugsRes = await fetch('http://localhost:3001/api/drugs');
                const drugsData = await drugsRes.json();
                setAllDrugs(drugsData);

                const interactionsRes = await fetch('http://localhost:3001/api/interactions');
                const interactionsData = await interactionsRes.json();
                setInteractions(interactionsData);
            } catch (error) {
                console.error("加载数据失败:", error);
                alert("加载数据失败！请确保后端服务正在运行。");
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

    // 3. 当用户用药列表变化时，重新生成用药计划
    useEffect(() => {
        const newPlan = generatePlan(userDrugs);
        setPlan(newPlan);
    }, [userDrugs]);

    // 4. 事件处理函数
    const addDrug = (drug) => {
        if (!userDrugs.find(d => d.id === drug.id)) {
            setUserDrugs([...userDrugs, drug]);
        }
    };

    const removeDrug = (drugId) => {
        setUserDrugs(userDrugs.filter(d => d.id !== drugId));
    };

    // 5. 从 OCR 文本中查找并添加药品
    const findAndAddDrugsFromText = (text) => {
        let foundCount = 0;
        allDrugs.forEach(drug => {
            if (text.includes(drug.name)) {
                if (!userDrugs.some(ud => ud.id === drug.id)) {
                    addDrug(drug);
                    foundCount++;
                }
            }
        });
        if (foundCount > 0) {
            alert(`成功从图片中识别并添加了 ${foundCount} 种药品！`);
        } else {
            alert('未在识别的文本中找到药品库里对应的药品。');
        }
    };

    return (
        <div>
            <h1>知药 - 智能用药管理平台</h1>
            
            {/* OCR 组件 */}
            <OcrReader onOcrComplete={findAndAddDrugsFromText} />

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
                {risk ? <p>{risk.description}</p> : <p>✅ 当前用药方案未发现已知的相互作用风险。</p>}
            </div>

            {/* 用药计划模块 */}
            <MedicationPlan plan={plan} />

            {/* 健康追踪模块 */}
            <HealthTracker />
        </div>
    );
};

ReactDOM.render(<App />, document.getElementById('root'));

/**
 * 表情识别深度学习训练系统
 * 使用 TensorFlow.js 在浏览器中本地训练 CNN 模型
 */

const CONFIG = {
    IMG_SIZE: 96,
    NUM_CLASSES: 8,
    EMOTIONS: ['neutral', 'happy', 'sad', 'angry', 'surprised', 'fearful', 'disgusted', 'contempt'],
    EMOTION_LABELS: {
        neutral: '平静',
        happy: '开心',
        sad: '悲伤',
        angry: '愤怒',
        surprised: '惊讶',
        fearful: '恐惧',
        disgusted: '厌恶',
        contempt: '轻蔑'
    },
    EMOTION_ICONS: {
        neutral: '😐',
        happy: '😊',
        sad: '😢',
        angry: '😠',
        surprised: '😲',
        fearful: '😨',
        disgusted: '🤢',
        contempt: '😏'
    }
};

// ==================== 全局状态 ====================
const state = {
    stream: null,
    selectedEmotion: null,
    dataset: {
        neutral: [],
        happy: [],
        sad: [],
        angry: [],
        surprised: [],
        fearful: [],
        disgusted: [],
        contempt: []
    },
    model: null,
    isTraining: false,
    isAutoCapturing: false,
    autoCaptureInterval: null
};

// ==================== DOM 元素 ====================
const elements = {
    video: document.getElementById('video'),
    captureCanvas: document.getElementById('captureCanvas'),
    captureBtn: document.getElementById('captureBtn'),
    autoCaptureBtn: document.getElementById('autoCaptureBtn'),
    trainBtn: document.getElementById('trainBtn'),
    stopTrainBtn: document.getElementById('stopTrainBtn'),
    clearDataBtn: document.getElementById('clearDataBtn'),
    exportDataBtn: document.getElementById('exportDataBtn'),
    importDataBtn: document.getElementById('importDataBtn'),
    importFile: document.getElementById('importFile'),
    saveModelBtn: document.getElementById('saveModelBtn'),
    loadModelBtn: document.getElementById('loadModelBtn'),
    modelFile: document.getElementById('modelFile'),
    datasetGrid: document.getElementById('datasetGrid'),
    modelStatus: document.getElementById('modelStatus'),
    progressContainer: document.getElementById('progressContainer'),
    progressFill: document.getElementById('progressFill'),
    progressText: document.getElementById('progressText'),
    logs: document.getElementById('logs'),
    epochsInput: document.getElementById('epochsInput'),
    batchSizeInput: document.getElementById('batchSizeInput'),
    learningRateInput: document.getElementById('learningRateInput'),
    validationSplitInput: document.getElementById('validationSplitInput'),
    emotionBtns: document.querySelectorAll('.emotion-btn')
};

const captureCtx = elements.captureCanvas.getContext('2d');

// ==================== 初始化 ====================
async function init() {
    try {
        await initCamera();
        setupEventListeners();
        updateDatasetDisplay();
        log('系统初始化完成', 'success');
    } catch (error) {
        log('初始化失败: ' + error.message, 'error');
    }
}

// ==================== 摄像头初始化 ====================
async function initCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 640 },
                height: { ideal: 480 },
                facingMode: 'user'
            },
            audio: false
        });
        
        state.stream = stream;
        elements.video.srcObject = stream;
        
        return new Promise((resolve) => {
            elements.video.onloadedmetadata = () => {
                elements.video.play();
                log('摄像头已启动');
                resolve();
            };
        });
    } catch (error) {
        throw new Error('摄像头启动失败: ' + error.message);
    }
}

// ==================== 设置事件监听 ====================
function setupEventListeners() {
    // 表情选择
    elements.emotionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.emotionBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.selectedEmotion = btn.dataset.emotion;
            log(`已选择表情: ${CONFIG.EMOTION_LABELS[state.selectedEmotion]}`);
        });
    });

    // 拍摄按钮
    elements.captureBtn.addEventListener('click', captureSample);

    // 自动采集
    elements.autoCaptureBtn.addEventListener('click', toggleAutoCapture);

    // 训练按钮
    elements.trainBtn.addEventListener('click', startTraining);
    elements.stopTrainBtn.addEventListener('click', stopTraining);

    // 数据管理
    elements.clearDataBtn.addEventListener('click', clearDataset);
    elements.exportDataBtn.addEventListener('click', exportDataset);
    elements.importDataBtn.addEventListener('click', () => elements.importFile.click());
    elements.importFile.addEventListener('change', importDataset);

    // 模型管理
    elements.saveModelBtn.addEventListener('click', saveModel);
    elements.loadModelBtn.addEventListener('click', () => elements.modelFile.click());
    elements.modelFile.addEventListener('change', loadModel);
}

// ==================== 拍摄样本 ====================
function captureSample() {
    if (!state.selectedEmotion) {
        alert('请先选择一个表情类型');
        return;
    }

    // 在画布上绘制当前视频帧
    captureCtx.drawImage(
        elements.video,
        0, 0,
        CONFIG.IMG_SIZE,
        CONFIG.IMG_SIZE
    );

    // 获取图像数据
    const imageData = captureCtx.getImageData(0, 0, CONFIG.IMG_SIZE, CONFIG.IMG_SIZE);
    const data = Array.from(imageData.data);

    // 添加到数据集
    state.dataset[state.selectedEmotion].push(data);
    
    updateDatasetDisplay();
    log(`已添加样本: ${CONFIG.EMOTION_LABELS[state.selectedEmotion]} (共 ${state.dataset[state.selectedEmotion].length} 个)`);
}

// ==================== 自动采集 ====================
function toggleAutoCapture() {
    if (state.isAutoCapturing) {
        stopAutoCapture();
    } else {
        startAutoCapture();
    }
}

function startAutoCapture() {
    if (!state.selectedEmotion) {
        alert('请先选择一个表情类型');
        return;
    }

    state.isAutoCapturing = true;
    elements.autoCaptureBtn.textContent = '⏹️ 停止采集';
    elements.autoCaptureBtn.classList.add('active');
    
    log('开始自动采集...');
    
    let count = 0;
    const maxCount = 50;
    
    state.autoCaptureInterval = setInterval(() => {
        if (count >= maxCount) {
            stopAutoCapture();
            return;
        }
        captureSample();
        count++;
    }, 200);
}

function stopAutoCapture() {
    state.isAutoCapturing = false;
    clearInterval(state.autoCaptureInterval);
    elements.autoCaptureBtn.textContent = '▶️ 自动采集';
    elements.autoCaptureBtn.classList.remove('active');
    log('自动采集已停止');
}

// ==================== 更新数据集显示 ====================
function updateDatasetDisplay() {
    elements.datasetGrid.innerHTML = '';
    
    CONFIG.EMOTIONS.forEach(emotion => {
        const count = state.dataset[emotion].length;
        const item = document.createElement('div');
        item.className = 'dataset-item';
        item.innerHTML = `
            <div style="font-size: 1.5rem;">${CONFIG.EMOTION_ICONS[emotion]}</div>
            <div class="count">${count}</div>
            <div class="label">${CONFIG.EMOTION_LABELS[emotion]}</div>
        `;
        elements.datasetGrid.appendChild(item);
    });
}

// ==================== 清空数据集 ====================
function clearDataset() {
    if (!confirm('确定要清空所有数据吗？')) return;
    
    CONFIG.EMOTIONS.forEach(emotion => {
        state.dataset[emotion] = [];
    });
    
    updateDatasetDisplay();
    log('数据集已清空');
}

// ==================== 导出数据集 ====================
function exportDataset() {
    const dataStr = JSON.stringify(state.dataset);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `emotion_dataset_${Date.now()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    log('数据集已导出');
}

// ==================== 导入数据集 ====================
function importDataset(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            
            // 验证数据格式
            let totalSamples = 0;
            CONFIG.EMOTIONS.forEach(emotion => {
                if (data[emotion] && Array.isArray(data[emotion])) {
                    state.dataset[emotion] = data[emotion];
                    totalSamples += data[emotion].length;
                }
            });
            
            updateDatasetDisplay();
            log(`数据集导入成功，共 ${totalSamples} 个样本`, 'success');
        } catch (error) {
            log('数据集导入失败: ' + error.message, 'error');
        }
    };
    reader.readAsText(file);
}

// ==================== 构建 CNN 模型 ====================
function buildModel() {
    const model = tf.sequential();

    // 第一层卷积
    model.add(tf.layers.conv2d({
        inputShape: [CONFIG.IMG_SIZE, CONFIG.IMG_SIZE, 3],
        filters: 32,
        kernelSize: 3,
        activation: 'relu',
        padding: 'same'
    }));
    model.add(tf.layers.batchNormalization());
    model.add(tf.layers.maxPooling2d({ poolSize: 2 }));
    model.add(tf.layers.dropout({ rate: 0.25 }));

    // 第二层卷积
    model.add(tf.layers.conv2d({
        filters: 64,
        kernelSize: 3,
        activation: 'relu',
        padding: 'same'
    }));
    model.add(tf.layers.batchNormalization());
    model.add(tf.layers.maxPooling2d({ poolSize: 2 }));
    model.add(tf.layers.dropout({ rate: 0.25 }));

    // 第三层卷积
    model.add(tf.layers.conv2d({
        filters: 128,
        kernelSize: 3,
        activation: 'relu',
        padding: 'same'
    }));
    model.add(tf.layers.batchNormalization());
    model.add(tf.layers.maxPooling2d({ poolSize: 2 }));
    model.add(tf.layers.dropout({ rate: 0.25 }));

    // 全连接层
    model.add(tf.layers.flatten());
    model.add(tf.layers.dense({ units: 256, activation: 'relu' }));
    model.add(tf.layers.batchNormalization());
    model.add(tf.layers.dropout({ rate: 0.5 }));
    model.add(tf.layers.dense({ units: CONFIG.NUM_CLASSES, activation: 'softmax' }));

    return model;
}

// ==================== 准备训练数据 ====================
function prepareTrainingData() {
    const xs = [];
    const ys = [];

    CONFIG.EMOTIONS.forEach((emotion, index) => {
        state.dataset[emotion].forEach(sample => {
            // 将图像数据归一化到 0-1
            const normalized = new Float32Array(sample.length);
            for (let i = 0; i < sample.length; i += 4) {
                normalized[i] = sample[i] / 255;       // R
                normalized[i + 1] = sample[i + 1] / 255; // G
                normalized[i + 2] = sample[i + 2] / 255; // B
                // 跳过 alpha 通道
            }
            
            // 只保留 RGB 通道
            const rgb = new Float32Array(CONFIG.IMG_SIZE * CONFIG.IMG_SIZE * 3);
            let rgbIndex = 0;
            for (let i = 0; i < sample.length; i += 4) {
                rgb[rgbIndex++] = sample[i] / 255;
                rgb[rgbIndex++] = sample[i + 1] / 255;
                rgb[rgbIndex++] = sample[i + 2] / 255;
            }
            
            xs.push(rgb);
            
            // one-hot 编码
            const label = new Array(CONFIG.NUM_CLASSES).fill(0);
            label[index] = 1;
            ys.push(label);
        });
    });

    return { xs, ys };
}

// ==================== 开始训练 ====================
async function startTraining() {
    // 检查数据量
    let totalSamples = 0;
    CONFIG.EMOTIONS.forEach(emotion => {
        totalSamples += state.dataset[emotion].length;
    });

    if (totalSamples < 10) {
        alert('数据量太少，请先收集更多样本（至少每个表情10个）');
        return;
    }

    const epochs = parseInt(elements.epochsInput.value);
    const batchSize = parseInt(elements.batchSizeInput.value);
    const learningRate = parseFloat(elements.learningRateInput.value);
    const validationSplit = parseFloat(elements.validationSplitInput.value);

    log('准备训练数据...');
    const { xs, ys } = prepareTrainingData();

    // 创建张量
    const xsTensor = tf.tensor4d(
        xs,
        [xs.length, CONFIG.IMG_SIZE, CONFIG.IMG_SIZE, 3]
    );
    const ysTensor = tf.tensor2d(ys);

    log(`数据张量形状: ${xsTensor.shape}, 标签张量形状: ${ysTensor.shape}`);

    // 构建模型
    if (!state.model) {
        log('构建 CNN 模型...');
        state.model = buildModel();
    }

    // 编译模型
    state.model.compile({
        optimizer: tf.train.adam(learningRate),
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
    });

    log('模型结构:');
    state.model.summary();

    // 更新UI状态
    state.isTraining = true;
    elements.trainBtn.disabled = true;
    elements.stopTrainBtn.disabled = false;
    elements.progressContainer.style.display = 'block';
    updateModelStatus('training');

    log(`开始训练: ${epochs} epochs, batch size: ${batchSize}, learning rate: ${learningRate}`);

    try {
        // 训练
        const history = await state.model.fit(xsTensor, ysTensor, {
            epochs: epochs,
            batchSize: batchSize,
            validationSplit: validationSplit,
            shuffle: true,
            callbacks: {
                onEpochBegin: (epoch) => {
                    const progress = ((epoch + 1) / epochs * 100).toFixed(1);
                    elements.progressFill.style.width = progress + '%';
                    elements.progressText.textContent = `训练中... Epoch ${epoch + 1}/${epochs}`;
                },
                onEpochEnd: (epoch, logs) => {
                    const loss = logs.loss.toFixed(4);
                    const acc = (logs.acc * 100).toFixed(2);
                    const valLoss = logs.val_loss ? logs.val_loss.toFixed(4) : 'N/A';
                    const valAcc = logs.val_acc ? (logs.val_acc * 100).toFixed(2) : 'N/A';
                    
                    log(`Epoch ${epoch + 1}/${epochs} - loss: ${loss}, acc: ${acc}%, val_loss: ${valLoss}, val_acc: ${valAcc}%`);
                }
            }
        });

        const finalAcc = (history.history.acc[history.history.acc.length - 1] * 100).toFixed(2);
        log(`训练完成！最终准确率: ${finalAcc}%`, 'success');
        
        elements.saveModelBtn.disabled = false;
        updateModelStatus('ready');

    } catch (error) {
        log('训练出错: ' + error.message, 'error');
    } finally {
        state.isTraining = false;
        elements.trainBtn.disabled = false;
        elements.stopTrainBtn.disabled = true;
        
        // 释放张量
        xsTensor.dispose();
        ysTensor.dispose();
    }
}

// ==================== 停止训练 ====================
function stopTraining() {
    state.isTraining = false;
    log('训练已停止');
}

// ==================== 保存模型 ====================
async function saveModel() {
    if (!state.model) {
        alert('没有可保存的模型');
        return;
    }

    try {
        await state.model.save('downloads://emotion-model');
        log('模型已保存', 'success');
    } catch (error) {
        log('保存模型失败: ' + error.message, 'error');
    }
}

// ==================== 加载模型 ====================
async function loadModel(event) {
    const files = event.target.files;
    if (files.length === 0) return;

    try {
        log('正在加载模型...');
        state.model = await tf.loadLayersModel(tf.io.browserFiles(files));
        log('模型加载成功', 'success');
        
        elements.saveModelBtn.disabled = false;
        updateModelStatus('ready');
    } catch (error) {
        log('加载模型失败: ' + error.message, 'error');
    }
}

// ==================== 更新模型状态 ====================
function updateModelStatus(status) {
    const badge = elements.modelStatus;
    badge.className = 'status-badge ' + status;
    
    switch (status) {
        case 'ready':
            badge.textContent = '已训练';
            break;
        case 'training':
            badge.textContent = '训练中';
            break;
        case 'not-ready':
            badge.textContent = '未训练';
            break;
    }
}

// ==================== 日志功能 ====================
function log(message, type = 'info') {
    const entry = document.createElement('div');
    entry.className = 'log-entry ' + type;
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    elements.logs.appendChild(entry);
    elements.logs.scrollTop = elements.logs.scrollHeight;
    
    console.log(`[${type}] ${message}`);
}

// ==================== 启动应用 ====================
document.addEventListener('DOMContentLoaded', init);

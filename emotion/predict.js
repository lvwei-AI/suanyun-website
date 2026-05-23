/**
 * 使用本地训练模型的表情识别预测
 * 支持加载 TensorFlow.js 训练的自定义模型
 */

// ==================== 配置常量 ====================
const CONFIG = {
    MODEL_URL: 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model',
    DETECTION_INTERVAL: 100,
    MIN_CONFIDENCE: 0.5,
    VIDEO_WIDTH: 640,
    VIDEO_HEIGHT: 480,
    IMG_SIZE: 96,
    EMOTIONS: ['neutral', 'happy', 'sad', 'angry', 'surprised', 'fearful', 'disgusted', 'contempt'],
    EMOTION_CONFIG: {
        neutral: { icon: '😐', label: '平静', color: '#74b9ff' },
        happy: { icon: '😊', label: '开心', color: '#fdcb6e' },
        sad: { icon: '😢', label: '悲伤', color: '#74b9ff' },
        angry: { icon: '😠', label: '愤怒', color: '#ff7675' },
        fearful: { icon: '😨', label: '恐惧', color: '#a29bfe' },
        disgusted: { icon: '🤢', label: '厌恶', color: '#00b894' },
        surprised: { icon: '😲', label: '惊讶', color: '#fd79a8' },
        contempt: { icon: '😏', label: '轻蔑', color: '#fab1a0' }
    }
};

// ==================== 全局状态 ====================
const state = {
    isModelLoaded: false,
    isVideoPlaying: false,
    stream: null,
    detectionInterval: null,
    lastDetectionTime: 0,
    frameCount: 0,
    lastFpsTime: 0,
    fps: 0,
    useCustomModel: false,
    customModel: null,
    faceDetector: null
};

// ==================== DOM 元素 ====================
const elements = {
    video: document.getElementById('video'),
    overlay: document.getElementById('overlay'),
    startBtn: document.getElementById('startBtn'),
    stopBtn: document.getElementById('stopBtn'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    emotionIcon: document.getElementById('emotionIcon'),
    emotionText: document.getElementById('emotionText'),
    emotionConfidence: document.getElementById('emotionConfidence'),
    detectStatus: document.getElementById('detectStatus'),
    faceCount: document.getElementById('faceCount'),
    fps: document.getElementById('fps'),
    modelType: document.getElementById('modelType'),
    loadingText: document.querySelector('.loading-text')
};

const ctx = elements.overlay.getContext('2d');

// ==================== 初始化 ====================
async function init() {
    try {
        // 检查是否有自定义模型
        await checkCustomModel();
        
        // 加载 face-api.js 模型用于人脸检测
        await loadFaceApiModels();
        
        setupEventListeners();
        hideLoading();
        console.log('表情识别系统初始化完成');
    } catch (error) {
        console.error('初始化失败:', error);
        showError('系统初始化失败，请刷新页面重试');
    }
}

// ==================== 检查自定义模型 ====================
async function checkCustomModel() {
    try {
        // 尝试从本地存储加载模型信息
        const modelInfo = localStorage.getItem('customModelInfo');
        if (modelInfo) {
            const info = JSON.parse(modelInfo);
            log('发现自定义模型信息: ' + info.name);
        }
    } catch (e) {
        // 忽略错误
    }
}

// ==================== 加载 Face API 模型 ====================
async function loadFaceApiModels() {
    console.log('正在加载人脸检测模型...');
    elements.loadingText.textContent = '正在加载人脸检测模型...';
    
    try {
        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(CONFIG.MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(CONFIG.MODEL_URL)
        ]);
        
        state.isModelLoaded = true;
        console.log('人脸检测模型加载完成');
    } catch (error) {
        console.error('模型加载失败:', error);
        throw new Error('模型加载失败: ' + error.message);
    }
}

// ==================== 加载自定义模型 ====================
async function loadCustomModel() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.multiple = true;
    
    input.onchange = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        
        try {
            elements.loadingOverlay.classList.remove('hidden');
            elements.loadingText.textContent = '正在加载自定义模型...';
            
            state.customModel = await tf.loadLayersModel(tf.io.browserFiles(files));
            state.useCustomModel = true;
            
            elements.modelType.textContent = '自定义模型';
            log('自定义模型加载成功');
            
            // 保存模型信息
            localStorage.setItem('customModelInfo', JSON.stringify({
                name: files[0].name,
                loadedAt: new Date().toISOString()
            }));
            
        } catch (error) {
            log('加载模型失败: ' + error.message, 'error');
            alert('加载模型失败: ' + error.message);
        } finally {
            hideLoading();
        }
    };
    
    input.click();
}

// ==================== 切换模型 ====================
function toggleModel() {
    if (state.useCustomModel && state.customModel) {
        // 切换回预训练模型
        state.useCustomModel = false;
        elements.modelType.textContent = '预训练模型';
        log('已切换至预训练模型');
    } else {
        // 加载自定义模型
        loadCustomModel();
    }
}

// ==================== 设置事件监听 ====================
function setupEventListeners() {
    elements.startBtn.addEventListener('click', startVideo);
    elements.stopBtn.addEventListener('click', stopVideo);
    window.addEventListener('resize', resizeOverlay);
}

// ==================== 开始视频 ====================
async function startVideo() {
    if (!state.isModelLoaded) {
        showError('模型尚未加载完成，请稍候');
        return;
    }
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: CONFIG.VIDEO_WIDTH },
                height: { ideal: CONFIG.VIDEO_HEIGHT },
                facingMode: 'user'
            },
            audio: false
        });
        
        state.stream = stream;
        elements.video.srcObject = stream;
        
        elements.video.onloadedmetadata = () => {
            elements.video.play();
            state.isVideoPlaying = true;
            resizeOverlay();
            updateUIState(true);
            startDetection();
            console.log('摄像头已启动');
        };
        
    } catch (error) {
        console.error('摄像头启动失败:', error);
        
        if (error.name === 'NotAllowedError') {
            showError('请允许访问摄像头权限');
        } else if (error.name === 'NotFoundError') {
            showError('未找到摄像头设备');
        } else {
            showError('摄像头启动失败: ' + error.message);
        }
    }
}

// ==================== 停止视频 ====================
function stopVideo() {
    stopDetection();
    
    if (state.stream) {
        state.stream.getTracks().forEach(track => track.stop());
        state.stream = null;
    }
    
    elements.video.srcObject = null;
    state.isVideoPlaying = false;
    
    ctx.clearRect(0, 0, elements.overlay.width, elements.overlay.height);
    
    updateUIState(false);
    resetResults();
}

// ==================== 调整Canvas大小 ====================
function resizeOverlay() {
    if (elements.video.videoWidth && elements.video.videoHeight) {
        elements.overlay.width = elements.video.videoWidth;
        elements.overlay.height = elements.video.videoHeight;
    }
}

// ==================== 开始检测 ====================
function startDetection() {
    elements.detectStatus.textContent = '检测中';
    
    function detectionLoop() {
        if (!state.isVideoPlaying) return;
        detectFaces();
        requestAnimationFrame(detectionLoop);
    }
    
    requestAnimationFrame(detectionLoop);
    state.lastFpsTime = performance.now();
    state.frameCount = 0;
}

// ==================== 停止检测 ====================
function stopDetection() {
    elements.detectStatus.textContent = '已停止';
}

// ==================== 人脸检测 ====================
async function detectFaces() {
    const now = performance.now();
    
    if (now - state.lastDetectionTime < CONFIG.DETECTION_INTERVAL) {
        return;
    }
    state.lastDetectionTime = now;
    
    // 计算FPS
    state.frameCount++;
    if (now - state.lastFpsTime >= 1000) {
        state.fps = state.frameCount;
        elements.fps.textContent = state.fps + ' FPS';
        state.frameCount = 0;
        state.lastFpsTime = now;
    }
    
    // 使用 face-api.js 检测人脸
    const detections = await faceapi
        .detectAllFaces(elements.video, new faceapi.TinyFaceDetectorOptions({
            inputSize: 416,
            scoreThreshold: CONFIG.MIN_CONFIDENCE
        }))
        .withFaceLandmarks();
    
    elements.faceCount.textContent = detections.length;
    
    ctx.clearRect(0, 0, elements.overlay.width, elements.overlay.height);
    
    if (detections.length > 0) {
        const dims = faceapi.matchDimensions(elements.overlay, {
            width: elements.video.videoWidth,
            height: elements.video.videoHeight
        }, true);
        
        const resizedDetections = faceapi.resizeResults(detections, dims);
        
        for (const detection of resizedDetections) {
            // 获取人脸区域
            const box = detection.detection.box;
            
            // 预测表情
            let expressions;
            if (state.useCustomModel && state.customModel) {
                expressions = await predictWithCustomModel(box);
            } else {
                // 使用 face-api.js 的表情识别
                const faceExpressions = await faceapi
                    .detectSingleFace(elements.video, new faceapi.TinyFaceDetectorOptions())
                    .withFaceExpressions();
                
                if (faceExpressions) {
                    expressions = faceExpressions.expressions;
                } else {
                    expressions = { neutral: 1, happy: 0, sad: 0, angry: 0, surprised: 0, fearful: 0, disgusted: 0 };
                }
            }
            
            drawFaceBox(detection, expressions);
            drawLandmarks(detection);
        }
        
        // 更新表情显示（使用第一个人脸）
        const firstFace = resizedDetections[0];
        const box = firstFace.detection.box;
        let expressions;
        
        if (state.useCustomModel && state.customModel) {
            expressions = await predictWithCustomModel(box);
        } else {
            const faceExpressions = await faceapi
                .detectSingleFace(elements.video, new faceapi.TinyFaceDetectorOptions())
                .withFaceExpressions();
            
            if (faceExpressions) {
                expressions = faceExpressions.expressions;
            } else {
                expressions = { neutral: 1, happy: 0, sad: 0, angry: 0, surprised: 0, fearful: 0, disgusted: 0 };
            }
        }
        
        updateEmotionDisplay(expressions);
    } else {
        resetEmotionDisplay();
    }
}

// ==================== 使用自定义模型预测 ====================
async function predictWithCustomModel(box) {
    if (!state.customModel) return null;
    
    try {
        // 创建临时画布来裁剪人脸
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = CONFIG.IMG_SIZE;
        tempCanvas.height = CONFIG.IMG_SIZE;
        const tempCtx = tempCanvas.getContext('2d');
        
        // 绘制人脸区域到画布
        tempCtx.drawImage(
            elements.video,
            box.x, box.y, box.width, box.height,
            0, 0, CONFIG.IMG_SIZE, CONFIG.IMG_SIZE
        );
        
        // 获取图像数据
        const imageData = tempCtx.getImageData(0, 0, CONFIG.IMG_SIZE, CONFIG.IMG_SIZE);
        const data = imageData.data;
        
        // 转换为张量
        const rgb = new Float32Array(CONFIG.IMG_SIZE * CONFIG.IMG_SIZE * 3);
        let rgbIndex = 0;
        for (let i = 0; i < data.length; i += 4) {
            rgb[rgbIndex++] = data[i] / 255;
            rgb[rgbIndex++] = data[i + 1] / 255;
            rgb[rgbIndex++] = data[i + 2] / 255;
        }
        
        const input = tf.tensor4d(rgb, [1, CONFIG.IMG_SIZE, CONFIG.IMG_SIZE, 3]);
        
        // 预测
        const prediction = state.customModel.predict(input);
        const probs = await prediction.data();
        
        // 释放张量
        input.dispose();
        prediction.dispose();
        
        // 转换为表达式对象
        const expressions = {};
        CONFIG.EMOTIONS.forEach((emotion, index) => {
            expressions[emotion] = probs[index];
        });
        
        return expressions;
        
    } catch (error) {
        console.error('预测失败:', error);
        return { neutral: 1, happy: 0, sad: 0, angry: 0, surprised: 0, fearful: 0, disgusted: 0, contempt: 0 };
    }
}

// ==================== 绘制人脸框 ====================
function drawFaceBox(detection, expressions) {
    const box = detection.detection.box;
    const dominantEmotion = getDominantEmotion(expressions);
    const emotionConfig = CONFIG.EMOTION_CONFIG[dominantEmotion] || CONFIG.EMOTION_CONFIG.neutral;
    
    ctx.strokeStyle = emotionConfig.color;
    ctx.lineWidth = 3;
    ctx.strokeRect(box.x, box.y, box.width, box.height);
    
    const label = `${emotionConfig.icon} ${emotionConfig.label}`;
    ctx.font = 'bold 16px Arial';
    const textWidth = ctx.measureText(label).width;
    const padding = 8;
    
    ctx.fillStyle = emotionConfig.color;
    ctx.fillRect(box.x, box.y - 30, textWidth + padding * 2, 30);
    
    ctx.fillStyle = '#000';
    ctx.fillText(label, box.x + padding, box.y - 10);
}

// ==================== 绘制面部关键点 ====================
function drawLandmarks(detection) {
    const landmarks = detection.landmarks;
    const positions = landmarks.positions;
    
    ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
    positions.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
        ctx.fill();
    });
}

// ==================== 获取主导表情 ====================
function getDominantEmotion(expressions) {
    let maxScore = 0;
    let dominantEmotion = 'neutral';
    
    for (const [emotion, score] of Object.entries(expressions)) {
        if (score > maxScore) {
            maxScore = score;
            dominantEmotion = emotion;
        }
    }
    
    return dominantEmotion;
}

// ==================== 更新表情显示 ====================
function updateEmotionDisplay(expressions) {
    const dominantEmotion = getDominantEmotion(expressions);
    const emotionConfig = CONFIG.EMOTION_CONFIG[dominantEmotion] || CONFIG.EMOTION_CONFIG.neutral;
    const confidence = Math.round((expressions[dominantEmotion] || 0) * 100);
    
    elements.emotionIcon.textContent = emotionConfig.icon;
    elements.emotionText.textContent = emotionConfig.label;
    elements.emotionText.style.color = emotionConfig.color;
    elements.emotionConfidence.textContent = `置信度: ${confidence}%`;
    
    // 更新进度条
    for (const [emotion, score] of Object.entries(expressions)) {
        const percentage = Math.round((score || 0) * 100);
        const barElement = document.getElementById(`bar-${emotion}`);
        const valueElement = document.getElementById(`val-${emotion}`);
        
        if (barElement && valueElement) {
            barElement.style.width = `${percentage}%`;
            valueElement.textContent = `${percentage}%`;
        }
    }
}

// ==================== 重置表情显示 ====================
function resetEmotionDisplay() {
    elements.emotionIcon.textContent = '😐';
    elements.emotionText.textContent = '未检测到人脸';
    elements.emotionText.style.color = '#fff';
    elements.emotionConfidence.textContent = '置信度: 0%';
    
    const emotions = ['neutral', 'happy', 'sad', 'angry', 'surprised', 'fearful', 'disgusted'];
    emotions.forEach(emotion => {
        const barElement = document.getElementById(`bar-${emotion}`);
        const valueElement = document.getElementById(`val-${emotion}`);
        if (barElement && valueElement) {
            barElement.style.width = '0%';
            valueElement.textContent = '0%';
        }
    });
}

// ==================== 重置所有结果 ====================
function resetResults() {
    resetEmotionDisplay();
    elements.faceCount.textContent = '0';
    elements.fps.textContent = '0 FPS';
    elements.detectStatus.textContent = '未开始';
}

// ==================== 更新UI状态 ====================
function updateUIState(isPlaying) {
    elements.startBtn.disabled = isPlaying;
    elements.stopBtn.disabled = !isPlaying;
}

// ==================== 隐藏加载界面 ====================
function hideLoading() {
    elements.loadingOverlay.classList.add('hidden');
}

// ==================== 显示错误 ====================
function showError(message) {
    alert(message);
}

// ==================== 日志功能 ====================
function log(message, type = 'info') {
    console.log(`[${type}] ${message}`);
}

// ==================== 启动应用 ====================
document.addEventListener('DOMContentLoaded', init);

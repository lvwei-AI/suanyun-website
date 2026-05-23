/**
 * 实时表情识别系统
 * 任务分工：
 * 1. 项目基础架构 - HTML/CSS结构
 * 2. 摄像头模块 - 视频流捕获
 * 3. 人脸检测集成 - face-api.js模型加载与检测
 * 4. 表情识别逻辑 - 表情分析与分类
 * 5. UI展示设计 - 数据可视化
 * 6. 性能优化 - 帧率控制与错误处理
 */


const CONFIG = {
    MODEL_URL: 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model',
    DETECTION_INTERVAL: 50, // 检测间隔(ms) - 提高检测频率
    MIN_CONFIDENCE: 0.3, // 降低置信度阈值，提高检测灵敏度
    VIDEO_WIDTH: 640,
    VIDEO_HEIGHT: 480
};

// ==================== 表情映射配置 ====================
const EMOTION_CONFIG = {
    neutral: { icon: '😐', label: '平静', color: '#74b9ff' },
    happy: { icon: '😊', label: '开心', color: '#fdcb6e' },
    sad: { icon: '😢', label: '悲伤', color: '#74b9ff' },
    angry: { icon: '😠', label: '愤怒', color: '#ff7675' },
    fearful: { icon: '😨', label: '恐惧', color: '#a29bfe' },
    disgusted: { icon: '🤢', label: '厌恶', color: '#00b894' },
    surprised: { icon: '😲', label: '惊讶', color: '#fd79a8' }
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
    fps: 0
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
    fps: document.getElementById('fps')
};

const ctx = elements.overlay.getContext('2d');

// ==================== 初始化 ====================
async function init() {
    try {
        await loadModels();
        setupEventListeners();
        hideLoading();
        console.log('表情识别系统初始化完成');
    } catch (error) {
        console.error('初始化失败:', error);
        showError('系统初始化失败，请刷新页面重试');
    }
}

// ==================== 加载模型 ====================
async function loadModels() {
    console.log('正在加载模型...');
    
    try {
        // 逐个加载模型，便于调试
        console.log('加载 SSD MobileNet 模型...');
        await faceapi.nets.ssdMobilenetv1.loadFromUri(CONFIG.MODEL_URL);
        console.log('SSD MobileNet 模型加载完成');
        
        console.log('加载 FaceLandmark68 模型...');
        await faceapi.nets.faceLandmark68Net.loadFromUri(CONFIG.MODEL_URL);
        console.log('FaceLandmark68 模型加载完成');
        
        console.log('加载 FaceExpression 模型...');
        await faceapi.nets.faceExpressionNet.loadFromUri(CONFIG.MODEL_URL);
        console.log('FaceExpression 模型加载完成');
        
        state.isModelLoaded = true;
        console.log('所有模型加载完成');
    } catch (error) {
        console.error('模型加载失败:', error);
        throw new Error('模型加载失败: ' + error.message);
    }
}

// ==================== 设置事件监听 ====================
function setupEventListeners() {
    elements.startBtn.addEventListener('click', startVideo);
    elements.stopBtn.addEventListener('click', stopVideo);
    
    // 窗口大小改变时调整canvas
    window.addEventListener('resize', resizeOverlay);
}

// ==================== 开始视频 ====================
async function startVideo() {
    if (!state.isModelLoaded) {
        showError('模型尚未加载完成，请稍候');
        return;
    }
    
    try {
        // 请求摄像头权限
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
        
        // 等待视频准备好
        elements.video.onloadedmetadata = () => {
            elements.video.play();
            state.isVideoPlaying = true;
            
            // 调整canvas大小
            resizeOverlay();
            
            // 更新UI状态
            updateUIState(true);
            
            // 开始检测循环
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
    // 停止检测
    stopDetection();
    
    // 停止视频流
    if (state.stream) {
        state.stream.getTracks().forEach(track => track.stop());
        state.stream = null;
    }
    
    // 清除视频源
    elements.video.srcObject = null;
    state.isVideoPlaying = false;
    
    // 清除画布
    ctx.clearRect(0, 0, elements.overlay.width, elements.overlay.height);
    
    // 更新UI状态
    updateUIState(false);
    resetResults();
    
    console.log('摄像头已关闭');
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
    
    // 使用 requestAnimationFrame 进行平滑检测
    function detectionLoop() {
        if (!state.isVideoPlaying) return;
        
        detectFaces();
        requestAnimationFrame(detectionLoop);
    }
    
    requestAnimationFrame(detectionLoop);
    
    // FPS计算
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
    
    // 控制检测频率
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
    
    // 进行检测
    let detections = [];
    try {
        // 使用 SSD MobileNet 检测器，通常比 TinyFaceDetector 更准确
        detections = await faceapi
            .detectAllFaces(elements.video, new faceapi.SsdMobilenetv1Options({
                minConfidence: 0.3
            }))
            .withFaceLandmarks()
            .withFaceExpressions();
        
        // 调试信息：在控制台输出检测结果
        if (detections.length === 0) {
            console.log('未检测到人脸 - 视频尺寸:', elements.video.videoWidth, 'x', elements.video.videoHeight);
        } else {
            console.log('检测到', detections.length, '个人脸');
        }
    } catch (error) {
        console.error('人脸检测出错:', error);
    }
    
    // 更新人脸数量
    elements.faceCount.textContent = detections.length;
    
    // 清除画布
    ctx.clearRect(0, 0, elements.overlay.width, elements.overlay.height);
    
    // 绘制结果
    if (detections.length > 0) {
        // 调整检测结果尺寸以匹配视频
        const dims = faceapi.matchDimensions(elements.overlay, {
            width: elements.video.videoWidth,
            height: elements.video.videoHeight
        }, true);
        
        const resizedDetections = faceapi.resizeResults(detections, dims);
        
        // 绘制人脸框和表情
        resizedDetections.forEach((detection, index) => {
            drawFaceBox(detection);
            drawLandmarks(detection);
        });
        
        // 更新表情显示（使用第一个检测到的人脸）
        updateEmotionDisplay(detections[0].expressions);
    } else {
        resetEmotionDisplay();
    }
}

// ==================== 绘制人脸框 ====================
function drawFaceBox(detection) {
    const box = detection.detection.box;
    const expressions = detection.expressions;
    const dominantEmotion = getDominantEmotion(expressions);
    const emotionConfig = EMOTION_CONFIG[dominantEmotion];
    
    // 绘制边框
    ctx.strokeStyle = emotionConfig.color;
    ctx.lineWidth = 3;
    ctx.strokeRect(box.x, box.y, box.width, box.height);
    
    // 绘制标签背景
    const label = `${emotionConfig.icon} ${emotionConfig.label}`;
    ctx.font = 'bold 16px Arial';
    const textWidth = ctx.measureText(label).width;
    const padding = 8;
    
    ctx.fillStyle = emotionConfig.color;
    ctx.fillRect(box.x, box.y - 30, textWidth + padding * 2, 30);
    
    // 绘制标签文字
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
    const emotionConfig = EMOTION_CONFIG[dominantEmotion];
    const confidence = Math.round(expressions[dominantEmotion] * 100);
    
    // 更新主表情显示
    elements.emotionIcon.textContent = emotionConfig.icon;
    elements.emotionText.textContent = emotionConfig.label;
    elements.emotionText.style.color = emotionConfig.color;
    elements.emotionConfidence.textContent = `置信度: ${confidence}%`;
    
    // 更新进度条
    for (const [emotion, score] of Object.entries(expressions)) {
        const percentage = Math.round(score * 100);
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
    
    // 重置所有进度条
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

// ==================== 启动应用 ====================
// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', init);

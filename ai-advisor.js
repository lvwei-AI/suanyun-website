/**
 * 算云智能顾问 - DeepSeek Chat + RAG
 *
 * 使用说明：
 * 1. 在下方 CONFIG.API_KEY 中填入你的 DeepSeek API Key
 * 2. 打开页面即可对话
 */

// ============================================================
//  配置区
// ============================================================
const CONFIG = {
    API_KEY: 'YOUR_DEEPSEEK_API_KEY_HERE',
    API_URL: 'https://api.deepseek.com/v1/chat/completions',
    MODEL: 'deepseek-chat',
    SYSTEM_PROMPT: '你是"算云智能顾问"，由哈尔滨市松北区算云软件开发工作室基于 DeepSeek 大语言模型构建的 AI 技术咨询助手。\n\n【回答要求】\n- 用中文回答，保持专业且友善\n- 使用纯文本回复，不要使用任何 Markdown 格式\n- 当用户问你的模型或身份时，如实告知你是基于 DeepSeek 模型的算云智能顾问\n- 只能依据上面"参考信息"中的内容来回答，参考信息里没有的内容严禁自行编造\n- 如果参考信息不足以回答用户问题，请礼貌致歉，并建议用户联系人工客服或通过邮箱留言，由专业技术团队为您解答'
};

const RAG_CONFIG = {
    TOP_K: 5
};

// ============================================================
//  知识库（为 RAG 检索准备）
// ============================================================
const KNOWLEDGE_BASE = [
  {
    id: 'intro',
    title: '公司简介',
    content: '算云信息展示平台是一个专注于软件开发、人工智能应用、网络与信息安全领域的技术服务商，提供全方位的技术解决方案。企业主体为哈尔滨市松北区算云软件开发工作室。',
    tags: ['算云信息', '算云', '公司介绍', '简介'],
    category: 'company'
  },
  {
    id: 'enterprise-info',
    title: '企业资质信息',
    content: '企业名称：哈尔滨市松北区算云软件开发工作室。统一社会信用代码：92230109MAKCUYD46K。类型：个体工商户。组成形式：个人经营。注册日期：2026年04月21日。',
    tags: ['企业', '资质', '注册', '信用代码', '营业执照'],
    category: 'company'
  },
  {
    id: 'advantages',
    title: '核心优势',
    content: '正规工商注册，合法合规经营。专业技术团队，丰富项目经验。定制化解决方案，满足个性需求。完善的售后服务体系。严格的信息安全保障。',
    tags: ['优势', '资质', '团队', '服务', '安全'],
    category: 'company'
  },
  {
    id: 'service-dev',
    title: '服务范围：软件开发',
    content: '定制化软件系统开发，包括企业管理系统、业务应用系统、移动应用开发等。技术栈涵盖微信小程序、Node.js、MongoDB、微信云开发等。',
    tags: ['软件开发', '企业系统', '管理软件', '移动应用', '小程序'],
    category: 'service'
  },
  {
    id: 'service-ai',
    title: '服务范围：人工智能应用',
    content: 'AI技术应用开发，智能算法实现，机器学习模型部署与应用集成。涵盖大语言模型对话、智能客服、内容生成等场景。',
    tags: ['人工智能', 'AI', '机器学习', '算法', '模型部署'],
    category: 'service'
  },
  {
    id: 'service-security',
    title: '服务范围：网络与信息安全',
    content: '网络安全评估、安全加固、渗透测试、安全运维等全方位安全服务。',
    tags: ['网络安全', '信息安全', '安全评估', '渗透测试', '安全运维'],
    category: 'service'
  },
  {
    id: 'service-network',
    title: '服务范围：网络技术服务',
    content: '网络架构设计、网络部署实施、网络优化、技术支持与维护服务。',
    tags: ['网络架构', '网络部署', '网络优化', '技术维护'],
    category: 'service'
  },
  {
    id: 'service-consulting',
    title: '服务范围：技术咨询与转让',
    content: '专业技术咨询服务、技术方案设计、技术成果转化与技术转让。',
    tags: ['技术咨询', '方案设计', '技术转让', '技术成果'],
    category: 'service'
  },
  {
    id: 'service-data',
    title: '服务范围：互联网数据服务',
    content: '数据处理、数据分析、数据可视化、大数据平台搭建与运维服务。',
    tags: ['数据处理', '数据分析', '数据可视化', '大数据'],
    category: 'service'
  },
  {
    id: 'project-xiaoyouji',
    title: '项目：校有集 — 高校综合服务平台',
    content: '基于微信小程序的二手交易、校园服务、信息发布综合平台，独立完成全栈开发与上线运营。技术栈：微信小程序、Node.js、MongoDB、微信云开发。提供微信小程序二维码可扫码体验。',
    tags: ['校有集', '高校', '校园', '二手交易', '微信小程序', '综合平台'],
    category: 'project'
  },
  {
    id: 'project-emotion',
    title: '项目：实时人脸表情识别系统',
    content: '基于 TensorFlow.js + face-api.js 的浏览器端实时表情识别应用，支持 7 类情绪检测与自定义模型训练。技术栈：TensorFlow.js、face-api.js、CNN、JavaScript。提供在线体验入口。',
    tags: ['人脸识别', '表情识别', 'TensorFlow', 'AI', '情绪检测', 'CNN'],
    category: 'project'
  },
  {
    id: 'project-km',
    title: '项目：K&M 校园早餐预定平台',
    content: '基于微信小程序的校园早餐预约与配送服务，从需求调研到配送运营全流程落地，解决早起排队与食堂拥挤痛点。技术栈：微信小程序、校园O2O、配送服务。运营数据：累计用户 900+，完成订单 1000+，兼职岗位 2。',
    tags: ['K&M', '早餐', '校园', 'O2O', '配送', '预定'],
    category: 'project'
  },
  {
    id: 'project-cloud',
    title: '项目：云边小卖部',
    content: '校园即时零售服务平台，通过数据驱动运营策略优化，实现 0 元起送 + 免配送费模式验证，建立配货配送协作机制。运营数据：累计用户 1,200+，月流水 1-2 万，兼职岗位 4。',
    tags: ['云边小卖部', '零售', '即时配送', '校园', '数据驱动'],
    category: 'project'
  }
];

// ============================================================
//  RAG 引擎（关键词检索）
// ============================================================
class RAGEngine {
    constructor(kb) {
        this.kb = kb;
        this.ready = true;
        // 分类关键词映射：用户说"项目"就匹配 project 分类
        this.categoryKeywords = {
            project: ['项目', '案例', '做过', '实践', '产品', '校有集', '表情', '早餐', '云边'],
            service: ['服务', '业务', '开发', '技术', '咨询', '解决方案'],
            company: ['公司', '介绍', '关于', '简介', '资质', '优势', '企业']
        };
    }

    // 关键词检索
    keywordSearch(query, topK) {
        const q = query.toLowerCase();
        const scored = this.kb.map(chunk => {
            let score = 0;
            // 标签匹配（精准）
            for (const tag of chunk.tags) {
                if (q.includes(tag.toLowerCase())) score += 3;
            }
            // 标题匹配（精准）
            if (q.includes(chunk.title.toLowerCase())) score += 4;
            // 内容匹配（部分命中）
            if (chunk.content.toLowerCase().includes(q)) score += 2;
            // 分类匹配：用户说"项目"则命中所有 project 分类
            const keywords = this.categoryKeywords[chunk.category] || [];
            for (const kw of keywords) {
                if (q.includes(kw)) { score += 1; break; }
            }
            return { id: chunk.id, score };
        });
        scored.sort((a, b) => b.score - a.score);
        return scored.filter(s => s.score > 0).slice(0, topK);
    }

    retrieve(query) {
        const results = this.keywordSearch(query, RAG_CONFIG.TOP_K);
        if (results.length === 0) return '';
        return results.map(r => {
            const chunk = this.kb.find(c => c.id === r.id);
            return '【' + chunk.title + '】' + chunk.content;
        }).join('\n\n');
    }
}

// ============================================================
//  聊天引擎
// ============================================================
class DeepSeekChat {
    constructor() {
        this.messagesEl = document.getElementById('chatMessages');
        this.inputEl = document.getElementById('chatInput');
        this.sendBtn = document.getElementById('chatSendBtn');

        this.conversationHistory = [];
        this.isProcessing = false;
        this.ragEngine = new RAGEngine(KNOWLEDGE_BASE);

        this.init();
    }

    init() {
        this.addWelcome();
        this.sendBtn.addEventListener('click', () => this.send());
        this.inputEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.send();
            }
        });
        this.inputEl.focus();
    }

    addWelcome() {
        const msg = document.createElement('div');
        msg.className = 'chat-message ai';
        msg.innerHTML = [
            '<div class="message-avatar">◆</div>',
            '<div class="message-content">',
            '<div class="message-bubble">',
            '<p style="font-weight:500;color:var(--accent);margin-bottom:4px;">您好！我是算云智能顾问</p>',
            '<p style="font-size:13px;color:var(--text-muted);">请告诉我您想了解的技术问题，我会为您提供专业的建议。</p>',
            '</div>',
            '<span class="message-time">算云智能顾问</span>',
            '</div>'
        ].join('');
        this.messagesEl.appendChild(msg);
    }

    async send() {
        const text = this.inputEl.value.trim();
        if (!text || this.isProcessing) return;

        this.inputEl.value = '';
        this.addMessage('user', text);

        if (!CONFIG.API_KEY) {
            this.addMessage('ai', '请先在 ai-advisor.js 的 CONFIG.API_KEY 中填入你的 DeepSeek API Key。');
            return;
        }

        this.isProcessing = true;
        this.sendBtn.disabled = true;
        this.showTyping();

        try {
            // RAG 检索：根据用户问题获取相关知识块
            const context = this.ragEngine.retrieve(text);

            // 动态构建 system prompt
            let systemContent = CONFIG.SYSTEM_PROMPT;
            if (context) {
                systemContent += '\n\n参考信息：\n' + context;
            } else {
                systemContent += '\n\n注意：当前问题在知识库中没有匹配到相关信息，请礼貌致歉并建议用户联系人工客服或邮箱留言。';
            }

            // 构建完整消息序列
            const messages = [
                { role: 'system', content: systemContent },
                ...this.conversationHistory,
                { role: 'user', content: text }
            ];

            const response = await this.callAPI(messages);
            const reply = response.choices[0].message.content;
            this.hideTyping();
            this.addMessage('ai', reply);
            this.conversationHistory.push({ role: 'user', content: text });
            this.conversationHistory.push({ role: 'assistant', content: reply });
        } catch (err) {
            this.hideTyping();
            this.addMessage('ai', '请求失败：' + this.escapeHtml(err.message));
        }

        this.isProcessing = false;
        this.sendBtn.disabled = false;
        this.inputEl.focus();
    }

    addMessage(role, text) {
        const div = document.createElement('div');
        div.className = 'chat-message ' + role;
        if (role === 'ai') {
            div.innerHTML = [
                '<div class="message-avatar">◆</div>',
                '<div class="message-content">',
                '<div class="message-bubble">' + text + '</div>',
                '<span class="message-time">算云智能顾问</span>',
                '</div>'
            ].join('');
        } else {
            div.innerHTML = [
                '<div class="message-avatar">U</div>',
                '<div class="message-content">',
                '<div class="message-bubble">' + this.escapeHtml(text) + '</div>',
                '<span class="message-time">我</span>',
                '</div>'
            ].join('');
        }
        this.messagesEl.appendChild(div);
        this.scrollBottom();
    }

    showTyping() {
        const div = document.createElement('div');
        div.className = 'chat-message ai';
        div.id = 'typingIndicator';
        div.innerHTML = '<div class="message-avatar">◆</div><div class="typing-indicator active"><div class="typing-dots"><span></span><span></span><span></span></div></div>';
        this.messagesEl.appendChild(div);
        this.scrollBottom();
    }

    hideTyping() {
        const el = document.getElementById('typingIndicator');
        if (el) el.remove();
    }

    async callAPI(messages) {
        const res = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + CONFIG.API_KEY
            },
            body: JSON.stringify({
                model: CONFIG.MODEL,
                messages: messages,
                max_tokens: 2048,
                stream: false
            })
        });
        if (!res.ok) {
            throw new Error(await res.text());
        }
        return res.json();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    scrollBottom() {
        this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => new DeepSeekChat(), 100);
});

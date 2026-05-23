// 粒子动画系统
class ParticleSystem {
    constructor() {
        this.canvas = document.getElementById('particles-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.maxParticles = 80;
        this.connectionDistance = 150;
        this.maxConnections = 3;
        
        this.init();
        
        // 监听主题切换事件
        window.addEventListener('themeChanged', () => {
            this.updateColors();
        });
    }
    
    getParticleColor() {
        const body = document.body;
        if (body.classList.contains('light-mode')) {
            return '37, 99, 235'; // 蓝色
        }
        return '201, 169, 98'; // 金色
    }
    
    updateColors() {
        // 颜色会在下一帧自动更新
    }
    
    init() {
        this.resize();
        this.createParticles();
        this.animate();
        
        window.addEventListener('resize', () => this.resize());
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    createParticles() {
        for (let i = 0; i < this.maxParticles; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                radius: Math.random() * 2 + 1,
                opacity: Math.random() * 0.5 + 0.2
            });
        }
    }
    
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const particleColor = this.getParticleColor();
        
        // 更新和绘制粒子
        this.particles.forEach((particle, i) => {
            // 更新位置
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // 边界检测
            if (particle.x < 0 || particle.x > this.canvas.width) particle.vx *= -1;
            if (particle.y < 0 || particle.y > this.canvas.height) particle.vy *= -1;
            
            // 绘制粒子
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(${particleColor}, ${particle.opacity})`;
            this.ctx.fill();
            
            // 绘制连接线
            let connections = 0;
            for (let j = i + 1; j < this.particles.length; j++) {
                if (connections >= this.maxConnections) break;
                
                const other = this.particles[j];
                const dx = particle.x - other.x;
                const dy = particle.y - other.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < this.connectionDistance) {
                    const opacity = (1 - distance / this.connectionDistance) * 0.3;
                    this.ctx.beginPath();
                    this.ctx.moveTo(particle.x, particle.y);
                    this.ctx.lineTo(other.x, other.y);
                    this.ctx.strokeStyle = `rgba(${particleColor}, ${opacity})`;
                    this.ctx.lineWidth = 0.5;
                    this.ctx.stroke();
                    connections++;
                }
            }
        });
        
        requestAnimationFrame(() => this.animate());
    }
}

// 导航栏滚动效果
class Navigation {
    constructor() {
        this.navbar = document.querySelector('.navbar');
        this.body = document.body;
        this.init();
    }
    
    init() {
        window.addEventListener('scroll', () => this.handleScroll());
    }
    
    handleScroll() {
        if (window.scrollY > 50) {
            this.navbar.style.padding = '15px 0';
            this.navbar.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.15)';
        } else {
            this.navbar.style.padding = '20px 0';
            this.navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        }
    }
}

// 滚动显示动画
class ScrollReveal {
    constructor() {
        this.elements = document.querySelectorAll('.about-card, .service-item, .contact-item');
        this.init();
    }
    
    init() {
        this.elements.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'all 0.6s ease-out';
        });
        
        this.checkVisibility();
        window.addEventListener('scroll', () => this.checkVisibility());
    }
    
    checkVisibility() {
        this.elements.forEach(el => {
            const rect = el.getBoundingClientRect();
            const isVisible = rect.top < window.innerHeight * 0.85;
            
            if (isVisible) {
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }
        });
    }
}

// 数字滚动动画
class NumberCounter {
    constructor() {
        this.numbers = document.querySelectorAll('.service-number');
        this.init();
    }
    
    init() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animate(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        
        this.numbers.forEach(num => observer.observe(num));
    }
    
    animate(element) {
        const finalNumber = element.textContent;
        const target = parseInt(finalNumber);
        let current = 0;
        const increment = target / 30;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                element.textContent = finalNumber;
                clearInterval(timer);
            } else {
                element.textContent = String(Math.floor(current)).padStart(2, '0');
            }
        }, 50);
    }
}

// 卡片3D倾斜效果
class CardTilt {
    constructor() {
        this.cards = document.querySelectorAll('.about-card, .service-item, .project-item');
        this.init();
    }

    init() {
        this.cards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transition = 'transform 0.05s, border-color 0.4s, box-shadow 0.4s';
            });
            card.addEventListener('mousemove', (e) => this.handleMouseMove(e, card));
            card.addEventListener('mouseleave', () => this.handleMouseLeave(card));
        });
    }

    handleMouseMove(e, card) {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = (y - centerY) / 60;
        const rotateY = (centerX - x) / 60;

        card.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px)`;
    }

    handleMouseLeave(card) {
        card.style.transition = 'transform 0.4s ease, border-color 0.4s, box-shadow 0.4s';
        card.style.transform = '';
    }
}

// 主题切换功能
class ThemeToggle {
    constructor() {
        this.toggleBtn = document.getElementById('themeToggle');
        this.body = document.body;
        this.init();
    }
    
    init() {
        // 检查本地存储的主题设置，默认浅色
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            this.body.classList.add('dark-mode');
        } else {
            // 默认浅色模式，无需添加class
            this.body.classList.remove('dark-mode');
        }
        
        this.toggleBtn.addEventListener('click', () => this.toggleTheme());
    }
    
    toggleTheme() {
        const isDark = this.body.classList.contains('dark-mode');
        
        if (isDark) {
            this.body.classList.remove('dark-mode');
            localStorage.setItem('theme', 'light');
        } else {
            this.body.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark');
        }
        
        // 触发粒子颜色更新
        setTimeout(() => {
            const event = new CustomEvent('themeChanged');
            window.dispatchEvent(event);
        }, 300);
    }
}

// 页面导航高亮
class PageNav {
    constructor() {
        this.init();
    }

    init() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        document.querySelectorAll('.nav-link').forEach(link => {
            const href = link.getAttribute('href');
            // 移除所有 active
            link.classList.remove('active');
            // 高亮当前页面对应的导航项
            if (href === currentPage) {
                link.classList.add('active');
            }
            // index.html 上的锚点链接
            if (currentPage === 'index.html' && href.startsWith('#')) {
                if (href === '#home' || href === '#') {
                    link.classList.add('active');
                }
            }
        });
    }
}

// 增强平滑滚动：处理跨页面锚点
class EnhancedSmoothScroll {
    constructor() {
        this.links = document.querySelectorAll('a[href^="#"], a[href^="index.html#"]');
        this.init();
    }

    init() {
        this.links.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');

                // 跨页面链接（index.html#section）—— 正常导航
                if (href.startsWith('index.html#')) {
                    // 让浏览器默认行为处理导航，不做拦截
                    return;
                }

                // 同页面锚点 —— 平滑滚动
                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }
}

// 初始化所有功能
document.addEventListener('DOMContentLoaded', () => {
    new ParticleSystem();
    new Navigation();
    new ScrollReveal();
    new EnhancedSmoothScroll();
    new NumberCounter();
    new CardTilt();
    new ThemeToggle();
    new PageNav();
});

// 导航链接点击高亮（单页应用模式）
document.addEventListener('DOMContentLoaded', () => {
    // 为 index.html 上的锚点链接添加滚动监听高亮
    if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname === '') {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-link[href^="#"]');

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    navLinks.forEach(link => {
                        link.classList.remove('active');
                        if (link.getAttribute('href') === '#' + entry.target.id) {
                            link.classList.add('active');
                        }
                    });
                }
            });
        }, { threshold: 0.3, rootMargin: '-80px 0px 0px 0px' });

        sections.forEach(section => observer.observe(section));
    }
});

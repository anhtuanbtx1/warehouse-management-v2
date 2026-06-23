'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Sun, Moon } from 'lucide-react';
import './login-v2.css';

const WarehouseLoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isUsernameFocused, setIsUsernameFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/warehouse-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();

      if (result.success) {
        localStorage.setItem('warehouse_auth_token', result.token);
        localStorage.setItem('warehouse_user', JSON.stringify(result.user));
        
        const card = document.querySelector('.login-card') as HTMLElement;
        if (card) card.classList.add('form-success');
        
        setTimeout(() => {
          router.push('/warehouse-v2');
        }, 800);
      } else {
        setError(result.error || 'Đăng nhập thất bại');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Có lỗi xảy ra khi đăng nhập');
    } finally {
      setLoading(false);
    }
  };

  const toggleDarkMode = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark-mode');
      document.documentElement.setAttribute('data-bs-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark-mode');
      document.documentElement.setAttribute('data-bs-theme', 'light');
    }
  };

  useEffect(() => {
    const isDarkGlobal = document.documentElement.classList.contains('dark-mode') || 
                         document.documentElement.getAttribute('data-bs-theme') === 'dark';
    setIsDarkMode(isDarkGlobal);
  }, []);

  useEffect(() => {
    const canvas = document.getElementById('particles') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);

    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;

      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 3 + 1;
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.speedY = (Math.random() - 0.5) * 0.5;
        this.color = isDarkMode
          ? `rgba(34, 211, 238, ${Math.random() * 0.15 + 0.05})`
          : `rgba(245, 87, 2, ${Math.random() * 0.15 + 0.05})`;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x > canvas.width) this.x = 0;
        if (this.x < 0) this.x = canvas.width;
        if (this.y > canvas.height) this.y = 0;
        if (this.y < 0) this.y = canvas.height;
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const particles: Particle[] = [];
    const particleCount = Math.min(80, Math.floor((canvas.width * canvas.height) / 20000));
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    let animationFrameId: number;
    const animate = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const particle of particles) {
        particle.update();
        particle.draw();
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', setCanvasSize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isDarkMode]);

  return (
    <div className={`login-container ${isDarkMode ? 'dark' : 'light'}`}>
      <canvas id="particles" className="particles-canvas"></canvas>

      <div className="theme-toggle" onClick={toggleDarkMode}>
        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
      </div>

      <div className="login-card">
        <div className="login-card-inner">
          <div className="login-header">
            <h1>Hệ thống quản lý kho</h1>
            <p>Đăng nhập để tiếp tục</p>
          </div>

          {error && (
            <div className="alert alert-danger py-2 px-3 mb-3" style={{ borderRadius: '0.75rem', fontSize: '0.85rem' }}>
              <i className="fas fa-exclamation-triangle me-2"></i>
              {error}
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit}>
            <div className={`form-field ${isUsernameFocused || username ? 'active' : ''}`}>
              <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} onFocus={() => setIsUsernameFocused(true)} onBlur={() => setIsUsernameFocused(false)} required />
              <label htmlFor="username">Tên đăng nhập</label>
            </div>

            <div className={`form-field ${isPasswordFocused || password ? 'active' : ''}`}>
              <input type={showPassword ? 'text' : 'password'} id="password" value={password} onChange={(e) => setPassword(e.target.value)} onFocus={() => setIsPasswordFocused(true)} onBlur={() => setIsPasswordFocused(false)} required />
              <label htmlFor="password">Mật khẩu</label>
              <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="form-options">
              <label className="remember-me">
                <input type="checkbox" checked={rememberMe} onChange={() => setRememberMe(!rememberMe)} />
                <span className="checkmark"></span>
                Nhớ tài khoản
              </label>

              <a href="#" className="forgot-password" onClick={(e) => e.preventDefault()}>Quên mật khẩu?</a>
            </div>

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Đang đăng nhập...
                </>
              ) : 'Đăng nhập'}
            </button>
          </form>

          <div className="separator"><span>Thông tin demo</span></div>
          <div style={{ fontSize: '0.85rem', opacity: 0.85, textAlign: 'center' }}>
            Tên: <strong>admin</strong> | Mật khẩu: <strong>admin</strong>
          </div>
          <p className="signup-prompt mt-4 mb-0">© 2026 Hệ thống thiết kế bởi AT</p>
        </div>
      </div>
    </div>
  );
};

export default WarehouseLoginPage;
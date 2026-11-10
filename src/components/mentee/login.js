'use client';
import { API_BASE_URL } from "@/lib/api";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function MenteeLogin() {
  const [enrollmentNumber, setEnrollmentNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/m/login`, {
        enrollmentNumber,
        password
      });
      localStorage.setItem('menteeToken', res.data.token);
      alert("Mentee logged in");
      router.push('/dashboard');
    } catch (err) {
      alert(err.response?.data?.error || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style jsx>{`
        .login-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 60vh;
        }
        
        .login-card {
          width: 100%;
          max-width: 400px;
          padding: 2rem;
          background: linear-gradient(to right, #b3d4e6, #FFFFFF, #b3d4e6); 
          border-radius: 10px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
              margin: 2rem;
        }
        
        .login-card:hover {
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
        }
        
        .login-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 0.5rem;
          text-align: center;
        }
        
        .login-subtitle {
          font-size: 0.875rem;
          color: #718096;
          text-align: center;
          margin-bottom: 2rem;
        }
        
        .input-group {
          position: relative;
          margin-bottom: 1rem;
          margin-top: 1rem;
        }
        
        .input-field {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 0.875rem;
          transition: all 0.2s ease;
          padding-right: 2.5rem;
        }
        
        .input-field:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
        }
        
        .password-toggle {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #718096;
          padding: 0.25rem;
        }
        
        .password-toggle:hover {
          color: #4f46e5;
        }
        
        .login-button {
          width: 100%;
          padding: 0.75rem;
          background: linear-gradient(135deg, #296c9e 0%, #3e86b5 50%, #5078c8 100%);
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .login-button:hover {
          background-color: #4338ca;
        }
        
        .login-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .spinner {
          animation: spin 1s linear infinite;
          display: inline-block;
          margin-right: 0.5rem;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        
      `}</style>

      <div className="login-container">
        <div className="login-card">
          <h1 className="login-title">Mentee Login</h1>
          <p className="login-subtitle">Enter your credentials to access your dashboard</p>
          
          <input
            type="text"
            placeholder="Enrollment Number"
            value={enrollmentNumber}
            onChange={(e) => setEnrollmentNumber(e.target.value)}
            className="input-field"
          />
          
          <div className="input-group">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
            />
            <button 
              type="button" 
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486l.708.709z"/>
                  <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829l.822.822zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829z"/>
                  <path d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12-.708.708z"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
                  <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
                </svg>
              )}
            </button>
          </div>
          
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="login-button"
          >
            {isLoading ? (
              <>
                <span className="spinner">↻</span> Logging in...
              </>
            ) : 'Login'}
          </button>
        </div>
      </div>
    </>
  );
}
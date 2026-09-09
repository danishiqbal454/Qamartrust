

import React, { useState, useRef } from 'react';
import { DoneeIcon, PasswordIcon } from '../components/Icons';

interface LoginPageProps {
  onLogin: (username: string, pass: string) => Promise<boolean>;
  onGoToSignUp: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onGoToSignUp }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const marqueeRef = useRef<HTMLMarqueeElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('User Name and password are required.');
      return;
    }

    const loginSuccessful = await onLogin(username, password);

    if (!loginSuccessful) {
      setError('Invalid username or password, or user account is inactive.');
    } else {
      setError('');
    }
  };

  const handleMarqueeMouseOver = () => {
    if (marqueeRef.current) {
      marqueeRef.current.stop();
    }
  };

  const handleMarqueeMouseOut = () => {
    if (marqueeRef.current) {
      marqueeRef.current.start();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-indigo-900 text-white flex flex-col">
      <main className="flex-grow flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-red-200">
            Qamar Khan Trust
          </h1>
          <h2 className="mt-6 text-2xl font-bold text-red-200">
            Sign in your account
          </h2>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white/10 backdrop-blur-sm border border-gray-700 shadow-2xl rounded-2xl py-8 px-4 sm:px-10">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && <p className="text-center text-sm text-red-400">{error}</p>}
              <div>
                <label htmlFor="username-login" className="block text-sm font-medium text-white">
                  User Name
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DoneeIcon className="h-5 w-5 text-white" />
                  </div>
                  <input
                    id="username-login"
                    name="username"
                    type="text"
                    autoComplete="username"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="appearance-none block w-full pl-10 pr-3 py-2.5 border border-gray-600 bg-gray-800/50 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password-login" className="block text-sm font-medium text-white">
                  Password
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <PasswordIcon className="h-5 w-5 text-white" />
                  </div>
                  <input
                    id="password-login"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full pl-10 pr-3 py-2.5 border border-gray-600 bg-gray-800/50 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-white"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-indigo-500 focus:ring-indigo-400 border-gray-600 bg-gray-700 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-white">
                    Remember me
                  </label>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-900 transition-all duration-200"
                >
                  Sign In 
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
      <footer className="w-full text-center p-4 text-white text-sm">
        <div className="flex justify-center items-center flex-wrap gap-x-4 gap-y-2">
          <marquee
            ref={marqueeRef}
            behavior="scroll"
            direction="left"
            scrollamount="10"
            onMouseOver={handleMarqueeMouseOver}
            onMouseOut={handleMarqueeMouseOut}
          >
            <span>Danish Iqbal Mughal</span>
            <span className="hidden md:inline">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
            <span>Contact No. <a href="tel:+923477523873">0347-7523873</a></span>
            <span className="hidden md:inline">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
            <span>Email: <a href="mailto:qamarteacompany0@gmail.com">qamarteacompany0@gmail.com</a></span>
          </marquee>
        </div>
      </footer>
    </div>
  );
};

export default LoginPage;
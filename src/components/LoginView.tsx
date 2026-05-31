import React, { useState } from 'react';
import { Shield, KeySquare, User, Mail, Sparkles, CheckCircle2, ArrowRight, LogIn, UserPlus } from 'lucide-react';
import { AppUser } from '../types';

interface LoginViewProps {
  onLoginSuccess: (user: AppUser) => void;
  users: AppUser[];
  onRegisterUser: (name: string, username: string, email: string, passwordPlain: string) => { success: boolean; error?: string };
}

export default function LoginView({ onLoginSuccess, users, onRegisterUser }: LoginViewProps) {
  const [activeForm, setActiveForm] = useState<'login' | 'register'>('login');
  
  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regSuccess, setRegSuccess] = useState(false);
  const [regError, setRegError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginIdentifier || !loginPassword) {
      setLoginError('សូមបំពេញប្រអប់ព័ត៌មានទាំងអស់ (Please fill all fields)');
      return;
    }

    // Accept username or email
    const cleanedId = loginIdentifier.trim().toLowerCase();
    const user = users.find(
      (u) => u.username.toLowerCase() === cleanedId || u.email.toLowerCase() === cleanedId
    );

    if (!user) {
      setLoginError('រកមិនឃើញគណនីអ្នកប្រើប្រាស់នេះទេ (Admin account not found)');
      return;
    }

    if (user.passwordPlain !== loginPassword) {
      setLoginError('លេខសម្ងាត់មិនត្រឹមត្រូវឡើយ (Incorrect password)');
      return;
    }

    if (user.status === 'pending') {
      setLoginError('គណនីរបស់អ្នកកំពុងរង់ចាំការអនុញ្ញាតពី Super Admin (Account pending super admin approval)');
      return;
    }

    if (user.status === 'rejected') {
      setLoginError('គណនីរបស់អ្នកត្រូវបានបដិសេធការចូលប្រើប្រាស់ (Account login access denied by super admin)');
      return;
    }

    // Success!
    onLoginSuccess(user);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess(false);

    if (!regName || !regUsername || !regEmail || !regPassword) {
      setRegError('សូមបំពេញប្រអប់ព័ត៌មានទាំងអស់សម្រាប់ការចុះឈ្មោះ (Please fill all fields to register)');
      return;
    }

    if (regUsername.toLowerCase() === 'hempiden') {
      setRegError('ឈ្មោះអ្នកប្រើប្រាស់ "hempiden" ត្រូវបានរក្សាទុកសម្រាប់ Super Admin ប៉ុណ្ណោះ (Username is reserved)');
      return;
    }

    const cleanedUsername = regUsername.trim().toLowerCase();
    const cleanedEmail = regEmail.trim().toLowerCase();

    // Check pre-existing
    const exists = users.some(
      (u) => u.username.toLowerCase() === cleanedUsername || u.email.toLowerCase() === cleanedEmail
    );

    if (exists) {
      setRegError('ឈ្មោះអ្នកប្រើប្រាស់ ឬ អ៊ីមែលនេះមានរួចរាល់ហើយ (Username or Email already registered)');
      return;
    }

    const status = onRegisterUser(regName, regUsername, regEmail, regPassword);
    if (status.success) {
      setRegSuccess(true);
      // Clear fields
      setRegName('');
      setRegUsername('');
      setRegEmail('');
      setRegPassword('');
    } else {
      setRegError(status.error || 'មានបញ្ហាក្នុងការចុះឈ្មោះ (Registration error)');
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100 font-sans">
      
      {/* Brand Header Banner */}
      <div className="bg-[#D40511] p-8 text-center relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-[#FFCC00] opacity-10 rounded-full blur-2xl transform translate-x-12 -translate-y-12"></div>
        <div className="absolute left-0 bottom-0 w-24 h-24 bg-white opacity-5 rounded-full blur-xl transform -translate-x-8 translate-y-8"></div>
        
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full backdrop-blur-sm border border-white/15 mb-4 animate-pulse">
          <Shield className="w-3.5 h-3.5 text-[#FFCC00] fill-[#FFCC00]/20" />
          <span className="text-[9px] font-black tracking-widest text-[#FFCC00] uppercase">
            PORTAL SECURITY CENTRAL
          </span>
        </div>

        <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center justify-center gap-1.5 pl-2 leading-none">
          SYSTEM ACCESS PORTAL
        </h2>
        <p className="text-[10px] text-white/70 font-semibold tracking-normal uppercase mt-1">
          ផ្ទាំងចូលគ្រប់គ្រងការប្រកួត (Tournament Panel)
        </p>

        {/* Form Selector Tabs */}
        <div className="flex bg-black/15 p-1 rounded-xl mt-6 border border-white/5">
          <button
            type="button"
            onClick={() => {
              setActiveForm('login');
              setLoginError('');
              setRegError('');
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
              activeForm === 'login'
                ? 'bg-white text-gray-900 shadow-md scale-100'
                : 'text-white/85 hover:bg-white/5'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>ចូលប្រព័ន្ធ (Sign In)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveForm('register');
              setLoginError('');
              setRegError('');
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
              activeForm === 'register'
                ? 'bg-white text-gray-900 shadow-md scale-100'
                : 'text-white/85 hover:bg-white/5'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>ស្នើសុំគណនី (Register)</span>
          </button>
        </div>
      </div>

      <div className="p-8">
        {activeForm === 'login' ? (
          /* LOGIN FORM */
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                ឈ្មោះអ្នកប្រើប្រាស់ ឬ អ៊ីមែល (Username or Email)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="e.g., hempiden / piden.hem@dhl.com"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#D40511]/15 focus:border-[#D40511] transition duration-200 placeholder:text-gray-300"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 tracking-widest uppercase mb-1.5">
                លេខសម្ងាត់សម្ងាត់ (Access Password)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
                  <KeySquare className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#D40511]/15 focus:border-[#D40511] transition duration-200 placeholder:text-gray-300"
                />
              </div>
            </div>

            {loginError && (
              <div className="p-3.5 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2 animate-shake">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                <span className="text-[11px] text-[#D40511] font-bold leading-relaxed">{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 bg-[#D40511] hover:bg-[#b0040d] text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-md shadow-[#D40511]/15 hover:shadow-lg transition duration-150 active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>ចូលគណនីគ្រប់គ្រង (Verify & Access All Panels)</span>
              <ArrowRight className="w-4 h-4" />
            </button>


          </form>
        ) : (
          /* REGISTRATION FORM */
          <form onSubmit={handleRegister} className="space-y-4">
            {regSuccess ? (
              <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-2xl text-center space-y-3 animate-fade-in">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto animate-bounce" />
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-emerald-800 uppercase tracking-wide">
                    ស្នើសុំគណនីជោគជ័យ! (Registration Pending)
                  </h4>
                  <p className="text-[10px] text-emerald-700 font-semibold leading-relaxed">
                    គណនីត្រូវបានចុះឈ្មោះហើយ។ សូមទាក់ទង Super Admin (hempiden) ដើម្បីស្នើសុំការអនុញ្ញាត (Approved status) មុនពេលចូលប្រើប្រាស់។
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setRegSuccess(false);
                    setActiveForm('login');
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition cursor-pointer"
                >
                  ត្រឡប់ទៅទំព័រចូលប្រព័ន្ធ (Back to Sign In)
                </button>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 tracking-widest uppercase mb-1">
                    ឈ្មោះពេញរបស់អ្នក (Full Name)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
                      <Sparkles className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g., Sovanna Dan"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#D40511]/15 focus:border-[#D40511] transition duration-200 placeholder:text-gray-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 tracking-widest uppercase mb-1">
                    ឈ្មោះអ្នកប្រើប្រាស់ (Username)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      placeholder="e.g., sovanna_d"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#D40511]/15 focus:border-[#D40511] transition duration-200 placeholder:text-gray-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 tracking-widest uppercase mb-1">
                    អាសយដ្ឋានអ៊ីមែល (Company Email)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="e.g., sovanna.dan@company.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#D40511]/15 focus:border-[#D40511] transition duration-200 placeholder:text-gray-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 tracking-widest uppercase mb-1">
                    កំណត់លេខសម្ងាត់ (Choose Password)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
                      <KeySquare className="w-4 h-4" />
                    </span>
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#D40511]/15 focus:border-[#D40511] transition duration-200 placeholder:text-gray-300"
                    />
                  </div>
                </div>

                {regError && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2 animate-shake">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                    <span className="text-[11px] text-[#D40511] font-bold leading-relaxed">{regError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-md shadow-indigo-600/15 hover:shadow-lg transition duration-150 active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>ស្នើសុំការចុះឈ្មោះ (Sign Up For Approval)</span>
                </button>
              </>
            )}
          </form>
        )}
      </div>

    </div>
  );
}

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Phone, ArrowLeft, X, AlertCircle } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSignUp, setShowSignUp] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [bootstrapAvailable, setBootstrapAvailable] = useState(false);
  const [bootstrapChecked, setBootstrapChecked] = useState(false);
  const [showBootstrapForm, setShowBootstrapForm] = useState(false);
  const [bootstrapLoading, setBootstrapLoading] = useState(false);
  const [bootstrapError, setBootstrapError] = useState('');
  const [bootstrapForm, setBootstrapForm] = useState({
    companyName: '',
    email: '',
    password: '',
    number: '',
    image: null as File | null,
  });
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const checkBootstrap = async () => {
      try {
        const response = await fetch(`${API_URL}/api/auth/bootstrap-status`, {
          method: 'GET',
          credentials: 'include',
        });
        const data = await response.json();

        if (response.ok && data.success) {
          setBootstrapAvailable(!data.hasUsers);
        }
      } catch (err) {
        console.error('Bootstrap status error:', err);
      } finally {
        setBootstrapChecked(true);
      }
    };

    checkBootstrap();
  }, [API_URL]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
        navigate('/home');
      } else {
        if (bootstrapAvailable) {
          setError('No users found. Create the first admin account to continue.');
        } else {
          setError(data.message || 'Login failed. Please try again.');
        }
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBootstrapSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBootstrapError('');

    if (
      !bootstrapForm.companyName ||
      !bootstrapForm.email ||
      !bootstrapForm.password ||
      !bootstrapForm.number
    ) {
      setBootstrapError('All fields are required.');
      return;
    }

    setBootstrapLoading(true);

    try {
      const formData = new FormData();
      formData.append('companyName', bootstrapForm.companyName);
      formData.append('email', bootstrapForm.email);
      formData.append('password', bootstrapForm.password);
      formData.append('number', bootstrapForm.number);
      if (bootstrapForm.image) {
        formData.append('image', bootstrapForm.image);
      }

      const response = await fetch(`${API_URL}/api/auth/bootstrap-admin`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
        setBootstrapAvailable(false);
        navigate('/home');
      } else {
        setBootstrapError(data.message || 'Failed to create admin account.');
      }
    } catch (err) {
      setBootstrapError('Network error. Please check your connection and try again.');
      console.error('Bootstrap error:', err);
    } finally {
      setBootstrapLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-green-100 px-3 sm:px-4 py-6">
      
      {/* Login Container */}
      <div className="w-full max-w-md">
        
        {/* Logo/Brand Section - Mobile Optimized */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-block p-4 sm:p-6 bg-green-500/30 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-white/50 shadow-2xl mb-3 sm:mb-4">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-black">WhatsApp</h1>
            <h2 className="text-base sm:text-xl md:text-2xl font-semibold text-black">Campaign Manager</h2>
          </div>
        </div>

        {/* Main Card - Mobile Optimized */}
        <div className="bg-white/40 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-white/60 shadow-2xl p-5 sm:p-6 md:p-8">
          
          {!showSignUp && !showBootstrapForm ? (
            // LOGIN FORM
            <>
              <h3 className="text-xl sm:text-2xl font-bold text-black mb-4 sm:mb-6 text-center">Login to Your Account</h3>

              {/* Error Message */}
              {error && (
                <div className="mb-3 sm:mb-4 p-2.5 sm:p-3 bg-red-100/60 backdrop-blur-sm border border-red-300 rounded-lg sm:rounded-xl">
                  <p className="text-red-700 text-xs sm:text-sm font-semibold">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                
                {/* Email Input */}
                <div>
                  <label htmlFor="email" className="block text-xs sm:text-sm font-bold text-black mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/60 backdrop-blur-sm border-2 border-white/80 rounded-lg sm:rounded-xl text-sm sm:text-base text-black placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                    placeholder="Enter your email"
                    disabled={loading}
                  />
                </div>

                {/* Password Input */}
                <div>
                  <label htmlFor="password" className="block text-xs sm:text-sm font-bold text-black mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/60 backdrop-blur-sm border-2 border-white/80 rounded-lg sm:rounded-xl text-sm sm:text-base text-black placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                    placeholder="Enter your password"
                    disabled={loading}
                  />
                </div>

                {/* Remember Me & Forgot Password - Mobile Stacked */}
                <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 xs:gap-0">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 border-2 border-green-500 rounded focus:ring-2 focus:ring-green-500"
                    />
                    <span className="ml-2 text-xs sm:text-sm font-semibold text-black">Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-xs sm:text-sm font-semibold text-black hover:text-green-600 hover:underline transition-colors text-left xs:text-right"
                  >
                    Forgot Password?
                  </button>
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 sm:px-6 py-2.5 sm:py-3 bg-green-500/80 backdrop-blur-md text-white font-bold text-base sm:text-lg rounded-lg sm:rounded-xl border border-white/30 shadow-lg hover:bg-green-600/80 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                >
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </form>

              {/* Sign Up Link */}
              <div className="mt-4 sm:mt-6 text-center">
                <p className="text-xs sm:text-sm text-black">
                  Don't have an account?{' '}
                  <button
                    onClick={() => {
                      setShowSignUp(true);
                      setShowBootstrapForm(false);
                      setError('');
                      setBootstrapError('');
                    }}
                    className="font-bold text-green-600 hover:underline"
                  >
                    Sign Up
                  </button>
                </p>
              </div>

              {bootstrapChecked && bootstrapAvailable && (
                <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-amber-50/80 backdrop-blur-sm rounded-lg sm:rounded-xl border border-amber-300">
                  <p className="text-xs sm:text-sm text-amber-900 font-semibold">
                    No users found. Create the first admin account to get started.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowBootstrapForm(true);
                      setShowSignUp(false);
                      setError('');
                      setBootstrapError('');
                    }}
                    className="mt-3 w-full px-4 sm:px-6 py-2.5 sm:py-3 bg-amber-500/80 backdrop-blur-md text-white font-bold text-sm sm:text-base rounded-lg sm:rounded-xl border border-white/30 shadow-lg hover:bg-amber-600/80 hover:shadow-xl transition-all active:scale-95"
                  >
                    Create Admin Account
                  </button>
                </div>
              )}
            </>
          ) : showBootstrapForm ? (
            // BOOTSTRAP ADMIN FORM
            <>
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <button
                  onClick={() => {
                    setShowBootstrapForm(false);
                    setBootstrapError('');
                  }}
                  className="flex items-center gap-1.5 sm:gap-2 text-black hover:text-green-600 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm sm:text-base font-semibold">Back to Login</span>
                </button>
                <span className="text-[10px] sm:text-xs font-bold text-amber-800 bg-amber-100 px-2 py-1 rounded-full">
                  First-Time Setup
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-black mb-2 sm:mb-3 text-center">Create Admin Account</h3>
              <p className="text-center text-xs sm:text-sm text-black mb-4 sm:mb-6">
                This account will have the highest authority in the system.
              </p>

              {bootstrapError && (
                <div className="mb-3 sm:mb-4 p-2.5 sm:p-3 bg-red-100/60 backdrop-blur-sm border border-red-300 rounded-lg sm:rounded-xl">
                  <p className="text-red-700 text-xs sm:text-sm font-semibold">{bootstrapError}</p>
                </div>
              )}

              <form onSubmit={handleBootstrapSubmit} className="space-y-4 sm:space-y-5">
                <div>
                  <label htmlFor="bootstrap-company" className="block text-xs sm:text-sm font-bold text-black mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    id="bootstrap-company"
                    value={bootstrapForm.companyName}
                    onChange={(e) => setBootstrapForm({ ...bootstrapForm, companyName: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/60 backdrop-blur-sm border-2 border-white/80 rounded-lg sm:rounded-xl text-sm sm:text-base text-black placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                    placeholder="Enter company name"
                    disabled={bootstrapLoading}
                  />
                </div>

                <div>
                  <label htmlFor="bootstrap-email" className="block text-xs sm:text-sm font-bold text-black mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="bootstrap-email"
                    value={bootstrapForm.email}
                    onChange={(e) => setBootstrapForm({ ...bootstrapForm, email: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/60 backdrop-blur-sm border-2 border-white/80 rounded-lg sm:rounded-xl text-sm sm:text-base text-black placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                    placeholder="Enter admin email"
                    disabled={bootstrapLoading}
                  />
                </div>

                <div>
                  <label htmlFor="bootstrap-password" className="block text-xs sm:text-sm font-bold text-black mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    id="bootstrap-password"
                    value={bootstrapForm.password}
                    onChange={(e) => setBootstrapForm({ ...bootstrapForm, password: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/60 backdrop-blur-sm border-2 border-white/80 rounded-lg sm:rounded-xl text-sm sm:text-base text-black placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                    placeholder="Create a password"
                    disabled={bootstrapLoading}
                  />
                </div>

                <div>
                  <label htmlFor="bootstrap-number" className="block text-xs sm:text-sm font-bold text-black mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="bootstrap-number"
                    value={bootstrapForm.number}
                    onChange={(e) => setBootstrapForm({ ...bootstrapForm, number: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/60 backdrop-blur-sm border-2 border-white/80 rounded-lg sm:rounded-xl text-sm sm:text-base text-black placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                    placeholder="Enter phone number"
                    disabled={bootstrapLoading}
                  />
                </div>

                <div>
                  <label htmlFor="bootstrap-image" className="block text-xs sm:text-sm font-bold text-black mb-2">
                    Profile Image (Optional)
                  </label>
                  <input
                    type="file"
                    id="bootstrap-image"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setBootstrapForm({ ...bootstrapForm, image: file });
                    }}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/60 backdrop-blur-sm border-2 border-white/80 rounded-lg sm:rounded-xl text-xs sm:text-sm text-black file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-green-500/80 file:text-white file:font-semibold"
                    disabled={bootstrapLoading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={bootstrapLoading}
                  className="w-full px-4 sm:px-6 py-2.5 sm:py-3 bg-green-500/80 backdrop-blur-md text-white font-bold text-base sm:text-lg rounded-lg sm:rounded-xl border border-white/30 shadow-lg hover:bg-green-600/80 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                >
                  {bootstrapLoading ? 'Creating Admin...' : 'Create Admin'}
                </button>
              </form>
            </>
          ) : (
            // SIGN UP / CONTACT SECTION
            <>
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <button
                  onClick={() => setShowSignUp(false)}
                  className="flex items-center gap-1.5 sm:gap-2 text-black hover:text-green-600 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm sm:text-base font-semibold">Back to Login</span>
                </button>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-black mb-3 sm:mb-4 text-center">Want to Sign Up?</h3>
              <p className="text-center text-sm sm:text-base text-black mb-4 sm:mb-6">
                Contact our team to create an account
              </p>

              {/* Contact Information Cards */}
              <div className="space-y-3 sm:space-y-4">
                
                {/* Email Contact */}
                <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-50/80 to-blue-100/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border-2 border-blue-300 shadow-lg">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="p-2 sm:p-3 bg-blue-500/20 rounded-lg sm:rounded-xl flex-shrink-0">
                      <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-blue-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-gray-700 uppercase">Email Us</p>
                      <a
                        href="mailto:support@example.com"
                        className="text-sm sm:text-base md:text-lg font-bold text-blue-700 hover:underline break-all"
                      >
                        support@example.com
                      </a>
                    </div>
                  </div>
                </div>

                {/* Phone Contact */}
                <div className="p-4 sm:p-5 bg-gradient-to-r from-green-50/80 to-green-100/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border-2 border-green-300 shadow-lg">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="p-2 sm:p-3 bg-green-500/20 rounded-lg sm:rounded-xl flex-shrink-0">
                      <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-green-700" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs sm:text-sm font-bold text-gray-700 uppercase">Call Us</p>
                      <a
                        href="tel:+911234567890"
                        className="text-sm sm:text-base md:text-lg font-bold text-green-700 hover:underline"
                      >
                        +91 12345 67890
                      </a>
                    </div>
                  </div>
                </div>

                {/* Info Box */}
                <div className="p-3 sm:p-4 bg-yellow-50/80 backdrop-blur-sm rounded-lg sm:rounded-xl border border-yellow-300">
                  <p className="text-xs sm:text-sm text-gray-700">
                    <span className="font-bold">Note:</span> Our team will verify your details and create an account for you within 24 hours.
                  </p>
                </div>
              </div>

              {/* Contact Button */}
              <div className="mt-4 sm:mt-6">
                <a
                  href="mailto:support@example.com"
                  className="block w-full px-4 sm:px-6 py-2.5 sm:py-3 bg-green-500/80 backdrop-blur-md text-white font-bold text-base sm:text-lg text-center rounded-lg sm:rounded-xl border border-white/30 shadow-lg hover:bg-green-600/80 hover:shadow-xl transition-all active:scale-95"
                >
                  Send Email
                </a>
              </div>

              {/* Back to Login */}
              <div className="mt-4 sm:mt-6 text-center">
                <p className="text-xs sm:text-sm text-black">
                  Already have an account?{' '}
                  <button
                    onClick={() => setShowSignUp(false)}
                    className="font-bold text-green-600 hover:underline"
                  >
                    Login
                  </button>
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* FORGOT PASSWORD MODAL - Mobile Optimized */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white/90 backdrop-blur-xl rounded-xl sm:rounded-2xl border-2 border-orange-500 shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-5 md:p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-black">Forgot Password?</h3>
                <button
                  onClick={() => setShowForgotPassword(false)}
                  className="p-1.5 sm:p-2 hover:bg-gray-200 rounded-lg transition-all flex-shrink-0"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
                </button>
              </div>

              {/* Alert Icon */}
              <div className="flex justify-center mb-3 sm:mb-4">
                <div className="p-3 sm:p-4 bg-orange-100 rounded-full">
                  <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-orange-600" />
                </div>
              </div>

              {/* Message */}
              <div className="space-y-3 sm:space-y-4">
                <div className="p-3 sm:p-4 bg-orange-50 rounded-lg sm:rounded-xl border border-orange-300">
                  <h4 className="text-base sm:text-lg font-bold text-orange-800 mb-2">Contact Your Admin or Reseller</h4>
                  <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                    To reset your password, please contact your <span className="font-bold">Admin</span> or <span className="font-bold">Reseller</span>. 
                    They have the authority to change your password.
                  </p>
                </div>

                <div className="p-3 sm:p-4 bg-blue-50 rounded-lg sm:rounded-xl border border-blue-300">
                  <h4 className="text-xs sm:text-sm font-bold text-blue-800 mb-2">After Password Reset:</h4>
                  <p className="text-xs sm:text-sm text-gray-700">
                    Once your password is changed, you can update it yourself by going to:
                  </p>
                  <p className="text-xs sm:text-sm font-bold text-blue-700 mt-2">
                    Dashboard → Manage Business Profile
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <div className="mt-4 sm:mt-6">
                <button
                  onClick={() => setShowForgotPassword(false)}
                  className="w-full px-4 sm:px-6 py-2.5 sm:py-3 bg-green-500 text-white font-bold text-sm sm:text-base rounded-lg sm:rounded-xl hover:bg-green-600 transition-all active:scale-95"
                >
                  Got It
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;

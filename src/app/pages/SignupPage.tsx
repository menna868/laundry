import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import {
  ArrowLeft, Eye, EyeOff, Loader2, AlertCircle,
  User, Mail, Lock, Phone, Check
} from 'lucide-react';
import { useAuth, SignupData } from '../context/AuthContext';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { GoogleLogin } from '@react-oauth/google';

const SIDE_IMG = 'https://images.unsplash.com/photo-1711783059489-8a0da5564785?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800';

function InputField({
  label, type = 'text', placeholder, value, onChange, error, icon: Icon, suffix
}: {
  label: string; type?: string; placeholder: string;
  value: string; onChange: (v: string) => void;
  error?: string; icon: React.ElementType; suffix?: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          className={`w-full bg-gray-50 border rounded-2xl px-4 py-3.5 pl-11 ${suffix ? 'pr-11' : ''} text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 transition-all ${
            error ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:border-[#1D6076] focus:ring-[#1D6076]/20'
          }`}
        />
        <Icon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" strokeWidth={2} />
        {suffix && <div className="absolute right-4 top-1/2 -translate-y-1/2">{suffix}</div>}
      </div>
      {error && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1"><AlertCircle size={11} />{error}</p>}
    </div>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const { signup, socialLogin } = useAuth();

  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [phone,     setPhone]     = useState('');
  const [errors,    setErrors]    = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!firstName.trim()) e.firstName = 'Required';
    if (!lastName.trim())  e.lastName  = 'Required';
    if (!email.trim())     e.email     = 'Required';
    else if (!/^\S+@\S+\.\S+$/.test(email)) e.email = 'Invalid email';
    if (!phone.trim())     e.phone     = 'Required';
    if (password.length < 6) e.password = 'Min 6 chars';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setError('');
    
    const data: SignupData = { firstName, lastName, email, phone, password };
    const res = await signup(data);
    setLoading(false);
    
    if (res.success) {
      router.replace(`/verify-email?email=${encodeURIComponent(email)}`);
    } else {
      setError(res.error || 'Signup failed');
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-white flex" dir="ltr">
      <motion.div
        className="flex-1 flex flex-col justify-center px-6 md:px-14 lg:px-20 py-12 max-w-xl mx-auto w-full lg:max-w-none"
        initial={{ opacity: 0, x: -32 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="max-w-md w-full mx-auto">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-400 hover:text-gray-600 text-sm mb-6 transition-colors group tracking-wide"
          >
            <ArrowLeft size={16} strokeWidth={2} className="group-hover:-translate-x-0.5 transition-transform" />
            Back
          </button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          >
            <h1 className="text-3xl text-gray-900 mb-1.5" style={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
              Create account
            </h1>
            <p className="text-gray-500 text-sm mb-6">
              Join Nadeef for free.{' '}
              <Link href="/login" className="text-[#1D6076] font-medium hover:underline">Already have an account?</Link>
            </p>
          </motion.div>

          {error && (
            <div className="flex items-center gap-2.5 bg-red-50 border border-red-100 rounded-2xl px-4 py-3 mb-5">
              <AlertCircle size={16} className="text-red-500 shrink-0" strokeWidth={2} />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="flex flex-col items-center mb-5">
            <div className="w-full">
               <GoogleLogin
                  onSuccess={async (credentialResponse) => {
                    if (credentialResponse.credential) {
                      setError('');
                      const ok = await socialLogin(credentialResponse.credential);
                      if (ok) router.replace('/');
                      else setError('Google login failed. Please try again.');
                    }
                  }}
                  onError={() => setError('Google login failed.')}
                  useOneTap
                  theme="outline"
                  size="large"
                  width="100%"
                  shape="pill"
               />
            </div>
          </div>

          <div className="flex items-center gap-4 mb-5">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-gray-400 text-xs font-medium">or</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <InputField label="First name" placeholder="Basel" value={firstName} onChange={v => { setFirstName(v); setErrors(p => ({ ...p, firstName: '' })); }} error={errors.firstName} icon={User} />
              <InputField label="Last name"  placeholder="Ahmed" value={lastName}  onChange={v => { setLastName(v);  setErrors(p => ({ ...p, lastName: '' }));  }} error={errors.lastName}  icon={User} />
            </div>
            <InputField label="Email" type="email" placeholder="you@example.com" value={email} onChange={v => { setEmail(v); setErrors(p => ({ ...p, email: '' })); }} error={errors.email} icon={Mail} />
            <InputField label="Phone number" type="tel" placeholder="01X XXX XXXX" value={phone} onChange={v => { setPhone(v); setErrors(p => ({ ...p, phone: '' })); }} error={errors.phone} icon={Phone} />
            
            <InputField
              label="Create password" type={showPwd ? 'text' : 'password'} placeholder="Min. 6 characters"
              value={password} onChange={v => { setPassword(v); setErrors(p => ({ ...p, password: '' })); }}
              error={errors.password} icon={Lock}
              suffix={
                <button type="button" onClick={() => setShowPwd(v => !v)} className="text-gray-400 hover:text-gray-600">
                  {showPwd ? <EyeOff size={16} strokeWidth={2} /> : <Eye size={16} strokeWidth={2} />}
                </button>
              }
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-4 rounded-2xl text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-md hover:-translate-y-0.5 active:scale-[0.99] transition-all disabled:opacity-70"
              style={{ background: 'linear-gradient(135deg, #1D6076 0%, #2a7a94 100%)' }}
            >
              {loading
                ? <><Loader2 size={18} className="animate-spin" strokeWidth={2} /> Creating...</>
                : <><Check size={16} strokeWidth={2.5} /> Create My Account</>
              }
            </button>
          </form>

          <p className="text-xs text-gray-400 mt-5 leading-relaxed text-center mb-6">
            By creating an account you agree to our{' '}
            <span className="text-[#1D6076] cursor-pointer hover:underline">Terms</span> and{' '}
            <span className="text-[#1D6076] cursor-pointer hover:underline">Privacy Policy</span>
          </p>
        </div>
      </motion.div>

      <div className="hidden lg:flex flex-1 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #EBA050 0%, #d4832a 100%)' }}>
        <ImageWithFallback src={SIDE_IMG} alt="Happy customer" className="absolute inset-0 w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#EBA050]/80 to-[#d4832a]/90" />
        <div className="relative z-10 flex flex-col justify-center px-14 py-16 max-w-lg">
          <div className="text-6xl mb-6">🧺</div>
          <h2 className="text-4xl text-white mb-5" style={{ fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Don&apos;t let laundry<br />slow you down.
          </h2>
          <p className="text-white/80 text-base leading-relaxed mb-8">
            Join Nadeef and discover a smarter way to manage your laundry — schedule pickups, track orders, and get fresh clothes delivered.
          </p>
          <div className="space-y-3">
            {['Browse verified local laundries', 'Transparent pricing, no surprises', 'Real-time order tracking'].map(f => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-white/25 flex items-center justify-center shrink-0">
                  <Check size={12} className="text-white" strokeWidth={3} />
                </div>
                <span className="text-white/90 text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

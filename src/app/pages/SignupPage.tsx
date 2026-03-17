import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, ArrowRight, Eye, EyeOff, Loader2, AlertCircle,
  User, Mail, Lock, Phone, MapPin, Check
} from 'lucide-react';
import { useAuth, SignupData } from '../context/AuthContext';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

const SIDE_IMG = 'https://images.unsplash.com/photo-1711783059489-8a0da5564785?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800';

// Social icons
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  );
}

// ── Step indicator ────────────────────────────────────────────────────────────
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-2">
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                i < current
                  ? 'bg-[#1D6076] text-white'
                  : i === current
                    ? 'bg-[#1D6076] text-white ring-4 ring-[#1D6076]/20'
                    : 'bg-gray-100 text-gray-400'
              }`}
            >
              {i < current ? <Check size={14} strokeWidth={3} /> : i + 1}
            </div>
            {i < total - 1 && (
              <div className={`h-0.5 w-8 rounded-full transition-all ${i < current ? 'bg-[#1D6076]' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>
      <span className="text-xs text-gray-400 font-medium">Step {current + 1} of {total}</span>
    </div>
  );
}

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

// ── Main ──────────────────────────────────────────────────────────────────────
export default function SignupPage() {
  const router = useRouter();
  const { signup, socialLogin } = useAuth();

  const [step, setStep] = useState(0); // 0 = choose method, 1 = details, 2 = contact
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoad, setSocialLoad] = useState('');

  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [phone,     setPhone]     = useState('');
  const [address,   setAddress]   = useState('');
  const [errors,    setErrors]    = useState<Record<string, string>>({});

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!firstName.trim()) e.firstName = 'First name is required';
    if (!lastName.trim())  e.lastName  = 'Last name is required';
    if (!email.trim())     e.email     = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Invalid email address';
    if (password.length < 6) e.password = 'Password must be at least 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e: Record<string, string> = {};
    if (!phone.trim()) e.phone = 'Phone number is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleStep0Continue = () => setStep(1);

  const handleStep1Next = () => {
    if (validateStep1()) { setErrors({}); setStep(2); }
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;
    setLoading(true);
    const data: SignupData = { firstName, lastName, email, phone, password, address };
    const ok = await signup(data);
    setLoading(false);
    if (ok) router.push('/', { replace: true });
  };

  const handleSocial = async (provider: string) => {
    setSocialLoad(provider);
    const ok = await socialLogin(provider);
    setSocialLoad('');
    if (ok) router.push('/', { replace: true });
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-[calc(100vh-64px)] bg-white flex" dir="ltr">

      {/* ── Left form ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center px-6 md:px-14 lg:px-20 py-12 max-w-xl mx-auto w-full lg:max-w-none">
        <div className="max-w-md w-full mx-auto">

          {/* Back */}
          <button
            onClick={() => step === 0 ? router.back() : setStep(s => s - 1)}
            className="flex items-center gap-2 text-gray-400 hover:text-gray-600 text-sm mb-8 transition-colors group"
          >
            <ArrowLeft size={16} strokeWidth={2} className="group-hover:-translate-x-0.5 transition-transform" />
            {step === 0 ? 'Back' : 'Previous step'}
          </button>

          {/* Step 0 — Choose method */}
          {step === 0 && (
            <>
              <h1 className="text-3xl text-gray-900 mb-1.5" style={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
                Create account
              </h1>
              <p className="text-gray-500 text-sm mb-8">
                Join Nadeef for free.{' '}
                <Link href="/login" className="text-[#1D6076] font-medium hover:underline">Already have an account?</Link>
              </p>

              <div className="space-y-3 mb-6">
                {[
                  { id: 'google', label: 'Continue with Google', Icon: GoogleIcon },
                  { id: 'apple',  label: 'Continue with Apple',  Icon: AppleIcon  },
                ].map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    onClick={() => handleSocial(id)}
                    disabled={!!socialLoad || loading}
                    className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-2xl py-3.5 text-sm font-medium text-gray-800 hover:bg-gray-50 hover:border-gray-300 active:scale-[0.99] transition-all disabled:opacity-60"
                  >
                    {socialLoad === id ? <Loader2 size={18} className="animate-spin text-gray-500" strokeWidth={2} /> : <Icon />}
                    {label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-gray-400 text-xs font-medium">or</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              <button
                onClick={handleStep0Continue}
                className="w-full py-4 rounded-2xl text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-md hover:-translate-y-0.5 active:scale-[0.99] transition-all"
                style={{ background: 'linear-gradient(135deg, #1D6076 0%, #2a7a94 100%)' }}
              >
                Sign up with Email
                <ArrowRight size={16} strokeWidth={2.5} />
              </button>
            </>
          )}

          {/* Step 1 — Name, email, password */}
          {step === 1 && (
            <>
              <StepIndicator current={0} total={2} />
              <h1 className="text-2xl text-gray-900 mb-1.5" style={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
                Let&apos;s get started!
              </h1>
              <p className="text-gray-500 text-sm mb-6">Fill in your basic info to create your account.</p>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <InputField label="First name" placeholder="Basel" value={firstName} onChange={v => { setFirstName(v); setErrors(p => ({ ...p, firstName: '' })); }} error={errors.firstName} icon={User} />
                  <InputField label="Last name"  placeholder="Ahmed" value={lastName}  onChange={v => { setLastName(v);  setErrors(p => ({ ...p, lastName: '' }));  }} error={errors.lastName}  icon={User} />
                </div>
                <InputField label="Email" type="email" placeholder="you@example.com" value={email} onChange={v => { setEmail(v); setErrors(p => ({ ...p, email: '' })); }} error={errors.email} icon={Mail} />
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
              </div>

              <button
                onClick={handleStep1Next}
                className="w-full mt-6 py-4 rounded-2xl text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-md hover:-translate-y-0.5 active:scale-[0.99] transition-all"
                style={{ background: 'linear-gradient(135deg, #1D6076 0%, #2a7a94 100%)' }}
              >
                Continue
                <ArrowRight size={16} strokeWidth={2.5} />
              </button>
            </>
          )}

          {/* Step 2 — Phone & address */}
          {step === 2 && (
            <>
              <StepIndicator current={1} total={2} />
              <h1 className="text-2xl text-gray-900 mb-1.5" style={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
                Almost done!
              </h1>
              <p className="text-gray-500 text-sm mb-6">Add your contact details for smooth delivery.</p>

              <div className="space-y-4">
                <InputField label="Phone number" type="tel" placeholder="+20 1XX XXX XXXX" value={phone} onChange={v => { setPhone(v); setErrors(p => ({ ...p, phone: '' })); }} error={errors.phone} icon={Phone} />
                <InputField label="Home address (optional)" placeholder="Street, City" value={address} onChange={setAddress} icon={MapPin} />
              </div>

              <p className="text-xs text-gray-400 mt-4 leading-relaxed text-center">
                By creating an account you agree to our{' '}
                <span className="text-[#1D6076] cursor-pointer hover:underline">Terms of Service</span>
                {' '}and{' '}
                <span className="text-[#1D6076] cursor-pointer hover:underline">Privacy Policy</span>
              </p>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full mt-5 py-4 rounded-2xl text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-md hover:-translate-y-0.5 active:scale-[0.99] transition-all disabled:opacity-70"
                style={{ background: 'linear-gradient(135deg, #EBA050 0%, #d4832a 100%)' }}
              >
                {loading
                  ? <><Loader2 size={18} className="animate-spin" strokeWidth={2} /> Creating account…</>
                  : <><Check size={16} strokeWidth={2.5} /> Create My Account</>
                }
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Right: image ──────────────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #EBA050 0%, #d4832a 100%)' }}>
        <ImageWithFallback
          src={SIDE_IMG}
          alt="Happy customer"
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />
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

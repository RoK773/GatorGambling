import { useState } from 'react';

function InputField({ label, type = 'text', value, onChange, placeholder}){
    return (
        <div style={{ marginBottom: 18}}>
            <label style={{
                display: 'block', fontSize: 11, fontWeight: 600,
                color: 'var(--text-secondary)', marginBottom: 8,
                letterSpacing: '0.1em', textTransform: 'uppercase',
            }}>{label}</label>
            <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={{
                width: '100%', background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: 10, padding: '13px 16px',
                fontSize: 14, color: 'var(--text-primary)',
                transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
            onFocus={e => {
                e.target.style.borderColor = 'var(--accent)';
                e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)';
            }}
            onBlur={e => {
                e.target.style.borderColor = 'var(--border)';
                e.target.style.boxShadow = 'none';
            }}
            />
        </div>
    );
}

function AuthButton({ label, primary = false, onClick, disabled = false }){
    const [hover, setHover] = useState(false);
    return (
        <button onClick={onClick} disabled={disabled} onMouseEnter={() => !disabled && setHover(true)} onMouseLeave={() => setHover(false)} style={{
            width: '100%', padding: '14px',
            borderRadius: 10, fontWeight: 600, fontSize: 15,
            letterSpacing: '0.04em', 
            background: primary
                ? hover ? 'var(--accent-dim)' : 'var(--accent)'
                : hover ? 'var(--bg-card-hover)' : 'var(--bg-card)',
            color: primary? '#080A0F' : 'var(--text-primary)',
            border: primary? 'none' : '1px solid var(--border-bright)',
            transform: hover ? 'translateY(-1px)' : 'none',
            boxShadow: primary && hover ? '0 8px 24px var(--accent-glow-strong)' : 'none',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.7 : 1,
            transition: 'all 0.2s', 
        }}
        >{label}</button>
    );
}

export function LoginScreen({ onLogin, onBack, LogoComponent, isLoading = false, errorMessage = '' }){
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showForgotPassword, setShowForgotPassword] = useState(false);

    return(
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            position: 'relative',
            overflow: 'hidden',
            backgroundImage: "linear-gradient(135deg, rgba(8, 10, 15, 0.82), rgba(8, 10, 15, 0.68)), url('/images.jpeg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
        }}>
            <div style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(circle at top, rgba(198, 241, 53, 0.16), transparent 42%), linear-gradient(180deg, rgba(8, 10, 15, 0.15), rgba(8, 10, 15, 0.58))',
                pointerEvents: 'none',
            }} />
            <div style={{
                position: 'relative',
                zIndex: 1,
                maxWidth: 440,
                width: '100%',
                animation: 'slideUp 0.4s ease both',
            }}>
                <div style={{
                    background: 'rgba(8, 10, 15, 0.82)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: '0 24px 80px rgba(0, 0, 0, 0.45)',
                    borderRadius: 20,
                    padding: 28,
                    backdropFilter: 'blur(12px)',
                }}>
                    <LogoComponent onClick={onBack} style={{
                        marginBottom: 28,
                    }}/>
                    <h2 style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 38,
                        letterSpacing: '0.06em',
                        marginBottom: 8,
                    }}>WELCOME BACK</h2>
                    <p style={{
                        fontSize: 14,
                        color: 'rgba(240, 242, 247, 0.8)',
                        marginBottom: 28,
                    }}>Sign in to your account to continue</p>

                    <InputField label="Username" value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" />
                    <div style={{ marginBottom: 18 }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 12,
                            marginBottom: 8,
                        }}>
                            <label style={{
                                display: 'block',
                                fontSize: 11,
                                fontWeight: 600,
                                color: 'var(--text-secondary)',
                                letterSpacing: '0.1em',
                                textTransform: 'uppercase',
                            }}>Password</label>
                            <button
                                type="button"
                                onClick={() => setShowForgotPassword(true)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    padding: 0,
                                    color: 'var(--accent)',
                                    fontSize: 12,
                                    fontWeight: 600,
                                    textDecoration: 'underline',
                                    textUnderlineOffset: 2,
                                }}
                            >
                                Forgot Password?
                            </button>
                        </div>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Password"
                            style={{
                                width: '100%',
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border)',
                                borderRadius: 10,
                                padding: '13px 16px',
                                fontSize: 14,
                                color: 'var(--text-primary)',
                                transition: 'border-color 0.2s, box-shadow 0.2s',
                            }}
                            onFocus={e => {
                                e.target.style.borderColor = 'var(--accent)';
                                e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)';
                            }}
                            onBlur={e => {
                                e.target.style.borderColor = 'var(--border)';
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                    </div>
                    <div style={{
                        marginTop: 8,
                        marginBottom: 24,
                    }}>
                        <AuthButton label={isLoading ? 'SIGNING IN...' : 'SIGN IN'} primary disabled={isLoading} onClick={() => onLogin({ username, password })} />
                        {!!errorMessage && (
                            <p style={{
                                marginTop: 10,
                                color: 'var(--danger)',
                                fontSize: 13,
                                fontWeight: 600,
                            }}>{errorMessage}</p>
                        )}
                    </div>

                    <p style={{
                        textAlign: 'center',
                        fontSize:  13,
                        color: 'rgba(240, 242, 247, 0.78)',
                    }}> Don't have an account? {' '}
                    <button onClick={onBack} style={{
                        background: 'none',
                        color: 'var(--accent)',
                        fontWeight: 600,
                        fontSize: 13,
                    }}>Sign Up</button>
                    </p>
                </div>
            </div>
            {showForgotPassword && (
                <div onClick={() => setShowForgotPassword(false)} style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 1000,
                    background: 'rgba(0, 0, 0, 0.78)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 24,
                }}>
                    <div onClick={e => e.stopPropagation()} style={{
                        width: '100%',
                        maxWidth: 420,
                        background: 'rgba(8, 10, 15, 0.96)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 18,
                        padding: 18,
                        boxShadow: '0 24px 80px rgba(0,0,0,0.55)',
                        position: 'relative',
                    }}>
                        <button
                            type="button"
                            onClick={() => setShowForgotPassword(false)}
                            aria-label="Close forgot password popup"
                            style={{
                                position: 'absolute',
                                top: 12,
                                right: 12,
                                width: 34,
                                height: 34,
                                borderRadius: '50%',
                                border: '1px solid rgba(255,255,255,0.12)',
                                background: 'rgba(255,255,255,0.06)',
                                color: 'var(--text-primary)',
                                fontSize: 18,
                                lineHeight: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            ×
                        </button>
                        <h3 style={{
                            margin: 0,
                            marginBottom: 14,
                            fontFamily: 'var(--font-display)',
                            fontSize: 26,
                            letterSpacing: '0.06em',
                            textAlign: 'center',
                        }}>WHOMP WHOMP</h3>
                        <div style={{
                            borderRadius: 14,
                            overflow: 'hidden',
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: 'rgba(255,255,255,0.03)',
                        }}>
                            <img
                                src="/womp-womp-too-bad.gif"
                                alt="Womp womp gif"
                                style={{
                                    width: '100%',
                                    height: 'auto',
                                    display: 'block',
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export function SignUpScreen({ onSignUp, onBack, LogoComponent, isLoading = false, errorMessage = '' }) {
    const [form, setForm] = useState({username: '', password: '', email: '', dob: '', location: ''});
    const set = (key) => (e) => setForm(f => ({...f, [key]: e.target.value}));

    return(
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            position: 'relative',
            overflow: 'hidden',
            backgroundImage: "linear-gradient(135deg, rgba(8, 10, 15, 0.82), rgba(8, 10, 15, 0.68)), url('/images.jpeg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
        }}>
            <div style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(circle at top, rgba(198, 241, 53, 0.16), transparent 42%), linear-gradient(180deg, rgba(8, 10, 15, 0.15), rgba(8, 10, 15, 0.58))',
                pointerEvents: 'none',
            }} />
            <div style={{
                position: 'relative',
                zIndex: 1,
                maxWidth: 440,
                width: '100%',
                animation: 'slideUp 0.4s ease both',
            }}>
                <div style={{
                    background: 'rgba(8, 10, 15, 0.82)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: '0 24px 80px rgba(0, 0, 0, 0.45)',
                    borderRadius: 20,
                    padding: 28,
                    backdropFilter: 'blur(12px)',
                }}>
                <LogoComponent onClick={onBack} style={{
                    marginBottom: 28,
                }}/>
                <h2 style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 38,
                    letterSpacing: '0.06em',
                    marginBottom: 0,
                }}>JOIN THE ACTION</h2>
                <p style={{
                    fontSize: 14,
                    color: 'rgba(240, 242, 247, 0.8)',
                    marginBottom: 32,
                    }}>
                        Create your account and join the bask!
                    </p>
                    
                    <InputField label="Username" value={form.username} onChange={set('username')} placeholder="Username"/>
                    <InputField label="Password" type="password" value={form.password} onChange={set('password')} placeholder="Password"/>
                    <InputField label="Email" value={form.email} onChange={set('email')} placeholder="your@email.com"/>
                    <InputField label="Date of Birth" type="date" value={form.dob} onChange={set('dob')}/>
                    <InputField label="Location" value={form.location} onChange={set('location')} placeholder="Province, Country" />
                    <div style={{
                        marginTop: 8,
                    }}>
                        <AuthButton label={isLoading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'} primary disabled={isLoading} onClick={() => onSignUp(form)}/>
                        {!!errorMessage && (
                            <p style={{
                                marginTop: 10,
                                color: 'var(--danger)',
                                fontSize: 13,
                                fontWeight: 600,
                            }}>{errorMessage}</p>
                        )}
                    </div>
                    <p style={{
                        textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)', marginTop: 20}}>
                            Already have an account?{' '}
                            <button onClick={onBack} style={{
                                background: 'none', color: 'var(--accent)', fontWeight: 600, fontSize: 13,
                            }}>Sign In</button>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function AuthPage() {
    return null;
}

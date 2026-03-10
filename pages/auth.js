import { useState } from 'react';

function InputField({ label, type = 'text', value, onChange, placeholder}){
    return (
        <div style={{ marginBottom: 18}}>
            <label style={{
                display: 'block', fontSize: 11, fontWeight: 60,
                color: 'var(--text-secondary', marignBottom: 8,
                letterSpacing: '0.1em', textTransform: 'uppercase',
            }}>{label}</label>
            <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={{
                width: '100%', background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: 10, padding: '13px 16px',
                fontsize: 14, color: 'var(--text-primary)',
                transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
            onFocus={e => {
                e.target.style.borderColor = 'var(--acent)';
                e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)';
            }}
            onblur={e => {
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
    return(
        <div style={{
            minHeight: '100vh', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
            <div style={{
                maxWidth: 400, width: '100%', animation: 'slideUp 0.4s ease both',
            }}>
                <LogoComponent onClick={onBack} style={{
                    marginBottom: 40,
                }}/>
                <h2 style={{
                    fontFamily: 'var(--font-display)', fontSize: 38,
                    letterSpacing: '0.06em', marginBottom: 8,
                }}>WELCOME BACK</h2>
                <p style={{
                    fontSize: 14, color: 'var(--text-secondary)', marginBottom: 32,
                }}>Sign in to your account to continue</p>

                <InputField label="Username" value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" />
                <InputField label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
                <div style={{
                    marginTop: 8, marginBottom: 24,
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
                    textAlign: 'center', fontSize:  13, color: 'var(--text-secondary)',
                }}> Don't have an account? {' '}
                <button onClick={onBack} style={{
                    background: 'none', color: 'var(--accent)',
                    fontWeight: 600, fontSize: 13,
                }}>Sign Up</button>
                </p>
            </div>
        </div>
    );
}

export function SignUpScreen({ onSignUp, onBack, LogoComponent, isLoading = false, errorMessage = '' }) {
    const [form, setForm] = useState({username: '', password: '', email: '', dob: '', location: ''});
    const set = (key) => (e) => setForm(f => ({...f, [key]: e.target.value}));

    return(
        <div style={{
            minHeight: '100vh', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
            <div style={{
                maxWidth: 400, width: '100%', animation: 'slideUp 0.4s ease both',
            }}>
                <LogoComponent onClick={onBack} style={{
                    marginBottom: 40,
                }}/>
                <h2 style={{
                    fontFamily: 'var(--font-display)', fontSize: 38,
                    letterSpacing: '0.06em', marginBottom: 0,
                }}>JOIN THE ACTION</h2>
                <p style={{
                    fontSize: 14, color: 'var(--text-secondary)', marginBottom: 32,
                    }}>
                        Create your account and join the bask!
                    </p>
                    
                    <InputField label="Username" value={form.username} onChange={set('username')} placeholder="Username"/>
                    <InputField label="Password" value={form.password} onChange={set('password')} placeholder="Password"/>
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
    );
}

export default function AuthPage() {
    return null;
}

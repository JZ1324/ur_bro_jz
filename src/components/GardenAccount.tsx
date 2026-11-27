import { useEffect, useState } from 'react';
import { ArrowRight, Check, Fish, Flower2, LogOut, Mail, UserRound } from 'lucide-react';
import { useGardenAccount } from '../account/AccountProvider';
import { EditorialDialog } from './EditorialDialog';
import './account.css';

export function GardenAccountButton() {
  const account = useGardenAccount();
  return <div className="garden-account">
    <button className="garden-account-button" type="button" disabled={account.busy} onClick={() => void account.startSignIn()} aria-label={account.user ? `Your garden account, ${account.user.name}` : 'Sign in to the garden'}>
      <UserRound size={14} strokeWidth={1.5} /><span>{account.busy ? 'Connecting…' : account.user ? account.user.name : 'Sign in'}</span>
      {account.user && account.ready && <i aria-label="Account connected" />}
    </button>
  </div>;
}

export function GardenAccountDialog() {
  const account = useGardenAccount();
  const [email, setEmail] = useState(() => account.challenge?.email ?? ''), [name, setName] = useState(''), [code, setCode] = useState('');
  const [enterCode, setEnterCode] = useState(!!account.challenge);
  useEffect(() => {
    if (account.challenge) { setEmail(account.challenge.email); setCode(''); setEnterCode(true); }
    else { setCode(''); setEnterCode(false); }
  }, [account.challenge]);
  const signedIn = account.user && account.ready;
  return <EditorialDialog open={account.signInOpen} onClose={account.closeSignIn} title="Your garden account" className="garden-account-dialog">
    <p className="account-eyebrow"><Flower2 size={15} />Your garden account</p>
    <h2>{signedIn ? <>Hello, <em>{account.user!.name}.</em></> : enterCode ? <>Check<br /><em>your inbox.</em></> : <>Take your garden<br /><em>with you.</em></>}</h2>
    <p className="account-description">{signedIn ? 'Your fish and plantings are saved to your garden account. Sign in on another device to find them here.' : enterCode ? <>Enter the sign-in code sent to <strong>{email}</strong>. It’s valid for ten minutes.</> : 'Sign in to save your fish and plants across devices. Your collection from this device will be added to your account.'}</p>
    {signedIn && <div className="account-collection"><span><Fish size={18} /><strong>{Object.values(account.ocean.fish).reduce((sum, n) => sum + n, 0)}</strong> fish</span><span><Flower2 size={18} /><strong>{account.plants.length}</strong> plantings</span></div>}
    {account.error && <p className="account-error" role="alert">{account.error}</p>}
    {signedIn ? <>
      <p className="account-connected"><Check size={14} />Your garden is saved</p>
      <button className="account-signout" disabled={account.busy} onClick={async () => { await account.signOut(); account.closeSignIn(); }}><LogOut size={14} />Sign out of the garden</button>
    </> : <>
      <form className="account-form" aria-busy={account.busy} onSubmit={event => { event.preventDefault(); if (enterCode) void account.verifyCode(code); else void account.sendCode(email, name); }}>
        {enterCode ? <label htmlFor="garden-sign-in-code">Sign-in code<input id="garden-sign-in-code" type="text" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={event => setCode(event.target.value.replace(/\D/g, '').slice(0, 10))} pattern="[0-9]{6,10}" minLength={6} maxLength={10} placeholder="Your email code" required disabled={account.busy} /></label> : <>
          <label htmlFor="garden-sign-in-name">Your name <small>for new accounts</small><input id="garden-sign-in-name" type="text" autoComplete="nickname" value={name} onChange={event => setName(event.target.value)} maxLength={32} placeholder="A name for your plantings" disabled={account.busy} /></label>
          <label htmlFor="garden-sign-in-email">Email address<input id="garden-sign-in-email" type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} maxLength={254} placeholder="you@example.com" required disabled={account.busy} /></label>
        </>}
        <button type="submit" className="account-signin" disabled={account.busy}>{account.busy ? 'Connecting…' : enterCode ? 'Open my garden' : <><Mail size={15} />Send a sign-in code</>}<ArrowRight size={16} /></button>
        <p className="account-privacy">No password to remember. Your email stays private.</p>
      </form>
      {enterCode && <button className="account-retry" disabled={account.busy} onClick={() => { setCode(''); setEnterCode(false); }}>Change email or request another code</button>}
      <button className="account-signout" disabled={account.busy} onClick={async () => { if (!account.ready || account.user) await account.signOut(); account.closeSignIn(); }}>Continue as a guest</button>
    </>}
    {account.error && account.user && <button className="account-retry" disabled={account.busy} onClick={() => void account.refresh()}>Retry connection</button>}
  </EditorialDialog>;
}

export function GardenAccountNote({ storageAvailable = true }: { storageAvailable?: boolean }) {
  const account = useGardenAccount();
  return <div className={`ocean-account-note${account.user ? ' is-connected' : ''}`}>
    <span>{account.user || storageAvailable ? <Check size={14} /> : <UserRound size={14} />}
      {account.user ? account.ready ? `Saved with ${account.user.name} · Garden account` : 'Reconnect to save your next catch' : storageAvailable ? 'Saved on this device' : 'Kept for this visit'}</span>
    {!account.user && <button disabled={account.busy} onClick={() => void account.startSignIn()}>Sync across devices<ArrowRight size={13} /></button>}
    {account.error && <p role="alert">{account.error} <button onClick={() => void account.refresh()}>Retry</button></p>}
  </div>;
}

import React, { useEffect, useRef, useState } from 'react';
import { homeBody, footerBody } from './home';
import { pages } from './pages';
import { runDemo, initPage } from './demoRun';
import logoUrl from './assets/logo.png';
import './style.css';

const links: [string, string][] = [['about', 'About'], ['services', 'Services'], ['industries', 'Industries'], ['resources', 'Resources'], ['faq', 'FAQ'], ['contact', 'Contact']];
const route = () => { const m = location.hash.match(/^#\/([\w-]+)/); return m && pages[m[1]] ? m[1] : 'home'; };

export function App() {
    const [r, setR] = useState(route());
    useEffect(() => { const cleanup = runDemo(); const f = () => { setR(route()); window.scrollTo(0, 0); }; window.addEventListener('hashchange', f); return () => { cleanup(); window.removeEventListener('hashchange', f); }; }, []);
    const main = useRef<HTMLElement>(null), first = useRef(true);
    useEffect(() => {
        (window as any).__snaxPaused = r !== 'home'; window.dispatchEvent(new Event('snaxvisibility')); initPage();
        const label = links.find(([k]) => k === r)?.[1];
        document.title = label ? label + ' | SnaxSmart Demo' : 'SnaxSmart Demo'; // unique title per route
        if (!first.current) main.current?.focus({ preventScroll: true }); // move focus on navigation, not on first load
        first.current = false;
    }, [r]);
    // Native validation runs first; this only fires for a valid submit.
    const submit = (e: React.FormEvent) => {
        const f = (e.target as Element).closest?.('.demo-form') as HTMLFormElement | null;
        if (!f) return;
        e.preventDefault();
        const miss = Array.from(f.querySelectorAll<HTMLInputElement>('[required]')).find(x => !x.value.trim());
        if (miss) { miss.focus(); return; }
        const status = f.querySelector<HTMLElement>('.demo-status')!;
        Array.from(f.children).forEach(c => { (c as HTMLElement).hidden = c !== status; });
        status.innerHTML = '<h3>Thanks! This is a demo form.</h3><p>Nothing was sent. This is an unofficial design demo.</p>';
        status.tabIndex = -1; status.focus();
    };
    return (
        <div className="demo-root" onSubmit={submit}>
            <button type="button" className="skip-link" onClick={() => main.current?.focus()}>Skip to content</button>
            <nav className="nav" aria-label="Main navigation">
                <a className="lg" href="#/"><img src={logoUrl} alt="" />SnaxSmart</a>
                <div className="nl">{links.map(([k, t]) => <a key={k} href={'#/' + k} className={r === k ? 'on' : ''} aria-current={r === k ? 'page' : undefined}>{t}</a>)}</div>
                <a className="btn sm" href="tel:+919880798807">Call +91 98807 98807</a>
            </nav>
            <main id="main" ref={main} tabIndex={-1}>
                <div style={{ display: r === 'home' ? 'block' : 'none' }} dangerouslySetInnerHTML={{ __html: homeBody }} />
                {r !== 'home' && <div className="pg" key={r} dangerouslySetInnerHTML={{ __html: pages[r] }} />}
            </main>
            <div dangerouslySetInnerHTML={{ __html: footerBody }} />
        </div>
    );
}

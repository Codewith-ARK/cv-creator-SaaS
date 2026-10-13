"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@carbon/react";
import { Add, ArrowRight, ArrowUpRight, Catalog, Checkmark, Document, Download, Edit, Folder, Growth } from "@carbon/react/icons";
import { Brand } from "@/components/Folio";

function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current; if (!element) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { element.classList.add("is-visible"); return; }
    const observer = new IntersectionObserver((entries) => { if (entries[0].isIntersecting) { element.classList.add("is-visible"); observer.disconnect(); } }, { threshold: .08 });
    observer.observe(element); return () => observer.disconnect();
  }, []);
  return <div ref={ref} className={"reveal " + className}>{children}</div>;
}
const directions = [
  { label: "Product design", headline: "Product Designer", summary: "I turn complex problems into thoughtful, useful products. My work connects research, clear interfaces and teams that care about the people they serve.", highlight: "Led the redesign of a community banking app, from early interviews to a clearer everyday experience.", skills: ["Product thinking", "Interaction design", "User research"] },
  { label: "Design leadership", headline: "Design Lead", summary: "I help teams find clarity, build confidence and do their best work. I bring a hands-on design background and a collaborative approach to leading people.", highlight: "Helped a team of five designers develop a shared process for research, critique and delivery.", skills: ["Team leadership", "Design strategy", "Facilitation"] },
  { label: "Research", headline: "UX Researcher", summary: "I make space for the people behind the product. I connect careful listening with practical insights that help teams make better decisions.", highlight: "Planned and led interviews with first-time banking customers to understand what confidence looks like.", skills: ["Qualitative research", "Synthesis", "Interviewing"] },
];
function CareerDemo() {
  const [direction, setDirection] = useState(0);
  const [included, setIncluded] = useState(["summary", "project", "skills"]);
  const selected = directions[direction];
  function toggle(key: string) { setIncluded((items) => items.includes(key) ? items.filter((item) => item !== key) : [...items, key]); }
  return <div className="career-demo"><div className="demo-controls"><div className="demo-window-label"><Catalog size={20}/><span>A sample career library</span></div>
    <h3>Meet Amara.<br/>Three paths. One story.</h3><p>Choose a direction, then pick the details that belong in this version.</p>
    <fieldset className="demo-role-choice"><legend>What comes next?</legend>{directions.map((item, index) => <button key={item.label} aria-pressed={direction === index} onClick={() => setDirection(index)} className={direction === index ? "selected" : ""}>{item.label}{direction === index ? <Checkmark size={18}/> : <ArrowUpRight size={18}/>}</button>)}</fieldset>
    <div className="demo-details"><span className="demo-detail-label">Make it your own</span>{[{ key: "summary", label: "A personal summary", icon: Edit }, { key: "project", label: "A project to be proud of", icon: Folder }, { key: "skills", label: "Skills that fit the role", icon: Growth }].map(({ key, label, icon: Icon }) => <button key={key} className={included.includes(key) ? "included" : ""} onClick={() => toggle(key)} aria-pressed={included.includes(key)}><Icon size={20}/><span>{label}</span>{included.includes(key) ? <Checkmark size={18}/> : <Add size={18}/>}</button>)}</div>
    <p className="demo-status" role="status">{selected.headline} CV · {included.length + 1} details selected</p>
  </div><div className="demo-preview"><div className="demo-preview-toolbar"><span>YOUR VERSION</span><span>Folio Paper / A4</span></div><article className="sample-paper" key={direction}>
    <header><h3>Amara Shah</h3><p>{selected.headline}</p><span>London, UK · amara@example.com</span></header>
    {included.includes("summary") && <section><h4>A little about me</h4><p>{selected.summary}</p></section>}
    <section><h4>Experience</h4><div className="sample-experience"><strong>Product Designer</strong><span>2022 — Present</span></div><p className="sample-company">Common Ground Studio · London</p><p>{selected.highlight}</p></section>
    {included.includes("project") && <section><h4>Selected project</h4><strong>A more welcoming way to bank</strong><p>Made everyday banking easier to understand, with a focus on clear language and accessible design.</p></section>}
    {included.includes("skills") && <section><h4>What I bring</h4><div className="sample-skills">{selected.skills.map((skill) => <span key={skill}>{skill}</span>)}</div></section>}
    <span className="sample-page-number">01</span>
  </article><p className="demo-preview-note">Try the controls. Your preview changes with every choice.</p></div></div>;
}

export default function LandingPage() {
  return <div className="landing-page"><a className="skip-link" href="#landing-main">Skip to content</a>
    <header className="landing-nav"><Brand/><nav aria-label="Main navigation"><Link href="#how-it-works">How it works</Link><Link href="#try-folio">Try it out</Link></nav><div className="landing-nav-actions"><Button href="/" kind="ghost" size="sm">Sign in</Button><Button href="/?signup=1" size="sm" renderIcon={ArrowUpRight}>Get started</Button></div></header>
    <main id="landing-main"><section className="landing-hero"><div className="hero-copy"><p className="small-label">FOR YOUR NEXT CHAPTER</p><h1>Your story.<br/><span>Your next chapter.</span></h1><p className="hero-description">Keep your experience in one place. Create thoughtful CVs for wherever you're heading.</p><div className="hero-actions"><Button href="/?signup=1" renderIcon={ArrowRight}>Create your first CV</Button><a href="#try-folio" className="text-action">Take a closer look <ArrowUpRight size={20}/></a></div></div><figure className="hero-photograph"><img src="/images/career-desk.png" alt="A woman reflecting on her career and writing notes by a sunny window" fetchPriority="high"/></figure></section>
      <div className="landing-benefits"><span><Catalog size={22}/>A home for your experience</span><span><Document size={22}/>A CV for every opportunity</span><span><Download size={22}/>A PDF, ready to share</span></div>
      <section className="landing-demo-section" id="try-folio"><Reveal><div className="landing-section-copy"><h2>A new direction.<br/>Still very much you.</h2><p>Your experience doesn't change with every application. The details you choose can. Give it a try.</p></div><CareerDemo/></Reveal></section>
      <section className="landing-workflow" id="how-it-works"><Reveal className="workflow-layout"><div className="workflow-copy"><h2>Less starting over.<br/>More moving forward.</h2><p>Your career has a lot of moving parts. Folio gives them a little order, and you a little breathing room.</p><Link href="/?signup=1" className="text-action">Find your starting point <ArrowRight size={20}/></Link></div>
        <ol className="workflow-steps"><li><span className="workflow-step-icon"><Catalog size={28}/></span><div><h3>Keep the details that matter.</h3><p>Save roles, projects, education and achievements as reusable career details. Add to your library as you grow.</p></div></li><li><span className="workflow-step-icon"><Edit size={28}/></span><div><h3>Tell the story for this opportunity.</h3><p>Choose the details that fit. Arrange your sections, tailor the role and watch your document take shape.</p></div></li><li><span className="workflow-step-icon"><Download size={28}/></span><div><h3>Put yourself out there.</h3><p>Preview and download the same clean PDF. Keep this version, then build another when the next possibility arrives.</p></div></li></ol>
      </Reveal></section>
      <section className="landing-closing"><Reveal><div className="closing-content"><p>You don't have to have it all figured out.</p><h2>Start with what<br/>you've already done.</h2><Button href="/?signup=1" renderIcon={ArrowRight}>Make room for what's next</Button><span className="closing-footnote">Your experience is worth keeping.</span></div></Reveal></section>
    </main><footer className="landing-footer"><div><Brand/><p>A home for your next chapter.</p></div><div className="landing-footer-links"><Link href="#how-it-works">How it works</Link><Link href="/">Your workspace <ArrowUpRight size={16}/></Link></div><span>Made for real careers, still in progress.</span></footer>
  </div>;
}


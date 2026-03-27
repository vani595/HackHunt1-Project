import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck, Users2, Workflow } from "lucide-react";
import WhyChooseHackHunt from "../components/WhyChooseHackHunt";
import heroImage from "../assets/hero.png";

const roleCards = [
  {
    title: "For Participants",
    description: "Browse approved hackathons from your dashboard, register faster, and keep track of active events in one place.",
    cta: "Go to User Login",
    to: "/login-user",
    badge: "text-cyan-300",
    accent: "from-cyan-500/20 to-blue-400/10"
  },
  {
    title: "For Organizers",
    description: "Create hackathons, submit them for review, and manage event updates from a cleaner organizer workflow.",
    cta: "Go to Organizer Login",
    to: "/login-organizer",
    badge: "text-amber-300",
    accent: "from-amber-500/20 to-orange-400/10"
  },
  {
    title: "For Admins",
    description: "Approve submissions, manage users, and monitor platform activity from the admin dashboard.",
    cta: "Go to Admin Login",
    to: "/login-admin",
    badge: "text-rose-300",
    accent: "from-rose-500/20 to-fuchsia-400/10"
  }
];

const steps = [
  {
    icon: Workflow,
    title: "Organizers submit events",
    description: "Hackathons are created inside HackHunt and routed through a structured approval flow before they go live."
  },
  {
    icon: ShieldCheck,
    title: "Admins review quality",
    description: "The admin dashboard approves, rejects, and tracks platform activity so only verified events reach users."
  },
  {
    icon: Users2,
    title: "Users discover and register",
    description: "Participants see approved hackathons inside the dashboard only, keeping the landing page focused and clean."
  }
];

const Home = () => {
  return (
    <div className="min-h-screen bg-[#0b0a14] text-white">
      <section id="explore" className="relative overflow-hidden border-b border-white/8">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:112px_112px] opacity-35" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_40%,rgba(244,63,94,0.18),transparent_18%),radial-gradient(circle_at_54%_52%,rgba(34,211,238,0.15),transparent_22%),radial-gradient(circle_at_82%_24%,rgba(139,92,246,0.24),transparent_26%),linear-gradient(180deg,#0d0a18_0%,#0b0a14_100%)]" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>

        <div className="relative mx-auto max-w-[1380px] px-6 py-16 sm:py-20 lg:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
            <div className="max-w-3xl">
              <h1 className="max-w-4xl text-5xl font-black leading-[0.92] tracking-[-0.06em] text-white sm:text-6xl lg:text-[7rem]">
                Discover
                <span className="mt-2 block bg-gradient-to-r from-violet-300 via-blue-300 to-cyan-300 bg-clip-text text-transparent">
                  Hackathons
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-9 text-slate-300 sm:text-xl">
                Enter HackHunt through a sharper front page, then move into role-based dashboards where the real hackathon workflow stays live, useful, and connected.
              </p>

              <p className="mt-8 text-lg font-semibold uppercase tracking-[0.26em] text-slate-500">
                Build. Compete. Win.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  to="/login-user"
                  className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-violet-600 to-blue-500 px-8 py-4 text-base font-semibold text-white shadow-[0_18px_50px_rgba(99,102,241,0.35)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_60px_rgba(99,102,241,0.45)]"
                >
                  Explore Hackathons
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link
                  to="/signup-organizer"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-8 py-4 text-base font-semibold text-slate-200 transition duration-300 hover:border-white/20 hover:bg-white/[0.06]"
                >
                  Create as Organizer
                </Link>
              </div>
            </div>

            <div className="relative min-h-[520px] sm:min-h-[620px] lg:min-h-[760px]">
              <div className="absolute right-0 top-2 h-[30rem] w-[30rem] rounded-full bg-violet-500/15 blur-3xl" />
              <div className="absolute bottom-8 left-4 h-[24rem] w-[24rem] rounded-full bg-cyan-400/10 blur-3xl" />

              <div className="absolute inset-x-0 top-1/2 mx-auto w-full max-w-[54rem] -translate-y-1/2 rounded-[2.5rem] border border-white/10 bg-white/[0.05] p-4 shadow-[0_24px_80px_rgba(2,6,23,0.45)] backdrop-blur-xl sm:p-6 lg:max-w-[60rem] lg:p-7">
                <div className="rounded-[2rem] bg-[linear-gradient(135deg,rgba(91,33,182,0.22),rgba(15,23,42,0.65),rgba(34,211,238,0.16))] p-4 sm:p-5 lg:p-6">
                  <img
                    src={heroImage}
                    alt="Hackathon participants collaborating around laptops"
                    className="h-auto w-full rounded-[1.6rem] object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="for-organizers" className="relative py-10 sm:py-12">
        <div className="mx-auto max-w-screen-xl px-6">
          <div className="grid gap-5 lg:grid-cols-3">
            {roleCards.map((item) => (
              <article
                key={item.title}
                className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-6 shadow-[0_18px_55px_rgba(2,6,23,0.28)] transition duration-300 hover:-translate-y-1"
              >
                <div className={`inline-flex rounded-full bg-gradient-to-r px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${item.accent} ${item.badge}`}>
                  Role
                </div>
                <h3 className="mt-5 text-2xl font-bold tracking-tight text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-300">{item.description}</p>
                <Link to={item.to} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white">
                  {item.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <WhyChooseHackHunt />

      <section id="how-it-works" className="relative bg-[#0d0c18] py-10 sm:py-14">
        <div className="mx-auto max-w-screen-xl px-6">
          <div className="rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-8 shadow-[0_24px_80px_rgba(2,6,23,0.35)] backdrop-blur sm:p-10">
            <div className="max-w-3xl">
              <div className="inline-flex rounded-full bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">
                How It Works
              </div>
              <h2 className="mt-5 text-4xl font-bold tracking-[-0.04em] text-white sm:text-5xl">
                Everything you need to compete and win
              </h2>
              <p className="mt-4 text-base leading-8 text-slate-300 sm:text-lg">
                The homepage introduces the platform clearly. The real hackathon data and actions stay inside role-specific dashboards where they belong.
              </p>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              {steps.map((step) => {
                const Icon = step.icon;
                return (
                  <article
                    key={step.title}
                    className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_12px_32px_rgba(2,6,23,0.24)] transition duration-300 hover:-translate-y-1 hover:bg-white/[0.06]"
                  >
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 text-white shadow-md">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-5 text-xl font-semibold tracking-tight text-white">{step.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-300">{step.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/8 bg-[#0a0912] pb-16 pt-8 sm:pb-20">
        <div className="mx-auto max-w-screen-xl px-6">
          <div className="rounded-[34px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.18),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-8 shadow-[0_22px_70px_rgba(2,6,23,0.35)] sm:p-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <h2 className="text-3xl font-bold tracking-[-0.04em] text-white sm:text-4xl">
                  Ready to get started?
                </h2>
                <p className="mt-3 text-base leading-8 text-slate-300">
                  Sign in to your role-specific dashboard and move from discovery into action without exposing dashboard data on the public homepage.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <Link
                  to="/signup-user"
                  className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-violet-600 to-blue-500 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_18px_50px_rgba(99,102,241,0.35)] transition hover:-translate-y-0.5"
                >
                  Sign up as User
                </Link>
                <Link
                  to="/signup-organizer"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-3.5 text-sm font-semibold text-slate-100 transition hover:bg-white/[0.06]"
                >
                  Sign up as Organizer
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

import { Link } from 'react-router-dom';
import { CategoryNav } from '../components/layout/CategoryNav';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import {
  CheckCircle,
  Users,
  BarChart3,
  Zap,
  Star,
  ArrowRight,
  Shield,
  Globe,
} from 'lucide-react';

const FEATURES = [
  {
    icon: Zap,
    title: 'Lightning Fast',
    description:
      'Streamline your decisions and tasks with an intuitive workflow that adapts to how you work.',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description:
      'Bring your entire team together. Assign tasks, track progress, and celebrate wins — all in one place.',
  },
  {
    icon: BarChart3,
    title: 'Insightful Analytics',
    description:
      'Get real-time visibility into performance metrics, completion rates, and team productivity trends.',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description:
      'Bank-grade encryption, SSO integration, and granular role-based access controls keep your data safe.',
  },
  {
    icon: Globe,
    title: 'Works Anywhere',
    description:
      'Fully responsive across desktop, tablet, and mobile. Offline mode keeps you productive on the go.',
  },
  {
    icon: CheckCircle,
    title: 'Smart Automation',
    description:
      'Automate repetitive tasks with powerful rules. Focus on what matters — let UpToU handle the rest.',
  },
];

const STATS = [
  { value: '50,000+', label: 'Active Users' },
  { value: '2.4M', label: 'Tasks Completed' },
  { value: '99.9%', label: 'Uptime SLA' },
  { value: '4.9 / 5', label: 'Average Rating' },
];

const TESTIMONIALS = [
  {
    name: 'Sarah Chen',
    role: 'Head of Product, Nexora Inc.',
    avatar: 'SC',
    content:
      'UpToU transformed how our 40-person team collaborates. We cut our weekly planning meetings in half and ship twice as fast.',
  },
  {
    name: 'Marcus Webb',
    role: 'CTO, BlueShift Labs',
    avatar: 'MW',
    content:
      "I've tried every productivity tool out there. UpToU is the first one that actually stuck. The analytics alone are worth it.",
  },
  {
    name: 'Priya Nair',
    role: 'Operations Lead, Clearbridge',
    avatar: 'PN',
    content:
      'Our remote team spans 8 time zones. UpToU keeps everyone aligned without the usual coordination chaos.',
  },
];

export function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <span className="text-xl font-bold tracking-tight">UpToU</span>
          <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground sm:flex">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#testimonials" className="hover:text-foreground transition-colors">Testimonials</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          </nav>
          <Link to="/login">
            <Button size="sm">Sign In</Button>
          </Link>
        </div>
      </header>

      <CategoryNav />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 sm:py-32">
        <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary mb-6">
          Now in Public Beta
        </span>
        <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
          The smarter way to{' '}
          <span className="text-primary">get things done</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          UpToU brings your tasks, team, and insights together in one beautifully simple workspace.
          Stop switching tabs — start shipping.
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link to="/login">
            <Button size="lg" className="gap-2 px-8">
              Get Started Free <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <a href="#features">
            <Button size="lg" variant="outline" className="px-8">
              See How It Works
            </Button>
          </a>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y bg-muted/40">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px px-4 sm:grid-cols-4 sm:px-6">
          {STATS.map(({ value, label }) => (
            <div key={label} className="flex flex-col items-center py-10">
              <span className="text-3xl font-extrabold sm:text-4xl">{value}</span>
              <span className="mt-1 text-sm text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything your team needs
          </h2>
          <p className="mt-4 text-muted-foreground">
            Powerful features designed to remove friction and keep your team in flow.
          </p>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <Card key={title} className="border hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="border-t bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Loved by teams worldwide
            </h2>
            <p className="mt-4 text-muted-foreground">
              Don't take our word for it — hear from the people using UpToU every day.
            </p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TESTIMONIALS.map(({ name, role, avatar, content }) => (
              <Card key={name} className="border">
                <CardContent className="p-6 flex flex-col gap-4">
                  <div className="flex gap-0.5 text-yellow-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">"{content}"</p>
                  <div className="flex items-center gap-3 mt-auto pt-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
                      {avatar}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{name}</p>
                      <p className="text-xs text-muted-foreground">{role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing teaser */}
      <section id="pricing" className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 sm:py-28">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Simple, transparent pricing
        </h2>
        <p className="mt-4 text-muted-foreground">
          Free forever for individuals. Upgrade when your team is ready.
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-3 text-left">
          {[
            {
              plan: 'Starter',
              price: 'Free',
              period: 'forever',
              features: ['Up to 3 projects', '5 team members', 'Basic analytics', 'Email support'],
              cta: 'Get Started',
              highlight: false,
            },
            {
              plan: 'Pro',
              price: '$12',
              period: 'per user / month',
              features: ['Unlimited projects', '25 team members', 'Advanced analytics', 'Priority support', 'Automations'],
              cta: 'Start Free Trial',
              highlight: true,
            },
            {
              plan: 'Enterprise',
              price: 'Custom',
              period: 'contact us',
              features: ['Unlimited everything', 'SSO & SAML', 'Custom integrations', 'Dedicated CSM', 'SLA guarantee'],
              cta: 'Contact Sales',
              highlight: false,
            },
          ].map(({ plan, price, period, features, cta, highlight }) => (
            <Card
              key={plan}
              className={`border ${highlight ? 'border-primary ring-2 ring-primary shadow-lg' : ''}`}
            >
              <CardContent className="p-6 flex flex-col gap-4 h-full">
                {highlight && (
                  <span className="self-start rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                    Most Popular
                  </span>
                )}
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">{plan}</p>
                  <p className="mt-1 text-3xl font-extrabold">{price}</p>
                  <p className="text-xs text-muted-foreground">{period}</p>
                </div>
                <ul className="space-y-2 flex-1">
                  {features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/login" className="mt-4">
                  <Button
                    className="w-full"
                    variant={highlight ? 'default' : 'outline'}
                  >
                    {cta}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="border-t bg-primary text-primary-foreground">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to level up your team?
          </h2>
          <p className="mt-4 text-primary-foreground/80">
            Join 50,000+ teams already using UpToU to do their best work.
          </p>
          <Link to="/login">
            <Button
              size="lg"
              variant="secondary"
              className="mt-8 gap-2 px-10"
            >
              Start for Free <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/20">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 py-8 text-center text-sm text-muted-foreground sm:flex-row sm:justify-between sm:px-6 sm:text-left">
          <span className="font-semibold text-foreground">UpToU</span>
          <span>© {new Date().getFullYear()} UpToU, Inc. All rights reserved.</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

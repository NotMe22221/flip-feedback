import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { Navigation } from '@/components/Navigation';
import { Activity, Brain, Mic, Clock, Upload, Sparkles, Target, Check, X } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in-up');
          entry.target.classList.add('opacity-100');
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    if (featuresRef.current) {
      const featureCards = featuresRef.current.querySelectorAll('.feature-card');
      featureCards.forEach((card) => {
        card.classList.add('opacity-0');
        observer.observe(card);
      });
    }

    if (stepsRef.current) {
      const stepCards = stepsRef.current.querySelectorAll('.step-card');
      stepCards.forEach((card) => {
        card.classList.add('opacity-0');
        observer.observe(card);
      });
    }

    if (ctaRef.current) {
      ctaRef.current.classList.add('opacity-0');
      observer.observe(ctaRef.current);
    }

    return () => observer.disconnect();
  }, []);
  const features = [
    {
      icon: Activity,
      title: 'MediaPipe Pose Detection',
      description: 'Advanced 33-landmark pose analysis powered by Google\'s MediaPipe technology for precise movement tracking.',
    },
    {
      icon: Brain,
      title: 'AI-Powered Scoring',
      description: 'Get instant feedback on your routine with AI that analyzes posture, stability, and smoothness.',
    },
    {
      icon: Mic,
      title: 'Voice Coaching',
      description: 'Interactive voice coach powered by ElevenLabs provides personalized feedback and guidance.',
    },
    {
      icon: Clock,
      title: 'Session History',
      description: 'Track your progress over time with detailed session history and performance analytics.',
    },
  ];

  const steps = [
    {
      number: '01',
      title: 'Upload Your Routine',
      description: 'Upload a video or image of your gymnastics routine for instant analysis.',
      icon: Upload,
    },
    {
      number: '02',
      title: 'AI Analysis',
      description: 'Our AI analyzes your pose, identifies key landmarks, and evaluates your performance.',
      icon: Sparkles,
    },
    {
      number: '03',
      title: 'Get Feedback',
      description: 'Receive detailed scores, feedback, and personalized coaching to improve your technique.',
      icon: Target,
    },
  ];

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      <Navigation />

      {/* Hero Section */}
      <section ref={heroRef} className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 animate-fade-in-up px-4">
            The #1 AI Routine Coach
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-foreground/80 mb-8 max-w-3xl mx-auto animate-fade-in-up px-4" style={{ animationDelay: '0.1s' }}>
            Transform your gymnastics with AI-powered pose analysis, instant feedback, and personalized coaching
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up px-4" style={{ animationDelay: '0.2s' }}>
            <Link to="/auth" className="w-full sm:w-auto">
              <Button size="lg" className="gradient-primary glow-blue text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 h-auto w-full sm:w-auto">
                Start Free Trial
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 h-auto w-full sm:w-auto border-2 border-primary/50 hover:border-primary hover:bg-primary/10">
              Watch Demo
            </Button>
          </div>

          {/* Demo Video */}
          <div className="mt-12 sm:mt-16 animate-fade-in-up px-4" style={{ animationDelay: '0.3s' }}>
            <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto glow-blue">
              <div className="aspect-video rounded-lg overflow-hidden">
                <iframe
                  src="https://www.loom.com/embed/f2cd374e502d4caf8890c65b424b3b4e?sid=5e2e3b8a-3a9e-4f7f-8c9a-1b3f8e5a9c2d"
                  frameBorder="0"
                  allowFullScreen
                  className="w-full h-full"
                  title="AI Routine Coach Demo"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" ref={featuresRef} className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Powerful Features
            </h2>
            <p className="text-lg sm:text-xl text-foreground/80 max-w-2xl mx-auto">
              Everything you need to analyze and improve your gymnastics routines
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={index} 
                  className="feature-card glass-card border-primary/20 hover:border-primary/40 transition-all duration-500 hover:glow-blue group hover:scale-105"
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <CardHeader>
                    <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/30 transition-colors">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg sm:text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm sm:text-base text-foreground/70">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" ref={stepsRef} className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-lg sm:text-xl text-foreground/80 max-w-2xl mx-auto">
              Get started in three simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="relative">
                  <Card 
                    className="step-card glass-card border-primary/20 h-full transition-all duration-500 hover:scale-105 hover:glow-blue"
                    style={{ transitionDelay: `${index * 150}ms` }}
                  >
                    <CardHeader>
                      <div className="text-5xl sm:text-6xl font-bold gradient-text mb-4">
                        {step.number}
                      </div>
                      <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-xl sm:text-2xl">{step.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-sm sm:text-base text-foreground/70">
                        {step.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-primary/30" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 fade-in-up">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">
              Choose Your Plan
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Start free and scale as you grow. All plans include core features.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {/* Free Tier */}
            <Card variant="glass" className="p-8 hover:scale-105 transition-transform duration-300">
              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">Free</h3>
                <div className="flex items-baseline mb-4">
                  <span className="text-5xl font-bold gradient-text">$0</span>
                  <span className="text-muted-foreground ml-2">/month</span>
                </div>
                <p className="text-muted-foreground">Perfect for getting started</p>
              </div>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>5 video analyses per month</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Basic pose detection</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Session history (7 days)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Mobile & web access</span>
                </li>
                <li className="flex items-start gap-2">
                  <X className="w-5 h-5 text-muted-foreground/50 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">AI coaching feedback</span>
                </li>
                <li className="flex items-start gap-2">
                  <X className="w-5 h-5 text-muted-foreground/50 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Voice coach assistant</span>
                </li>
              </ul>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate("/auth")}
              >
                Get Started
              </Button>
            </Card>

            {/* Pro Tier - Highlighted */}
            <Card variant="glass" className="p-8 border-2 border-primary relative hover:scale-105 transition-transform duration-300">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-blue-400 text-white px-4 py-1 rounded-full text-sm font-semibold">
                Most Popular
              </div>
              
              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">Pro</h3>
                <div className="flex items-baseline mb-4">
                  <span className="text-5xl font-bold gradient-text">$19</span>
                  <span className="text-muted-foreground ml-2">/month</span>
                </div>
                <p className="text-muted-foreground">For serious athletes</p>
              </div>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Unlimited video analyses</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Advanced pose detection</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Unlimited session history</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>AI coaching feedback</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Voice coach assistant</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Progress tracking & analytics</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Priority support</span>
                </li>
              </ul>
              
              <Button 
                variant="hero" 
                className="w-full"
                onClick={() => navigate("/auth")}
              >
                Start Pro Trial
              </Button>
            </Card>

            {/* Enterprise Tier */}
            <Card variant="glass" className="p-8 hover:scale-105 transition-transform duration-300">
              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
                <div className="flex items-baseline mb-4">
                  <span className="text-5xl font-bold gradient-text">Custom</span>
                </div>
                <p className="text-muted-foreground">For teams & organizations</p>
              </div>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Everything in Pro</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Team management dashboard</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Custom AI training models</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>API access & integrations</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Dedicated account manager</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>SLA & premium support</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Custom deployment options</span>
                </li>
              </ul>
              
              <Button 
                variant="outline" 
                className="w-full"
              >
                Contact Sales
              </Button>
            </Card>
          </div>

          {/* Comparison Table */}
          <div className="fade-in-up">
            <Card variant="glass" className="p-8">
              <h3 className="text-2xl font-bold mb-8 text-center">Feature Comparison</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-4 px-4 font-semibold">Feature</th>
                      <th className="text-center py-4 px-4 font-semibold">Free</th>
                      <th className="text-center py-4 px-4 font-semibold">Pro</th>
                      <th className="text-center py-4 px-4 font-semibold">Enterprise</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border/30">
                      <td className="py-4 px-4">Video Analyses</td>
                      <td className="text-center py-4 px-4">5/month</td>
                      <td className="text-center py-4 px-4">Unlimited</td>
                      <td className="text-center py-4 px-4">Unlimited</td>
                    </tr>
                    <tr className="border-b border-border/30">
                      <td className="py-4 px-4">Pose Detection</td>
                      <td className="text-center py-4 px-4">Basic</td>
                      <td className="text-center py-4 px-4">Advanced</td>
                      <td className="text-center py-4 px-4">Advanced</td>
                    </tr>
                    <tr className="border-b border-border/30">
                      <td className="py-4 px-4">Session History</td>
                      <td className="text-center py-4 px-4">7 days</td>
                      <td className="text-center py-4 px-4">Unlimited</td>
                      <td className="text-center py-4 px-4">Unlimited</td>
                    </tr>
                    <tr className="border-b border-border/30">
                      <td className="py-4 px-4">AI Coaching</td>
                      <td className="text-center py-4 px-4"><X className="w-5 h-5 mx-auto text-muted-foreground/50" /></td>
                      <td className="text-center py-4 px-4"><Check className="w-5 h-5 mx-auto text-primary" /></td>
                      <td className="text-center py-4 px-4"><Check className="w-5 h-5 mx-auto text-primary" /></td>
                    </tr>
                    <tr className="border-b border-border/30">
                      <td className="py-4 px-4">Voice Assistant</td>
                      <td className="text-center py-4 px-4"><X className="w-5 h-5 mx-auto text-muted-foreground/50" /></td>
                      <td className="text-center py-4 px-4"><Check className="w-5 h-5 mx-auto text-primary" /></td>
                      <td className="text-center py-4 px-4"><Check className="w-5 h-5 mx-auto text-primary" /></td>
                    </tr>
                    <tr className="border-b border-border/30">
                      <td className="py-4 px-4">Progress Analytics</td>
                      <td className="text-center py-4 px-4"><X className="w-5 h-5 mx-auto text-muted-foreground/50" /></td>
                      <td className="text-center py-4 px-4"><Check className="w-5 h-5 mx-auto text-primary" /></td>
                      <td className="text-center py-4 px-4"><Check className="w-5 h-5 mx-auto text-primary" /></td>
                    </tr>
                    <tr className="border-b border-border/30">
                      <td className="py-4 px-4">Team Management</td>
                      <td className="text-center py-4 px-4"><X className="w-5 h-5 mx-auto text-muted-foreground/50" /></td>
                      <td className="text-center py-4 px-4"><X className="w-5 h-5 mx-auto text-muted-foreground/50" /></td>
                      <td className="text-center py-4 px-4"><Check className="w-5 h-5 mx-auto text-primary" /></td>
                    </tr>
                    <tr className="border-b border-border/30">
                      <td className="py-4 px-4">API Access</td>
                      <td className="text-center py-4 px-4"><X className="w-5 h-5 mx-auto text-muted-foreground/50" /></td>
                      <td className="text-center py-4 px-4"><X className="w-5 h-5 mx-auto text-muted-foreground/50" /></td>
                      <td className="text-center py-4 px-4"><Check className="w-5 h-5 mx-auto text-primary" /></td>
                    </tr>
                    <tr>
                      <td className="py-4 px-4">Support</td>
                      <td className="text-center py-4 px-4">Community</td>
                      <td className="text-center py-4 px-4">Priority</td>
                      <td className="text-center py-4 px-4">Dedicated</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section id="contact" className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto" ref={ctaRef}>
          <Card className="glass-strong border-primary/30 glow-blue-strong transition-all duration-500">
            <CardHeader className="text-center pb-6 sm:pb-8">
              <CardTitle className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                Ready to Improve Your Routine?
              </CardTitle>
              <CardDescription className="text-base sm:text-lg lg:text-xl text-foreground/80">
                Join athletes using AI to take their performance to the next level
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Link to="/auth">
                <Button size="lg" className="gradient-primary glow-blue text-base sm:text-lg px-8 sm:px-12 py-5 sm:py-6 h-auto w-full sm:w-auto">
                  Get Started Free
                </Button>
              </Link>
              <p className="text-xs sm:text-sm text-foreground/60 mt-4">
                No credit card required • Free forever
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-8 px-4 sm:px-6 lg:px-8 border-t border-primary/20">
        <div className="max-w-7xl mx-auto text-center text-foreground/60">
          <p>&copy; 2025 Routine Coach. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

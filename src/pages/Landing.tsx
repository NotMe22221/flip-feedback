import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { Navigation } from '@/components/Navigation';
import { Activity, Brain, Mic, Clock, Upload, Sparkles, Target } from 'lucide-react';

export default function Landing() {
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
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground mb-6 animate-fade-in-up">
            The #1 AI Routine Coach
          </h1>
          <p className="text-xl sm:text-2xl text-foreground/80 mb-8 max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Transform your gymnastics with AI-powered pose analysis, instant feedback, and personalized coaching
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <Link to="/auth">
              <Button size="lg" className="gradient-primary glow-blue text-lg px-8 py-6 h-auto">
                Start Free Trial
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 h-auto border-2 border-primary/50 hover:border-primary hover:bg-primary/10">
              Watch Demo
            </Button>
          </div>

          {/* Hero Image Placeholder */}
          <div className="mt-16 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="glass-card rounded-2xl p-8 max-w-5xl mx-auto glow-blue">
              <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center">
                <Activity className="h-32 w-32 text-primary/40" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-foreground/80 max-w-2xl mx-auto">
              Everything you need to analyze and improve your gymnastics routines
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="glass-card border-primary/20 hover:border-primary/40 transition-all hover:glow-blue group">
                  <CardHeader>
                    <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/30 transition-colors">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-foreground/70">
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
      <section id="how-it-works" className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-xl text-foreground/80 max-w-2xl mx-auto">
              Get started in three simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="relative">
                  <Card className="glass-card border-primary/20 h-full">
                    <CardHeader>
                      <div className="text-6xl font-bold gradient-text mb-4">
                        {step.number}
                      </div>
                      <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-2xl">{step.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-foreground/70 text-base">
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

      {/* Final CTA Section */}
      <section id="contact" className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="glass-strong border-primary/30 glow-blue-strong">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-4xl sm:text-5xl font-bold mb-4">
                Ready to Improve Your Routine?
              </CardTitle>
              <CardDescription className="text-xl text-foreground/80">
                Join athletes using AI to take their performance to the next level
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Link to="/auth">
                <Button size="lg" className="gradient-primary glow-blue text-lg px-12 py-6 h-auto">
                  Get Started Free
                </Button>
              </Link>
              <p className="text-sm text-foreground/60 mt-4">
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

import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import logo from '@/assets/flipcoach-logo.jpg';

export const Navigation = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAppRoute = location.pathname.startsWith('/app');

  const landingLinks = [
    { name: 'Features', href: '#features' },
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'Contact', href: '#contact' },
  ];

  const appLinks = [
    { name: 'Dashboard', href: '/app' },
    { name: 'Upload', href: '/app/upload' },
    { name: 'Training', href: '/app/training' },
    { name: 'History', href: '/app/history' },
    { name: 'Notes', href: '/app/notes' },
  ];

  const navLinks = isAppRoute ? appLinks : landingLinks;

  const scrollToSection = (href: string) => {
    if (href.startsWith('#')) {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        setMobileMenuOpen(false);
      }
    }
  };

  const handleNavClick = (link: { name: string; href: string }) => {
    if (link.href.startsWith('#')) {
      scrollToSection(link.href);
    } else {
      setMobileMenuOpen(false);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-primary/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 text-foreground hover:text-primary transition-colors">
            <img src={logo} alt="FlipCoach AI" className="h-10 w-10 object-contain" />
            <span className="text-xl font-bold">FlipCoach AI</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              link.href.startsWith('#') ? (
                <button
                  key={link.name}
                  onClick={() => scrollToSection(link.href)}
                  className="text-foreground/80 hover:text-foreground transition-colors relative group"
                >
                  {link.name}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
                </button>
              ) : (
                <Link
                  key={link.name}
                  to={link.href}
                  className="text-foreground/80 hover:text-foreground transition-colors relative group"
                >
                  {link.name}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
                </Link>
              )
            ))}
          </div>

          {/* Desktop CTAs - Only show on landing page */}
          {!isAppRoute && (
            <div className="hidden md:flex items-center gap-4">
              <Link to="/auth">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link to="/auth">
                <Button className="gradient-primary glow-blue">Start Free Trial</Button>
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-strong border-t border-primary/20">
          <div className="px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              link.href.startsWith('#') ? (
                <button
                  key={link.name}
                  onClick={() => scrollToSection(link.href)}
                  className="block w-full text-left text-foreground/80 hover:text-foreground py-2"
                >
                  {link.name}
                </button>
              ) : (
                <Link
                  key={link.name}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-left text-foreground/80 hover:text-foreground py-2"
                >
                  {link.name}
                </Link>
              )
            ))}
            {!isAppRoute && (
              <div className="pt-4 space-y-2">
                <Link to="/auth" className="block" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full">Sign In</Button>
                </Link>
                <Link to="/auth" className="block" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full gradient-primary glow-blue">Start Free Trial</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

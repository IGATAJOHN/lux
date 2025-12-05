import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  Shield,
  Zap,
  Clock,
  Star,
  ChevronRight,
  Users,
  Award,
  Globe
} from 'lucide-react';

const Index: React.FC = () => {
  const features = [
    {
      icon: Sparkles,
      title: 'AI-Powered Experience',
      description: 'Personalized recommendations and services tailored just for you.',
    },
    {
      icon: Shield,
      title: 'Advanced Security',
      description: 'Biometric verification and fraud detection for your peace of mind.',
    },
    {
      icon: Zap,
      title: 'Instant Service',
      description: 'Request any service from your room with just a tap.',
    },
    {
      icon: Clock,
      title: 'Seamless Check-in',
      description: 'Skip the front desk with our contactless check-in system.',
    },
  ];

  const stats = [
    { value: '50K+', label: 'Happy Guests', icon: Users },
    { value: '4.9', label: 'Average Rating', icon: Star },
    { value: '200+', label: 'Luxury Suites', icon: Award },
    { value: '24/7', label: 'Concierge', icon: Globe },
  ];

  const testimonials = [
    {
      name: 'Adebayo Oluwaseun',
      role: 'Business Traveler',
      content: 'The AI recommendations were spot on. It felt like home away from home. Excellent service!',
      rating: 5,
    },
    {
      name: 'Chinedu & Nneka Okonkwo',
      role: 'Family Vacation',
      content: 'Seamless check-in and the kids loved the pool. A truly world-class experience in Lagos.',
      rating: 5,
    },
    {
      name: 'Zainab Ibrahim',
      role: 'Honeymoon',
      content: 'Absolutely magical experience. The attention to detail exceeded all our expectations.',
      rating: 5,
    },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-navy-light/20 to-background" />

        {/* Animated background elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center">
          <div className="animate-slide-up">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8">
              <Sparkles className="h-4 w-4" />
              AI-Powered Luxury Hospitality
            </span>
          </div>

          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Experience Luxury
            <span className="block gradient-text">Redefined</span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-muted-foreground mb-10 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            Where cutting-edge AI meets unparalleled hospitality. Every moment is crafted
            to perfection, every need anticipated before it's spoken.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <Button variant="gold" size="xl" asChild>
              <Link to="/booking">
                Book Your Stay
                <ChevronRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button variant="glass" size="xl" asChild>
              <Link to="/rooms">Explore Rooms</Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            {stats.map((stat, index) => (
              <div key={index} className="glass-card p-6 text-center">
                <stat.icon className="h-6 w-6 text-primary mx-auto mb-2" />
                <div className="text-3xl font-display font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-4">
              Why Choose <span className="gradient-text">LuxeStay</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We combine the warmth of exceptional hospitality with the precision of artificial intelligence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="glass-card-hover p-8 text-center group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-4">
              Guest <span className="gradient-text">Stories</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Hear from those who've experienced the LuxeStay difference.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="glass-card p-8 relative">
                <div className="absolute top-6 right-6 flex gap-1">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-foreground mb-6 leading-relaxed">"{testimonial.content}"</p>
                <div>
                  <div className="font-semibold text-foreground">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/luxury-bg.png"
            alt="Luxury Hotel"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px]" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-white mb-6">
            Your Luxury Awaits
          </h2>
          <p className="text-xl text-gray-200 mb-10 max-w-2xl mx-auto leading-relaxed">
            Experience world-class hospitality powered by cutting-edge AI technology.
            Every stay is personalized, every moment is exceptional.
          </p>
          <Button variant="gold" size="xl" asChild>
            <Link to="/register">
              Start Your Journey
              <ChevronRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default Index;

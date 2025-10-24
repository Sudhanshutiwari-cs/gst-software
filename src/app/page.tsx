import React from 'react';

const GSTSoftwareLanding = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="bg-blue-600 text-white p-2 rounded-lg">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="ml-3 text-xl font-bold text-gray-900">GSTPro</span>
            </div>
            <div className="hidden md:flex space-x-8">
              <a href="#features" className="text-gray-700 hover:text-blue-600">Features</a>
              <a href="#pricing" className="text-gray-700 hover:text-blue-600">Pricing</a>
              <a href="#testimonials" className="text-gray-700 hover:text-blue-600">Testimonials</a>
              <a href="#contact" className="text-gray-700 hover:text-blue-600">Contact</a>
            </div>
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-200">
              Start Free Trial
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl font-bold text-gray-900 leading-tight">
                Simplify Your GST Filing with 
                <span className="text-blue-600"> Intelligent Software</span>
              </h1>
              <p className="text-xl text-gray-600 mt-6">
                Automated GST compliance, error-free filing, and real-time tracking. 
                Trusted by 50,000+ businesses across India.
              </p>
              <div className="mt-8 flex space-x-4">
                <button className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition duration-200 font-semibold">
                  Get Started Free
                </button>
                <button className="border border-blue-600 text-blue-600 px-8 py-3 rounded-lg hover:bg-blue-50 transition duration-200 font-semibold">
                  Watch Demo
                </button>
              </div>
              <div className="mt-6 text-sm text-gray-500">
                No credit card required • 30-day free trial • Cancel anytime
              </div>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-xl">
              <img 
                src="/api/placeholder/600/400" 
                alt="GST Software Dashboard"
                className="rounded-lg w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Everything You Need for GST Compliance</h2>
            <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
              Comprehensive features designed to make GST filing simple, accurate, and hassle-free
            </p>
          </div>
          
          <div className="mt-16 grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-6">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mt-4 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600 mt-2">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Simple, Transparent Pricing</h2>
            <p className="text-gray-600 mt-4">Choose the plan that works best for your business</p>
          </div>
          
          <div className="mt-16 grid md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <div key={index} className={`bg-white rounded-2xl p-8 ${plan.popular ? 'ring-2 ring-blue-600 relative' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm">Most Popular</span>
                  </div>
                )}
                <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                <div className="mt-4">
                  <span className="text-4xl font-bold">₹{plan.price}</span>
                  <span className="text-gray-600">/{plan.period}</span>
                </div>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <button className={`w-full mt-8 py-3 rounded-lg font-semibold ${
                  plan.popular 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                } transition duration-200`}>
                  Get Started
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Trusted by Businesses</h2>
          </div>
          <div className="mt-16 grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-50 p-6 rounded-lg">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="font-semibold text-blue-600">{testimonial.initials}</span>
                  </div>
                  <div className="ml-4">
                    <h4 className="font-semibold">{testimonial.name}</h4>
                    <p className="text-sm text-gray-600">{testimonial.company}</p>
                  </div>
                </div>
                <p className="text-gray-700">"{testimonial.quote}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white">Ready to Simplify Your GST Filing?</h2>
          <p className="text-blue-100 mt-4 text-xl">
            Join 50,000+ businesses that trust our GST software
          </p>
          <div className="mt-8">
            <button className="bg-white text-blue-600 px-8 py-3 rounded-lg hover:bg-gray-100 transition duration-200 font-semibold text-lg">
              Start Your Free Trial Today
            </button>
          </div>
          <p className="text-blue-200 mt-4 text-sm">
            No credit card required • Setup in 5 minutes
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center">
                <div className="bg-blue-600 text-white p-2 rounded-lg">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="ml-2 text-xl font-bold">GSTPro</span>
              </div>
              <p className="text-gray-400 mt-4">
                Making GST compliance simple and efficient for businesses across India.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Features</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">API</a></li>
                <li><a href="#" className="hover:text-white">Integrations</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Contact Us</a></li>
                <li><a href="#" className="hover:text-white">Documentation</a></li>
                <li><a href="#" className="hover:text-white">Status</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 GSTPro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Data arrays
const features = [
  {
    icon: (
      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: "Error-Free Filing",
    description: "Automated validation and error detection to ensure 100% accurate GST returns"
  },
  {
    icon: (
      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: "Real-time Tracking",
    description: "Monitor your GST filing status and compliance in real-time dashboard"
  },
  {
    icon: (
      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    title: "Bank-Grade Security",
    description: "Your financial data is protected with enterprise-level security measures"
  }
];

const pricingPlans = [
  {
    name: "Starter",
    price: "999",
    period: "month",
    popular: false,
    features: [
      "Up to 50 invoices/month",
      "GSTR-1, GSTR-3B Filing",
      "Basic Reports",
      "Email Support",
      "Auto ITC Matching"
    ]
  },
  {
    name: "Professional",
    price: "1999",
    period: "month",
    popular: true,
    features: [
      "Up to 500 invoices/month",
      "All GST Returns",
      "Advanced Analytics",
      "Priority Support",
      "Multi-user Access",
      "API Integration"
    ]
  },
  {
    name: "Enterprise",
    price: "3999",
    period: "month",
    popular: false,
    features: [
      "Unlimited invoices",
      "Custom Workflows",
      "Dedicated Account Manager",
      "24/7 Phone Support",
      "Custom Integrations",
      "Advanced Security"
    ]
  }
];

const testimonials = [
  {
    name: "Rajesh Kumar",
    company: "Kumar Traders",
    initials: "RK",
    quote: "Reduced our GST filing time from 2 days to 2 hours. Incredible software!"
  },
  {
    name: "Priya Sharma",
    company: "Sharma Enterprises",
    initials: "PS",
    quote: "The auto-error detection saved us from multiple compliance penalties."
  },
  {
    name: "Amit Patel",
    company: "Patel Industries",
    initials: "AP",
    quote: "Best investment we made for our business compliance. Highly recommended!"
  }
];

export default GSTSoftwareLanding;
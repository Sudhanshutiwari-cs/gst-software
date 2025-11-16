'use client';

import Button from '@/components/ui/button/Button';

import Link from "next/link";


export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      
      {/* Navigation Header */}
      <header className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-100 z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">GST</span>
            </div>
            <span className="font-semibold text-gray-900">GST</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#" className="text-gray-600 hover:text-gray-900 transition">Product</a>
            <a href="#" className="text-gray-600 hover:text-gray-900 transition">Features</a>
            <a href="#" className="text-gray-600 hover:text-gray-900 transition">Pricing</a>
            <a href="#" className="text-gray-600 hover:text-gray-900 transition">Contact</a>
          </div>

         <div className="flex items-center gap-3">
      <Link href="/login">
        <button className="text-gray-600 hover:text-gray-900 transition">
          Login
        </button>
      </Link>

      <Link href="/signup">
        <Button className="bg-blue-600 hover:bg-blue-700">
          Sign up
        </Button>
      </Link>
    </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Column - Text Content */}
            <div className="space-y-6">
              <div className="inline-block">
                <span className="px-4 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                  100% Safe & Secure!
                </span>
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Record payments <br />
                effortlessly
              </h1>
              
              <p className="text-lg text-gray-600 leading-relaxed max-w-md">
                Track every payment, every time — without lifting a finger. While others make it complicated, we make it simple.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-base">
                  Try for free
                </Button>
                <button className="px-6 py-3 text-gray-700 font-medium hover:bg-gray-50 transition rounded-lg border border-gray-200">
                  Request a demo →
                </button>
              </div>

              <div className="pt-8 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-3">💰 Trusted by</p>
                <p className="text-2xl font-bold text-gray-900">20,00,000+ Businesses</p>
              </div>
            </div>

            {/* Right Column - Illustration Cards */}
            <div className="relative h-96 lg:h-full flex items-center justify-center">
              <div className="relative w-full max-w-sm">
                {/* Top Card - Invoice */}
                <div className="absolute -top-8 -right-4 w-72 bg-white rounded-2xl border-2 border-gray-900 p-6 shadow-xl transform hover:scale-105 transition">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-semibold text-gray-900">Invoice</span>
                    <span className="text-emerald-500 text-xl">✓</span>
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>

                {/* Middle Card - Card */}
                <div className="absolute top-20 -right-12 w-64 bg-white rounded-2xl border-2 border-gray-900 p-4 shadow-xl transform hover:scale-105 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-pink-200 rounded-xl"></div>
                    <span className="font-semibold text-gray-900">Card</span>
                  </div>
                </div>

                {/* Card - UPI */}
                <div className="absolute top-40 -right-8 w-64 bg-white rounded-2xl border-2 border-gray-900 p-4 shadow-xl transform hover:scale-105 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-200 rounded-xl flex items-center justify-center">
                      <span className="text-white">✓</span>
                    </div>
                    <span className="font-bold text-gray-900 text-lg">UPI</span>
                  </div>
                </div>

                {/* Card - Netbanking */}
                <div className="absolute top-56 right-0 w-64 bg-white rounded-2xl border-2 border-gray-900 p-4 shadow-xl transform hover:scale-105 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-orange-200 rounded-xl"></div>
                    <span className="font-semibold text-gray-900">Netbanking</span>
                  </div>
                </div>

                {/* Card - Cash */}
                <div className="absolute top-72 right-8 w-64 bg-white rounded-2xl border-2 border-gray-900 p-4 shadow-xl transform hover:scale-105 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-emerald-200 rounded-xl"></div>
                    <span className="font-semibold text-gray-900">Cash</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Decorative animated elements */}
      <style jsx>{`
        @keyframes bounce-gentle {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        .animate-bounce-gentle {
          animation: bounce-gentle 3s infinite;
        }
      `}</style>
    </div>
  );
}

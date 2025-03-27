import React from "react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white font-[family-name:var(--font-geist-sans)]">
      <header className="bg-black/80 backdrop-blur-md sticky top-0 z-10 border-b border-neutral-800 py-3">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <h1 className="text-2xl font-medium tracking-tight text-white">
            Performance Dashboard
          </h1>
          <nav className="flex gap-6">
            <a
              href="/about"
              className="hover:text-neutral-400 text-sm transition-colors"
            >
              About
            </a>
            <a
              href="/contact"
              className="hover:text-neutral-400 text-sm transition-colors"
            >
              Contact
            </a>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-24">
        <section className="mb-24 text-center">
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-b from-white to-neutral-400 bg-clip-text text-transparent">
            Visualize Your Performance
          </h2>
          <p className="text-lg max-w-2xl mx-auto text-neutral-400">
            Track, analyze, and optimize your metrics with our powerful dashboard. 
            Built with the latest technology to ensure real-time insights and seamless user experience.
          </p>
          <div className="mt-10">
            <button className="bg-white hover:bg-white/90 text-black font-medium py-2 px-6 rounded-md transition-all duration-200">
              Get Started
            </button>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24">
          <div className="bg-neutral-900 p-6 rounded-md border border-neutral-800 hover:border-neutral-700 transition-colors">
            <h3 className="text-lg font-medium mb-3">Real-time Analytics</h3>
            <p className="text-neutral-400 text-sm">Monitor your performance metrics in real-time with interactive dashboards and customizable views.</p>
          </div>
          
          <div className="bg-neutral-900 p-6 rounded-md border border-neutral-800 hover:border-neutral-700 transition-colors">
            <h3 className="text-lg font-medium mb-3">Deep Insights</h3>
            <p className="text-neutral-400 text-sm">Gain valuable insights with advanced data analysis tools and predictive algorithms.</p>
          </div>
          
          <div className="bg-neutral-900 p-6 rounded-md border border-neutral-800 hover:border-neutral-700 transition-colors">
            <h3 className="text-lg font-medium mb-3">Seamless Integration</h3>
            <p className="text-neutral-400 text-sm">Connect with your existing tools and platforms for a unified performance monitoring experience.</p>
          </div>
        </section>

        <section className="bg-neutral-900 p-8 rounded-md border border-neutral-800 mb-24">
          <h2 className="text-2xl font-medium mb-4 text-center">Join Our Community</h2>
          <p className="text-sm max-w-2xl mx-auto text-center text-neutral-400 mb-6">
            Connect with like-minded professionals and grow together. Our
            community provides valuable resources, insights, and networking opportunities.
          </p>
          <div className="flex justify-center">
            <button className="bg-neutral-900 text-white font-medium py-2 px-6 rounded-md border border-neutral-700 hover:bg-neutral-800 transition-all duration-200">
              Join Now
            </button>
          </div>
        </section>
      </main>

      <footer className="border-t border-neutral-800 py-6">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
          <div className="text-xs text-neutral-500">
            © 2024 Performance Dashboard. All rights reserved.
          </div>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a
              href="#"
              className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              Documentation
            </a>
            <a
              href="#"
              className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              Support
            </a>
            <a
              href="#"
              className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              Settings
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
import React from "react";

export default function HomePage() {
  return (
&lt;div className="min-h-screen bg-gray-50 text-gray-900 font-[family-name:var(--font-geist-sans)]"&gt;
      <header className="bg-white shadow-md py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <h1 className="text-4xl font-extrabold">Welcome to Our Website</h1>
          <nav className="flex gap-6">
            <a href="/about" className="hover:underline text-lg">
              About
            </a>
            <a href="/contact" className="hover:underline text-lg">
              Contact
            </a>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-20">
        <section className="mb-20 text-center">
          <h2 className="text-4xl font-extrabold mb-6">
            Discover Our Features
          </h2>
          <p className="text-xl">
            Explore the amazing features we offer to enhance your experience.
          </p>
        </section>

        <section className="mb-20 text-center">
          <h2 className="text-4xl font-extrabold mb-6">Join Our Community</h2>
          <p className="text-xl">
            Connect with like-minded individuals and grow together.
          </p>
        </section>
      </main>

      <footer className="border-t border-gray-200 py-8">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm">
            © 2024 Performance Dashboard. All rights reserved.
          </div>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="text-sm hover:underline">
              Documentation
            </a>
            <a href="#" className="text-sm hover:underline">
              Support
            </a>
            <a href="#" className="text-sm hover:underline">
              Settings
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

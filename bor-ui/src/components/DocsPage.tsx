import React from 'react';
import { ArrowRight, Sparkles, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export const DocsPage = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
      <Link 
        to="/" 
        className="absolute top-8 left-8 flex flex-col items-center group"
      >
        <img 
          src="/bow1.svg" 
          alt="Bow Logo" 
          className="w-16 h-16 mb-2"
        />
        <span className="text-sm text-[#fe2c55] group-hover:text-[#fe2c55]/80 transition-colors">
          Back to Home
        </span>
      </Link>

      <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            What is Borp?
          </h1>
          <p className="text-lg text-[#fe2c55]">
            {/* Get started */}
          </p>
        </div>

        <div className="space-y-12">
          {/* Getting Started Section */}
          <section>
            {/* <h2 className="text-2xl font-semibold mb-6 text-[#fe2c55]">Getting Started</h2> */}
            <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-6 space-y-4 border border-[#fe2c55]/20">
              <p className="text-neutral-700 dark:text-neutral-300">
               Powered by Eliza. 
              </p>
              
            </div>
          </section>

          {/* Coming Soon Section */}
          <section>
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2 text-[#fe2c55]">
              <Sparkles className="text-[#fe2c55]" size={20} />
              Coming Soon
            </h2>
            <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-6 border border-[#fe2c55]/20">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="text-[#fe2c55]" size={20} />
                <h3 className="text-lg font-medium text-[#fe2c55]">Stream Your Own VTuber</h3>
              </div>
              <p className="text-neutral-700 dark:text-neutral-300">
                We're working on features that will allow creators to stream their own VTuber avatars.
                Stay tuned for updates on custom avatar integration, streaming tools, and creator dashboards.
              </p>
            </div>
          </section>

          {/* Resources Section */}
          <section>
            <h2 className="text-2xl font-semibold mb-6 text-[#fe2c55]">Resources</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <a 
                href="https://x.com/watch_borp" 
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-[#fe2c55]/20 hover:border-[#fe2c55] transition-colors"
              >
                <span className="text-neutral-700 dark:text-neutral-300">Follow us on Twitter</span>
                <ArrowRight size={16} className="text-[#fe2c55]" />
              </a>
              <a 
                href="#" 
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-[#fe2c55]/20 hover:border-[#fe2c55] transition-colors"
              >
                <span className="text-neutral-700 dark:text-neutral-300">Join our Discord</span>
                <ArrowRight size={16} className="text-[#fe2c55]" />
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}; 
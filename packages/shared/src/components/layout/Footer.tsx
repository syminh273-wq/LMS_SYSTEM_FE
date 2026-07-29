import * as React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-white dark:bg-card border-t border-gray-100 dark:border-border mt-auto transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2 space-y-4">
            <Link href="/consumer/dashboard" className="flex items-center gap-2">
              <span className="text-xl font-bold text-[#4F46E5] dark:text-white">
                EduFocus <span className="text-gray-900 dark:text-gray-300 font-medium">LMS</span>
              </span>
            </Link>
            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm leading-relaxed">
              Designed to empower students through an intuitive, distraction-free digital campus experience. Achieve more, focus better.
            </p>
          </div>
          
          <div>
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">Support</h4>
            <ul className="space-y-3">
              {['Help Center', 'Tech Requirements', 'Accessibility'].map(item => (
                <li key={item}>
                  <Link href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-[#4F46E5] transition-colors font-medium">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">Legal</h4>
            <ul className="space-y-3">
              {['Privacy Policy', 'Terms of Service', 'Student Code'].map(item => (
                <li key={item}>
                  <Link href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-[#4F46E5] transition-colors font-medium">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="pt-12 mt-12 border-t border-gray-50 dark:border-border/50 text-center">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
            © 2024 EduFocus LMS. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

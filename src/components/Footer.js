'use client';

import React from 'react';
import Link from 'next/link';
import { FireIcon } from '@heroicons/react/24/outline';

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
      <div className="max-w-6xl mx-auto px-4 py-12 sm:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <FireIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
              <span className="font-extrabold tracking-tight text-slate-900 dark:text-white">BandBooster</span>
            </div>
            <p className="text-sm font-medium tracking-tight text-slate-500 dark:text-slate-400">
              AI-powered IELTS Writing feedback based on official band descriptors.
            </p>
          </div>
          {/* Product */}
          <div>
            <h4 className="font-semibold tracking-tight text-slate-900 dark:text-white mb-4">Product</h4>
            <ul className="space-y-2">
              <li><Link href="/#features" className="text-sm font-medium tracking-tight text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">Features</Link></li>
              <li><Link href="/#how-it-works" className="text-sm font-medium tracking-tight text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">How It Works</Link></li>
              <li><Link href="/#pricing" className="text-sm font-medium tracking-tight text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">Pricing</Link></li>
              <li><Link href="/dashboard" className="text-sm font-medium tracking-tight text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">Dashboard</Link></li>
            </ul>
          </div>
          {/* Legal */}
          <div>
            <h4 className="font-semibold tracking-tight text-slate-900 dark:text-white mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><Link href="/privacy" className="text-sm font-medium tracking-tight text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-sm font-medium tracking-tight text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">Terms of Service</Link></li>
              <li><Link href="/refund" className="text-sm font-medium tracking-tight text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">Refund Policy</Link></li>
            </ul>
          </div>
          {/* Support */}
          <div>
            <h4 className="font-semibold tracking-tight text-slate-900 dark:text-white mb-4">Support</h4>
            <ul className="space-y-2">
              <li><a href="mailto:support@bandbooster.com" className="text-sm font-medium tracking-tight text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">Contact Us</a></li>
              <li><Link href="/#pricing" className="text-sm font-medium tracking-tight text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">Top-up Credits</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 text-center space-y-2">
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm font-medium tracking-tight text-slate-500 dark:text-slate-400">
            <Link href="/privacy" className="hover:text-red-600 dark:hover:text-red-400 transition-colors">Privacy Policy</Link>
            <span aria-hidden>·</span>
            <Link href="/terms" className="hover:text-red-600 dark:hover:text-red-400 transition-colors">Terms of Service</Link>
            <span aria-hidden>·</span>
            <Link href="/refund" className="hover:text-red-600 dark:hover:text-red-400 transition-colors">Refund Policy</Link>
          </div>
          <p className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">
            © 2026 BANDBOOSTER LLC. All rights reserved.
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            16192 Coastal Highway, Lewes, Delaware 19958, USA
          </p>
        </div>
      </div>
    </footer>
  );
}

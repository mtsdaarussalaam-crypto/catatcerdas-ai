'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface AIInsightWidgetProps {
  insights: string[];
}

export function AIInsightWidget({ insights }: AIInsightWidgetProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 p-5 sm:p-6 text-white shadow-md border border-emerald-700/40">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              <Sparkles className="w-4 h-4 text-emerald-300" />
            </span>
            <h3 className="text-sm font-bold tracking-tight text-white">
              Ringkasan & Wawasan Finansial AI
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {insights.slice(0, 4).map((item, index) => (
              <div
                key={index}
                className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-emerald-100"
              >
                <Lightbulb className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="shrink-0 self-end lg:self-center">
          <Link href="/assistant">
            <Button
              variant="secondary"
              size="sm"
              className="bg-white text-emerald-900 hover:bg-emerald-50 font-bold gap-1.5 shadow-sm"
            >
              <span>Tanya Asisten AI</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

import { Suspense } from 'react';
import { RentInsightForm } from '@/components/forms/RentInsightForm';

export const metadata = {
  title: 'Rent check · Are you overpaying in Mumbai?',
  description: 'Instantly see how your rent compares to nearby data points in your Mumbai neighbourhood.',
};

export default function InsightsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
          Are you overpaying in Mumbai?
        </h1>
        <p className="text-slate-600 text-sm mt-2 max-w-2xl">
          Drop a pin on where you live, tell us your rent, and we&apos;ll compare it with listings
          and crowd-sourced sightings in a configurable radius around that pin.
        </p>
      </header>
      <Suspense fallback={<div className="text-slate-500 text-sm">Loading…</div>}>
        <RentInsightForm />
      </Suspense>
    </div>
  );
}

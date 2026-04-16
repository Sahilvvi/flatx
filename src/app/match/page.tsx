import { MatchForm } from '@/components/forms/MatchForm';

export const metadata = {
  title: 'Find matches · Mumbai Rent Intelligence',
  description:
    'Get ranked listings and flatmates matched to your budget, location, BHK and lifestyle preferences.',
};

export default function MatchPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
          Find your match, minus the brokers
        </h1>
        <p className="text-slate-600 text-sm mt-2 max-w-2xl">
          Tell us where you want to live and your budget. We&apos;ll rank nearby listings by how
          well they fit — then connect you directly with the owner on WhatsApp.
        </p>
      </header>
      <MatchForm />
    </div>
  );
}

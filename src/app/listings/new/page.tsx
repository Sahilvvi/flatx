import { AddListingForm } from '@/components/forms/AddListingForm';

export const metadata = {
  title: 'List a flat, room or flatmate · Mumbai Rent Intelligence',
};

export default function NewListingPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Add a listing</h1>
        <p className="text-slate-600 text-sm mt-1">
          Broker-free. Your listing appears on the map instantly. Tenants contact you directly via
          WhatsApp.
        </p>
      </header>
      <AddListingForm />
    </div>
  );
}

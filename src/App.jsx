import { FastLogo } from './components/FastLogo';

function App() {
  return (
    <div className="min-h-screen bg-brand-light p-6 font-sans">
      <header className="flex items-center gap-4 border-b pb-4">
        <FastLogo className="h-10 w-auto" />
        <h1 className="text-2xl font-heading font-bold text-brand-primary">
          FAST Real-Time Transit Tracking
        </h1>
      </header>
      
      <main className="mt-8 text-center">
        <p className="text-lg text-brand-dark">
          Welcome to FAST transit tracking app.
        </p>
      </main>
    </div>
  );
}

export default App;
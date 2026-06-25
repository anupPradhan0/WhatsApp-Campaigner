import { useNavigate } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100dvh-200px)] flex items-center justify-center p-6">
      <div className="max-w-[420px] w-full bg-surface border border-line rounded-[14px] p-8 text-center">
        <div className="w-14 h-14 rounded-[14px] bg-brand-dim flex items-center justify-center mx-auto mb-[18px]">
          <Compass size={26} className="text-brand-light" />
        </div>
        <p className="text-5xl font-extrabold text-fg leading-none mb-2">404</p>
        <h1 className="text-lg font-bold text-fg mb-2">
          Page not found
        </h1>
        <p className="text-[13px] text-fg-muted leading-[1.6] mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <button
          onClick={() => navigate('/home')}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand text-white border-none rounded-lg text-sm font-semibold cursor-pointer"
        >
          <ArrowLeft size={15} />
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}


interface SpinnerProps {
  label?: string;
  size?: number;
}

export const Spinner = ({ label = 'Loading…', size = 36 }: SpinnerProps) => (
  <div className="flex flex-col items-center justify-center gap-3 min-h-[400px]">
    <div
      className="rounded-full border-[3px] border-line border-t-brand animate-spin [animation-duration:0.8s]"
      style={{ width: size, height: size }}
    />
    <p className="text-fg-muted text-[13px]">{label}</p>
  </div>
);

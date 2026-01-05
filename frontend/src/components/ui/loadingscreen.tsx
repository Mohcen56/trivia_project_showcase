// Simple bounce loader using the primary brand color (cyan)
export default function BounceLoader() {
  const dot = 'h-5 w-5 animate-bounce rounded-full bg-cyan-500';

  return (
    <div className="flex items-center justify-center space-x-2">
      <div className={`${dot} [animation-delay:-0.3s]`} />
      <div className={`${dot} [animation-delay:-0.13s]`} />
      <div className={dot} />
    </div>
  );
}
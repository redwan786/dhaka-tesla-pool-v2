export function CapacityMeter({ occupied, capacity }: { occupied: number; capacity: number }) {
  const safeOccupied = Math.min(Math.max(occupied, 0), capacity);
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-bold">Seat capacity</span>
        <span className="text-ink/60">{safeOccupied}/{capacity} occupied</span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2" aria-label={`${safeOccupied} of ${capacity} seats occupied`}>
        {Array.from({ length: capacity }, (_, index) => (
          <span
            key={index}
            className={`h-3 rounded-full ${index < safeOccupied ? 'bg-signal' : 'bg-ink/10'}`}
          />
        ))}
      </div>
    </div>
  );
}

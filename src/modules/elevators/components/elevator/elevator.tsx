import { CogIcon } from '@/components/ui/cog';
import { cn } from '@/lib/utils';
import { Elevator as TElevator } from '@/modules/elevators/stores/elevator.store';

type ElevatorProps = TElevator & {
  totalFloors: number;
  className?: string;
};

function getTopValue(floor: number, totalFloors: number) {
  const floorHeight = 100;
  const totalHeight = (totalFloors - 1) * floorHeight;

  return `${totalHeight - floor * floorHeight}px`;
}

export function Elevator({ id, currentFloor, totalFloors, status }: ElevatorProps) {
  const topValue = getTopValue(currentFloor.number, totalFloors);

  return (
    <div className="h-full w-[50px]">
      <div className="relative w-full">
        <div className="absolute -top-[150px] flex w-full flex-col items-center gap-8">
          <CogIcon className={cn('size-[50px]', status !== 'idle' && 'animate-spin-slow')} />

          <div className={cn(status !== 'idle' && 'text-amber-600')}>{id}</div>
        </div>

        <div
          style={{ top: topValue }}
          className="absolute flex h-[100px] w-full flex-col items-center justify-center bg-slate-700 text-white transition-all duration-1000"
        >
          <div className="text-center text-sm">
            <p>{status.toUpperCase()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

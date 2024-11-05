import { Elevator as TElevator } from '@/modules/elevators/hooks/use-manager';

type ElevatorProps = TElevator & {
  totalFloors: number;
  className?: string;
};

function getTopValue(floor: number, totalFloors: number) {
  const floorHeight = 200;
  const totalHeight = (totalFloors - 1) * floorHeight;

  return `${totalHeight - floor * floorHeight}px`;
}

export function Elevator({ id, currentFloor, totalFloors }: ElevatorProps) {
  const topValue = getTopValue(currentFloor.number, totalFloors);

  return (
    <div className="h-full w-[125px]">
      <div className="relative w-full">
        <div
          style={{ top: topValue }}
          className="duration-900 absolute flex h-[200px] w-full flex-col items-center justify-center bg-slate-700 text-white transition-all"
        >
          <h1>Elevator: {id}</h1>
          <h2>Floor: {currentFloor.name ?? currentFloor.number}</h2>
        </div>
      </div>
    </div>
  );
}

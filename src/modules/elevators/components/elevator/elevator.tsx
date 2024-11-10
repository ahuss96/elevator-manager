import { Elevator as TElevator } from '@/modules/elevators/stores/elevator.store';

type ElevatorProps = TElevator & {
  totalFloors: number;
  className?: string;
};

function getTopValue(floor: number, totalFloors: number) {
  const floorHeight = 200;
  const totalHeight = (totalFloors - 1) * floorHeight;

  return `${totalHeight - floor * floorHeight}px`;
}

export function Elevator({ id, currentFloor, totalFloors, status }: ElevatorProps) {
  const topValue = getTopValue(currentFloor.number, totalFloors);

  return (
    <div className="h-full w-[125px]">
      <div className="relative w-full">
        <div
          style={{ top: topValue }}
          className="absolute flex h-[200px] w-full flex-col items-center justify-center bg-slate-700 text-white transition-all duration-1000"
        >
          <h1>Elevator: {id}</h1>
          <h2>Floor: {currentFloor.name ?? currentFloor.number}</h2>

          <div className="mt-2 text-center text-sm">
            <p>Status: {status}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

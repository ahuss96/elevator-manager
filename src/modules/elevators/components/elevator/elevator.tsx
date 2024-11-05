import { Job, Elevator as TElevator } from '@/modules/elevators/hooks/use-manager';

type ElevatorProps = TElevator & {
  totalFloors: number;
  className?: string;
  job?: Job;
};

function getTopValue(floor: number, totalFloors: number) {
  const floorHeight = 200;
  const totalHeight = (totalFloors - 1) * floorHeight;

  return `${totalHeight - floor * floorHeight}px`;
}

export function Elevator({ id, currentFloor, totalFloors, job }: ElevatorProps) {
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

          {job && (
            <div className="mt-2 text-sm">
              <p>Job From: {job.from.name ?? job.from.number}</p>
              <p>Job To: {job.to.name ?? job.to.number}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { CallElevator } from '@/modules/elevators/components/call-elevator';
import { Elevator } from '@/modules/elevators/components/elevator';
import { useElevatorManager } from '@/modules/elevators/hooks/use-elevator-manager';
import { useElevatorStore } from '@/modules/elevators/stores/elevator.store';

export function Elevators() {
  const elevators = useElevatorStore((state) => state.elevators);
  const floors = useElevatorStore((state) => state.floors);
  const addJob = useElevatorStore((state) => state.addJob);

  useElevatorManager();

  return (
    <div className="flex w-full gap-12">
      <div className="flex flex-col divide-y border">
        {floors.map((thisFloor) => (
          <div key={thisFloor.number} className="flex h-[200px] flex-col items-center justify-center gap-4 px-4">
            <h1>Floor: {thisFloor.name ?? thisFloor.number}</h1>

            <CallElevator
              floor={thisFloor}
              floors={floors}
              onElevatorCall={(toFloor) => addJob({ from: thisFloor, to: toFloor })}
            />
          </div>
        ))}
      </div>

      <div className="flex gap-10">
        {elevators.map((props) => {
          const job = undefined;

          return <Elevator key={props.id} {...props} totalFloors={floors.length} job={job} />;
        })}
      </div>
    </div>
  );
}

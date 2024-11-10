import { CallElevator } from '@/modules/elevators/components/call-elevator';
import { Elevator } from '@/modules/elevators/components/elevator';
import { useElevatorManager } from '@/modules/elevators/hooks/use-elevator-manager';
import { useElevatorStore } from '@/modules/elevators/stores/elevator.store';
import { useShallow } from 'zustand/shallow';

export function Elevators() {
  const { elevators, addJob, floors } = useElevatorStore(
    useShallow((state) => ({ addJob: state.createTrip, elevators: state.elevators, floors: state.floors })),
  );

  useElevatorManager();

  return (
    <div className="flex w-full gap-8">
      <div className="flex flex-col divide-y border">
        {floors.map((thisFloor) => (
          <div key={thisFloor.number} className="flex h-[100px] flex-col items-center justify-center gap-4 px-2">
            <h1>{thisFloor.name ?? thisFloor.number}</h1>

            <CallElevator
              floor={thisFloor}
              floors={floors}
              onElevatorCall={(toFloor) => addJob({ from: thisFloor, to: toFloor })}
            />
          </div>
        ))}
      </div>

      <div className="flex gap-8">
        {elevators.map((props) => (
          <Elevator key={props.id} {...props} totalFloors={floors.length} />
        ))}
      </div>
    </div>
  );
}

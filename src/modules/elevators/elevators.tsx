import { CallElevator } from '@/modules/elevators/components/call-elevator';
import { Elevator } from '@/modules/elevators/components/elevator';
import { useManager } from '@/modules/elevators/hooks/use-manager';

export function Elevators() {
  const { elevators, floors, createJob } = useManager();

  return (
    <div className="flex w-full gap-12">
      <div className="flex flex-col divide-y border">
        {floors.map((thisFloor) => (
          <div key={thisFloor.number} className="flex h-[200px] flex-col items-center justify-center gap-4 px-4">
            <h1>Floor: {thisFloor.name ?? thisFloor.number}</h1>

            <CallElevator floor={thisFloor} floors={floors} onElevatorCall={createJob(thisFloor)} />
          </div>
        ))}
      </div>

      <div className="flex gap-10">
        {elevators.map((props) => (
          <Elevator key={props.id} {...props} totalFloors={floors.length} />
        ))}
      </div>
    </div>
  );
}

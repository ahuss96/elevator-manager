import { Button } from '@/components/ui/button';
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Floor } from '@/modules/elevators/stores/elevator.store';

type CallElevatorProps = {
  floor: Floor;
  floors: Floor[];
  onElevatorCall: (toFloor: Floor) => void;
};

export function CallElevator({ floor, floors, onElevatorCall }: CallElevatorProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          Call
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto" side="right">
        <div className="flex flex-col">
          {floors.map((toFloor) => (
            <PopoverClose asChild key={toFloor.number} onClick={() => onElevatorCall(toFloor)}>
              <Button variant="ghost" disabled={floor.number === toFloor.number}>
                {toFloor.name ?? toFloor.number}
              </Button>
            </PopoverClose>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

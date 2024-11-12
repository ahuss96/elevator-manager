import { completeJobsAtCurrentFloor, handleElevatorMovement, selectNextTrip } from '@/modules/elevators/hooks/utils';
import { useElevatorStore } from '@/modules/elevators/stores/elevator.store';
import { useEffect } from 'react';

const INTERVAL_MS = 1000;

export function useElevatorManager() {
  const store = useElevatorStore((state) => state);

  useEffect(() => {
    const interval = setInterval(() => {
      store.elevators.forEach((elevator) => {
        const { id, trips, currentFloor } = elevator;
        if (!trips.length) return;

        const tripToProgress = selectNextTrip(elevator);

        if (!tripToProgress) return;

        const { pickup, dropOff } = tripToProgress;

        // Perform the first applicable job
        if (pickup.status !== 'completed') {
          if (currentFloor.number !== pickup.to.number) {
            handleElevatorMovement(elevator, pickup, 'pickup');
          } else {
            // Pickup completed
            console.log(`Elevator ${id}: completed pickup on ${pickup.to.number}`);

            store.updateJobStatus(id, pickup.id, 'completed');
          }
        } else if (dropOff.status !== 'completed') {
          if (currentFloor.number !== dropOff.to.number) {
            handleElevatorMovement(elevator, dropOff, 'drop off');
          } else {
            // Drop off completed
            console.log(`Elevator ${id}: completed drop off on ${dropOff.to.number}`);

            completeJobsAtCurrentFloor(elevator);

            // Check if there are no trips left after removing the current one
            const updatedElevator = store.getElevatorById(id);

            if (updatedElevator.trips.length === 0) {
              console.log(`Elevator ${id}: setting to idle`);
              store.updateElevatorStatus(id, 'idle'); // Set to idle if no trips remain
            }
          }
        }

        console.log('\n\n\n');
      });

      return clearInterval(interval);
    }, INTERVAL_MS);

    return () => clearInterval(interval);
  }, [store]);
}

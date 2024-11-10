import { useElevatorStore } from '@/modules/elevators/stores/elevator.store';
import { useEffect } from 'react';

const INTERVAL_MS = 1000;

export function useElevatorManager() {
  const store = useElevatorStore((state) => state);

  useEffect(() => {
    const interval = setInterval(() => {
      store.elevators.forEach(({ trips, id, currentFloor }) => {
        if (!trips.length) {
          return;
        }

        const tripToProgress = trips[0]; // trips are sorted on trip creation
        const { pickup, dropOff: dropOff, id: tripId, elevatorId } = tripToProgress;

        console.log(`Elevator ${id}: on floor ${currentFloor.number}`);

        // Handle the pickup job first if it's not completed
        if (pickup.status !== 'completed') {
          if (currentFloor.number < pickup.to.number) {
            console.log(`Elevator ${id}: moving up to pickup on ${pickup.to.number}`);

            store.moveElevator(id, 1); // Move up
          } else if (currentFloor.number > pickup.to.number) {
            console.log(`Elevator ${id}: moving down to pickup on ${pickup.to.number}`);

            store.moveElevator(id, -1); // Move down
          } else {
            // Elevator reached pickup floor
            console.log(`Elevator ${id}: completed pickup on ${pickup.to.number}`);

            store.updateJobStatus(id, pickup.id, 'completed'); // Mark pickup as completed
          }
        } else {
          // Pickup is completed, handle the dropOff
          if (dropOff.status !== 'completed') {
            if (currentFloor.number < dropOff.to.number) {
              console.log(`Elevator ${id}: moving up to drop off on ${dropOff.to.number}`);

              store.moveElevator(id, 1); // Move up
            } else if (currentFloor.number > dropOff.to.number) {
              console.log(`Elevator ${id}: moving down to drop off on ${dropOff.to.number}`);

              store.moveElevator(id, -1); // Move down
            } else {
              // Elevator reached dropOff floor
              console.log(`Elevator ${id}: completed drop off on ${dropOff.to.number}`);
              store.updateJobStatus(id, dropOff.id, 'completed'); // Mark dropOff as completed
              store.removeTrip(elevatorId, tripId); // Remove the trip once pickup and dropOff are complete

              // Check if there are no trips left after removing the current one
              const updatedElevator = store.getElevatorById(id);
              if (updatedElevator.trips.length === 0) {
                store.updateElevatorStatus(id, 'idle'); // Set to idle if no trips remain
              }
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

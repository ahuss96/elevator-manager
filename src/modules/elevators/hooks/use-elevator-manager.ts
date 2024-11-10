import { useElevatorStore } from '@/modules/elevators/stores/elevator.store';
import { useEffect } from 'react';

const INTERVAL_MS = 1000;

export function useElevatorManager() {
  const store = useElevatorStore((state) => state);

  useEffect(() => {
    const interval = setInterval(() => {
      store.elevators.forEach(({ jobs, id, currentFloor }) => {
        if (!jobs.length) {
          clearInterval(interval);
          return;
        }

        console.log(jobs);

        const jobToProgress = jobs[0];

        // console.log(`Current floor: ${currentFloor.number}, current job: ${jobToProgress.id}`);
        // console.log(
        //   `Using elevator ${jobToProgress.elevatorId} to go from ${currentFloor.number} to ${jobToProgress.to.number}`,
        // );

        if (currentFloor.number < jobToProgress.to.number) {
          // console.log(`Elevator ${id} moving up to ${currentFloor.number + 1}`);

          store.moveElevator(id, 1);
        } else if (currentFloor.number > jobToProgress.to.number) {
          // console.log(`Elevator ${id} moving down to ${currentFloor.number - 1}`);

          store.moveElevator(id, -1);
        } else {
          // console.log(`Elevator ${id} has arrived at destination ${jobToProgress.to.number}. Removing job.`);

          store.removeJob(id, jobToProgress);
        }

        console.log('\n\n\n');
      });
    }, INTERVAL_MS);

    return () => clearInterval(interval);
  }, [store]);
}

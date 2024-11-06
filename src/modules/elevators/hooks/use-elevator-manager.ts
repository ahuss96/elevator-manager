import { useElevatorStore } from '@/modules/elevators/stores/elevator.store';
import { useEffect } from 'react';
import { useShallow } from 'zustand/shallow';

const INTERVAL_MS = 1000;

export function useElevatorManager() {
  const { jobs, getElevatorById, moveElevator, removeJob, getNextJob } = useElevatorStore(
    useShallow((state) => ({
      jobs: state.jobs,
      getElevatorById: state.getElevatorById,
      moveElevator: state.moveElevator,
      removeJob: state.removeJob,
      getNextJob: state.getNextJob,
    })),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const elevatorJobs = Object.entries(jobs);

      if (!elevatorJobs.length) {
        clearInterval(interval);
        return;
      }

      elevatorJobs.forEach(([elevatorId, elevatorJobs]) => {
        const elId = parseInt(elevatorId);

        if (!elevatorJobs.length) {
          clearInterval(interval);
          return;
        }

        const jobToProgress = getNextJob(elId);

        console.log(jobToProgress);

        const elevator = getElevatorById(elId);

        if (elevator.currentFloor.number < jobToProgress.to.number) {
          console.log(`Elevator ${elevator.id} moving up to ${elevator.currentFloor.number + 1}`);
          moveElevator(elId, 1);
        } else if (elevator.currentFloor.number > jobToProgress.to.number) {
          console.log(`Elevator ${elevator.id} moving down to ${elevator.currentFloor.number - 1}`);

          moveElevator(elId, -1);
        } else {
          console.log(`Elevator ${elevator.id} has arrived at destination ${jobToProgress.to.number}. Removing job.`);

          removeJob(jobToProgress);
        }
      });
    }, INTERVAL_MS);

    return () => clearInterval(interval);
  }, [getElevatorById, getNextJob, jobs, moveElevator, removeJob]);
}

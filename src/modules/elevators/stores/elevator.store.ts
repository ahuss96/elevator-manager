import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export type Floor = {
  number: number;
  name?: string;
};

export type Job = {
  elevatorId: number;
  id: string;
  from: Floor;
  to: Floor;
};

export type Elevator = {
  id: number;
  currentFloor: Floor;
  status: 'idle' | 'moving up' | 'moving down';
  jobs: Job[];
};

type ElevatorState = {
  elevators: Elevator[];
  floors: Floor[];

  getElevatorById(elevatorId: number): Elevator;
  getFloorByNumber(floorNum: number): Floor;

  addJob(job: Omit<Job, 'elevatorId' | 'id'>): void;
  removeJob(elevatorId: number, job: Job): void;
  getNextJob(elevatorId: number): Job;

  moveElevator(elevatorId: number, modifier: number): void;
};

const NUMBER_OF_FLOORS = 7;

const floors = Array.from({ length: NUMBER_OF_FLOORS }, (_, index) => ({
  number: index,
  ...(index === 0 ? { name: 'G' } : {}),
})).sort((a, b) => b.number - a.number);

function getDirectionOfElevator(to: Floor, from: Floor) {
  return to.number > from.number ? 'moving up' : 'moving down';
}

function getCostForElevator(elevatorId: number, from: Floor, to: Floor): number {
  const { getElevatorById } = useElevatorStore.getState();
  return Math.abs(getElevatorById(elevatorId).currentFloor.number - from.number) + Math.abs(from.number - to.number);
}

function calculateCost(from: Floor, to: Floor) {
  const { elevators } = useElevatorStore.getState();

  return elevators.map((elevator) => {
    // current elevator's jobs
    const currentFloor = elevator.currentFloor.number;

    let totalCost = 0;

    if (!elevator.jobs.length) {
      // If there are no jobs, calculate the cost directly from the current floor to the new job's floors
      totalCost += Math.abs(currentFloor - from.number) + Math.abs(from.number - to.number);
    } else {
      const elevatorDirection = getDirectionOfElevator(elevator.jobs[0].to, elevator.jobs[0].from);

      // If the new job is in the current direction, add it as part of the route
      if (
        (elevatorDirection === 'moving up' && from.number >= currentFloor) ||
        (elevatorDirection === 'moving down' && from.number <= currentFloor)
      ) {
        totalCost += Math.abs(currentFloor - from.number) + Math.abs(from.number - to.number);
      } else {
        // If the job requires a direction change, calculate cost from final job's floor
        const finalJob = elevator.jobs[elevator.jobs.length - 1].to.number;
        totalCost += Math.abs(currentFloor - finalJob) + Math.abs(from.number - to.number);
      }
    }

    return { ...elevator, cost: totalCost };
  });
}

export const useElevatorStore = create<ElevatorState>()(
  devtools((set, get) => ({
    floors,
    elevators: [
      { id: 0, currentFloor: floors[floors.length - 1], status: 'idle', jobs: [] },
      { id: 1, currentFloor: floors[floors.length - 1], status: 'idle', jobs: [] },
      { id: 2, currentFloor: floors[floors.length - 1], status: 'idle', jobs: [] },
    ],

    getElevatorById(elevatorId) {
      const foundElevator = get().elevators.find((el) => elevatorId === el.id);

      if (!foundElevator) throw new Error("Elevator doesn't exist");

      return foundElevator;
    },

    getFloorByNumber(floorNum) {
      const foundFloor = floors.find((floor) => floorNum === floor.number);

      if (!foundFloor) throw new Error("Floor doesn't exist");

      return foundFloor;
    },

    addJob({ from, to }) {
      console.log(`Elevator requested from ${from.name ?? from.number} to ${to.name ?? to.number}`);

      set((state) => {
        const cheapestElevator = [...calculateCost(from, to)].sort((a, b) => a.cost - b.cost)[0];

        const { jobs: existingJobs } = state.getElevatorById(cheapestElevator.id);

        const pickupJob: Job = {
          elevatorId: cheapestElevator.id,
          id: uuidv4(),
          from: cheapestElevator.currentFloor,
          to: from,
        };
        const dropOffJob: Job = { elevatorId: cheapestElevator.id, id: uuidv4(), from, to };

        const updatedJobs: Job[] = [
          ...existingJobs,
          ...(pickupJob.from.number === pickupJob.to.number ? [] : [pickupJob]),
          dropOffJob,
        ];

        return {
          elevators: state.elevators.map((el) => {
            if (el.id === cheapestElevator.id) {
              return {
                ...el,
                jobs: updatedJobs,
              };
            }

            return el;
          }),
        };
      });
    },

    removeJob(elevatorId, job) {
      set((state) => {
        const { jobs } = state.getElevatorById(elevatorId);

        return {
          elevators: state.elevators.map((el) => {
            if (el.id === elevatorId)
              return {
                ...el,
                status: 'idle',
                jobs: jobs.filter(({ id }) => id !== job.id),
              };

            return el;
          }),
        };
      });
    },

    getNextJob(elevatorId) {
      const { jobs, status } = get().getElevatorById(elevatorId);

      if (!jobs?.length) {
        throw new Error('No jobs found for elevator');
      }

      if (jobs.length === 1) return jobs[0];

      const jobsInSameDirection = jobs.filter((job) => status === getDirectionOfElevator(job.to, job.from));

      if (!jobsInSameDirection.length) return jobs[0];

      return [...jobsInSameDirection].sort(
        (a, b) => getCostForElevator(elevatorId, a.from, a.to) - getCostForElevator(elevatorId, b.from, b.to),
      )[0];
    },

    moveElevator(elevatorId, modifier) {
      const { currentFloor } = get().getElevatorById(elevatorId);
      const newFloor = get().getFloorByNumber(currentFloor.number + modifier);

      // console.log({ newFloor });

      set((state) => ({
        elevators: state.elevators.map((el) => {
          if (el.id === elevatorId)
            return { ...el, currentFloor: newFloor, status: modifier > 0 ? 'moving up' : 'moving down' };

          return el;
        }),
      }));
    },
  })),
);

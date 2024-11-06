import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type Floor = {
  number: number;
  name?: string;
};

export type Job = {
  elevatorId: number;
  from: Floor;
  to: Floor;
};

export type Elevator = {
  id: number;
  currentFloor: Floor;
};

export type Request = {
  from: Floor;
  to: Floor;
};

type ElevatorState = {
  jobs: Record<number, Job[]>;
  elevators: Elevator[];
  floors: Floor[];
  requests: Request[];

  getElevatorById(elevatorId: number): Elevator;
  getFloorByNumber(floorNum: number): Floor;

  addRequest(request: Request): void;

  addJob(job: Omit<Job, 'elevatorId'>): void;
  removeJob(job: Job): void;
  getNextJob(elevatorId: number): Job;

  moveElevator(elevatorId: number, modifier: number): void;
};

const NUMBER_OF_FLOORS = 7;

const floors = Array.from({ length: NUMBER_OF_FLOORS }, (_, index) => ({
  number: index,
  ...(index === 0 ? { name: 'G' } : {}),
})).sort((a, b) => b.number - a.number);

function getDirectionOfElevator(to: Floor, from: Floor) {
  return to.number > from.number ? 'up' : 'down';
}

function getCostForElevator(elevatorId: number, from: Floor, to: Floor): number {
  const { getElevatorById } = useElevatorStore.getState();
  return Math.abs(getElevatorById(elevatorId).currentFloor.number - from.number) + Math.abs(from.number - to.number);
}

function calculateCost(from: Floor, to: Floor) {
  const { elevators, jobs } = useElevatorStore.getState();

  return elevators.map((elevator) => {
    // current elevator's jobs
    const elevatorJobs = jobs[elevator.id];
    const currentFloor = elevator.currentFloor.number;

    let totalCost = 0;

    if (!elevatorJobs?.length) {
      // If there are no jobs, calculate the cost directly from the current floor to the new job's floors
      totalCost += Math.abs(currentFloor - from.number) + Math.abs(from.number - to.number);
    } else {
      const elevatorDirection = getDirectionOfElevator(elevatorJobs[0].to, elevatorJobs[0].from);

      // If the new job is in the current direction, add it as part of the route
      if (
        (elevatorDirection === 'up' && from.number >= currentFloor) ||
        (elevatorDirection === 'down' && from.number <= currentFloor)
      ) {
        totalCost += Math.abs(currentFloor - from.number) + Math.abs(from.number - to.number);
      } else {
        // If the job requires a direction change, calculate cost from final job's floor
        const finalJob = elevatorJobs[elevatorJobs.length - 1].to.number;
        totalCost += Math.abs(currentFloor - finalJob) + Math.abs(from.number - to.number);
      }
    }

    return { ...elevator, cost: totalCost };
  });
}

export const useElevatorStore = create<ElevatorState>()(
  devtools((set, get) => ({
    floors,
    jobs: {},
    elevators: [
      { id: 0, currentFloor: floors[floors.length - 1] },
      { id: 1, currentFloor: floors[floors.length - 1] },
      { id: 2, currentFloor: floors[floors.length - 1] },
    ],
    requests: [],

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

    addRequest(request) {
      set((state) => ({
        requests: [...state.requests, request],
      }));
    },

    addJob({ from, to }) {
      set((state) => {
        const cheapestElevator = [...calculateCost(from, to)].sort((a, b) => a.cost - b.cost)[0];

        const { [cheapestElevator.id]: existingJobs, ...rest } = state.jobs;

        const pickupJob: Job = { elevatorId: cheapestElevator.id, from: cheapestElevator.currentFloor, to: from };
        const dropOffJob: Job = { elevatorId: cheapestElevator.id, from, to };

        const newJobs: Job[] = [...(existingJobs ? existingJobs : []), pickupJob, dropOffJob];

        return {
          jobs: {
            ...rest,
            [cheapestElevator.id]: newJobs,
          },
        };
      });
    },

    removeJob(job) {
      set((state) => {
        const { [job.elevatorId]: elevatorJobs, ...rest } = state.jobs;

        return {
          jobs: {
            ...rest,
            [job.elevatorId]: elevatorJobs.slice(1),
          },
        };
      });
    },

    getNextJob(elevatorId) {
      const elevatorJobs = get().jobs[elevatorId];

      if (!elevatorJobs?.length) {
        throw new Error('No jobs found for elevator');
      }

      const originalDirection = getDirectionOfElevator(elevatorJobs[0].to, elevatorJobs[0].from);
      const jobsInSameDirection = elevatorJobs.filter(
        (job) => originalDirection === getDirectionOfElevator(job.to, job.from),
      );

      if (!jobsInSameDirection.length) return elevatorJobs[0];

      return [...jobsInSameDirection].sort(
        (a, b) => getCostForElevator(elevatorId, a.from, a.to) - getCostForElevator(elevatorId, b.from, b.to),
      )[0];
    },

    moveElevator(elevatorId, modifier) {
      const { currentFloor } = get().getElevatorById(elevatorId);
      const newFloor = get().getFloorByNumber(currentFloor.number + modifier);

      set((state) => ({
        elevators: state.elevators.map((el) => {
          if (el.id === elevatorId) return { ...el, currentFloor: newFloor };

          return el;
        }),
      }));
    },
  })),
);

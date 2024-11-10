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
  tripId: string;
  to: Floor;
  isPickup?: boolean;
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

  addJob(job: Omit<Job, 'elevatorId' | 'id' | 'tripId'> & { from: Floor }): void;
  removeJob(elevatorId: number, job: Job): void;

  moveElevator(elevatorId: number, modifier: number): void;
};

const NUMBER_OF_FLOORS = 4;

const floors = Array.from({ length: NUMBER_OF_FLOORS }, (_, index) => ({
  number: index,
  ...(index === 0 ? { name: 'G' } : {}),
})).sort((a, b) => b.number - a.number);

function getDirectionOfElevator(to: Floor, from: Floor) {
  return to.number > from.number ? 'moving up' : 'moving down';
}

function getCheapestElevator(from: Floor, to: Floor) {
  const { elevators } = useElevatorStore.getState();

  return elevators
    .map((elevator) => {
      // current elevator's jobs
      const currentFloor = elevator.currentFloor.number;

      let totalCost = 0;

      if (!elevator.jobs.length) {
        // If there are no jobs, calculate the cost directly from the current floor to the new job's floors
        totalCost += Math.abs(currentFloor - from.number) + Math.abs(from.number - to.number);
      } else {
        // If the new job is in the current direction, add it as part of the route
        if (
          (elevator.status === 'moving up' && from.number >= currentFloor) ||
          (elevator.status === 'moving down' && from.number <= currentFloor)
        ) {
          totalCost += Math.abs(currentFloor - from.number) + Math.abs(from.number - to.number);
        } else {
          // If the job requires a direction change, calculate cost from final job's floor
          const finalJob = elevator.jobs[elevator.jobs.length - 1].to.number;
          totalCost += Math.abs(currentFloor - finalJob) + Math.abs(from.number - to.number);
        }
      }

      return { ...elevator, cost: totalCost };
    })
    .sort((a, b) => a.cost - b.cost)[0];
}

export const useElevatorStore = create<ElevatorState>()(
  devtools((set, get) => ({
    floors,
    elevators: [
      { id: 0, currentFloor: floors[floors.length - 1], status: 'idle', jobs: [] },
      // { id: 1, currentFloor: floors[floors.length - 1], status: 'idle', jobs: [] },
      // { id: 2, currentFloor: floors[floors.length - 1], status: 'idle', jobs: [] },
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
        const cheapestElevator = getCheapestElevator(from, to);

        const { jobs: existingJobs } = state.getElevatorById(cheapestElevator.id);

        const tripId = uuidv4();

        const pickupJob: Job = {
          elevatorId: cheapestElevator.id,
          id: uuidv4(),
          to: from,
          isPickup: true,
          tripId,
        };

        const dropOffJob: Job = { elevatorId: cheapestElevator.id, id: uuidv4(), to, tripId };

        const updatedJobs: Job[] = [...existingJobs];

        // only create pickup job if picking up from a different floor
        // if (cheapestElevator.currentFloor.number !== from.number) {
        updatedJobs.push(pickupJob);
        // }

        updatedJobs.push(dropOffJob);

        return {
          elevators: state.elevators.map((el) => {
            if (el.id === cheapestElevator.id) {
              return {
                ...el,
                jobs: updatedJobs.sort((a, b) => {
                  const jobADirection = getDirectionOfElevator(a.to, cheapestElevator.currentFloor);
                  const jobBDirection = getDirectionOfElevator(b.to, cheapestElevator.currentFloor);

                  if (a.to.number === 3) console.log(jobADirection);
                  if (b.to.number === 3) console.log(jobBDirection);

                  const isJobAInSameDirection = cheapestElevator.status === jobADirection;
                  const isJobBInSameDirection = cheapestElevator.status === jobBDirection;

                  // 1. Prioritize direction matching
                  if (isJobAInSameDirection && !isJobBInSameDirection) return -1;
                  if (!isJobAInSameDirection && isJobBInSameDirection) return 1;

                  // 2. Prioritize pickups before dropoffs for the same tripId
                  if (a.tripId === b.tripId) {
                    if (a.isPickup && !b.isPickup) return -1;
                    if (!a.isPickup && b.isPickup) return 1;
                  }

                  // 3. Sort by cost if direction and pickup/dropoff are the same
                  const jobACost = getCheapestElevator(cheapestElevator.currentFloor, a.to);
                  const jobBCost = getCheapestElevator(cheapestElevator.currentFloor, b.to);

                  return jobACost.cost - jobBCost.cost;
                }),
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

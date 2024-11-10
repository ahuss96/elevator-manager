import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { getCheapestElevator, sortTrips } from '@/modules/elevators/stores/utils';

export type Floor = {
  number: number;
  name?: string;
};

type JobStatus = 'pending' | 'in-progress' | 'completed';

export type Job = {
  id: string;
  to: Floor;
  status: JobStatus;
};

export type Trip = {
  id: string;
  elevatorId: number;
  pickup: Job;
  dropOff: Job;
};

type ElevatorStatus = 'idle' | 'moving up' | 'moving down';
export type Elevator = {
  id: number;
  currentFloor: Floor;
  status: ElevatorStatus;
  trips: Trip[];
};

export type ElevatorState = {
  elevators: Elevator[];
  floors: Floor[];

  getElevatorById(elevatorId: number): Elevator;
  getFloorByNumber(floorNum: number): Floor;

  createTrip(job: { to: Floor; from: Floor }): void;
  updateJobStatus(elevatorId: number, jobId: string, newStatus: JobStatus): void;
  removeTrip(elevatorId: number, tripId: string): void;

  updateElevatorStatus(elevatorId: number, status: ElevatorStatus): void;
  moveElevator(elevatorId: number, modifier: number): void;
};

const NUMBER_OF_FLOORS = 4;

const floors = Array.from({ length: NUMBER_OF_FLOORS }, (_, index) => ({
  number: index,
  ...(index === 0 ? { name: 'G' } : {}),
})).sort((a, b) => b.number - a.number);

export const useElevatorStore = create<ElevatorState>()(
  devtools((set, get) => ({
    floors,
    elevators: [
      { id: 0, currentFloor: floors[floors.length - 1], status: 'idle', trips: [] },
      { id: 1, currentFloor: floors[floors.length - 1], status: 'idle', trips: [] },
      { id: 2, currentFloor: floors[floors.length - 1], status: 'idle', trips: [] },
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

    createTrip({ from, to }) {
      console.log(`Elevator requested: ${from.name ?? from.number} to ${to.name ?? to.number}`);
      console.log('\n\n\n');

      set((state) => {
        // Check all elevators to see if any has a matching trip already scheduled
        const existingTrip = state.elevators.some((elevator) =>
          elevator.trips.some(
            (trip) =>
              trip.pickup.to.number === from.number &&
              trip.dropOff.to.number === to.number &&
              trip.pickup.status === 'pending',
          ),
        );

        // If a matching trip already exists, skip creating a new one
        if (existingTrip) {
          console.log(`Warning! A trip from ${from.number} to ${to.number} is already in progress.`);
          return state; // No state update needed if trip exists
        }

        const cheapestElevator = getCheapestElevator(from, to);
        const { trips: existingTrips } = state.getElevatorById(cheapestElevator.id);

        // Create new pickup and drop off jobs
        const pickupJob: Job = {
          id: uuidv4(),
          to: from,
          status: 'pending',
        };

        const dropOffJob: Job = {
          id: uuidv4(),
          to,
          status: 'pending',
        };

        // Add the new trip to the selected elevator’s trips
        const updatedTrips: Trip[] = [
          ...existingTrips,
          {
            id: uuidv4(),
            elevatorId: cheapestElevator.id,
            pickup: pickupJob,
            dropOff: dropOffJob,
          },
        ];

        return {
          elevators: state.elevators.map((el) => {
            if (el.id === cheapestElevator.id) {
              return {
                ...el,
                trips: sortTrips(updatedTrips, el),
              };
            }
            return el;
          }),
        };
      });
    },

    updateJobStatus(elevatorId, jobId, newStatus) {
      set((state) => {
        const elevator = state.getElevatorById(elevatorId);

        const updatedTrips = elevator.trips.map((trip) => {
          if (trip.pickup.id === jobId) {
            return {
              ...trip,
              pickup: { ...trip.pickup, status: newStatus },
            };
          }

          if (trip.dropOff.id === jobId) {
            return {
              ...trip,
              dropOff: { ...trip.dropOff, status: newStatus },
            };
          }

          return trip;
        });

        return {
          elevators: state.elevators.map((el) => (el.id === elevatorId ? { ...el, trips: updatedTrips } : el)),
        };
      });
    },

    removeTrip(elevatorId, tripId) {
      set((state) => {
        const elevator = state.getElevatorById(elevatorId);
        const updatedTrips = elevator.trips.filter((trip) => trip.id !== tripId);

        return {
          elevators: state.elevators.map((el) => (el.id === elevatorId ? { ...el, trips: updatedTrips } : el)),
        };
      });
    },

    moveElevator(elevatorId, modifier) {
      set((state) => {
        const { currentFloor } = state.getElevatorById(elevatorId);
        const newFloor = state.getFloorByNumber(currentFloor.number + modifier);

        return {
          elevators: state.elevators.map((el) => {
            if (el.id === elevatorId)
              return {
                ...el,
                currentFloor: newFloor,
                status: modifier > 0 ? 'moving up' : 'moving down',
              };
            return el;
          }),
        };
      });
    },

    updateElevatorStatus(elevatorId, status) {
      set((state) => ({
        elevators: state.elevators.map((el) => (el.id === elevatorId ? { ...el, status } : el)),
      }));
    },
  })),
);

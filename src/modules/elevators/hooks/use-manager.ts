import { useCallback, useEffect, useReducer } from 'react';

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

type State = {
  elevators: Elevator[];
  jobs: Job[];
};

type Action =
  | { type: 'CREATE_JOB'; job: Job }
  | { type: 'REMOVE_JOB' }
  | { type: 'MOVE_ELEVATOR'; elevatorId: number; newFloor: Floor };

const NUMBER_OF_FLOORS = 7;

const floors: Floor[] = Array.from({ length: NUMBER_OF_FLOORS }, (_, index) => ({
  number: index,
  ...(index === 0 ? { name: 'G' } : {}),
})).sort((a, b) => b.number - a.number);

const getFloorByNumber = (number: number) => {
  const foundFloor = floors.find((floor) => number === floor.number);

  if (!foundFloor) throw new Error("Floor doesn't exist");

  return foundFloor;
};

const initialState: State = {
  elevators: [
    { id: 0, currentFloor: getFloorByNumber(0) },
    { id: 1, currentFloor: getFloorByNumber(0) },
    { id: 2, currentFloor: getFloorByNumber(0) },
    { id: 3, currentFloor: getFloorByNumber(0) },
    { id: 4, currentFloor: getFloorByNumber(0) },
    { id: 5, currentFloor: getFloorByNumber(0) },
  ],
  jobs: [],
};

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'CREATE_JOB':
      return { ...state, jobs: [...state.jobs, action.job] };
    case 'REMOVE_JOB':
      return { ...state, jobs: state.jobs.slice(1) };
    case 'MOVE_ELEVATOR':
      return {
        ...state,
        elevators: state.elevators.map((el) =>
          el.id === action.elevatorId ? { ...el, currentFloor: action.newFloor } : el,
        ),
      };
    default:
      return state;
  }
};

export function useManager() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { elevators, jobs } = state;

  const calculateCost = useCallback(
    (from: Floor, to: Floor) =>
      elevators
        .map((elevator) => {
          const elevatorJobs = jobs.filter((job) => job.elevatorId === elevator.id);
          let totalCost = 0;
          let currentFloor = elevator.currentFloor.number;

          let direction: 'up' | 'down' | null = null;

          if (elevatorJobs.length > 0) {
            direction = elevatorJobs[0].to.number > elevatorJobs[0].from.number ? 'up' : 'down';
          }

          elevatorJobs.forEach((job) => {
            // Move to each job's 'from' floor
            totalCost += Math.abs(currentFloor - job.from.number);
            currentFloor = job.from.number;

            // Move to each job's 'to' floor
            totalCost += Math.abs(currentFloor - job.to.number);
            currentFloor = job.to.number;
          });

          if (direction) {
            // If the new job is in the current direction, add it as part of the route
            if (
              (direction === 'up' && from.number >= currentFloor) ||
              (direction === 'down' && from.number <= currentFloor)
            ) {
              totalCost += Math.abs(currentFloor - from.number) + Math.abs(from.number - to.number);
            } else {
              // If the job requires a direction change, complete all current jobs first
              totalCost +=
                Math.abs(
                  currentFloor - (elevatorJobs.length ? elevatorJobs[elevatorJobs.length - 1].to.number : currentFloor),
                ) + Math.abs(from.number - to.number);
            }
          } else {
            // If there are no jobs, calculate the cost directly from the current floor to the new job's floors
            totalCost += Math.abs(currentFloor - from.number) + Math.abs(from.number - to.number);
          }

          return { ...elevator, cost: totalCost };
        })
        .sort((a, b) => a.cost - b.cost),
    [elevators, jobs],
  );

  const createJob = useCallback(
    (from: Floor) => (to: Floor) => {
      const sortedElevators = calculateCost(from, to);
      const selectedElevator = sortedElevators[0];

      // Create a job to pick up and then go to the destination
      const pickupJob: Job = { elevatorId: selectedElevator.id, from: selectedElevator.currentFloor, to: from };
      const dropOffJob: Job = { elevatorId: selectedElevator.id, from, to };

      if (pickupJob.from.number !== pickupJob.to.number) {
        dispatch({ type: 'CREATE_JOB', job: pickupJob });
      }

      dispatch({ type: 'CREATE_JOB', job: dropOffJob });
    },
    [calculateCost],
  );

  useEffect(() => {
    const interval = setInterval(() => {
      if (jobs.length === 0) {
        console.log('No jobs left to process. Stopping the elevator.');
        clearInterval(interval);
        return;
      }

      elevators.forEach((elevator) => {
        // Find the first job associated with this elevator
        const job = jobs.find((j) => j.elevatorId === elevator.id);

        if (job) {
          console.log(
            `Elevator: ${elevator.id}, Current Floor: ${elevator.currentFloor.number}, From: ${job.from.number}, To: ${job.to.number}`,
          );

          // Move the elevator towards the destination floor
          if (elevator.currentFloor.number < job.to.number) {
            console.log(`Elevator ${elevator.id} moving up to ${elevator.currentFloor.number + 1}`);

            dispatch({
              type: 'MOVE_ELEVATOR',
              elevatorId: elevator.id,
              newFloor: getFloorByNumber(elevator.currentFloor.number + 1),
            });
          } else if (elevator.currentFloor.number > job.to.number) {
            console.log(`Elevator ${elevator.id} moving down to ${elevator.currentFloor.number - 1}`);

            dispatch({
              type: 'MOVE_ELEVATOR',
              elevatorId: elevator.id,
              newFloor: getFloorByNumber(elevator.currentFloor.number - 1),
            });
          }

          // After moving, check if the elevator has reached the destination
          const updatedElevator = elevators.find((el) => el.id === elevator.id);
          if (updatedElevator && updatedElevator.currentFloor.number === job.to.number) {
            console.log(`Elevator ${updatedElevator.id} has arrived at destination ${job.to.number}. Removing job.`);

            dispatch({ type: 'REMOVE_JOB' });
          }
        }
      });

      console.log('\n\n\n\n');
    }, 1000);

    return () => clearInterval(interval);
  }, [jobs, elevators]);

  return {
    createJob,
    elevators,
    jobs,
    floors,
  };
}

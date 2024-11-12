import { Elevator, Job, Trip, useElevatorStore } from '@/modules/elevators/stores/elevator.store';

export function selectNextTrip(elevator: Elevator): Trip | null {
  const { status, trips, currentFloor } = elevator;

  // If the elevator is idle, simply choose the first trip in the queue
  if (status === 'idle') {
    return trips[0] || null;
  }

  // Check if we’re already at a pickup or dropoff floor
  const tripAtCurrentFloor = trips.find(
    (trip) =>
      (trip.pickup.status !== 'completed' && trip.pickup.to.number === currentFloor.number) ||
      (trip.pickup.status === 'completed' && trip.dropOff.to.number === currentFloor.number),
  );

  if (tripAtCurrentFloor) return tripAtCurrentFloor;

  // 1. Prioritise closest dropOff with completed pickup in the same direction
  const closestDropInSameDirAfterPick = trips.find((trip) => {
    const isSameDirection =
      status === 'up' ? trip.dropOff.to.number > currentFloor.number : trip.dropOff.to.number < currentFloor.number;
    return trip.pickup.status === 'completed' && isSameDirection;
  });

  if (closestDropInSameDirAfterPick) return closestDropInSameDirAfterPick;

  // 2. If no trip found, pick the closest pickup job in the same direction
  const closestPickInSameDir = trips.find((trip) => {
    const isSameDirection =
      status === 'up' ? trip.pickup.to.number > currentFloor.number : trip.pickup.to.number < currentFloor.number;
    return trip.pickup.status !== 'completed' && isSameDirection;
  });

  if (closestPickInSameDir) return closestPickInSameDir;

  // 3. If still no trip, pick the closest dropOff with completed pickup in the opposite direction
  const closestDropInOppositeDirAfterPick = trips.find((trip) => {
    const isOppositeDirection =
      status === 'up' ? trip.dropOff.to.number < currentFloor.number : trip.dropOff.to.number > currentFloor.number;
    return trip.pickup.status === 'completed' && isOppositeDirection;
  });

  if (closestDropInOppositeDirAfterPick) return closestDropInOppositeDirAfterPick;

  // 4. If still no trip, pick the closest pickup job in the opposite direction
  const closestPickInOppositeDir = trips.find((trip) => {
    const isOppositeDirection =
      status === 'up' ? trip.pickup.to.number < currentFloor.number : trip.pickup.to.number > currentFloor.number;
    return trip.pickup.status !== 'completed' && isOppositeDirection;
  });

  return closestPickInOppositeDir ?? trips[0];
}

export function handleElevatorMovement(elevator: Elevator, job: Job, jobLogName?: string) {
  const { moveElevator, updateJobStatus } = useElevatorStore.getState();

  if (job.status !== 'in-progress') updateJobStatus(elevator.id, job.id, 'in-progress');

  const direction = elevator.currentFloor.number < job.to.number ? 1 : -1;
  const directionString = direction === 1 ? 'up' : 'down';

  if (jobLogName)
    console.log(
      `Elevator ${elevator.id}: moving ${directionString} from ${elevator.currentFloor.number} to ${jobLogName} on ${job.to.number}`,
    );

  moveElevator(elevator.id, direction);
}

export function completeJobsAtCurrentFloor(elevator: Elevator) {
  const { updateJobStatus, removeTrip } = useElevatorStore.getState();
  const currentFloor = elevator.currentFloor.number;

  // Find all trips with a drop off at the current floor and completed pickup
  elevator.trips.forEach((trip) => {
    if (
      trip.dropOff.to.number === currentFloor &&
      trip.pickup.status === 'completed' &&
      trip.dropOff.status !== 'completed'
    ) {
      // Update the status of the dropoff job to 'completed'
      updateJobStatus(elevator.id, trip.dropOff.id, 'completed');
      removeTrip(elevator.id, trip.id); // Remove the completed trip
    }
  });
}

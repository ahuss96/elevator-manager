import { Elevator, Floor, Trip, useElevatorStore } from '@/modules/elevators/stores/elevator.store';

export function getDirectionOfElevator(to: Floor, from: Floor) {
  return to.number > from.number ? 'moving up' : 'moving down';
}

export function getCost(from: number, to: number) {
  return Math.abs(from - to);
}

export function getCheapestElevator(from: Floor, to: Floor) {
  const { elevators } = useElevatorStore.getState();

  return elevators
    .map((elevator) => {
      const currentFloor = elevator.currentFloor.number;

      // 1. If no trips exist, calculate cost directly from current position
      if (!elevator.trips.length) {
        const initialCost = calculateDirectCost(currentFloor, from.number, to.number);
        return { ...elevator, cost: initialCost };
      }

      // 2. If the elevator has trips, calculate cost based on current direction and trips
      const finalTripFloor = elevator.trips[elevator.trips.length - 1].dropOff.to.number;

      // Determine if the elevator is currently moving in the direction of the pickup
      const isMovingTowardsPickup =
        (elevator.status === 'moving up' && from.number >= currentFloor) ||
        (elevator.status === 'moving down' && from.number <= currentFloor);

      let totalCost;

      if (isMovingTowardsPickup) {
        // If the elevator is already moving towards the pickup floor, calculate direct cost
        totalCost = calculateDirectCost(currentFloor, from.number, to.number);
      } else {
        // If the elevator is moving in the opposite direction, calculate detour cost
        totalCost = calculateDirectionChangeCost(currentFloor, finalTripFloor, from.number, to.number);
      }

      // 3. Factor in the cost to reach the final destination after the pickup
      const detourToDropOffCost = getCost(from.number, to.number);
      totalCost += detourToDropOffCost;

      return { ...elevator, cost: totalCost };
    })
    .sort((a, b) => a.cost - b.cost)[0];
}

// Helper to calculate direct cost when in the same direction
export function calculateDirectCost(currentFloor: number, pickupFloor: number, dropOffFloor: number): number {
  return getCost(currentFloor, pickupFloor) + getCost(pickupFloor, dropOffFloor);
}

// Helper to calculate cost when a direction change is needed
export function calculateDirectionChangeCost(
  currentFloor: number,
  finalJobFloor: number,
  pickupFloor: number,
  dropOffFloor: number,
): number {
  return (
    getCost(currentFloor, finalJobFloor) + getCost(finalJobFloor, pickupFloor) + getCost(pickupFloor, dropOffFloor)
  );
}

export function sortTrips(trips: Trip[], elevator: Elevator): Trip[] {
  const { currentFloor, status: currentDirection } = elevator;

  return trips.sort((tripA, tripB) => {
    // Determine the directions of each trip relative to the current floor
    const directionA = getDirectionOfElevator(tripA.pickup.to, currentFloor);
    const directionB = getDirectionOfElevator(tripB.pickup.to, currentFloor);

    // 1. Prioritise trips with pending drop offs over new pickups if idle
    const hasPendingDropOffA = tripA.dropOff.to.number !== currentFloor.number;
    const hasPendingDropOffB = tripB.dropOff.to.number !== currentFloor.number;

    if (elevator.status === 'idle') {
      if (hasPendingDropOffA && !hasPendingDropOffB) return -1;
      if (!hasPendingDropOffA && hasPendingDropOffB) return 1;
    }

    // 2. If the elevator is moving, prioritise trips in the current direction
    const isTripAInSameDirection = directionA === currentDirection;
    const isTripBInSameDirection = directionB === currentDirection;

    if (isTripAInSameDirection && !isTripBInSameDirection) return -1;
    if (!isTripAInSameDirection && isTripBInSameDirection) return 1;

    // 3. Sort by proximity if direction matches
    const distanceA = getCost(currentFloor.number, tripA.pickup.to.number);
    const distanceB = getCost(currentFloor.number, tripB.pickup.to.number);

    return distanceA - distanceB;
  });
}

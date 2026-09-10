import { addDays, isAfter, isWithinInterval, startOfDay } from 'date-fns';
import type { Outgoing } from './supabase-types';

export interface BillingCycle {
  cycleNumber: number;
  startDate: Date;
  endDate: Date;
  openingQuantity: number;
  rate: number;
  storageCharge: number;
  isFinal: boolean;
}

/**
 * Calculate billing cycles for an inventory item based on:
 * - Fixed 30-day cycles starting from incoming date
 * - Opening balance at start of each cycle determines charge
 * - Outgoing during a cycle only affects NEXT cycle
 * - Final cycle is fully charged even if balance becomes zero mid-cycle
 */
export function calculateBillingCycles(
  incomingDate: Date | string,
  totalQuantity: number,
  coldRate: number,
  outgoingRecords: Outgoing[]
): BillingCycle[] {
  const cycles: BillingCycle[] = [];

  // Handle invalid or missing incoming date
  if (!incomingDate) {
    console.warn('No incoming date provided for billing calculation');
    return cycles;
  }

  const startDate = startOfDay(new Date(incomingDate));

  // Validate the date is valid
  if (isNaN(startDate.getTime())) {
    console.error('Invalid incoming date:', incomingDate);
    return cycles;
  }

  const today = startOfDay(new Date());
  let cycleStartDate = startDate;
  let currentBalance = totalQuantity;
  let cycleNumber = 1;

  // Sort outgoing records by date
  const sortedOutgoing = [...outgoingRecords].sort(
    (a, b) => new Date(a.outgoing_date).getTime() - new Date(b.outgoing_date).getTime()
  );

  // Track which outgoing records have been processed for balance deduction
  const processedOutgoing = new Set<string>();

  while (currentBalance > 0) {
    const cycleEndDate = addDays(cycleStartDate, 29); // 30-day cycle (start + 29 days)
    
    // Stop generating future cycles - only generate up to the cycle that contains today
    // or cycles that have already completed
    if (isAfter(cycleStartDate, today)) {
      break;
    }
    
    // Opening quantity for this cycle
    const openingQuantity = currentBalance;
    
    // Calculate storage charge for this cycle
    const storageCharge = openingQuantity * coldRate;

    // Find outgoing records within this cycle
    const cycleOutgoing = sortedOutgoing.filter(out => {
      const outDate = startOfDay(new Date(out.outgoing_date));
      return isWithinInterval(outDate, { start: cycleStartDate, end: cycleEndDate }) &&
        !processedOutgoing.has(out.id);
    });

    // Mark these as processed and calculate quantity out for next cycle
    let quantityOutThisCycle = 0;
    cycleOutgoing.forEach(out => {
      processedOutgoing.add(out.id);
      quantityOutThisCycle += Number(out.quantity_out);
    });

    // Deduct from balance for NEXT cycle only
    const balanceAfterCycle = currentBalance - quantityOutThisCycle;
    const isFinal = balanceAfterCycle <= 0;

    cycles.push({
      cycleNumber,
      startDate: cycleStartDate,
      endDate: cycleEndDate,
      openingQuantity,
      rate: coldRate,
      storageCharge,
      isFinal,
    });

    // If balance becomes zero, this was the final cycle - stop
    if (isFinal) {
      break;
    }

    // Move to next cycle
    currentBalance = balanceAfterCycle;
    cycleStartDate = addDays(cycleEndDate, 1);
    cycleNumber++;

    // Safety limit to prevent infinite loops
    if (cycleNumber > 100) {
      console.warn('Billing cycle calculation exceeded 100 cycles, stopping');
      break;
    }
  }

  return cycles;
}

/**
 * Calculate total cold storage cost from billing cycles
 */
export function calculateTotalStorageCost(cycles: BillingCycle[]): number {
  return cycles.reduce((sum, cycle) => sum + cycle.storageCharge, 0);
}

/**
 * Get the current billing cycle for an active inventory item
 */
export function getCurrentCycle(cycles: BillingCycle[]): BillingCycle | null {
  const today = startOfDay(new Date());
  
  return cycles.find(cycle => 
    isWithinInterval(today, { start: cycle.startDate, end: cycle.endDate })
  ) || null;
}

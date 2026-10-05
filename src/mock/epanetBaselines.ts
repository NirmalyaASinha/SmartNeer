// EPANET Digital Twin baselines for 18 village sensor nodes
// Simulates hydraulic simulation calculations calibrated for Maharashtra village topography

export interface NodeBaselineRule {
  nominalOnPressureBar: number;
  pressureToleranceBar: number;
  nominalOnFlowLpm: number;
  flowToleranceLpm: number;
  offPressureBar: number;
  offFlowLpm: number;
}

// Rule lookup table per node
export const nodeHydraulicRules: Record<string, NodeBaselineRule> = {
  // ESR Outlet & Pump House
  'NODE-01': { nominalOnPressureBar: 3.2, pressureToleranceBar: 0.25, nominalOnFlowLpm: 420, flowToleranceLpm: 35, offPressureBar: 0.1, offFlowLpm: 0 }, // ESR Outlet
  'NODE-02': { nominalOnPressureBar: 3.5, pressureToleranceBar: 0.30, nominalOnFlowLpm: 440, flowToleranceLpm: 40, offPressureBar: 0.0, offFlowLpm: 0 }, // Pump House Rising Main
  'NODE-03': { nominalOnPressureBar: 2.9, pressureToleranceBar: 0.20, nominalOnFlowLpm: 390, flowToleranceLpm: 30, offPressureBar: 0.08, offFlowLpm: 0 }, // Gateway / GP Office Junction

  // Zone A - North Main Line
  'NODE-04': { nominalOnPressureBar: 2.6, pressureToleranceBar: 0.20, nominalOnFlowLpm: 180, flowToleranceLpm: 18, offPressureBar: 0.05, offFlowLpm: 0 },
  'NODE-05': { nominalOnPressureBar: 2.3, pressureToleranceBar: 0.18, nominalOnFlowLpm: 120, flowToleranceLpm: 15, offPressureBar: 0.04, offFlowLpm: 0 },
  'NODE-06': { nominalOnPressureBar: 1.9, pressureToleranceBar: 0.15, nominalOnFlowLpm: 75, flowToleranceLpm: 10, offPressureBar: 0.02, offFlowLpm: 0 },
  'NODE-07': { nominalOnPressureBar: 1.4, pressureToleranceBar: 0.15, nominalOnFlowLpm: 40, flowToleranceLpm: 8, offPressureBar: 0.01, offFlowLpm: 0 }, // Tail-End North

  // Zone B - Central Village / Market
  'NODE-08': { nominalOnPressureBar: 2.5, pressureToleranceBar: 0.22, nominalOnFlowLpm: 210, flowToleranceLpm: 25, offPressureBar: 0.05, offFlowLpm: 0 },
  'NODE-09': { nominalOnPressureBar: 2.2, pressureToleranceBar: 0.18, nominalOnFlowLpm: 140, flowToleranceLpm: 15, offPressureBar: 0.03, offFlowLpm: 0 },
  'NODE-10': { nominalOnPressureBar: 1.8, pressureToleranceBar: 0.15, nominalOnFlowLpm: 90, flowToleranceLpm: 12, offPressureBar: 0.02, offFlowLpm: 0 },
  'NODE-11': { nominalOnPressureBar: 1.5, pressureToleranceBar: 0.14, nominalOnFlowLpm: 60, flowToleranceLpm: 8, offPressureBar: 0.01, offFlowLpm: 0 },
  'NODE-12': { nominalOnPressureBar: 1.1, pressureToleranceBar: 0.12, nominalOnFlowLpm: 35, flowToleranceLpm: 6, offPressureBar: 0.01, offFlowLpm: 0 }, // School & Anganwadi Tail

  // Zone C - South & Harijan Basti / Farmlands
  'NODE-13': { nominalOnPressureBar: 2.4, pressureToleranceBar: 0.20, nominalOnFlowLpm: 160, flowToleranceLpm: 18, offPressureBar: 0.04, offFlowLpm: 0 },
  'NODE-14': { nominalOnPressureBar: 2.0, pressureToleranceBar: 0.18, nominalOnFlowLpm: 110, flowToleranceLpm: 14, offPressureBar: 0.03, offFlowLpm: 0 }, // Vulnerable segment node
  'NODE-15': { nominalOnPressureBar: 1.6, pressureToleranceBar: 0.15, nominalOnFlowLpm: 70, flowToleranceLpm: 10, offPressureBar: 0.02, offFlowLpm: 0 },
  'NODE-16': { nominalOnPressureBar: 1.2, pressureToleranceBar: 0.14, nominalOnFlowLpm: 45, flowToleranceLpm: 8, offPressureBar: 0.01, offFlowLpm: 0 },
  'NODE-17': { nominalOnPressureBar: 0.9, pressureToleranceBar: 0.12, nominalOnFlowLpm: 28, flowToleranceLpm: 5, offPressureBar: 0.01, offFlowLpm: 0 }, // Tail-End South
  'NODE-18': { nominalOnPressureBar: 0.8, pressureToleranceBar: 0.10, nominalOnFlowLpm: 22, flowToleranceLpm: 5, offPressureBar: 0.01, offFlowLpm: 0 }, // Tail-End East Farmland
};

export function isWaterSupplyScheduled(date: Date): boolean {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const timeVal = hours + minutes / 60;

  // Morning supply: 06:00 to 08:30 (6.0 to 8.5)
  // Evening supply: 17:00 to 19:00 (17.0 to 19.0)
  return (timeVal >= 6.0 && timeVal <= 8.5) || (timeVal >= 17.0 && timeVal <= 19.0);
}

export function getNextSupplyWindowInfo(date: Date): { nextTimeStr: string; countdownStr: string } {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const timeVal = hours + minutes / 60;

  if (timeVal >= 6.0 && timeVal <= 8.5) {
    const minsLeft = Math.round((8.5 - timeVal) * 60);
    return {
      nextTimeStr: 'Morning supply ends at 08:30 AM',
      countdownStr: `${minsLeft}m remaining`,
    };
  }

  if (timeVal >= 17.0 && timeVal <= 19.0) {
    const minsLeft = Math.round((19.0 - timeVal) * 60);
    return {
      nextTimeStr: 'Evening supply ends at 07:00 PM',
      countdownStr: `${minsLeft}m remaining`,
    };
  }

  if (timeVal < 6.0) {
    const minsUntil = Math.round((6.0 - timeVal) * 60);
    const hrs = Math.floor(minsUntil / 60);
    const remMins = minsUntil % 60;
    return {
      nextTimeStr: '06:00 AM (Morning Batch)',
      countdownStr: `in ${hrs}h ${remMins}m`,
    };
  }

  if (timeVal > 8.5 && timeVal < 17.0) {
    const minsUntil = Math.round((17.0 - timeVal) * 60);
    const hrs = Math.floor(minsUntil / 60);
    const remMins = minsUntil % 60;
    return {
      nextTimeStr: '05:00 PM (Evening Batch)',
      countdownStr: `in ${hrs}h ${remMins}m`,
    };
  }

  // After 19:00
  const minsUntil = Math.round((24.0 - timeVal + 6.0) * 60);
  const hrs = Math.floor(minsUntil / 60);
  const remMins = minsUntil % 60;
  return {
    nextTimeStr: 'Tomorrow 06:00 AM',
    countdownStr: `in ${hrs}h ${remMins}m`,
  };
}

export function getEpanetExpectedValues(nodeId: string, timestamp: Date = new Date()) {
  const rule = nodeHydraulicRules[nodeId] || {
    nominalOnPressureBar: 1.5,
    pressureToleranceBar: 0.2,
    nominalOnFlowLpm: 50,
    flowToleranceLpm: 10,
    offPressureBar: 0.05,
    offFlowLpm: 0,
  };

  const isSupplyOn = isWaterSupplyScheduled(timestamp);

  if (isSupplyOn) {
    return {
      expectedPressureBar: rule.nominalOnPressureBar,
      tolerancePressureBar: rule.pressureToleranceBar,
      expectedFlowLpm: rule.nominalOnFlowLpm,
      toleranceFlowLpm: rule.flowToleranceLpm,
      isSupplyOn: true,
    };
  } else {
    return {
      expectedPressureBar: rule.offPressureBar,
      tolerancePressureBar: 0.05,
      expectedFlowLpm: rule.offFlowLpm,
      toleranceFlowLpm: 1.5,
      isSupplyOn: false,
    };
  }
}

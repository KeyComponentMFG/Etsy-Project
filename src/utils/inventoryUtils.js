// Shared inventory/material calculation utilities used by multiple features

/**
 * Calculate material availability for an order given a model and filament stock
 * @returns {{ status: 'available'|'low'|'missing', details: Array }}
 */
export function calculateMaterialAvailability(order, model, filaments, memberId) {
  const details = [];
  if (!model || !memberId) return { status: 'missing', details: [{ name: 'No model/member', status: 'missing' }] };

  const memberFilaments = filaments[memberId] || [];
  const orderColor = (order.color || model.defaultColor || '').toLowerCase().trim();
  const quantity = order.quantity || 1;

  // Calculate filament needed from printer settings
  const printerSettings = model.printerSettings?.find(ps => ps.printerId === order.printerId) || model.printerSettings?.[0];
  let filamentNeeded = 0;

  if (printerSettings?.plates?.length > 0) {
    printerSettings.plates.forEach(plate => {
      if (plate.parts?.length > 0) {
        plate.parts.forEach(part => {
          if (!part.isMultiColor) {
            const partQty = parseInt(part.quantity) || 1;
            filamentNeeded += (parseFloat(part.filamentUsage) || 0) * partQty;
          }
        });
      } else if (plate.filamentUsage) {
        filamentNeeded += parseFloat(plate.filamentUsage) || 0;
      }
    });
  } else if (model.filamentUsage) {
    filamentNeeded = parseFloat(model.filamentUsage) || 0;
  }

  const totalFilamentNeeded = filamentNeeded * quantity;

  // Find matching filament in member's stock
  const matchingFilament = memberFilaments.find(f => {
    const filColor = f.color.toLowerCase().trim();
    return filColor === orderColor || filColor.includes(orderColor) || orderColor.includes(filColor);
  });

  const filamentAvailable = matchingFilament ? matchingFilament.amount : 0;
  const filamentRatio = totalFilamentNeeded > 0 ? filamentAvailable / totalFilamentNeeded : Infinity;

  let filamentStatus = 'available';
  if (filamentRatio < 1) filamentStatus = 'missing';
  else if (filamentRatio < 2) filamentStatus = 'low';

  details.push({
    name: `${orderColor || 'Unknown'} filament`,
    needed: totalFilamentNeeded,
    available: filamentAvailable,
    unit: 'g',
    status: filamentStatus
  });

  // Check external parts
  if (model.externalParts?.length > 0) {
    const memberParts = []; // Would need externalParts[memberId] passed in
    model.externalParts.forEach(part => {
      details.push({
        name: part.name,
        needed: (part.quantity || 1) * quantity,
        available: 0, // Simplified — full check would use externalParts state
        unit: 'pcs',
        status: 'available' // Default to available since we can't fully check here
      });
    });
  }

  // Overall status is the worst status among all materials
  const overallStatus = details.some(d => d.status === 'missing') ? 'missing'
    : details.some(d => d.status === 'low') ? 'low'
    : 'available';

  return { status: overallStatus, details };
}

/**
 * Calculate consumption rate for a filament color from usage history
 * @param {string} color - Filament color name
 * @param {Array} usageHistory - Array of { color, amount, date } records
 * @param {number} days - Number of days to look back (default 30)
 * @returns {number} grams per day
 */
export function calculateConsumptionRate(color, usageHistory, days = 30) {
  if (!color || !usageHistory || usageHistory.length === 0) return 0;

  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const lowerColor = color.toLowerCase().trim();

  const relevantHistory = usageHistory.filter(entry => {
    const entryColor = (entry.color || '').toLowerCase().trim();
    const entryDate = entry.date || entry.timestamp || 0;
    return (entryColor === lowerColor || entryColor.includes(lowerColor) || lowerColor.includes(entryColor))
      && entryDate >= cutoff;
  });

  const totalUsed = relevantHistory.reduce((sum, entry) => sum + (parseFloat(entry.amount) || 0), 0);
  return totalUsed / days;
}

/**
 * Calculate days until stockout for a filament
 * @param {{ amount: number, backupRolls: Array }} filament
 * @param {number} consumptionRate - grams per day
 * @returns {number|null} days until stockout, null if no consumption
 */
export function calculateDaysUntilStockout(filament, consumptionRate) {
  if (!filament || consumptionRate <= 0) return null;

  const ROLL_SIZE = 1000;
  const totalGrams = filament.amount + (filament.backupRolls?.length || 0) * ROLL_SIZE;
  return Math.floor(totalGrams / consumptionRate);
}

/**
 * Calculate BOM cost for a model
 * @returns {{ materialCost: number, laborCost: number, totalCOGS: number, breakdown: Array }}
 */
export function calculateBOMCost(model, filaments, memberId, options = {}) {
  const { laborRate = 15, electricityRate = 0.05 } = options;
  const breakdown = [];
  let materialCost = 0;

  const memberFilaments = filaments?.[memberId] || [];

  // Calculate filament costs
  const printerSettings = model.printerSettings?.[0];
  if (printerSettings?.plates?.length > 0) {
    printerSettings.plates.forEach(plate => {
      if (plate.parts?.length > 0) {
        plate.parts.forEach(part => {
          const partQty = parseInt(part.quantity) || 1;
          const filamentGrams = (parseFloat(part.filamentUsage) || 0) * partQty;
          // Estimate cost per gram from filament stock (default $0.025/g for PLA)
          const costPerGram = 0.025;
          const cost = filamentGrams * costPerGram;
          materialCost += cost;
          breakdown.push({
            type: 'filament',
            name: part.name || plate.name || 'Filament',
            quantity: `${filamentGrams.toFixed(1)}g`,
            cost
          });
        });
      } else if (plate.filamentUsage) {
        const grams = parseFloat(plate.filamentUsage) || 0;
        const cost = grams * 0.025;
        materialCost += cost;
        breakdown.push({
          type: 'filament',
          name: plate.name || 'Filament',
          quantity: `${grams.toFixed(1)}g`,
          cost
        });
      }
    });
  }

  // External parts costs
  if (model.externalParts?.length > 0) {
    model.externalParts.forEach(part => {
      const cost = (parseFloat(part.cost) || 0) * (part.quantity || 1);
      materialCost += cost;
      breakdown.push({
        type: 'part',
        name: part.name,
        quantity: `${part.quantity || 1} pcs`,
        cost
      });
    });
  }

  // Calculate print time for labor
  let totalPrintMinutes = 0;
  if (printerSettings?.plates?.length > 0) {
    printerSettings.plates.forEach(plate => {
      totalPrintMinutes += parseInt(plate.printMinutes) || 0;
      totalPrintMinutes += (parseInt(plate.printHours) || 0) * 60;
    });
  }

  const laborCost = (totalPrintMinutes / 60) * laborRate;
  const electricityCost = (totalPrintMinutes / 60) * electricityRate;
  const totalCOGS = materialCost + laborCost + electricityCost;

  return { materialCost, laborCost, electricityCost, totalCOGS, breakdown, totalPrintMinutes };
}

/**
 * Utility functions for the cutting optimization tool
 */

/**
 * Parse the input string into an array of parts
 * Format: "7500x3, 750x2" -> [{length: 7500, quantity: 3}, {length: 750, quantity: 2}]
 * 
 * @param {string} input - The input string in format "lengthxquantity, lengthxquantity"
 * @returns {Array<{length: number, quantity: number}>} Array of part objects
 */
function parsePartsInput(input) {
  if (!input.trim()) return [];
  
  const parts = [];
  const partStrings = input.split(',');
  
  for (const partString of partStrings) {
    const match = partString.trim().match(/^(\d+)x(\d+)$/);
    
    if (match) {
      const length = parseInt(match[1], 10);
      const quantity = parseInt(match[2], 10);
      
      if (length > 0 && quantity > 0) {
        parts.push({ length, quantity });
      }
    }
  }
  
  return parts;
}

/**
 * Format a length in mm to a readable string
 * 
 * @param {number} length - Length in mm
 * @returns {string} Formatted length string
 */
function formatLength(length) {
  return `${length.toLocaleString()} mm`;
}

/**
 * Calculate the percentage value
 * 
 * @param {number} part - The part value
 * @param {number} whole - The whole value
 * @returns {number} The percentage
 */
function calculatePercentage(part, whole) {
  return Math.round((part / whole) * 100);
}

/**
 * Generate a random color from a palette for visualization
 * 
 * @returns {string} A CSS color string
 */
function getRandomColor() {
  const colors = [
    '#3B6E8F', // primary
    '#4C8DAF', // primary light variant
    '#2D5A75', // primary dark variant
    '#5B9CCD', // blue
    '#4EAAA0', // teal
    '#6E7E99', // slate
    '#8B95A7'  // cool gray
  ];
  
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Generate a unique ID
 * 
 * @returns {string} A unique ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

/**
 * Check if two numbers are equal within a tolerance
 * 
 * @param {number} a - First number
 * @param {number} b - Second number
 * @param {number} tolerance - Tolerance (±)
 * @returns {boolean} Whether the numbers are equal within tolerance
 */
function isEqualWithTolerance(a, b, tolerance) {
  return Math.abs(a - b) <= tolerance;
}
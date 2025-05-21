// backend/services/DiceService.js
const DiceService = {
  // Lanzar un solo dado de n caras (por defecto d6)
  rollDie: (sides = 6) => {
    return Math.floor(Math.random() * sides) + 1;
  },

  // Lanzar múltiples dados
  rollDice: (count = 1, sides = 6) => {
    const results = [];
    for (let i = 0; i < count; i++) {
      results.push(DiceService.rollDie(sides));
    }
    return results;
  },

  // Sumar resultados de dados
  sumDice: (diceResults) => {
    return diceResults.reduce((sum, value) => sum + value, 0);
  },

  // Lanzar dados y obtener la suma
  rollAndSum: (count = 1, sides = 6) => {
    const results = DiceService.rollDice(count, sides);
    return {
      results,
      total: DiceService.sumDice(results)
    };
  }
};

module.exports = DiceService;
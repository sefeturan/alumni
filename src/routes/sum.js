const express = require('express');
const router = express.Router();

/**
 * GET /sum/:number1/:number2
 * Calculates the sum of two numbers provided as path parameters
 * Example: /sum/5/10 -> 15
 */
router.get('/:number1/:number2', (req, res) => {
  const num1 = Number(req.params.number1);
  const num2 = Number(req.params.number2);

  if (isNaN(num1) || isNaN(num2)) {
    return res.status(400).send('Lütfen geçerli sayılar giriniz.');
  }

  const sum = num1 + num2;
  res.send(sum.toString());
});

module.exports = router;

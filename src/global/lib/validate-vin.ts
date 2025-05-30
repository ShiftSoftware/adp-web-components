export default function validateVin(vin): boolean {
  const TransliterationTable = {
    0: 0,
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    7: 7,
    8: 8,
    9: 9,

    A: 1,
    B: 2,
    C: 3,
    D: 4,
    E: 5,
    F: 6,
    G: 7,
    H: 8,

    J: 1,
    K: 2,
    L: 3,
    M: 4,
    N: 5,
    P: 7,
    R: 9,

    S: 2,
    T: 3,
    U: 4,
    V: 5,
    W: 6,
    X: 7,
    Y: 8,
    Z: 9,
  };

  const WeightTable = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];

  let sum = 0;

  let valid = true;

  for (let i = 0; i < vin.length; i++) {
    const char = vin[i].toUpperCase();

    const value = TransliterationTable[char];

    if (value === undefined) {
      valid = false;
      break;
    }

    const weight = WeightTable[i];

    const product = value * weight;

    sum = sum + product;
  }

  let reminder = (sum % 11).toString();

  if (reminder === '10') reminder = 'X';

  if (vin[8] != reminder) {
    valid = false;
  }

  return valid;
}

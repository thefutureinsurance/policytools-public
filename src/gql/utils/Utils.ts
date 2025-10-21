export const nextMonthEffectiveDate = () => {
  const today = new Date();
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  return nextMonth.toISOString().split("T")[0]; // Devuelve en formato 'YYYY-MM-DD'
};

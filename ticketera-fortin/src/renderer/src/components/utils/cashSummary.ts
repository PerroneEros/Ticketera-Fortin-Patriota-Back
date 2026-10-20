// Amounts are whole pesos, so no decimals are shown.
export const formatMoney = (amount: number): string => `$${amount.toLocaleString('es-AR')}`

export const parseInputValue = (val) => {
  const cleanVal = val.replace(/\D/g, '') // Borra puntos, letras y símbolos, deja solo dígitos
  return cleanVal === '' ? 0 : Number(cleanVal)
}

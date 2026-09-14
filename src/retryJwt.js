// Solo para lecturas: esperar permite que el servidor acepte el token ya emitido.
// Renovarlo aquí podría generar otro token que vuelva a parecer del futuro.
export async function retryJwtRead(read, {
  isActive = () => true,
  wait = ms => new Promise(resolve => setTimeout(resolve, ms)),
} = {}) {
  const delays = [1000, 2000, 4000]
  for (let attempt = 0; isActive(); attempt++) {
    try {
      return await read()
    } catch (error) {
      if (!isActive()) return
      if (!/\bJWT issued at future\b/i.test(error?.message || '') || attempt >= delays.length) {
        throw error
      }
      await wait(delays[attempt])
    }
  }
}

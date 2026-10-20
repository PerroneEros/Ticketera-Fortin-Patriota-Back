import { contextBridge, ipcRenderer } from 'electron'

// Only these calls reach the main process; the renderer gets no generic ipcRenderer access.
const api = {
  checkLicense: () => ipcRenderer.invoke('check-license'),

  // Función para mandarle la clave tipeada a Electron
  activateLicense: (key: string) => ipcRenderer.invoke('activate-license', key),

  getApiToken: () => ipcRenderer.invoke('get-api-token')
}

contextBridge.exposeInMainWorld('api', api)

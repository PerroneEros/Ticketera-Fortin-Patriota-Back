declare global {
  interface Window {
    api: {
      checkLicense: () => Promise<{ isLicensed: boolean; machineId: string }>
      activateLicense: (key: string) => Promise<boolean>
      getApiToken: () => Promise<string>
    }
  }
}

export {}

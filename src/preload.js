const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('IPC', {
    send: e => ipcRenderer.send(e),
    on: (e, callback) => ipcRenderer.on(e, callback),
    invoke: (e, data) => ipcRenderer.invoke(e, data),
})
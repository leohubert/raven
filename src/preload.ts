// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import {contextBridge, ipcRenderer, IpcRendererEvent} from "electron";
import {EventPayloads, EventType, Theme} from "./shared";

contextBridge.exposeInMainWorld(
	'electron',
	{
		...(Object.values(EventType)).reduce((acc, event) => {
			acc[event] = (method: (opts: EventPayloads[EventType]) => void) => {

				const handleEvent = (e: IpcRendererEvent, opts: EventPayloads[EventType]) => {
					console.log(`Event received: ${event}`, opts)
					method(opts)
				}

				ipcRenderer.on(event, handleEvent)

				return () => {
					ipcRenderer.removeListener(event, handleEvent)
				}
			}
			return acc
		}, {} as Record<EventType, (method: (opts: EventPayloads[EventType]) => void) => void>),
		onFrontLoaded: async (method: (theme: Theme) => void) => {
			const theme = await ipcRenderer.invoke(EventType.OnFrontLoaded)

			method(theme)
		}
	}
)

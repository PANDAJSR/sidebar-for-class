import { app } from 'electron';

const isDev: boolean = !app.isPackaged;

export {
  isDev
};
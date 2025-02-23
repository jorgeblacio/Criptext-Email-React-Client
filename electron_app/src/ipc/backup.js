const ipc = require('@criptext/electron-better-ipc');
const { shell } = require('electron');
const moment = require('moment');
const {
  createDefaultBackupFolder,
  getDefaultBackupFolder,
  prepareBackupFiles,
  exportBackupUnencrypted,
  exportBackupEncrypted,
  restoreUnencryptedBackup,
  restoreEncryptedBackup
} = require('./../BackupManager');
const globalManager = require('./../globalManager');
const { showNotification } = require('./../notificationManager');
const { sendEventToAllWindows } = require('./../windows/windowUtils');
const {
  defineBackupFileName,
  defineUnitToAppend,
  backupDateFormat
} = require('./../utils/TimeUtils');
const { getSettings, updateSettings } = require('./../DBManager');
global.autoBackupIntervalId = null;

const simulatePause = ms => {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
};

const commitBackupStatus = (eventName, status, params) => {
  sendEventToAllWindows(eventName, params);
  globalManager.backupStatus.set(status);
};

ipc.answerRenderer('create-default-backup-folder', () =>
  createDefaultBackupFolder()
);

const doExportBackupUnencrypted = async params => {
  const { backupPath, notificationParams } = params;
  try {
    globalManager.windowsEvents.disable();
    commitBackupStatus('local-backup-disable-events', 1);
    await prepareBackupFiles({});
    await simulatePause(2000);
    globalManager.windowsEvents.enable();
    commitBackupStatus('local-backup-enable-events', 2);
    const backupSize = await exportBackupUnencrypted({ backupPath });
    commitBackupStatus('local-backup-export-finished', 3, backupSize);
    await simulatePause(2000);
    commitBackupStatus('local-backup-success', null);
    await simulatePause(2000);
    if (notificationParams) {
      showNotification({
        title: notificationParams.success.title,
        message: notificationParams.success.message,
        clickHandler: function() {
          shell.showItemInFolder(backupPath);
        },
        forceToShow: true
      });
    }
    return backupSize;
  } catch (error) {
    globalManager.windowsEvents.enable();
    commitBackupStatus('local-backup-enable-events', null, { error });
    if (notificationParams) {
      showNotification({
        title: notificationParams.error.title,
        message: notificationParams.error.message,
        forceToShow: true
      });
    }
    return 0;
  }
};

ipc.answerRenderer('export-backup-unencrypted', doExportBackupUnencrypted);

ipc.answerRenderer('export-backup-encrypted', async params => {
  const { backupPath, password, notificationParams } = params;
  try {
    globalManager.windowsEvents.disable();
    commitBackupStatus('local-backup-disable-events', 1);
    await prepareBackupFiles({});
    await simulatePause(2000);
    globalManager.windowsEvents.enable();
    commitBackupStatus('local-backup-enable-events', 2);
    const backupSize = await exportBackupEncrypted({
      backupPath,
      password
    });
    commitBackupStatus('local-backup-export-finished', 3, backupSize);
    await simulatePause(2000);
    commitBackupStatus('local-backup-success', null);
    await simulatePause(2000);
    if (notificationParams) {
      showNotification({
        title: notificationParams.success.title,
        message: notificationParams.success.message,
        clickHandler: function() {
          shell.showItemInFolder(backupPath);
        },
        forceToShow: true
      });
    }
    return backupSize;
  } catch (error) {
    globalManager.windowsEvents.enable();
    commitBackupStatus('local-backup-enable-events', null, { error });
    if (notificationParams) {
      showNotification({
        title: notificationParams.error.title,
        message: notificationParams.error.message,
        forceToShow: true
      });
    }
    return 0;
  }
});

ipc.answerRenderer('get-default-backup-folder', () => getDefaultBackupFolder());

ipc.answerRenderer('restore-backup-unencrypted', async ({ backupPath }) => {
  try {
    globalManager.windowsEvents.disable();
    commitBackupStatus('restore-backup-disable-events');
    await prepareBackupFiles({ backupPrevFiles: false });
    await simulatePause(2000);
    globalManager.windowsEvents.enable();
    commitBackupStatus('restore-backup-enable-events');
    await restoreUnencryptedBackup({ filePath: backupPath });
    commitBackupStatus('restore-backup-finished');
    await simulatePause(2000);
    commitBackupStatus('restore-backup-success', null);
  } catch (error) {
    globalManager.windowsEvents.enable();
    commitBackupStatus('restore-backup-enable-events', null, {
      error: error.message
    });
  }
});

ipc.answerRenderer('restore-backup-encrypted', async params => {
  const { backupPath, password } = params;
  try {
    globalManager.windowsEvents.disable();
    commitBackupStatus('restore-backup-disable-events');
    await prepareBackupFiles({ backupPrevFiles: false });
    await simulatePause(2000);
    globalManager.windowsEvents.enable();
    commitBackupStatus('restore-backup-enable-events');
    await restoreEncryptedBackup({ filePath: backupPath, password });
    commitBackupStatus('restore-backup-finished');
    await simulatePause(2000);
    commitBackupStatus('restore-backup-success', null);
  } catch (error) {
    globalManager.windowsEvents.enable();
    commitBackupStatus('restore-backup-enable-events', null, {
      error: error.message
    });
  }
});

const initAutoBackupMonitor = async () => {
  clearTimeout(global.autoBackupIntervalId);
  const {
    autoBackupPath,
    autoBackupFrequency,
    autoBackupNextDate
  } = await getSettings();
  if (!autoBackupNextDate) {
    log('Failed to get next date');
    return;
  }
  const now = moment();
  const pendingDate = moment(autoBackupNextDate);
  const timeDiff = pendingDate.diff(now);

  global.autoBackupIntervalId = setTimeout(async () => {
    try {
      const backupFileName = defineBackupFileName('db');
      const backupSize = await doExportBackupUnencrypted({
        backupPath: `${autoBackupPath}/${backupFileName}`
      });
      const timeUnit = defineUnitToAppend(autoBackupFrequency);
      const today = moment(Date.now());
      const nextDate = moment(autoBackupNextDate);
      do {
        nextDate.add(1, timeUnit);
      } while (nextDate.isBefore(today));
      await updateSettings({
        autoBackupLastDate: pendingDate.format(backupDateFormat),
        autoBackupLastSize: backupSize,
        autoBackupNextDate: nextDate.format(backupDateFormat)
      });
      initAutoBackupMonitor();
    } catch (backupErr) {
      log(
        `Failed to do scheduled backup at ${pendingDate.format(
          backupDateFormat
        )}`
      );
    }
  }, timeDiff);
};

ipc.answerRenderer('init-autobackup-monitor', initAutoBackupMonitor);

const log = message => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[AutoBackup]: ${message}`);
  }
};

process.on('exit', () => {
  global.autoBackupIntervalId = null;
});

module.exports = {
  doExportBackupUnencrypted
};

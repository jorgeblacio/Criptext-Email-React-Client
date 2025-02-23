import { callMain } from '@criptext/electron-better-ipc/renderer';

export const closeCreatingKeysLoadingWindow = () => {
  callMain('close-create-keys-loading');
};

export const getComputerName = () => callMain('get-computer-name');

export const openMailboxWindow = () => {
  callMain('open-mailbox', { firstOpenApp: true });
};

export const throwError = error => {
  callMain('throwError', error);
};

export const sendEndLinkDevicesEvent = () => {
  callMain('end-link-devices-event');
};

export const getSystemLanguage = async () => {
  return await callMain('get-system-language');
};

/* Criptext Client
----------------------------- */
export const acknowledgeEvents = async eventIds => {
  return await callMain('client-acknowledge-events', eventIds);
};

export const getDataReady = async () => {
  return await callMain('client-get-data-ready');
};

export const getKeyBundle = async deviceId => {
  return await callMain('client-get-key-bundle', deviceId);
};

export const linkAccept = async randomId => {
  return await callMain('client-link-accept', randomId);
};

export const linkDeny = async randomId => {
  return await callMain('client-link-deny', randomId);
};

export const postDataReady = async params => {
  return await callMain('client-post-data-ready', params);
};

export const postKeyBundle = async params => {
  return await callMain('client-post-key-bundle', params);
};

export const postUser = async params => {
  return await callMain('client-post-user', params);
};

export const syncAccept = async randomId => {
  return await callMain('client-sync-accept', randomId);
};

export const syncDeny = async randomId => {
  return await callMain('client-sync-deny', randomId);
};

/* DataBase
----------------------------- */
export const cleanDatabase = async username => {
  return await callMain('db-clean-database', username);
};

export const createAccount = async params => {
  return await callMain('db-create-account', params);
};

export const createContact = async params => {
  return await callMain('db-create-contact', params);
};

export const createIdentityKeyRecord = async params => {
  return await callMain('db-create-identity-key-record', params);
};

export const createLabel = async params => {
  return await callMain('db-create-label', params);
};

export const createPreKeyRecord = async params => {
  return await callMain('db-create-prekey-record', params);
};

export const createSessionRecord = async params => {
  return await callMain('db-create-session-record', params);
};

export const createSignedPreKeyRecord = async params => {
  return await callMain('db-create-signed-prekey-record', params);
};

export const createTables = async () => {
  return await callMain('db-create-tables');
};

export const deletePreKeyPair = async params => {
  return await callMain('db-delete-prekey-pair', params);
};

export const deleteSessionRecord = async params => {
  return await callMain('db-delete-session-record', params);
};

export const getAccount = async () => {
  return await callMain('db-get-account');
};

export const getAllLabels = async () => {
  return await callMain('db-get-all-labels');
};

export const getContactByEmails = async emails => {
  return await callMain('db-get-contact-by-emails', emails);
};

export const getIdentityKeyRecord = async params => {
  return await callMain('db-get-identity-key-record', params);
};

export const getPreKeyPair = async params => {
  return await callMain('db-get-prekey-pair', params);
};

export const getSessionRecord = async params => {
  return await callMain('db-get-session-record', params);
};

export const getSignedPreKey = async params => {
  return await callMain('db-get-signed-prekey', params);
};

export const updateAccount = async params => {
  return await callMain('db-update-account', params);
};

export const updateIdentityKeyRecord = async params => {
  return await callMain('db-update-identity-key-record', params);
};

/* DataTransfer
----------------------------- */
export const downloadBackupFile = async address => {
  return await callMain('data-transfer-download', address);
};

export const decryptBackupFile = async key => {
  return await callMain('data-transfer-decrypt', key);
};

export const importDatabase = async () => {
  return await callMain('data-transfer-import');
};

export const clearSyncData = async () => {
  return await callMain('data-transfer-clear-sync-data');
};

export const exportDatabase = async () => {
  return await callMain('data-transfer-export-database');
};

export const encryptDatabaseFile = async () => {
  return await callMain('data-transfer-encrypt');
};

export const uploadDatabaseFile = async randomId => {
  return await callMain('data-transfer-upload', randomId);
};

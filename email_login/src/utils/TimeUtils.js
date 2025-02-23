import moment from 'moment';

const getTimeLocal = time => {
  const timeUTC = moment.utc(time);
  return moment(timeUTC).local();
};

export const parseRateLimitBlockingTime = secondsString => {
  // eslint-disable-next-line fp/no-let
  let seconds = Number(String(secondsString));
  const hours = Math.floor(seconds / 3600);
  // eslint-disable-next-line fp/no-mutation
  seconds %= 3600;
  const minutes = Math.floor(seconds / 60);
  return `${hours ? `${hours}h ` : ''}${minutes ? `${minutes}min` : ''}`;
};

export const defineLastDeviceActivity = time => {
  return moment(getTimeLocal(time)).fromNow();
};

export const PLAN_DETAILS = {
  free: {
  price: 0,
  downloadsPerDay: 1,
  watchTimeMinutes: 30,
  adsFree: false,
},
  bronze: {
    price: 9900,
    downloadsPerDay: 3,
    watchTimeMinutes: 90,
    adsFree: true,
  },
  silver: {
    price: 19900,
    downloadsPerDay: 7,
    watchTimeMinutes: 180,
    adsFree: true,
  },
  gold: {
    price: 49900,
    downloadsPerDay: 999,
    watchTimeMinutes: 999999, // effectively unlimited
    adsFree: true,
  },
};
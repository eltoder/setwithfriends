/** This file contains all public configuration variables for different environments. */

const config = {
  development: {
    firebase: {
      apiKey: "AIzaSyDJbrpSFlmr2D9r9HS0UiFkw_Qk7wlY0lA",
      authDomain: "setwithforks-dev.firebaseapp.com",
      databaseURL: "https://setwithforks-dev-default-rtdb.firebaseio.com",
      projectId: "setwithforks-dev",
      appId: "1:488130851214:web:e656dc30f31e99e160b4df",
    },
  },
  staging: {
    firebase: {
      apiKey: "AIzaSyDJbrpSFlmr2D9r9HS0UiFkw_Qk7wlY0lA",
      authDomain: "setwithforks-dev.firebaseapp.com",
      databaseURL: "https://setwithforks-dev-default-rtdb.firebaseio.com",
      projectId: "setwithforks-dev",
      storageBucket: "setwithforks-dev.firebasestorage.app",
      messagingSenderId: "488130851214",
      appId: "1:488130851214:web:e656dc30f31e99e160b4df",
      measurementId: "G-LQR3228JDG",
    },
  },
  production: {
    firebase: {
      apiKey: "AIzaSyCeKQ4rauZ_fq1rEIPJ8m5XfppwjtmTZBY",
      authDomain: "setwithfriends.com",
      databaseURL: "https://setwithfriends.firebaseio.com",
      projectId: "setwithfriends",
      storageBucket: "setwithfriends.appspot.com",
      messagingSenderId: "970544876139",
      appId: "1:970544876139:web:06295fe4079007f76abf2e",
      measurementId: "G-QDX193SN7R",
    },
  },
};

/** The environment of the application. */
export const env = process.env.REACT_APP_ENV || "development";

/** Indicates whether the app is running in development. */
export const isDev = env === "development";

/** The version number (A.B.C) of the application, set by CI in production builds. */
export const version = process.env.REACT_APP_VERSION ?? null;

export default config[env];

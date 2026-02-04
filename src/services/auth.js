const CLIENT_ID = "644427686366-rkqdbr6ib7eogp842kvjdvnkried48i3.apps.googleusercontent.com";
const SCOPES = [
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/cloud-platform",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile"
].join(" ");

let tokenClient;
let gisInited = false;
let currentToken = null;

export const initAuth = () => {
    return new Promise((resolve) => {
        const checkGis = setInterval(() => {
            if (window.google) {
                tokenClient = window.google.accounts.oauth2.initTokenClient({
                    client_id: CLIENT_ID,
                    scope: SCOPES,
                    callback: (resp) => {
                        if (resp.access_token) {
                            currentToken = resp.access_token;
                            localStorage.setItem('vto_access_token', resp.access_token);
                            resolve(resp.access_token);
                        }
                    },
                });
                gisInited = true;
                clearInterval(checkGis);
                resolve();
            }
        }, 500);
    });
};

export const getAccessToken = async (forceNew = false) => {
    if (!gisInited) await initAuth();
    
    return new Promise((resolve, reject) => {
        tokenClient.callback = (resp) => {
            if (resp.error) {
                reject(resp);
                return;
            }
            currentToken = resp.access_token;
            localStorage.setItem('vto_access_token', resp.access_token);
            resolve(resp.access_token);
        };
        tokenClient.requestAccessToken({ prompt: forceNew ? 'consent' : '' });
    });
};

export const refreshToken = () => getAccessToken(false);

export const getStoredToken = () => {
    return currentToken || localStorage.getItem('vto_access_token');
};

const crypto = require('crypto');
const config = require('../config');

const AUTHORIZE_URL = 'https://access.line.me/oauth2/v2.1/authorize';
const TOKEN_URL = 'https://api.line.me/oauth2/v2.1/token';
const PROFILE_URL = 'https://api.line.me/v2/profile';

function buildState() {
  return crypto.randomBytes(16).toString('hex');
}

function buildAuthorizeUrl(state) {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.line.channelId,
    redirect_uri: config.line.redirectUri,
    state,
    scope: 'profile openid'
  });
  return `${AUTHORIZE_URL}?${params.toString()}`;
}

async function exchangeCodeForToken(code) {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: config.line.redirectUri,
    client_id: config.line.channelId,
    client_secret: config.line.channelSecret
  });
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`LINE token exchange failed (${res.status}): ${text}`);
  }
  return res.json(); // { access_token, id_token, ... }
}

async function fetchProfile(accessToken) {
  const res = await fetch(PROFILE_URL, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`LINE profile fetch failed (${res.status}): ${text}`);
  }
  return res.json(); // { userId, displayName, pictureUrl }
}

module.exports = { buildState, buildAuthorizeUrl, exchangeCodeForToken, fetchProfile };

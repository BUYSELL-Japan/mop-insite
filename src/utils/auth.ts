import { z } from 'zod';

interface TokenResponse {
  access_token: string;
  id_token: string;
  refresh_token: string;
  expires_in: number;
}

const FavoriteResponseSchema = z.object({
  favorites: z.array(z.string())
});

const AUTH_CONFIG = {
  domain: 'ap-southeast-2usngbi9wi.auth.ap-southeast-2.amazoncognito.com',
  clientId: '12nf22nqg8mpcq1q77nm5uqbls',
  redirectUri: 'https://mop-insite.com',
  apiEndpoint: 'https://fs9bcwy98j.execute-api.ap-southeast-2.amazonaws.com/dev'
};

const TOKEN_ENDPOINT = `https://${AUTH_CONFIG.domain}/oauth2/token`;

export async function exchangeCodeForTokens(code: string): Promise<TokenResponse> {
  try {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: AUTH_CONFIG.clientId,
      redirect_uri: AUTH_CONFIG.redirectUri
    });

    const response = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.status}`);
    }

    const tokens = await response.json();
    
    localStorage.setItem('access_token', tokens.access_token);
    localStorage.setItem('id_token', tokens.id_token);
    localStorage.setItem('refresh_token', tokens.refresh_token);
    localStorage.setItem('token_expiry', (Date.now() + tokens.expires_in * 1000).toString());

    return tokens;
  } catch (error) {
    console.error('Token exchange error:', error);
    throw new Error('Failed to exchange code for tokens');
  }
}

export async function refreshTokens(): Promise<TokenResponse> {
  const refreshToken = localStorage.getItem('refresh_token');

  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  try {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: AUTH_CONFIG.clientId
    });

    const response = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.status}`);
    }

    const tokens = await response.json();
    
    localStorage.setItem('access_token', tokens.access_token);
    localStorage.setItem('id_token', tokens.id_token);
    localStorage.setItem('token_expiry', (Date.now() + tokens.expires_in * 1000).toString());

    return tokens;
  } catch (error) {
    console.error('Token refresh error:', error);
    throw new Error('Failed to refresh tokens');
  }
}

export function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to parse JWT:', error);
    return null;
  }
}

export async function checkAndRefreshTokens(): Promise<boolean> {
  const tokenExpiry = localStorage.getItem('token_expiry');
  const refreshToken = localStorage.getItem('refresh_token');

  if (!tokenExpiry || !refreshToken) {
    return false;
  }

  const shouldRefresh = parseInt(tokenExpiry) - Date.now() < 5 * 60 * 1000;

  if (shouldRefresh) {
    try {
      await refreshTokens();
      return true;
    } catch (error) {
      console.error('Failed to refresh tokens:', error);
      return false;
    }
  }

  return true;
}

export async function deleteFavorite(pinId: string): Promise<boolean> {
  await checkAndRefreshTokens();
  const idToken = localStorage.getItem('id_token');
  const sub = localStorage.getItem('sub');

  if (!idToken || !sub) {
    throw new Error('User not authenticated');
  }

  try {
    const url = new URL(`${AUTH_CONFIG.apiEndpoint}/favorites`);
    url.searchParams.append('pin_id', pinId);

    const response = await fetch(url.toString(), {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to delete favorite');
    }

    return true;
  } catch (error) {
    console.error('Error deleting favorite:', error);
    throw error;
  }
}

export async function addToFavorites(pinId: string): Promise<boolean> {
  const idToken = localStorage.getItem('id_token');
  const sub = localStorage.getItem('sub');

  if (!idToken || !sub) {
    throw new Error('User not authenticated');
  }

  try {
    await checkAndRefreshTokens();
    
    const response = await fetch(`${AUTH_CONFIG.apiEndpoint}/favorites`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sub,
        pin_id: pinId
      })
    });

    if (!response.ok) {
      throw new Error('Failed to add favorite');
    }

    return true;
  } catch (error) {
    console.error('Error adding to favorites:', error);
    throw error;
  }
}

export async function getFavorites(): Promise<string[]> {
  const idToken = localStorage.getItem('id_token');
  const sub = localStorage.getItem('sub');

  if (!idToken || !sub) {
    return [];
  }

  try {
    await checkAndRefreshTokens();
    
    const response = await fetch(`${AUTH_CONFIG.apiEndpoint}/favorites`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${idToken}`,
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch favorites');
    }

    const data = await response.json();
    const result = FavoriteResponseSchema.safeParse(data);
    
    if (!result.success) {
      console.error('Invalid response format:', result.error.format());
      return [];
    }

    return result.data.favorites;
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return [];
  }
}
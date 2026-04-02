import { z } from 'zod';

const envSchema = z.object({
  VITE_GEOJSON_URL: z.string().url('Invalid GeoJSON URL').transform(url => {
    // 常に HTTPS を使用
    return url.replace(/^http:/, 'https:');
  })
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(): EnvConfig {
  try {
    const env = {
      VITE_GEOJSON_URL: import.meta.env.VITE_GEOJSON_URL
    };

    const result = envSchema.safeParse(env);

    if (!result.success) {
      console.error('Environment validation failed:', result.error.format());
      throw new Error('Invalid environment configuration');
    }

    return result.data;
  } catch (error) {
    console.error('Environment validation error:', error);
    throw new Error('Failed to validate environment configuration');
  }
}

export function createGeoJsonUrl(baseUrl: string, version: string = '3.23'): URL {
  try {
    const url = new URL(baseUrl);
    
    // バージョンとタイムスタンプを追加
    url.searchParams.set('_v', version);
    url.searchParams.set('_t', Date.now().toString());
    
    return url;
  } catch (error) {
    console.error('Error creating GeoJSON URL:', error);
    throw new Error('Failed to create valid GeoJSON URL');
  }
}
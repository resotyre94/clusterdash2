import { handleUpload } from '@vercel/blob/client';

const DATASET_PATH_PATTERN = /^datasets\/dataset-[a-zA-Z0-9-]+\.json$/;

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = await request.json();
    const result = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (pathname) => {
        if (!DATASET_PATH_PATTERN.test(pathname)) {
          throw new Error('Invalid dataset upload path.');
        }
        return {
          allowedContentTypes: ['application/json'],
          addRandomSuffix: false,
          tokenPayload: 'shared-dashboard-dataset',
        };
      },
    });
    return Response.json(result);
  } catch (error) {
    console.error('Dataset upload token request failed:', error);
    return Response.json(
      { error: 'Could not authorize this dataset upload. Check Vercel Blob configuration.' },
      { status: 400 },
    );
  }
}

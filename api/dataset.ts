import { get, head, put } from '@vercel/blob';

const MANIFEST_PATH = 'datasets/current.json';
const DATASET_PATH_PATTERN = /^datasets\/dataset-[a-zA-Z0-9-]+\.json$/;

interface DatasetManifest {
  pathname: string;
  meta: Record<string, unknown>;
  updatedAt: string;
}

async function readPrivateBlobText(pathname: string): Promise<string | null> {
  const blob = await get(pathname, { access: 'private', useCache: false });
  if (!blob || blob.statusCode !== 200 || !blob.stream) return null;
  return new Response(blob.stream).text();
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method === 'GET') {
    try {
      const manifestText = await readPrivateBlobText(MANIFEST_PATH);
      if (!manifestText) {
        return Response.json({ error: 'No shared dataset has been uploaded yet.' }, { status: 404 });
      }

      const manifest = JSON.parse(manifestText) as DatasetManifest;
      if (!DATASET_PATH_PATTERN.test(manifest.pathname)) {
        return Response.json({ error: 'The shared dataset manifest is invalid.' }, { status: 500 });
      }

      const dataset = await get(manifest.pathname, { access: 'private', useCache: false });
      if (!dataset || dataset.statusCode !== 200 || !dataset.stream) {
        return Response.json({ error: 'The shared dataset file could not be found.' }, { status: 404 });
      }

      return new Response(dataset.stream, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store, max-age=0',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    } catch (error) {
      console.error('Shared dataset load failed:', error);
      return Response.json(
        { error: 'Could not load the shared dataset. Check Vercel Blob configuration.' },
        { status: 503 },
      );
    }
  }

  if (request.method === 'POST') {
    try {
      const body = (await request.json()) as { pathname?: unknown; meta?: unknown };
      if (typeof body.pathname !== 'string' || !DATASET_PATH_PATTERN.test(body.pathname)) {
        return Response.json({ error: 'Invalid dataset pathname.' }, { status: 400 });
      }
      if (!body.meta || typeof body.meta !== 'object') {
        return Response.json({ error: 'Dataset metadata is required.' }, { status: 400 });
      }

      const uploadedBlob = await head(body.pathname);
      if (!uploadedBlob) {
        return Response.json({ error: 'Uploaded dataset was not found.' }, { status: 404 });
      }

      const manifest: DatasetManifest = {
        pathname: body.pathname,
        meta: body.meta as Record<string, unknown>,
        updatedAt: new Date().toISOString(),
      };

      await put(MANIFEST_PATH, JSON.stringify(manifest), {
        access: 'private',
        contentType: 'application/json',
        addRandomSuffix: false,
        allowOverwrite: true,
      });

      return Response.json({ ok: true, updatedAt: manifest.updatedAt });
    } catch (error) {
      console.error('Shared dataset publish failed:', error);
      return Response.json(
        { error: 'Could not publish the shared dataset. Check Vercel Blob configuration.' },
        { status: 503 },
      );
    }
  }

  return Response.json({ error: 'Method not allowed' }, { status: 405, headers: { Allow: 'GET, POST' } });
}

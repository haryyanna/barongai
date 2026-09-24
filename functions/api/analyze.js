import analyze from '../../api/analyze.js';

export async function onRequest({ request, env }) {
  let body = {};
  if (request.method === 'POST') {
    try {
      body = await request.json();
    } catch {
      return Response.json({
        isBarong: false,
        confidence: 0,
        classification: 'error',
        message: 'Request gambar tidak valid.'
      }, { status: 400 });
    }
  }

  let statusCode = 200;
  let responseBody = '';
  const responseHeaders = new Headers();
  const res = {
    setHeader(name, value) {
      responseHeaders.set(name, value);
      return this;
    },
    status(code) {
      statusCode = code;
      return this;
    },
    json(value) {
      responseHeaders.set('Content-Type', 'application/json; charset=utf-8');
      responseBody = JSON.stringify(value);
      return this;
    },
    end() {
      return this;
    }
  };

  await analyze({ method: request.method, body }, res, env);
  return new Response(responseBody, { status: statusCode, headers: responseHeaders });
}

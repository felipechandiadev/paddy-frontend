import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';

const EXCEL_CONTENT_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = (session?.user as any)?.accessToken;
    if (!token) {
      return NextResponse.json({ error: 'No token' }, { status: 401 });
    }

    const incomingParams = request.nextUrl.searchParams;
    const hideAnnulled = incomingParams.get('hideAnnulled') !== 'false';

    const backendParams = new URLSearchParams();
    backendParams.set('includeDeleted', hideAnnulled ? 'false' : 'true');

    const passthroughParams = ['status', 'search', 'sort', 'sortField', 'filters'];

    passthroughParams.forEach((key) => {
      const value = incomingParams.get(key);
      if (value && value.trim().length > 0) {
        backendParams.set(key, value);
      }
    });

    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/operations/receptions/export/excel?${backendParams.toString()}`;

    const backendResponse = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!backendResponse.ok) {
      const detail = await backendResponse.text().catch(() => 'Unknown backend error');
      return NextResponse.json(
        {
          error: `Backend error: ${backendResponse.status}`,
          detail: detail.slice(0, 600),
        },
        { status: backendResponse.status },
      );
    }

    const fileArrayBuffer = await backendResponse.arrayBuffer();
    const contentType =
      backendResponse.headers.get('content-type') || EXCEL_CONTENT_TYPE;
    const contentDisposition =
      backendResponse.headers.get('content-disposition') ||
      'attachment; filename="recepciones.xlsx"';

    return new NextResponse(fileArrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': contentDisposition,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[API][receptions/export] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

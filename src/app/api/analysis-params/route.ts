import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = (session?.user as any)?.accessToken;
    if (!token) {
      return NextResponse.json({ error: 'No token' }, { status: 401 });
    }

    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/configuration/analysis-params`;
    
    const backendResponse = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!backendResponse.ok) {
      return NextResponse.json(
        { error: `Backend error: ${backendResponse.status}` },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();
    
    // Backend returns { success: true, data: { data: [...] } }
    // We need to unwrap and return just the inner data
    const nestedData = data.data;
    if (nestedData && nestedData.data && Array.isArray(nestedData.data)) {
      return NextResponse.json({ data: nestedData.data });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

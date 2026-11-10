import { NextResponse } from 'next/server';
export async function middleware(request) {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') return NextResponse.next();
  if (!request.cookies.has('tn_mentee')) return NextResponse.next();
  try {
    const base=(process.env.NEXT_PUBLIC_API_BASE_URL||'http://localhost:8000').replace(/\/+$/,'');
    const response=await fetch(`${base}/api/m/session`,{headers:{Cookie:request.headers.get('cookie')||''},cache:'no-store',signal:AbortSignal.timeout(3000)});
    if(!response.ok)return NextResponse.next();
    const session=await response.json();
    if(session.role!=='MENTEE')return NextResponse.next();
    const path=request.nextUrl.pathname;
    if(session.mustChangePw && path!=='/change-password')return NextResponse.redirect(new URL('/change-password',request.url));
    if(path.startsWith('/admin')||path.startsWith('/mentor/'))return NextResponse.redirect(new URL('/dashboard',request.url));
    if(path==='/mentor')return NextResponse.redirect(new URL('/dashboard',request.url));
    return NextResponse.next();
  }catch{return NextResponse.next();} // Every API still enforces the role and session itself.
}
export const config={matcher:['/admin/:path*','/mentor/:path*','/mentee/:path*','/dashboard','/change-password']};

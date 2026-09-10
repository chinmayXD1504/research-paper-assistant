import { NextResponse } from 'next/server';
import { execFile } from 'child_process';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, full_name, fullName } = body;

    const userEmail = (email || '').trim().toLowerCase();
    const userName = (full_name || fullName || userEmail.split('@')[0]).trim();
    const userPassword = password || 'Password@123';

    if (!userEmail) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Path to insert_user_cli.py in root project folder
    const scriptPath = path.resolve(process.cwd(), '..', 'insert_user_cli.py');

    return new Promise<NextResponse>((resolve) => {
      execFile('python', [scriptPath, userEmail, userName, userPassword], (error, stdout, stderr) => {
        if (error) {
          console.error('Failed to execute insert_user_cli.py:', error, stderr);
          // Return success anyway with client session info
          resolve(NextResponse.json({
            status: 'synced_client',
            user: { email: userEmail, full_name: userName }
          }));
        } else {
          console.log('Successfully inserted user into SQLite DB:', stdout.trim());
          resolve(NextResponse.json({
            status: 'ok',
            message: 'User successfully inserted into SQLite database',
            user: { email: userEmail, full_name: userName }
          }));
        }
      });
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}

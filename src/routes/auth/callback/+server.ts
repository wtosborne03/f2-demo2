import { redirect } from '@sveltejs/kit';

export const GET = async (event: any) => {
  const {
    url,
    locals: { supabase }
  } = event;

  const code = url.searchParams.get('code') as string;
  const next = url.searchParams.get('next') ?? '/';

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      throw redirect(303, `/${next.slice(1)}`);
    } else {
      // Redirect to the error page with the error message
      throw redirect(303, `/auth/auth-code-error?message=${encodeURIComponent(error.message)}`);
    }
  }

  // If no code is provided, redirect to the error page
  throw redirect(303, '/auth/auth-code-error?message=Authorization code is missing');
};

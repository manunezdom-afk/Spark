// /spark → dashboard. We consolidated the engine selector into the home
// dashboard, so /spark just redirects there.

import { redirect } from 'next/navigation';

export default function SparkRedirect() {
  redirect('/');
}

import type {LoaderFunctionArgs} from 'react-router';
import {redirect} from 'react-router';

// Public-friendly entrypoint that redirects into the embedded app shell.
// Keeps this endpoint lightweight; the embedded `/app/marketing` route handles auth and UI.
export const loader = async ({request}: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  url.pathname = '/app/marketing';
  throw redirect(`${url.pathname}${url.search}`);
};

export default function CrossBorderAgentMarketingRedirect() {
  return null;
}



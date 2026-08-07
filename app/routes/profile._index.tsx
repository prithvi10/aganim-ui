import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { useLoaderData } from "react-router";
import { ProfileHomePage } from "../components/ProfileHomePage";
import { getProfileSeoContext } from "../utils/profileHost";
import { buildProfileIndexMeta } from "../utils/profileSeo";

export function loader({ request }: LoaderFunctionArgs) {
  return {
    seoContext: getProfileSeoContext(request),
  };
}

export const meta: MetaFunction<typeof loader> = ({ data }) =>
  buildProfileIndexMeta(data?.seoContext);

export default function ProfileIndexRoute() {
  const { seoContext } = useLoaderData<typeof loader>();
  return <ProfileHomePage seoContext={seoContext} />;
}

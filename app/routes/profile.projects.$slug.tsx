import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { useLoaderData } from "react-router";
import { ProfileProjectPage as ProfileProjectView } from "../components/ProfileProjectPage";
import {
  getProjectBySlug,
  getProjectMarkdown,
  prepareProjectMarkdown,
} from "../content/profile";
import { getProfileSeoContext } from "../utils/profileHost";
import {
  buildProfileProjectMeta,
} from "../utils/profileSeo";

export function loader({ params, request }: LoaderFunctionArgs) {
  const project = getProjectBySlug(params.slug || "");
  if (!project) {
    throw new Response("Not found", { status: 404 });
  }

  const rawMarkdown = getProjectMarkdown(project.slug);
  if (!rawMarkdown) {
    throw new Response("Not found", { status: 404 });
  }

  return {
    project,
    content: prepareProjectMarkdown(rawMarkdown, project.assetBase),
    seoContext: getProfileSeoContext(request),
  };
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data?.project) {
    return [{ title: "Project Not Found | Prithviraj Pawar" }];
  }

  return buildProfileProjectMeta(data.project, data.seoContext);
};

export default function ProfileProjectRoute() {
  const { project, content, seoContext } = useLoaderData<typeof loader>();
  return (
    <ProfileProjectView
      project={project}
      content={content}
      seoContext={seoContext}
    />
  );
}

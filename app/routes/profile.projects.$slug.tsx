import { Link } from "react-router";
import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { useLoaderData } from "react-router";
import { ArrowLeft, Linkedin } from "lucide-react";
import { ProfileMarkdown } from "../components/ProfileMarkdown";
import { ProfilePageShell } from "../components/ProfileLayout";
import { ProfileJsonLd } from "../components/ProfileJsonLd";
import {
  getProjectBySlug,
  getProjectMarkdown,
  prepareProjectMarkdown,
} from "../content/profile";
import {
  buildProfileProjectMeta,
  buildProfileProjectSchemas,
} from "../utils/profileSeo";

export function loader({ params }: LoaderFunctionArgs) {
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
  };
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data?.project) {
    return [{ title: "Project Not Found | Prithviraj Pawar" }];
  }

  return buildProfileProjectMeta(data.project);
};

export default function ProfileProjectPage() {
  const { project, content } = useLoaderData<typeof loader>();

  const formattedDate = new Date(project.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <ProfilePageShell>
      <ProfileJsonLd schemas={buildProfileProjectSchemas(project)} />

      <Link
        to="/profile#projects"
        className="mb-8 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to projects
      </Link>

      <div className="overflow-hidden rounded-2xl border border-white/10">
        <img
          src={project.featuredImage}
          alt={project.title}
          className="aspect-[21/9] w-full object-cover"
        />
      </div>

      <div className="mt-8 flex flex-col gap-4 border-b border-white/10 pb-8 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="mb-3 flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-fuchsia-500/10 px-3 py-1 text-xs text-fuchsia-200"
              >
                {tag}
              </span>
            ))}
          </div>
          <h1 className="text-3xl font-bold text-white sm:text-4xl">{project.title}</h1>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-300 sm:text-lg">
            {project.summary}
          </p>
        </div>
        <div className="flex flex-col gap-3 text-sm text-slate-400">
          <span>{formattedDate}</span>
          <a
            href={project.linkedinUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sky-300 transition hover:text-sky-200"
          >
            <Linkedin className="h-4 w-4" />
            Connect
          </a>
        </div>
      </div>

      <article className="mt-10 max-w-4xl">
        <ProfileMarkdown content={content} />
      </article>
    </ProfilePageShell>
  );
}

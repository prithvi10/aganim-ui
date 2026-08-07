import { Link } from "react-router";
import { ArrowLeft, Linkedin } from "lucide-react";
import { ProfileMarkdown } from "./ProfileMarkdown";
import { ProfilePageShell } from "./ProfileLayout";
import { ProfileJsonLd } from "./ProfileJsonLd";
import type { ProfileProject } from "../content/profile/types";
import {
  buildProfileProjectSchemas,
} from "../utils/profileSeo";
import type { ProfileSeoContext } from "../utils/profileHost";
import { useProfilePaths } from "../utils/useProfilePaths";

export function ProfileProjectPage({
  project,
  content,
  seoContext,
}: {
  project: ProfileProject;
  content: string;
  seoContext?: ProfileSeoContext;
}) {
  const paths = useProfilePaths();

  const formattedDate = new Date(project.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <ProfilePageShell>
      <ProfileJsonLd schemas={buildProfileProjectSchemas(project, seoContext)} />

      <Link
        to={paths.projectsAnchor}
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

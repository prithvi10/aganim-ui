import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  Briefcase,
  GraduationCap,
  Github,
  Linkedin,
  Mail,
} from "lucide-react";
import {
  ProfilePageShell,
  ProfileSection,
} from "./ProfileLayout";
import { Reveal } from "./LandingLayout";
import {
  formatExperienceDate,
  profileData,
  projectTags,
} from "../content/profile";
import { ProfileJsonLd } from "./ProfileJsonLd";
import {
  buildProfileIndexSchemas,
} from "../utils/profileSeo";
import type { ProfileSeoContext } from "../utils/profileHost";
import { useProfilePaths } from "../utils/useProfilePaths";

// Long-form technical blog series, served as self-contained HTML pages from
// /public/deep-learning. Shown as cards in the Blogs section alongside projects.
type SeriesBlog = {
  href: string;
  title: string;
  summary: string;
  tags: string[];
  featuredImage: string;
  part: string;
};

const SERIES_BLOGS: SeriesBlog[] = [
  {
    href: "/deep-learning/foundations-of-deep-learning.html",
    part: "Part 1",
    title: "Foundations of Deep Learning",
    summary:
      "The ideas behind every LLM — from a single neuron to backpropagation, CNNs, RNNs, and the first glimpse of attention.",
    tags: ["Deep Learning", "Artificial Intelligence", "Machine Learning"],
    featuredImage: "/deep-learning/cover-foundations.png",
  },
  {
    href: "/deep-learning/the-transformer-deep-dive.html",
    part: "Part 2",
    title: "The Transformer, Deep Dive",
    summary:
      "Attention, encoders, and decoders — the 2017 architecture rebuilt block by block, with the math and the intuition.",
    tags: ["Deep Learning", "Artificial Intelligence"],
    featuredImage: "/deep-learning/cover-transformer.png",
  },
  {
    href: "/deep-learning/modern-frontier-llms.html",
    part: "Part 3",
    title: "Modern Frontier LLMs",
    summary:
      "From the Transformer to Claude, Gemini, and GPT — RoPE, RMSNorm, SwiGLU, GQA, MoE, alignment, and scaling laws.",
    tags: ["Deep Learning", "Artificial Intelligence", "Machine Learning"],
    featuredImage: "/deep-learning/cover-frontier.png",
  },
];

export function ProfileHomePage({ seoContext }: { seoContext?: ProfileSeoContext }) {
  const paths = useProfilePaths();
  const [activeTag, setActiveTag] = useState<string>("All");

  useEffect(() => {
    const root = document.documentElement;
    const previous = root.style.scrollBehavior;
    root.style.scrollBehavior = "smooth";
    return () => {
      root.style.scrollBehavior = previous;
    };
  }, []);

  const filteredProjects = useMemo(
    () =>
      profileData.projects.filter((project) =>
        tagMatchesFilter(project.tags, activeTag),
      ),
    [activeTag],
  );

  const filteredSeries = useMemo(
    () => SERIES_BLOGS.filter((blog) => tagMatchesFilter(blog.tags, activeTag)),
    [activeTag],
  );

  return (
    <ProfilePageShell>
      <ProfileJsonLd schemas={buildProfileIndexSchemas(profileData, seoContext)} />

      <ProfileSection id="about" title="Introduction">
        <div className="grid gap-10 lg:grid-cols-[280px,1fr]">
          <Reveal>
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              <img
                src={profileData.avatar}
                alt={profileData.name}
                className="aspect-square w-full rounded-xl object-cover"
              />
              <div className="mt-4 space-y-2">
                <h1 className="text-xl font-semibold text-white">{profileData.name}</h1>
                <p className="text-base font-semibold leading-snug text-white">
                  {profileData.role}
                </p>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href={profileData.social.github}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-300 transition hover:border-white/30 hover:text-white"
                >
                  <Github className="h-3.5 w-3.5" />
                  GitHub
                </a>
                <a
                  href={profileData.social.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-300 transition hover:border-white/30 hover:text-white"
                >
                  <Linkedin className="h-3.5 w-3.5" />
                  LinkedIn
                </a>
              </div>
            </div>
          </Reveal>

          <Reveal>
            <div className="space-y-8">
              {profileData.bio.split("\n").map((paragraph) => (
                <p key={paragraph} className="text-base leading-relaxed text-slate-300 sm:text-lg">
                  {paragraph}
                </p>
              ))}

              <div>
                <div className="mb-4 flex items-center gap-2 text-white">
                  <GraduationCap className="h-5 w-5 text-sky-300" />
                  <h3 className="text-xl font-semibold">Education</h3>
                </div>
                <div className="space-y-4">
                  {profileData.education.map((item) => (
                    <div
                      key={item.course}
                      className="rounded-xl border border-white/10 bg-white/5 p-4"
                    >
                      <p className="font-medium text-white">{item.course}</p>
                      <p className="mt-1 text-sm text-slate-400">{item.institution}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </ProfileSection>

      <ProfileSection id="experience" title="Experience">
        <div className="space-y-6">
          {profileData.experiences.map((experience) => (
            <Reveal key={`${experience.company}-${experience.title}`}>
              <article className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="mb-2 flex items-center gap-2 text-fuchsia-300">
                      <Briefcase className="h-4 w-4" />
                      <span className="text-sm font-medium uppercase tracking-wide">
                        {experience.company}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold text-white">{experience.title}</h3>
                    <p className="mt-1 text-sm text-slate-400">{experience.location}</p>
                  </div>
                  <p className="text-sm font-medium text-sky-300">
                    {formatExperienceDate(experience.dateStart, experience.dateEnd)}
                  </p>
                </div>
                {experience.description && (
                  <p className="mt-4 text-base leading-relaxed text-slate-300">
                    {experience.description}
                  </p>
                )}
              </article>
            </Reveal>
          ))}
        </div>
      </ProfileSection>

      <ProfileSection id="projects" title="Blogs">
        <Reveal>
          <div className="mb-8 flex flex-wrap gap-2">
            {projectTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setActiveTag(tag)}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  activeTag === tag
                    ? "bg-fuchsia-500/20 text-fuchsia-200 ring-1 ring-fuchsia-400/30"
                    : "border border-white/10 text-slate-300 hover:border-white/30 hover:text-white"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </Reveal>

        <div className="grid gap-6 md:grid-cols-2">
          {filteredSeries.map((blog) => (
            <Reveal key={blog.href}>
              <a
                href={blog.href}
                className="group block overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition hover:border-white/20 hover:bg-white/[0.07]"
              >
                <div className="aspect-[16/10] overflow-hidden">
                  <img
                    src={blog.featuredImage}
                    alt={blog.title}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    loading="lazy"
                  />
                </div>
                <div className="p-6">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-violet-500/20 px-2.5 py-1 text-xs font-medium text-violet-200">
                      Series · {blog.part}
                    </span>
                    {blog.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-sky-500/10 px-2.5 py-1 text-xs text-sky-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h3 className="text-lg font-semibold text-white transition group-hover:text-sky-200">
                    {blog.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-400">
                    {blog.summary}
                  </p>
                </div>
              </a>
            </Reveal>
          ))}

          {filteredProjects.map((project) => (
            <Reveal key={project.slug}>
              <Link
                to={paths.project(project.slug)}
                className="group block overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition hover:border-white/20 hover:bg-white/[0.07]"
              >
                <div className="aspect-[16/10] overflow-hidden">
                  <img
                    src={project.featuredImage}
                    alt={project.title}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    loading="lazy"
                  />
                </div>
                <div className="p-6">
                  <div className="mb-3 flex flex-wrap gap-2">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-sky-500/10 px-2.5 py-1 text-xs text-sky-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h3 className="text-lg font-semibold text-white transition group-hover:text-sky-200">
                    {project.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-400">
                    {project.summary}
                  </p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </ProfileSection>

      <ProfileSection id="contact" title="Contact">
        <Reveal>
          <div className="grid gap-6 md:grid-cols-2">
            <a
              href={`mailto:${profileData.email}`}
              className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-white/20 hover:bg-white/[0.07]"
            >
              <div className="rounded-full bg-fuchsia-500/20 p-3 text-fuchsia-200">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Email</p>
                <p className="font-medium text-white">{profileData.email}</p>
              </div>
            </a>
            <a
              href={profileData.social.linkedin}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-white/20 hover:bg-white/[0.07]"
            >
              <div className="rounded-full bg-sky-500/20 p-3 text-sky-200">
                <Linkedin className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-400">LinkedIn</p>
                <p className="font-medium text-white">Connect me on LinkedIn</p>
              </div>
            </a>
          </div>
        </Reveal>
      </ProfileSection>
    </ProfilePageShell>
  );
}

function tagMatchesFilter(projectTagsList: string[], filter: string) {
  if (filter === "All") return true;
  return projectTagsList.some((tag) =>
    tag.toLowerCase().includes(filter.toLowerCase()),
  );
}

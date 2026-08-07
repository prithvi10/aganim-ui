export type ProfileExperience = {
  title: string;
  company: string;
  location: string;
  dateStart: string;
  dateEnd: string;
  description?: string;
};

export type ProfileProject = {
  slug: string;
  title: string;
  summary: string;
  tags: string[];
  date: string;
  featuredImage: string;
  linkedinUrl: string;
  markdownFile: string;
  assetBase: string;
};

export type ProfileData = {
  name: string;
  role: string;
  organizations: { name: string; url: string }[];
  education: { course: string; institution: string }[];
  bio: string;
  email: string;
  social: {
    github: string;
    linkedin: string;
  };
  avatar: string;
  experiences: ProfileExperience[];
  projects: ProfileProject[];
};

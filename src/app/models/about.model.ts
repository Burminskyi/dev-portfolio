export interface AboutModel {
  fullName: string;
  title: string;
  bio: string;
  avatarUrl: string;
  location: string;
  socialLinks: {
    telegramUrl?: string;
    githubUrl?: string;
    linkedinUrl?: string;
  }
}

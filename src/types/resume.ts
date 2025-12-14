export interface BasicInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  github?: string;
  website?: string;
}

export interface Education {
  school: string;
  degree: string;
  major: string;
  startDate: string;
  endDate: string;
  gpa?: string;
  highlights?: string[];
}

export interface WorkExperience {
  company: string;
  title: string;
  location?: string;
  startDate: string;
  endDate: string;
  description: string[];
}

export interface Project {
  name: string;
  description: string;
  technologies: string[];
  url?: string;
}

export interface ParsedResume {
  id: string;
  basicInfo: BasicInfo;
  summary?: string;
  education: Education[];
  workExperience: WorkExperience[];
  skills: string[];
  projects?: Project[];
  certifications?: string[];
  languages?: string[];
  rawText?: string;
  parseDate: string;
}

export interface ParseResumeResponse {
  success: boolean;
  data?: ParsedResume;
  error?: string;
}

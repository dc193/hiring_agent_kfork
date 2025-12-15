import { Mail, Phone, MapPin, Linkedin, Github } from "lucide-react";

interface ContactInfoProps {
  email?: string | null;
  phone?: string | null;
  location?: string | null;
  linkedin?: string | null;
  github?: string | null;
}

export function ContactInfo({ email, phone, location, linkedin, github }: ContactInfoProps) {
  return (
    <>
      <div className="flex flex-wrap gap-4 text-sm text-zinc-600 dark:text-zinc-400">
        {email && (
          <a href={`mailto:${email}`} className="flex items-center gap-1 hover:text-blue-500">
            <Mail className="w-4 h-4" />
            {email}
          </a>
        )}
        {phone && (
          <span className="flex items-center gap-1">
            <Phone className="w-4 h-4" />
            {phone}
          </span>
        )}
        {location && (
          <span className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {location}
          </span>
        )}
      </div>
      {(linkedin || github) && (
        <div className="flex gap-3 mt-3">
          {linkedin && (
            <a href={linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-500 hover:underline text-sm">
              <Linkedin className="w-4 h-4" />
              LinkedIn
            </a>
          )}
          {github && (
            <a href={github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-500 hover:underline text-sm">
              <Github className="w-4 h-4" />
              GitHub
            </a>
          )}
        </div>
      )}
    </>
  );
}

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { put } from "@vercel/blob";
import { ParsedResume, ParseResumeResponse } from "@/types/resume";
import { db, candidates, workExperiences, educations, projects, candidateProfiles, attachments } from "@/db";

const anthropic = new Anthropic();

// Clean JSON string to fix common issues from LLM output
function cleanJsonString(str: string): string {
  // Remove trailing commas before ] or }
  let cleaned = str.replace(/,(\s*[}\]])/g, '$1');
  // Remove any BOM or invisible characters
  cleaned = cleaned.replace(/^\uFEFF/, '');
  return cleaned;
}

// Safely parse JSON with error recovery
function safeJsonParse(str: string): unknown {
  const jsonMatch = str.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No JSON object found in response");
  }

  let jsonStr = cleanJsonString(jsonMatch[0]);

  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    // Try more aggressive cleaning
    // Remove any control characters
    jsonStr = jsonStr.replace(/[\x00-\x1F\x7F]/g, ' ');
    // Fix common quote issues
    jsonStr = jsonStr.replace(/'/g, '"');
    return JSON.parse(jsonStr);
  }
}

const RESUME_PARSE_PROMPT = `You are an expert resume parser. Extract structured information from the following resume text.

Return a JSON object with the following structure:
{
  "basicInfo": {
    "name": "Full name",
    "email": "email@example.com",
    "phone": "phone number",
    "location": "City, State/Country",
    "linkedin": "LinkedIn URL (optional)",
    "github": "GitHub URL (optional)",
    "website": "Personal website (optional)"
  },
  "summary": "Professional summary if present",
  "education": [
    {
      "school": "University name",
      "degree": "Degree type (e.g., Bachelor's, Master's)",
      "major": "Field of study",
      "startDate": "Start date",
      "endDate": "End date or 'Present'",
      "gpa": "GPA if mentioned",
      "highlights": ["Notable achievements"]
    }
  ],
  "workExperience": [
    {
      "company": "Company name",
      "title": "Job title",
      "location": "City, State (optional)",
      "startDate": "Start date",
      "endDate": "End date or 'Present'",
      "description": ["Bullet point descriptions of responsibilities/achievements"]
    }
  ],
  "skills": ["skill1", "skill2", "..."],
  "projects": [
    {
      "name": "Project name",
      "description": "Brief description",
      "technologies": ["tech1", "tech2"],
      "url": "Project URL (optional)"
    }
  ],
  "certifications": ["Certification 1", "..."],
  "languages": ["English", "Spanish", "..."]
}

Important:
- Extract ALL information available in the resume
- For missing optional fields, omit them from the response
- Dates should be in a readable format (e.g., "Jan 2020", "2020", "January 2020")
- Keep descriptions concise but informative
- Return ONLY valid JSON, no additional text

Resume text:
`;

const PROFILE_ANALYSIS_PROMPT = `You are an expert HR analyst. Based on the following parsed resume data, generate a candidate profile analysis (档案画像).

Analyze and return a JSON object with this structure:
{
  "careerStage": "junior|growth|senior|transition",
  "yearsOfExperience": number,
  "hardSkills": [
    {"name": "skill name", "level": 1-5}
  ],
  "softSkills": [
    {"name": "skill name", "level": 1-5}
  ],
  "certifications": ["cert1", "cert2"],
  "knowledgeStructure": {
    "breadth": 1-5,
    "depth": 1-5
  },
  "behaviorPatterns": {
    "communicationStyle": "brief description or null",
    "decisionStyle": "brief description or null",
    "collaborationStyle": "brief description or null"
  },
  "profileSummary": "2-3 sentence summary of who this candidate is and what they can do (in Chinese)"
}

Career Stage Guidelines:
- junior: 0-2 years, entry-level roles
- growth: 2-5 years, growing responsibilities
- senior: 5-10 years, leadership/expert roles
- transition: changing careers or industries

Skill Level Guidelines (1-5):
- 1: Beginner/Learning
- 2: Basic proficiency
- 3: Intermediate/Competent
- 4: Advanced/Expert
- 5: Master/Industry leader

Important:
- Infer years of experience from work history dates
- Rate skills based on how prominently they appear and context
- For behavioral patterns, only fill what can be reasonably inferred
- Write profileSummary in Chinese, focusing on capabilities
- Return ONLY valid JSON

Resume Data:
`;

export async function POST(request: NextRequest): Promise<NextResponse<ParseResumeResponse>> {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Use a placeholder stage - template will be assigned later in candidate detail page
    const initialStage = "initial";

    // Read file content
    const fileBuffer = await file.arrayBuffer();
    const fileType = file.type;

    let textContent: string;

    // Handle PDF files using Claude's vision capability
    if (fileType === "application/pdf") {
      const base64Content = Buffer.from(fileBuffer).toString("base64");

      const visionResponse = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "document",
                source: {
                  type: "base64",
                  media_type: "application/pdf",
                  data: base64Content,
                },
              },
              {
                type: "text",
                text: "Extract all text content from this resume PDF. Return the raw text preserving the structure as much as possible.",
              },
            ],
          },
        ],
      });

      textContent = visionResponse.content[0].type === "text"
        ? visionResponse.content[0].text
        : "";
    } else {
      // For text files, read directly
      textContent = new TextDecoder().decode(fileBuffer);
    }

    // Parse the resume using Claude
    const parseResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: RESUME_PARSE_PROMPT + textContent,
        },
      ],
    });

    const responseText = parseResponse.content[0].type === "text"
      ? parseResponse.content[0].text
      : "";

    // Extract and parse JSON from response
    let parsedData;
    try {
      parsedData = safeJsonParse(responseText);
    } catch (parseError) {
      console.error("JSON parse error:", parseError, "Response:", responseText.substring(0, 500));
      return NextResponse.json(
        { success: false, error: "Failed to parse resume structure" },
        { status: 500 }
      );
    }

    // ============================================
    // Generate Profile Analysis (档案画像)
    // ============================================
    let profileData = null;
    try {
      const profileResponse = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        messages: [
          {
            role: "user",
            content: PROFILE_ANALYSIS_PROMPT + JSON.stringify(parsedData, null, 2),
          },
        ],
      });

      const profileText = profileResponse.content[0].type === "text"
        ? profileResponse.content[0].text
        : "";

      try {
        profileData = safeJsonParse(profileText);
      } catch (profileParseError) {
        console.error("Profile JSON parse error:", profileParseError);
        // Continue without profile data
      }
    } catch (profileError) {
      console.error("Profile analysis error:", profileError);
      // Continue without profile data
    }

    // ============================================
    // Save to database
    // ============================================
    let candidateId: string;

    try {
      // 1. Create candidate record (no template assigned - will be selected later)
      const [newCandidate] = await db.insert(candidates).values({
        templateId: null,
        name: parsedData.basicInfo?.name || "Unknown",
        email: parsedData.basicInfo?.email || null,
        phone: parsedData.basicInfo?.phone || null,
        location: parsedData.basicInfo?.location || null,
        linkedin: parsedData.basicInfo?.linkedin || null,
        github: parsedData.basicInfo?.github || null,
        website: parsedData.basicInfo?.website || null,
        summary: parsedData.summary || null,
        skills: parsedData.skills || [],
        resumeRawText: textContent,
        status: "active",
        pipelineStage: initialStage,
      }).returning();

      candidateId = newCandidate.id;
      console.log("Created candidate:", candidateId);

      // 2. Upload resume file to Blob storage and create attachment
      try {
        const blob = await put(`resumes/${candidateId}/${file.name}`, file, {
          access: "public",
          contentType: fileType,
        });

        await db.insert(attachments).values({
          candidateId,
          pipelineStage: initialStage,
          type: "resume",
          fileName: file.name,
          fileSize: file.size,
          mimeType: fileType,
          blobUrl: blob.url,
          description: "简历原文",
          uploadedBy: null,
        });
        console.log("Saved resume as attachment:", blob.url);
      } catch (blobError) {
        console.error("Failed to save resume as attachment:", blobError);
        // Continue without failing - resume text is already saved
      }
    } catch (dbError) {
      console.error("Database insert error:", dbError);
      throw new Error(`Failed to save candidate to database: ${dbError instanceof Error ? dbError.message : "Unknown error"}`);
    }

    // 2. Save work experiences
    if (parsedData.workExperience && parsedData.workExperience.length > 0) {
      await db.insert(workExperiences).values(
        parsedData.workExperience.map((exp: {
          company: string;
          title: string;
          location?: string;
          startDate?: string;
          endDate?: string;
          description?: string[];
        }) => ({
          candidateId,
          company: exp.company || "",
          title: exp.title || "",
          location: exp.location || null,
          startDate: exp.startDate || null,
          endDate: exp.endDate || null,
          description: exp.description || [],
        }))
      );
    }

    // 3. Save education records
    if (parsedData.education && parsedData.education.length > 0) {
      await db.insert(educations).values(
        parsedData.education.map((edu: {
          school: string;
          degree?: string;
          major?: string;
          startDate?: string;
          endDate?: string;
          gpa?: string;
        }) => ({
          candidateId,
          school: edu.school || "",
          degree: edu.degree || null,
          major: edu.major || null,
          startDate: edu.startDate || null,
          endDate: edu.endDate || null,
          gpa: edu.gpa || null,
        }))
      );
    }

    // 4. Save projects
    if (parsedData.projects && parsedData.projects.length > 0) {
      await db.insert(projects).values(
        parsedData.projects.map((proj: {
          name: string;
          description?: string;
          technologies?: string[];
          url?: string;
        }) => ({
          candidateId,
          name: proj.name || "",
          description: proj.description || null,
          technologies: proj.technologies || [],
          url: proj.url || null,
        }))
      );
    }

    // 5. Save profile data (档案画像)
    if (profileData) {
      try {
        await db.insert(candidateProfiles).values({
          candidateId,
          careerStage: profileData.careerStage || null,
          yearsOfExperience: profileData.yearsOfExperience || null,
          hardSkills: profileData.hardSkills || [],
          softSkills: profileData.softSkills || [],
          certifications: profileData.certifications || parsedData.certifications || [],
          knowledgeStructure: profileData.knowledgeStructure || null,
          behaviorPatterns: profileData.behaviorPatterns || null,
          profileSummary: profileData.profileSummary || null,
        });
        console.log("Created profile for candidate:", candidateId);
      } catch (profileDbError) {
        console.error("Profile database insert error:", profileDbError);
        // Continue without failing - profile can be added later
      }
    }

    // Build response with database ID
    const resume: ParsedResume = {
      id: candidateId,
      basicInfo: parsedData.basicInfo || {
        name: "",
        email: "",
        phone: "",
        location: "",
      },
      summary: parsedData.summary,
      education: parsedData.education || [],
      workExperience: parsedData.workExperience || [],
      skills: parsedData.skills || [],
      projects: parsedData.projects,
      certifications: parsedData.certifications,
      languages: parsedData.languages,
      rawText: textContent,
      parseDate: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, data: resume, candidateId });
  } catch (error) {
    console.error("Resume parsing error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to parse resume"
      },
      { status: 500 }
    );
  }
}

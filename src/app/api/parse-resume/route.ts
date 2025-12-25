import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { ParsedResume, ParseResumeResponse } from "@/types/resume";
import { db, candidates, workExperiences, educations, projects, candidateProfiles, globalSettings, attachments, GLOBAL_SETTING_KEYS } from "@/db";
import { eq } from "drizzle-orm";
import { put } from "@vercel/blob";

const anthropic = new Anthropic();

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

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { success: false, error: "Failed to parse resume structure" },
        { status: 500 }
      );
    }

    const parsedData = JSON.parse(jsonMatch[0]);

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

      const profileJsonMatch = profileText.match(/\{[\s\S]*\}/);
      if (profileJsonMatch) {
        profileData = JSON.parse(profileJsonMatch[0]);
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
      // 1. Create candidate record
      const [newCandidate] = await db.insert(candidates).values({
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
        pipelineStage: "resume_review",
      }).returning();

      candidateId = newCandidate.id;
      console.log("Created candidate:", candidateId);
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

    // ============================================
    // 6. Generate Resume Evaluation (if prompt configured)
    // ============================================
    try {
      // Fetch resume evaluation prompt from global settings
      const [promptSetting] = await db
        .select()
        .from(globalSettings)
        .where(eq(globalSettings.key, GLOBAL_SETTING_KEYS.RESUME_EVALUATION_PROMPT));

      if (promptSetting?.value) {
        console.log("Generating resume evaluation with custom prompt...");

        // Prepare resume data for the prompt
        const resumeData = JSON.stringify({
          basicInfo: parsedData.basicInfo,
          summary: parsedData.summary,
          education: parsedData.education,
          workExperience: parsedData.workExperience,
          skills: parsedData.skills,
          projects: parsedData.projects,
          certifications: parsedData.certifications,
          profile: profileData,
        }, null, 2);

        // Replace placeholder with resume data
        const evaluationPrompt = promptSetting.value.replace("{resume_data}", resumeData);

        // Generate evaluation using Claude
        const evaluationResponse = await anthropic.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4096,
          messages: [
            {
              role: "user",
              content: evaluationPrompt,
            },
          ],
        });

        const evaluationText = evaluationResponse.content[0].type === "text"
          ? evaluationResponse.content[0].text
          : "";

        if (evaluationText) {
          // Create filename with timestamp
          const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, "");
          const fileName = `简历评估_${parsedData.basicInfo?.name || "候选人"}_${timestamp}.md`;

          // Create blob and upload to Vercel Blob
          const blob = new Blob([evaluationText], { type: "text/markdown" });
          const uploadedBlob = await put(
            `candidates/${candidateId}/resume_review/${fileName}`,
            blob,
            { access: "public" }
          );

          // Save as attachment in resume_review stage
          await db.insert(attachments).values({
            candidateId,
            pipelineStage: "resume_review",
            type: "note",
            fileName,
            fileSize: blob.size,
            mimeType: "text/markdown",
            blobUrl: uploadedBlob.url,
            description: "AI 自动生成的简历评估报告",
          });

          console.log("Created resume evaluation attachment:", fileName);
        }
      }
    } catch (evalError) {
      console.error("Resume evaluation error:", evalError);
      // Continue without failing - evaluation can be generated later
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

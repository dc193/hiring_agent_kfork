import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { v4 as uuidv4 } from "uuid";
import { ParsedResume, ParseResumeResponse } from "@/types/resume";

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

    const resume: ParsedResume = {
      id: uuidv4(),
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

    return NextResponse.json({ success: true, data: resume });
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

require('dotenv').config({ path: '../.env' });
/* eslint-env node */
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'placeholder_key',
});

app.post('/api/analyze-project', async (req, res) => {
  try {
    const { description } = req.body;

    if (!description) {
      return res.status(400).json({ error: "Description is required" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    console.log("Gemini API Key found:", !!apiKey);

    if (!apiKey) {
      return res.status(500).json({ error: "Gemini API key not configured" });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are an expert technical project manager. Analyze this project description and return ONLY a valid JSON object with no markdown, no backticks, no explanation.

Project Description: ${description}

Return this exact JSON structure:
{
  "detected_type": "string - project category",
  "confidence": 85,
  "core_requirements": ["requirement 1", "requirement 2", "requirement 3"],
  "implicit_requirements": ["inferred need 1", "inferred need 2", "inferred need 3"],
  "tech_stack": ["technology 1", "technology 2", "technology 3"],
  "ambiguities": ["unclear point 1", "unclear point 2"],
  "completeness_score": 60,
  "risk_score": 45,
  "risk_level": "Medium Risk",
  "risk_reasons": ["reason under 10 words", "reason under 10 words", "reason under 10 words"],
  "milestones": [
    {
      "title": "Milestone 1 Title",
      "deliverables": ["deliverable 1", "deliverable 2", "deliverable 3", "deliverable 4"],
      "deadline_days": 7,
      "payment_percentage": 25,
      "checklist": ["task 1", "task 2", "task 3", "task 4"],
      "complexity": "Medium",
      "confidence": 80
    },
    {
      "title": "Milestone 2 Title",
      "deliverables": ["deliverable 1", "deliverable 2", "deliverable 3", "deliverable 4"],
      "deadline_days": 10,
      "payment_percentage": 25,
      "checklist": ["task 1", "task 2", "task 3", "task 4"],
      "complexity": "Medium",
      "confidence": 80
    },
    {
      "title": "Milestone 3 Title",
      "deliverables": ["deliverable 1", "deliverable 2", "deliverable 3", "deliverable 4"],
      "deadline_days": 10,
      "payment_percentage": 25,
      "checklist": ["task 1", "task 2", "task 3", "task 4"],
      "complexity": "Complex",
      "confidence": 75
    },
    {
      "title": "Milestone 4 Title",
      "deliverables": ["deliverable 1", "deliverable 2", "deliverable 3", "deliverable 4"],
      "deadline_days": 7,
      "payment_percentage": 25,
      "checklist": ["task 1", "task 2", "task 3", "task 4"],
      "complexity": "Simple",
      "confidence": 90
    }
  ]
}

IMPORTANT: Return ONLY the JSON object. No markdown. No backticks. No explanation text.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    let text = response.text();
    text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(text);
    res.json(parsed);

  } catch (error) {
    console.error('Error analyzing project:', error);
    res.status(500).json({ error: 'Failed to analyze project. Please try again later.' });
  }
});

// Step 4: AI Scope Creep Detection
app.post('/api/detect-scope-creep', async (req, res) => {
  try {
    const { message, projectDescription } = req.body;

    if (!message || !projectDescription) {
      return res.status(400).json({ error: 'Message and project description are required.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Gemini API key not configured" });
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
        You are an AI Escrow Manager for a freelancing platform.
        Your job is to detect "Scope Creep" in real-time chat messages between a Client and a Freelancer.
        
        Original Project Description:
        "${projectDescription}"
        
        New Chat Message:
        "${message}"
        
        Analyze the new message. Does it represent a significant addition of work, a new feature, or a change in requirements that goes beyond the bounds of the original project description?
        
        Respond STRICTLY in JSON format with no markdown wrappers or additional text:
        {
            "is_scope_change": boolean,
            "confidence": number (1-100),
            "reason": "Brief, 1-sentence explanation of why it is or isn't scope creep."
        }
        `;

    const result = await model.generateContent(prompt);
    let rawResponse = result.response.text();

    // Strip markdown backticks if present
    rawResponse = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();

    const structuredData = JSON.parse(rawResponse);
    res.json(structuredData);

  } catch (error) {
    console.error('Error detecting scope creep:', error);
    res.status(500).json({ error: 'Failed to check scope creep.' });
  }
});

// Step 4: AI Work Verification
app.post('/api/verify-work', async (req, res) => {
  try {
    const { fileName, milestoneTitle, milestoneChecklist } = req.body;

    if (!fileName || !milestoneTitle) {
      return res.status(400).json({ error: 'fileName and milestoneTitle are required.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Gemini API key not configured" });
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
        You are an AI specialized in verifying freelance digital deliverables.
        
        A freelancer has submitted a file for a specific milestone.
        
        File Submitted: "${fileName}"
        Target Milestone: "${milestoneTitle}"
        Checklist Requirements:
        "${milestoneChecklist}"
        
        Based on the file name and the milestone requirements, estimate if this submission likely satisfies the requirements. 
        (In a real app, you would analyze the actual file contents. For this prototype, synthesize a highly realistic, professional assessment purely based on the names and checklist.)
        
        Respond STRICTLY in JSON format with no markdown wrappers or additional text:
        {
            "pfi_score": number (0-100, representing percentage of requirements met),
            "status": "APPROVED" | "REVISION_NEEDED" | "REJECTED",
            "explanation": "A 2-3 paragraph detailed professional explanation of the assessment.",
            "issues_found": ["Issue 1", "Issue 2"] // Array of strings, empty if APPROVED
        }
        `;

    const result = await model.generateContent(prompt);
    let rawResponse = result.response.text();

    // Strip markdown backticks if present
    rawResponse = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();

    const structuredData = JSON.parse(rawResponse);
    res.json(structuredData);

  } catch (error) {
    console.error('Error verifying work:', error);
    res.status(500).json({ error: 'Failed to verify work.' });
  }
});

// Step 5: PFI Score Calculation with Claude
app.post('/api/calculate-pfi', async (req, res) => {
  try {
    const { freelancerData } = req.body;

    if (!freelancerData) {
      return res.status(400).json({ error: 'Freelancer data is required.' });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      // Mock response if no key to allow testing UI
      return res.json({
        total_score: 845,
        trust_level: "Elite",
        factor_scores: {
          tcr: 0.95,
          qvs: 0.88,
          atd: 0.92,
          cfw: 0.4,
          re: 0.9
        },
        fraud_flags: {
          velocity: "Passed",
          network: "Passed",
          value: "Passed",
          account_age: "Passed"
        },
        badges: ["Reliable", "Top Quality"]
      });
    }

    const prompt = `
        Calculate freelancer PFI score using the exact formula:
        PFI = (TCR × 300) + (QVS × 250) + (ATD × 200) + (CFW × 150) + (RE × 100)
        
        Factor Definitions:
        - TCR: Task Completion Rate (0-1)
        - QVS: Quality Verification Score (0-1)
        - ATD: Average Time to Delivery (0-1, 1 is perfect)
        - CFW: Correctness of Frequency / Work (0-1)
        - RE: Requirement Expansion / Compliance (0-1)
        
        Freelancer Data:
        ${JSON.stringify(freelancerData)}
        
        Return ONLY valid JSON:
        {
          "total_score": number (0-1000),
          "trust_level": "Elite" | "Verified" | "Rising" | "Newcomer",
          "factor_scores": { "tcr": number, "qvs": number, "atd": number, "cfw": number, "re": number },
          "fraud_flags": { "velocity": "Passed" | "Flagged", "network": "Passed" | "Flagged", "value": "Passed" | "Flagged", "account_age": "Passed" | "Flagged" },
          "badges": ["badge 1", "badge 2"]
        }
    `;

    const msg = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    });

    const text = msg.content[0].text;
    const parsed = JSON.parse(text);
    res.json(parsed);

  } catch (error) {
    console.error('Error calculating PFI:', error);
    res.status(500).json({ error: 'Failed to calculate PFI score.' });
  }
});

app.listen(port, () => {
  console.log(`FairLance AI backend running at http://localhost:${port}`);
});

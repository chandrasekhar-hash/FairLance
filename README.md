# FairLance
FairLance is an AI-powered freelancing platform that acts as a neutral middleman between clients and freelancers. It reads project descriptions, generates structured milestones, locks payments in escrow, verifies completed work automatically, and releases funds without human intervention. Fair for everyone. Automated from start to finish.

# FairLance — AI Freelancing Platform

FairLance was built as a solution to a problem statement given during Cognizance Fest at IIT Roorkee, as part of a 36-hour hackathon.

The problem focused on trust issues in freelancing platforms — where clients fear paying for incomplete work and freelancers fear not getting paid after delivery. Existing platforms rely heavily on human moderation, which is slow, inconsistent, and not always fair.

FairLance approaches this differently by using AI to handle structure, verification, and payments.

Instead of manual intervention, the system:

* Converts vague project descriptions into clear milestones
* Detects scope changes during conversations
* Verifies submitted work against requirements
* Controls payments through predefined rules
* Maintains a transparent reputation score for freelancers

The goal is to reduce disputes and make freelancing more predictable and fair for both sides.

---

## What it does

* AI-based project structuring
* Scope creep detection in chat
* Work verification using AI
* Rule-based payment system with audit trail
* Freelancer scoring system (PFI)
* Simple dispute handling system

---

## Tech Stack

Frontend: React
Backend: Node.js + Express
Database: Supabase with localStorage fallback

AI:

* Gemini for analysis and verification
* Groq for chat monitoring
* Claude for scoring

---

## Run Locally

```bash
git clone https://github.com/yourusername/fairlance.git
cd fairlance
npm install
cd server && npm install
```

Start backend:

```bash
node index.js
```

Start frontend:

```bash
npm run dev
```

Open http://localhost:5173

---

## Note

This project was built under a strict 36-hour hackathon constraint, focusing on solving a real-world problem using AI-driven systems instead of manual moderation.

---

FairLance — a system where fairness is enforced, not assumed.

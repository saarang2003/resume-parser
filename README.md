```markdown
# 📄 resume-parser

> A robust and extensible PDF resume parser for Node.js that extracts structured data like contact info, education, skills, projects, experience, and more.

---

## 📦 Installation

Install the package via npm:

```bash
npm install resume-parser
```

---

## 🚀 Usage

Here's how to use the resume-parser in your Node.js project:

```javascript
const ResumeParser = require('resume-parser');
const parser = new ResumeParser();

(async () => {
  const data = await parser.parseResume('./upload/resume.pdf');
  console.log(data);
})();
```

---

## 📋 Sample Output

The parser extracts structured data from a resume PDF and returns it in the following JSON format:

```json
{
  "name": "John Doe",
  "contact": {
    "email": "john@example.com",
    "phone": "123-456-7890",
    "linkedin": "https://linkedin.com/in/johndoe",
    "github": "https://github.com/johndoe",
    "portfolio": "https://johndoe.dev"
  },
  "profile": "Full Stack Developer with 3 years of experience building scalable web applications using MERN stack.",
  "education": [
    {
      "institution": "XYZ University",
      "degree": "B.Tech",
      "field": "Computer Science",
      "duration": "Aug 2018 – May 2022",
      "gpa": "8.6",
      "location": "New York"
    }
  ],
  "experience": [
    {
      "title": "Software Engineer Intern",
      "company": "TechCorp",
      "duration": "May 2021 – Jul 2021",
      "location": "Remote",
      "responsibilities": [
        "Developed RESTful APIs using Node.js and Express",
        "Integrated MongoDB with backend services",
        "Optimized existing React components"
      ]
    }
  ],
  "projects": [
    {
      "name": "MyPortfolio",
      "technologies": ["React", "Node.js", "MongoDB"],
      "duration": "Jan 2022 – Mar 2022",
      "description": [
        "Designed and developed a personal portfolio site",
        "Deployed using Vercel and GitHub Pages"
      ],
      "links": ["https://github.com/johndoe/myportfolio"]
    }
  ],
  "skills": {
    "languages": ["JavaScript", "Python", "C++"],
    "frameworks": ["React", "Express", "Next.js"],
    "databases": ["MongoDB", "MySQL"],
    "tools": ["Git", "Docker", "Jenkins"],
    "libraries": ["Pandas", "NumPy"],
    "other": ["REST APIs", "Agile"]
  },
  "achievements": [
    "Top 5 finalist in Hack the Mountains 2022",
    "Published npm package: resume-parser"
  ],
  "languages": ["English", "Hindi"],
  "interests": ["Reading", "Gaming", "Public Speaking"]
}
```

---

## 🔍 Features

- ✅ Extracts structured data from resumes in PDF format
- ✅ Detects and categorizes:
  - Contact Information (email, phone, GitHub, LinkedIn)
  - Education & GPA
  - Work Experience with bullet responsibilities
  - Projects with technologies & links
  - Skills grouped by type (e.g., frameworks, tools, databases)
  - Achievements, Languages, and Interests
- ✅ Works on most resume layouts
- ✅ Cleaned and normalized output
- ✅ Lightweight and easy to integrate in Node.js

---

## 🧪 Local Testing

To test the parser locally, set up a new project:

```bash
mkdir test-project
cd test-project
npm init -y
npm install resume-parser
```

Then, create a test script (e.g., `test.js`):

```javascript
const ResumeParser = require('resume-parser');
const parser = new ResumeParser();

(async () => {
  const data = await parser.parseResume('./resume.pdf');
  console.log(data);
})();
```

Run the script with:

```bash
node test.js
```

Ensure you have a `resume.pdf` file in the project directory under upload folder.

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request with your improvements.

1. Fork the repository
2. Create a new branch (`git checkout -b feature-branch`)
3. Commit your changes (`git commit -m 'Add new feature'`)
4. Push to the branch (`git push origin feature-branch`)
5. Open a Pull Request

---


const fs = require('fs');
const pdf = require('pdf-parse');

class ResumeParser {
  constructor() {
    this.sectionPatterns = {
      contact: /^(contact|personal\s+info|contact\s+info)/i,
      profile: /^(profile|summary|objective|about|professional\s+summary|career\s+objective)/i,
      education: /^(education|academic|qualification|degree|university|college)/i,
      experience: /^(experience|work|employment|professional|career|internship)/i,
      projects: /^(projects|portfolio|work\s+samples|personal\s+projects)/i,
      skills: /^(skills|technical|technologies|programming|competencies|expertise)/i,
      achievements: /^(achievements|awards|honors|accomplishments|certifications|certificates)/i,
      languages: /^(languages|linguistic)/i,
      interests: /^(interests|hobbies|activities)/i
    };

    this.contactPatterns = {
      email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      phone: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+?\d{1,3}[-.\s]?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/g,
      linkedin: /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+/gi,
      github: /(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9-]+/gi,
      portfolio: /(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-z]{2,}(\/[^\s]*)?/gi
    };

    this.datePatterns = {
      range: /((Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|\d{4})\s*[-–—]\s*((Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|\d{4}|present|current)/gi,
      year: /\b\d{4}\b/g
    };

    this.degreePatterns = /\b(Bachelor|Master|PhD|Associate|Diploma|Certificate|B\.?Tech|M\.?Tech|B\.?Sc|M\.?Sc|B\.?A|M\.?A|MBA|BBA|HSC|SSC|12th|10th)\b/gi;

    this.skillCategories = {
      languages: ['java', 'python', 'javascript', 'typescript', 'c++', 'c#', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin', 'scala', 'r', 'matlab', 'sql', 'html', 'css'],
      frameworks: ['react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask', 'spring', 'laravel', 'rails', 'asp.net', 'fastapi', 'nextjs', 'nuxtjs'],
      databases: ['mysql', 'postgresql', 'mongodb', 'redis', 'sqlite', 'oracle', 'sql server', 'cassandra', 'dynamodb'],
      tools: ['git', 'docker', 'kubernetes', 'jenkins', 'travis', 'circleci', 'aws', 'azure', 'gcp', 'heroku', 'vercel', 'netlify'],
      libraries: ['pandas', 'numpy', 'matplotlib', 'opencv', 'tensorflow', 'pytorch', 'scikit-learn', 'jquery', 'bootstrap', 'material-ui']
    };
  }

  // ----- CORE LOGIC -----
  async parseResume(filePath) {
    try {
      const buffer = fs.readFileSync(filePath);
      const data = await pdf(buffer);
      const lines = this._splitLines(this._cleanText(data.text));

      const resumeData = this._initResumeStructure();
      this._parseHeader(lines.slice(0, 10), resumeData);
      this._parseSections(lines, resumeData);
      this._postProcess(resumeData);

      return resumeData;
    } catch (err) {
      throw new Error('Failed to parse resume: ' + err.message);
    }
  }

  _initResumeStructure() {
    return {
      name: '',
      contact: {
        email: '', phone: '', linkedin: '', github: '', portfolio: ''
      },
      profile: '',
      education: [],
      experience: [],
      projects: [],
      skills: {
        languages: [], frameworks: [], databases: [], tools: [], libraries: [], other: []
      },
      achievements: [],
      languages: [],
      interests: []
    };
  }

  // ----- TEXT CLEANUP -----
  _cleanText(text) {
    return text
      .replace(/[\u0080-\uFFFF]/g, ' ')
      .replace(/\s*\n\s*/g, '\n')
      .replace(/\s{2,}/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .trim();
  }

  _splitLines(text) {
    const rawLines = text.split('\n').map(line => line.trim()).filter(Boolean);
    const merged = [];
    let buffer = '';

    for (let line of rawLines) {
      if (this._shouldMerge(buffer, line)) {
        buffer += ' ' + line;
      } else {
        if (buffer) merged.push(buffer.trim());
        buffer = line;
      }
    }
    if (buffer) merged.push(buffer.trim());
    return merged;
  }

  _shouldMerge(curr, next) {
    if (!curr) return false;
    if (this._isSectionHeader(next)) return false;
    if (this.datePatterns.range.test(next)) return false;
    if (/^[•\-*]\s/.test(next)) return false;
    return curr.length < 50 && !this.contactPatterns.email.test(curr);
  }

  // ----- HEADER + CONTACT -----
  _parseHeader(lines, data) {
    for (let i = 0; i < Math.min(3, lines.length); i++) {
      if (this._isLikelyName(lines[i])) {
        data.name = lines[i];
        break;
      }
    }
    for (const line of lines) {
      this._extractContact(line, data.contact);
    }
  }

  _isLikelyName(line) {
    const words = line.split(/\s+/);
    if (words.length > 5 || /\d|@|\.com/.test(line)) return false;
    return /^[A-Z][a-z]+\s[A-Z][a-z]+/.test(line);
  }

  _extractContact(line, contact) {
    for (const [type, regex] of Object.entries(this.contactPatterns)) {
      const match = line.match(regex);
      if (match && !contact[type]) contact[type] = match[0];
    }
  }

  // ----- SECTION DETECTION -----
  _parseSections(lines, data) {
    let current = null, buffer = [];

    for (const line of lines) {
      const section = this._detectSection(line);
      if (section) {
        if (current) this._processSection(current, buffer, data);
        current = section;
        buffer = [];
      } else if (current) {
        buffer.push(line);
      }
    }
    if (current) this._processSection(current, buffer, data);
  }

  _detectSection(line) {
    const normalized = line.toLowerCase().replace(/[^a-z\s]/g, '').trim();
    for (const [section, pattern] of Object.entries(this.sectionPatterns)) {
      if (pattern.test(normalized)) return section;
    }
    return null;
  }

  _isSectionHeader(line) {
    return this._detectSection(line) !== null;
  }

  _processSection(section, lines, data) {
    const method = `_parse_${section}`;
    if (typeof this[method] === 'function') {
      data[section] = this[method](lines);
    } else if (['profile'].includes(section)) {
      data[section] = lines.join(' ');
    }
  }

  // ----- SECTION PARSERS -----
  _parse_education(lines) {
    const entries = [];
    let current = {};

    for (const line of lines) {
      if (this.containsInstitution(line)) {
        if (Object.keys(current).length) entries.push(current);
        current = { institution: line, degree: '', duration: '', gpa: '' };
      }
      const degree = line.match(this.degreePatterns);
      const duration = line.match(this.datePatterns.range);
      const gpa = line.match(/GPA[:\s]*([\d.]+)/i);
      if (degree) current.degree = degree[0];
      if (duration) current.duration = duration[0];
      if (gpa) current.gpa = gpa[1];
    }
    if (Object.keys(current).length) entries.push(current);
    return entries;
  }

  _parse_experience(lines) {
    const entries = [];
    let current = { title: '', company: '', duration: '', responsibilities: [] };

    for (const line of lines) {
      const duration = line.match(this.datePatterns.range);
      if (duration) {
        if (current.title) entries.push(current);
        current = { title: '', company: '', duration: duration[0], responsibilities: [] };
        const [before, after] = line.split(duration[0]);
        if (after && after.includes('@')) {
          [current.title, current.company] = after.split('@').map(x => x.trim());
        } else {
          current.title = before.trim();
        }
      } else if (/^[•\-*]\s/.test(line)) {
        current.responsibilities.push(line.replace(/^[•\-*]\s/, '').trim());
      }
    }
    if (current.title) entries.push(current);
    return entries;
  }

  _parse_projects(lines) {
    const projects = [];
    let current = { name: '', technologies: [], description: [], links: [] };

    for (const line of lines) {
      if (line.includes('|') || this.datePatterns.range.test(line)) {
        if (current.name) projects.push(current);
        current = { name: line.split('|')[0].trim(), technologies: [], description: [], links: [] };

        const techMatch = line.match(/\|(.+)$/);
        if (techMatch) {
          current.technologies = techMatch[1].split(/[,;]/).map(t => t.trim());
        }

        const links = line.match(this.contactPatterns.github) || line.match(this.contactPatterns.portfolio);
        if (links) current.links.push(...links);
      } else if (/^[•\-*]\s/.test(line)) {
        current.description.push(line.replace(/^[•\-*]\s/, '').trim());
      }
    }
    if (current.name) projects.push(current);
    return projects;
  }

  _parse_skills(lines) {
    const skills = { languages: [], frameworks: [], databases: [], tools: [], libraries: [], other: [] };

    for (const line of lines) {
      const match = line.match(/^([^:]+):\s*(.+)$/);
      const items = match ? match[2] : line;
      const skillList = items.split(/[,;]/).map(x => x.trim());

      this._categorizeSkills(skillList, skills);
    }

    // Deduplicate
    for (const key in skills) {
      skills[key] = [...new Set(skills[key].map(s => s.toLowerCase()))];
    }

    return skills;
  }

  _parse_achievements(lines) {
    return lines.map(l => l.replace(/^[•\-*]\s/, '').trim()).filter(Boolean);
  }

  _parse_languages(lines) {
    return [...new Set(lines.flatMap(l => l.split(/[,;]/).map(x => x.trim())))];
  }

  _parse_interests(lines) {
    return [...new Set(lines.flatMap(l => l.split(/[,;]/).map(x => x.trim())))];
  }

  _categorizeSkills(list, target) {
    for (const skill of list) {
      const lower = skill.toLowerCase();
      let found = false;
      for (const [cat, terms] of Object.entries(this.skillCategories)) {
        if (terms.includes(lower)) {
          target[cat].push(skill);
          found = true;
          break;
        }
      }
      if (!found) target.other.push(skill);
    }
  }

  containsInstitution(line) {
    return /university|college|institute|school|hsc|ssc/i.test(line) || this.datePatterns.range.test(line);
  }

  // ----- CLEANUP -----
  _postProcess(data) {
    if (!data.name) data.name = 'Unknown';
    for (const key of Object.keys(data.contact)) {
      if (!data.contact[key]) delete data.contact[key];
    }
    for (const key of Object.keys(data)) {
      if (Array.isArray(data[key]) && data[key].length === 0) delete data[key];
    }
  }
}

module.exports = { ResumeParser };


// Example usage
if (require.main === module) {
  (async () => {
    const parser = new ResumeParser();
    try {
      const result = await parser.parseResume('./upload/barkha_resume_public.pdf');
      fs.writeFileSync('parsed_resume.json', JSON.stringify(result, null, 2));
      console.log('✅ Resume parsed and saved to parsed_resume.json');
    } catch (err) {
      console.error('❌ Error:', err.message);
    }
  })();
}

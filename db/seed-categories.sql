-- Seed Job Categories
-- Run this SQL in your Vercel Postgres or Supabase SQL Editor

-- Insert Parent Categories
INSERT INTO job_categories (name, slug, description, icon, parent_id) VALUES
('Engineering', 'engineering', 'Software development and engineering roles', 'Code', NULL),
('Data & AI', 'data', 'Data science, machine learning, and analytics', 'Database', NULL),
('Product & Design', 'product', 'Product management and design roles', 'Package', NULL),
('Business', 'business', 'Sales, marketing, operations, and customer roles', 'Briefcase', NULL),
('Other', 'other', 'Other professional roles', 'MoreHorizontal', NULL)
ON CONFLICT (slug) DO NOTHING;

-- Insert Engineering Child Categories
INSERT INTO job_categories (name, slug, description, icon, parent_id) VALUES
('Frontend Developer', 'engineering.frontend', 'Build user interfaces with React, Vue, Angular, etc.', 'Layout', (SELECT id FROM job_categories WHERE slug = 'engineering')),
('React Developer', 'engineering.frontend.react', 'Specialized in React.js development', 'Atom', (SELECT id FROM job_categories WHERE slug = 'engineering')),
('Vue Developer', 'engineering.frontend.vue', 'Specialized in Vue.js development', 'Layers', (SELECT id FROM job_categories WHERE slug = 'engineering')),
('Angular Developer', 'engineering.frontend.angular', 'Specialized in Angular development', 'Triangle', (SELECT id FROM job_categories WHERE slug = 'engineering')),
('Backend Developer', 'engineering.backend', 'Server-side development with Node.js, Python, Java, Go, etc.', 'Server', (SELECT id FROM job_categories WHERE slug = 'engineering')),
('Node.js Developer', 'engineering.backend.nodejs', 'Specialized in Node.js backend development', 'Hexagon', (SELECT id FROM job_categories WHERE slug = 'engineering')),
('Python Developer', 'engineering.backend.python', 'Specialized in Python backend development', 'Code2', (SELECT id FROM job_categories WHERE slug = 'engineering')),
('Java Developer', 'engineering.backend.java', 'Specialized in Java backend development', 'Coffee', (SELECT id FROM job_categories WHERE slug = 'engineering')),
('Go Developer', 'engineering.backend.go', 'Specialized in Go/Golang development', 'Zap', (SELECT id FROM job_categories WHERE slug = 'engineering')),
('Full Stack Developer', 'engineering.fullstack', 'Both frontend and backend development', 'Layers', (SELECT id FROM job_categories WHERE slug = 'engineering')),
('Mobile Developer', 'engineering.mobile', 'iOS, Android, React Native, Flutter development', 'Smartphone', (SELECT id FROM job_categories WHERE slug = 'engineering')),
('DevOps Engineer', 'engineering.devops', 'CI/CD, infrastructure, cloud platforms', 'Settings', (SELECT id FROM job_categories WHERE slug = 'engineering')),
('QA Engineer', 'engineering.qa', 'Software testing and quality assurance', 'CheckCircle', (SELECT id FROM job_categories WHERE slug = 'engineering')),
('Security Engineer', 'engineering.security', 'Application and infrastructure security', 'Shield', (SELECT id FROM job_categories WHERE slug = 'engineering')),
('Blockchain Developer', 'engineering.blockchain', 'Web3, Smart Contracts, DeFi development', 'Link', (SELECT id FROM job_categories WHERE slug = 'engineering'))
ON CONFLICT (slug) DO NOTHING;

-- Insert Data & AI Child Categories
INSERT INTO job_categories (name, slug, description, icon, parent_id) VALUES
('Data Scientist', 'data.science', 'Data analysis, statistical modeling, insights', 'TrendingUp', (SELECT id FROM job_categories WHERE slug = 'data')),
('Data Engineer', 'data.engineer', 'Data pipelines, ETL, data infrastructure', 'GitBranch', (SELECT id FROM job_categories WHERE slug = 'data')),
('Data Analyst', 'data.analyst', 'Data analysis, reporting, visualization', 'BarChart', (SELECT id FROM job_categories WHERE slug = 'data')),
('ML/AI Engineer', 'ml.ai', 'Machine learning, artificial intelligence, deep learning', 'Brain', (SELECT id FROM job_categories WHERE slug = 'data')),
('AI Engineer', 'ml.ai.engineer', 'AI/ML model development, deployment, and optimization', 'Cpu', (SELECT id FROM job_categories WHERE slug = 'data')),
('AI Agent Developer', 'ml.ai.agent', 'LLM agents, autonomous systems, chatbots, AI assistants', 'Bot', (SELECT id FROM job_categories WHERE slug = 'data')),
('LLM Engineer', 'ml.ai.llm', 'Large Language Models, prompt engineering, fine-tuning', 'MessageSquare', (SELECT id FROM job_categories WHERE slug = 'data')),
('Computer Vision Engineer', 'ml.ai.vision', 'Image processing, object detection, CV models', 'Eye', (SELECT id FROM job_categories WHERE slug = 'data')),
('NLP Engineer', 'ml.ai.nlp', 'Natural Language Processing, text analysis, language models', 'Type', (SELECT id FROM job_categories WHERE slug = 'data')),
('MLOps Engineer', 'ml.ai.mlops', 'ML model deployment, monitoring, infrastructure', 'Gauge', (SELECT id FROM job_categories WHERE slug = 'data'))
ON CONFLICT (slug) DO NOTHING;

-- Insert Product & Design Child Categories
INSERT INTO job_categories (name, slug, description, icon, parent_id) VALUES
('Product Manager', 'product.manager', 'Product strategy, roadmap, feature planning', 'Target', (SELECT id FROM job_categories WHERE slug = 'product')),
('Product Designer', 'product.designer', 'End-to-end product design', 'Palette', (SELECT id FROM job_categories WHERE slug = 'product')),
('UX Designer', 'ux.designer', 'User experience research and design', 'User', (SELECT id FROM job_categories WHERE slug = 'product')),
('UI Designer', 'ui.designer', 'User interface and visual design', 'Paintbrush', (SELECT id FROM job_categories WHERE slug = 'product'))
ON CONFLICT (slug) DO NOTHING;

-- Insert Business Child Categories
INSERT INTO job_categories (name, slug, description, icon, parent_id) VALUES
('Sales', 'business.sales', 'Sales and business development', 'DollarSign', (SELECT id FROM job_categories WHERE slug = 'business')),
('Marketing', 'business.marketing', 'Digital marketing, content marketing, growth', 'Megaphone', (SELECT id FROM job_categories WHERE slug = 'business')),
('Operations', 'business.operations', 'Business operations and management', 'Settings', (SELECT id FROM job_categories WHERE slug = 'business')),
('Customer Success', 'business.customer_success', 'Customer success and account management', 'UserCheck', (SELECT id FROM job_categories WHERE slug = 'business')),
('Customer Support', 'business.customer_support', 'Customer support and service', 'Headphones', (SELECT id FROM job_categories WHERE slug = 'business'))
ON CONFLICT (slug) DO NOTHING;

-- Insert Other Child Categories
INSERT INTO job_categories (name, slug, description, icon, parent_id) VALUES
('Content Writer', 'other.content', 'Content writing, copywriting, technical writing', 'FileText', (SELECT id FROM job_categories WHERE slug = 'other')),
('HR & Recruiting', 'other.hr', 'Human resources, recruiting, talent acquisition', 'Users', (SELECT id FROM job_categories WHERE slug = 'other')),
('Finance', 'other.finance', 'Finance, accounting, FP&A', 'Calculator', (SELECT id FROM job_categories WHERE slug = 'other')),
('Legal', 'other.legal', 'Legal counsel, compliance', 'Scale', (SELECT id FROM job_categories WHERE slug = 'other')),
('General', 'other.general', 'Other roles not categorized above', 'Folder', (SELECT id FROM job_categories WHERE slug = 'other'))
ON CONFLICT (slug) DO NOTHING;

-- Verify the results
SELECT COUNT(*) as total_categories FROM job_categories;
SELECT name, slug, (SELECT COUNT(*) FROM job_categories c2 WHERE c2.parent_id = c1.id) as child_count 
FROM job_categories c1 
WHERE parent_id IS NULL 
ORDER BY name;

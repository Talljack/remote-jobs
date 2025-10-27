import { eq } from "drizzle-orm";

import { db, jobCategories } from "@/db";

interface CategoryData {
  name: string;
  slug: string;
  description: string;
  icon?: string;
  parentSlug?: string;
}

const CATEGORIES: CategoryData[] = [
  // Engineering - Parent
  {
    name: "Engineering",
    slug: "engineering",
    description: "Software development and engineering roles",
    icon: "Code",
  },
  // Engineering - Frontend (More detailed)
  {
    name: "Frontend Developer",
    slug: "engineering.frontend",
    description: "Build user interfaces with React, Vue, Angular, etc.",
    icon: "Layout",
    parentSlug: "engineering",
  },
  {
    name: "React Developer",
    slug: "engineering.frontend.react",
    description: "Specialized in React.js development",
    icon: "Atom",
    parentSlug: "engineering",
  },
  {
    name: "Vue Developer",
    slug: "engineering.frontend.vue",
    description: "Specialized in Vue.js development",
    icon: "Layers",
    parentSlug: "engineering",
  },
  {
    name: "Angular Developer",
    slug: "engineering.frontend.angular",
    description: "Specialized in Angular development",
    icon: "Triangle",
    parentSlug: "engineering",
  },
  // Engineering - Backend (More detailed)
  {
    name: "Backend Developer",
    slug: "engineering.backend",
    description: "Server-side development with Node.js, Python, Java, Go, etc.",
    icon: "Server",
    parentSlug: "engineering",
  },
  {
    name: "Node.js Developer",
    slug: "engineering.backend.nodejs",
    description: "Specialized in Node.js backend development",
    icon: "Hexagon",
    parentSlug: "engineering",
  },
  {
    name: "Python Developer",
    slug: "engineering.backend.python",
    description: "Specialized in Python backend development",
    icon: "Code2",
    parentSlug: "engineering",
  },
  {
    name: "Java Developer",
    slug: "engineering.backend.java",
    description: "Specialized in Java backend development",
    icon: "Coffee",
    parentSlug: "engineering",
  },
  {
    name: "Go Developer",
    slug: "engineering.backend.go",
    description: "Specialized in Go/Golang development",
    icon: "Zap",
    parentSlug: "engineering",
  },
  // Engineering - Other
  {
    name: "Full Stack Developer",
    slug: "engineering.fullstack",
    description: "Both frontend and backend development",
    icon: "Layers",
    parentSlug: "engineering",
  },
  {
    name: "Mobile Developer",
    slug: "engineering.mobile",
    description: "iOS, Android, React Native, Flutter development",
    icon: "Smartphone",
    parentSlug: "engineering",
  },
  {
    name: "DevOps Engineer",
    slug: "engineering.devops",
    description: "CI/CD, infrastructure, cloud platforms",
    icon: "Settings",
    parentSlug: "engineering",
  },
  {
    name: "QA Engineer",
    slug: "engineering.qa",
    description: "Software testing and quality assurance",
    icon: "CheckCircle",
    parentSlug: "engineering",
  },
  {
    name: "Security Engineer",
    slug: "engineering.security",
    description: "Application and infrastructure security",
    icon: "Shield",
    parentSlug: "engineering",
  },
  {
    name: "Blockchain Developer",
    slug: "engineering.blockchain",
    description: "Web3, Smart Contracts, DeFi development",
    icon: "Link",
    parentSlug: "engineering",
  },

  // Data & AI - Parent
  {
    name: "Data & AI",
    slug: "data",
    description: "Data science, machine learning, and analytics",
    icon: "Database",
  },
  // Data & AI - Data roles
  {
    name: "Data Scientist",
    slug: "data.science",
    description: "Data analysis, statistical modeling, insights",
    icon: "TrendingUp",
    parentSlug: "data",
  },
  {
    name: "Data Engineer",
    slug: "data.engineer",
    description: "Data pipelines, ETL, data infrastructure",
    icon: "GitBranch",
    parentSlug: "data",
  },
  {
    name: "Data Analyst",
    slug: "data.analyst",
    description: "Data analysis, reporting, visualization",
    icon: "BarChart",
    parentSlug: "data",
  },
  // Data & AI - AI/ML roles (More detailed)
  {
    name: "ML/AI Engineer",
    slug: "ml.ai",
    description: "Machine learning, artificial intelligence, deep learning",
    icon: "Brain",
    parentSlug: "data",
  },
  {
    name: "AI Engineer",
    slug: "ml.ai.engineer",
    description: "AI/ML model development, deployment, and optimization",
    icon: "Cpu",
    parentSlug: "data",
  },
  {
    name: "AI Agent Developer",
    slug: "ml.ai.agent",
    description: "LLM agents, autonomous systems, chatbots, AI assistants",
    icon: "Bot",
    parentSlug: "data",
  },
  {
    name: "LLM Engineer",
    slug: "ml.ai.llm",
    description: "Large Language Models, prompt engineering, fine-tuning",
    icon: "MessageSquare",
    parentSlug: "data",
  },
  {
    name: "Computer Vision Engineer",
    slug: "ml.ai.vision",
    description: "Image processing, object detection, CV models",
    icon: "Eye",
    parentSlug: "data",
  },
  {
    name: "NLP Engineer",
    slug: "ml.ai.nlp",
    description: "Natural Language Processing, text analysis, language models",
    icon: "Type",
    parentSlug: "data",
  },
  {
    name: "MLOps Engineer",
    slug: "ml.ai.mlops",
    description: "ML model deployment, monitoring, infrastructure",
    icon: "Gauge",
    parentSlug: "data",
  },

  // Product & Design - Parent
  {
    name: "Product & Design",
    slug: "product",
    description: "Product management and design roles",
    icon: "Package",
  },
  // Product & Design - Children
  {
    name: "Product Manager",
    slug: "product.manager",
    description: "Product strategy, roadmap, feature planning",
    icon: "Target",
    parentSlug: "product",
  },
  {
    name: "Product Designer",
    slug: "product.designer",
    description: "End-to-end product design",
    icon: "Palette",
    parentSlug: "product",
  },
  {
    name: "UX Designer",
    slug: "ux.designer",
    description: "User experience research and design",
    icon: "User",
    parentSlug: "product",
  },
  {
    name: "UI Designer",
    slug: "ui.designer",
    description: "User interface and visual design",
    icon: "Paintbrush",
    parentSlug: "product",
  },

  // Business - Parent
  {
    name: "Business",
    slug: "business",
    description: "Sales, marketing, operations, and customer roles",
    icon: "Briefcase",
  },
  // Business - Children
  {
    name: "Sales",
    slug: "business.sales",
    description: "Sales and business development",
    icon: "DollarSign",
    parentSlug: "business",
  },
  {
    name: "Marketing",
    slug: "business.marketing",
    description: "Digital marketing, content marketing, growth",
    icon: "Megaphone",
    parentSlug: "business",
  },
  {
    name: "Operations",
    slug: "business.operations",
    description: "Business operations and management",
    icon: "Settings",
    parentSlug: "business",
  },
  {
    name: "Customer Success",
    slug: "business.customer_success",
    description: "Customer success and account management",
    icon: "UserCheck",
    parentSlug: "business",
  },
  {
    name: "Customer Support",
    slug: "business.customer_support",
    description: "Customer support and service",
    icon: "Headphones",
    parentSlug: "business",
  },

  // Other - Parent
  {
    name: "Other",
    slug: "other",
    description: "Other professional roles",
    icon: "MoreHorizontal",
  },
  // Other - Children
  {
    name: "Content Writer",
    slug: "other.content",
    description: "Content writing, copywriting, technical writing",
    icon: "FileText",
    parentSlug: "other",
  },
  {
    name: "HR & Recruiting",
    slug: "other.hr",
    description: "Human resources, recruiting, talent acquisition",
    icon: "Users",
    parentSlug: "other",
  },
  {
    name: "Finance",
    slug: "other.finance",
    description: "Finance, accounting, FP&A",
    icon: "Calculator",
    parentSlug: "other",
  },
  {
    name: "Legal",
    slug: "other.legal",
    description: "Legal counsel, compliance",
    icon: "Scale",
    parentSlug: "other",
  },
  {
    name: "General",
    slug: "other.general",
    description: "Other roles not categorized above",
    icon: "Folder",
    parentSlug: "other",
  },
];

/**
 * Seed job categories into the database
 */
export async function seedCategories() {
  console.log("Seeding job categories...");

  try {
    // First pass: Create all parent categories
    const parentCategories = CATEGORIES.filter((cat) => !cat.parentSlug);
    const categoryMap = new Map<string, string>(); // slug -> id

    for (const category of parentCategories) {
      // Check if category already exists
      const [existing] = await db
        .select()
        .from(jobCategories)
        .where(eq(jobCategories.slug, category.slug))
        .limit(1);

      if (existing) {
        console.log(`  ✓ Category '${category.name}' already exists`);
        categoryMap.set(category.slug, existing.id);
      } else {
        const [newCategory] = await db
          .insert(jobCategories)
          .values({
            name: category.name,
            slug: category.slug,
            description: category.description,
            icon: category.icon,
          })
          .returning();

        categoryMap.set(category.slug, newCategory.id);
        console.log(`  + Created category '${category.name}'`);
      }
    }

    // Second pass: Create all child categories
    const childCategories = CATEGORIES.filter((cat) => cat.parentSlug);

    for (const category of childCategories) {
      // Check if category already exists
      const [existing] = await db
        .select()
        .from(jobCategories)
        .where(eq(jobCategories.slug, category.slug))
        .limit(1);

      if (existing) {
        console.log(`  ✓ Category '${category.name}' already exists`);
        categoryMap.set(category.slug, existing.id);
      } else {
        const parentId = category.parentSlug ? categoryMap.get(category.parentSlug) : null;

        const [newCategory] = await db
          .insert(jobCategories)
          .values({
            name: category.name,
            slug: category.slug,
            description: category.description,
            icon: category.icon,
            parentId: parentId || null,
          })
          .returning();

        categoryMap.set(category.slug, newCategory.id);
        console.log(`  + Created category '${category.name}' under '${category.parentSlug}'`);
      }
    }

    console.log(
      `\n✅ Successfully seeded ${CATEGORIES.length} categories (${parentCategories.length} parent, ${childCategories.length} child)`
    );
    return { success: true, count: CATEGORIES.length };
  } catch (error) {
    console.error("Error seeding categories:", error);
    throw error;
  }
}

// Run seed if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedCategories()
    .then(() => {
      console.log("\nSeed completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Seed failed:", error);
      process.exit(1);
    });
}

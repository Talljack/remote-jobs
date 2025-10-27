import { NextResponse } from "next/server";

import { eq } from "drizzle-orm";

import { db, jobCategories } from "@/db";

/**
 * Seed job categories
 * GET /api/seed/categories
 */
export async function GET() {
  try {
    const categories = [
      // Top-level categories
      {
        name: "Frontend Development",
        slug: "frontend",
        description: "React, Vue, Angular, UI/UX development",
        icon: "🎨",
      },
      {
        name: "Backend Development",
        slug: "backend",
        description: "Node.js, Python, Java, Go",
        icon: "⚙️",
      },
      {
        name: "AI & Machine Learning",
        slug: "ai-ml",
        description: "AI, ML, Deep Learning, NLP, Computer Vision",
        icon: "🤖",
      },
      {
        name: "Full Stack Development",
        slug: "fullstack",
        description: "End-to-end application development",
        icon: "💻",
      },
      {
        name: "Mobile Development",
        slug: "mobile",
        description: "iOS, Android, React Native, Flutter",
        icon: "📱",
      },
      {
        name: "DevOps & Infrastructure",
        slug: "devops",
        description: "AWS, Docker, Kubernetes, CI/CD",
        icon: "🔧",
      },
      {
        name: "Data Engineering",
        slug: "data-engineering",
        description: "ETL, Data Pipelines, Big Data",
        icon: "📊",
      },
      {
        name: "Data Science",
        slug: "data-science",
        description: "Analytics, Statistics, Visualization",
        icon: "📈",
      },
      {
        name: "UI/UX Design",
        slug: "design",
        description: "Product design, Visual design, User research",
        icon: "✨",
      },
      {
        name: "Product Management",
        slug: "product",
        description: "Product strategy, Roadmap planning",
        icon: "📋",
      },
      { name: "QA & Testing", slug: "qa", description: "Manual testing, Automation", icon: "🧪" },
      {
        name: "Security Engineering",
        slug: "security",
        description: "Cybersecurity, Penetration testing",
        icon: "🔒",
      },
      {
        name: "Blockchain Development",
        slug: "blockchain",
        description: "Web3, Smart contracts, DeFi",
        icon: "⛓️",
      },
      {
        name: "Game Development",
        slug: "game-dev",
        description: "Unity, Unreal Engine, Game design",
        icon: "🎮",
      },
    ];

    const subcategories = [
      // Frontend subcategories
      {
        name: "React Development",
        slug: "react",
        parentSlug: "frontend",
        description: "React.js, Next.js, React Native",
      },
      {
        name: "Vue.js Development",
        slug: "vue",
        parentSlug: "frontend",
        description: "Vue.js, Nuxt.js",
      },
      {
        name: "Angular Development",
        slug: "angular",
        parentSlug: "frontend",
        description: "Angular framework",
      },

      // Backend subcategories
      {
        name: "Node.js Development",
        slug: "nodejs",
        parentSlug: "backend",
        description: "Express, Nest.js, Fastify",
      },
      {
        name: "Python Development",
        slug: "python",
        parentSlug: "backend",
        description: "Django, Flask, FastAPI",
      },
      {
        name: "Go Development",
        slug: "go",
        parentSlug: "backend",
        description: "Golang microservices",
      },
      {
        name: "Java Development",
        slug: "java",
        parentSlug: "backend",
        description: "Spring, Spring Boot",
      },

      // AI/ML subcategories
      {
        name: "AI Agent Development",
        slug: "ai-agent",
        parentSlug: "ai-ml",
        description: "LangChain, AutoGPT, Agent frameworks",
      },
      {
        name: "ML Engineering",
        slug: "ml-engineering",
        parentSlug: "ai-ml",
        description: "TensorFlow, PyTorch, Model training",
      },
      {
        name: "NLP Engineering",
        slug: "nlp",
        parentSlug: "ai-ml",
        description: "Natural Language Processing, LLMs",
      },
      {
        name: "Computer Vision",
        slug: "computer-vision",
        parentSlug: "ai-ml",
        description: "Image processing, Object detection",
      },
    ];

    const created: string[] = [];
    const skipped: string[] = [];

    // Insert top-level categories first
    for (const category of categories) {
      const existing = await db
        .select()
        .from(jobCategories)
        .where(eq(jobCategories.slug, category.slug))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(jobCategories).values({
          name: category.name,
          slug: category.slug,
          description: category.description,
          icon: category.icon,
          parentId: null,
        });
        created.push(category.name);
      } else {
        skipped.push(category.name);
      }
    }

    // Insert subcategories
    for (const subcat of subcategories) {
      const existing = await db
        .select()
        .from(jobCategories)
        .where(eq(jobCategories.slug, subcat.slug))
        .limit(1);

      if (existing.length === 0) {
        // Find parent ID
        const [parent] = await db
          .select()
          .from(jobCategories)
          .where(eq(jobCategories.slug, subcat.parentSlug))
          .limit(1);

        if (parent) {
          await db.insert(jobCategories).values({
            name: subcat.name,
            slug: subcat.slug,
            description: subcat.description,
            parentId: parent.id,
          });
          created.push(subcat.name);
        }
      } else {
        skipped.push(subcat.name);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Categories seeded successfully",
      data: {
        created: created.length,
        skipped: skipped.length,
        createdCategories: created,
        skippedCategories: skipped,
      },
    });
  } catch (error) {
    console.error("Error seeding categories:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to seed categories",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

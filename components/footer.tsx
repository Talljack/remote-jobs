import { Briefcase, Github, Mail, Twitter } from "lucide-react";

import { Link } from "@/i18n/routing";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t py-12 md:py-16">
      <div className="container">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand section */}
          <div className="col-span-1 lg:col-span-2">
            <Link href="/" className="flex items-center space-x-2">
              <Briefcase className="h-6 w-6" />
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-xl font-bold text-transparent">
                RemoteJobs
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              Your gateway to the best remote job opportunities worldwide. Find your dream remote
              job today.
            </p>
            <div className="mt-6 flex items-center space-x-4">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <Github className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </a>
              <a
                href="mailto:hello@remotejobs.com"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <Mail className="h-5 w-5" />
                <span className="sr-only">Email</span>
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="mb-4 font-semibold">Product</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <Link href="/jobs" className="transition-colors hover:text-foreground">
                  Browse Jobs
                </Link>
              </li>
              <li>
                <Link href="/stats" className="transition-colors hover:text-foreground">
                  Statistics
                </Link>
              </li>
              <li>
                <Link href="/jobs/create" className="transition-colors hover:text-foreground">
                  Post a Job
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="mb-4 font-semibold">Resources</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <a href="#" className="transition-colors hover:text-foreground">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-foreground">
                  Remote Work Guide
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-foreground">
                  API Docs
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="mb-4 font-semibold">Company</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <a href="#" className="transition-colors hover:text-foreground">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-foreground">
                  Contact
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-foreground">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-foreground">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 text-sm text-muted-foreground md:flex-row">
          <p>© {currentYear} RemoteJobs. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="transition-colors hover:text-foreground">
              Privacy
            </a>
            <a href="#" className="transition-colors hover:text-foreground">
              Terms
            </a>
            <a href="#" className="transition-colors hover:text-foreground">
              Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

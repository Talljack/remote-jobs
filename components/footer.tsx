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
            <p className="text-muted-foreground mt-4 max-w-xs text-sm">
              Your gateway to the best remote job opportunities worldwide. Find your dream remote
              job today.
            </p>
            <div className="mt-6 flex items-center space-x-4">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Github className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </a>
              <a
                href="mailto:hello@remotejobs.com"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Mail className="h-5 w-5" />
                <span className="sr-only">Email</span>
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="mb-4 font-semibold">Product</h3>
            <ul className="text-muted-foreground space-y-3 text-sm">
              <li>
                <Link href="/jobs" className="hover:text-foreground transition-colors">
                  Browse Jobs
                </Link>
              </li>
              <li>
                <Link href="/stats" className="hover:text-foreground transition-colors">
                  Statistics
                </Link>
              </li>
              <li>
                <Link href="/jobs/create" className="hover:text-foreground transition-colors">
                  Post a Job
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="mb-4 font-semibold">Resources</h3>
            <ul className="text-muted-foreground space-y-3 text-sm">
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Remote Work Guide
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  API Docs
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="mb-4 font-semibold">Company</h3>
            <ul className="text-muted-foreground space-y-3 text-sm">
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Contact
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="text-muted-foreground mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 text-sm md:flex-row">
          <p>© {currentYear} RemoteJobs. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-foreground transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Terms
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

import { Link } from "@/i18n/routing";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t py-12 md:py-16">
      <div className="container">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <h3 className="mb-4 font-semibold">Product</h3>
            <ul className="text-muted-foreground space-y-2 text-sm">
              <li>
                <Link href="/jobs" className="hover:text-foreground">
                  Browse Jobs
                </Link>
              </li>
              <li>
                <Link href="/stats" className="hover:text-foreground">
                  Statistics
                </Link>
              </li>
              <li>
                <Link href="/jobs/create" className="hover:text-foreground">
                  Post a Job
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold">Resources</h3>
            <ul className="text-muted-foreground space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-foreground">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground">
                  Remote Work Guide
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground">
                  API Docs
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold">Company</h3>
            <ul className="text-muted-foreground space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-foreground">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground">
                  Contact
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold">Social</h3>
            <ul className="text-muted-foreground space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-foreground">
                  Twitter
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground">
                  GitHub
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground">
                  Telegram
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="text-muted-foreground mt-12 border-t pt-8 text-center text-sm">
          <p>© {currentYear} RemoteJobs. All rights reserved. Built with ❤️ for remote workers.</p>
        </div>
      </div>
    </footer>
  );
}

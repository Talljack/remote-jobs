export default function TestPage() {
  return (
    <div className="container py-20">
      <div className="mx-auto max-w-4xl space-y-8">
        <h1 className="text-4xl font-bold">Test Page</h1>

        <div className="bg-card rounded-lg border p-6">
          <h2 className="mb-4 text-2xl font-semibold">Card Component</h2>
          <p className="text-muted-foreground">
            This is a test card to verify that Tailwind CSS and shadcn/ui are working correctly.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="bg-primary text-primary-foreground rounded-lg border p-6">
            <h3 className="font-semibold">Primary Card</h3>
            <p>Primary background with foreground text</p>
          </div>
          <div className="bg-secondary text-secondary-foreground rounded-lg border p-6">
            <h3 className="font-semibold">Secondary Card</h3>
            <p>Secondary background with foreground text</p>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-foreground">Default foreground text</p>
          <p className="text-muted-foreground">Muted foreground text</p>
          <div className="bg-border h-px" />
          <p className="text-sm">Border line above this text</p>
        </div>
      </div>
    </div>
  );
}

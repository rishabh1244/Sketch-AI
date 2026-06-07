export default function ModelsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white">Models Configs</h2>
        <p className="text-muted-foreground text-white/60">
          Configure custom system prompts, instructions, and temperature settings for the AI models.
        </p>
      </div>
      <div className="border border-white/10 rounded-lg p-8 flex items-center justify-center bg-white/5">
        <p className="text-white/50">Model configuration settings go here</p>
      </div>
    </div>
  );
}

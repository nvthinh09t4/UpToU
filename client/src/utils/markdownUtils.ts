/**
 * Minimal markdown-to-HTML converter for story content rendering.
 * Supports headings, bold/italic, code, tables, lists, blockquotes, and paragraphs.
 */
export function renderMarkdown(content: string): string {
  return content
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold mt-6 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-8 mb-3">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
    .replace(/```[\w]*\n([\s\S]*?)```/g, '<pre class="bg-muted rounded-lg p-4 overflow-x-auto my-4 text-sm font-mono"><code>$1</code></pre>')
    .replace(/^\| (.+) \|$/gm, (_, row) => {
      const cells = row.split(' | ').map((c: string) => `<td class="border border-border px-3 py-2 text-sm">${c}</td>`).join('');
      return `<tr>${cells}</tr>`;
    })
    .replace(/(<tr>.*<\/tr>\n?)+/g, (table) => `<div class="overflow-x-auto my-4"><table class="border-collapse border border-border w-full">${table}</table></div>`)
    .replace(/^---$/gm, '<hr class="my-6 border-border">')
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-primary pl-4 my-4 text-muted-foreground italic">$1</blockquote>')
    .replace(/^- \[ \] (.+)$/gm, '<li class="flex items-center gap-2 my-1"><span class="h-4 w-4 rounded border border-border inline-block"></span>$1</li>')
    .replace(/^- (.+)$/gm, '<li class="list-disc ml-6 my-1">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="list-decimal ml-6 my-1">$2</li>')
    .replace(/(<li.*<\/li>\n?)+/g, (list) => `<ul class="my-3">${list}</ul>`)
    .replace(/\n\n/g, '</p><p class="mb-4">')
    .replace(/^(?!<[hbpuolt])/gm, '')
    .trim();
}

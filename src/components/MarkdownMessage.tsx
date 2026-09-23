import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownMessageProps {
  content: string;
  className?: string;
}

export const MarkdownMessage: React.FC<MarkdownMessageProps> = ({ content, className = '' }) => {
  return (
    <div className={`prose prose-invert max-w-none text-xs sm:text-sm leading-relaxed ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Custom bold styling
          strong: ({ children }) => (
            <strong className="font-semibold text-emerald-300">
              {children}
            </strong>
          ),
          // Custom italics
          em: ({ children }) => (
            <em className="italic text-slate-300">
              {children}
            </em>
          ),
          // Paragraphs with comfortable spacing
          p: ({ children }) => (
            <p className="mb-2.5 last:mb-0 leading-relaxed text-slate-200">
              {children}
            </p>
          ),
          // Lists
          ul: ({ children }) => (
            <ul className="space-y-1.5 my-2.5 pl-4 list-disc marker:text-emerald-400">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="space-y-1.5 my-2.5 pl-4 list-decimal marker:text-emerald-400 font-medium">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-slate-200 leading-relaxed pl-0.5">
              {children}
            </li>
          ),
          // Headings
          h1: ({ children }) => (
            <h1 className="text-base font-bold text-white mt-3 mb-2 border-b border-slate-700/60 pb-1">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm font-bold text-emerald-300 mt-2.5 mb-1.5 flex items-center gap-1.5">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xs font-semibold text-cyan-300 mt-2 mb-1">
              {children}
            </h3>
          ),
          // Code blocks & inline code
          code: ({ className, children, ...props }: any) => {
            const isInline = !className && typeof children === 'string' && !children.includes('\n');
            if (isInline) {
              return (
                <code
                  className="bg-slate-800/90 text-emerald-300 font-mono text-[11px] px-1.5 py-0.5 rounded border border-slate-700/80"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <div className="my-2 bg-slate-950 rounded-xl p-3 border border-slate-800 overflow-x-auto">
                <code className="font-mono text-xs text-slate-200 block whitespace-pre" {...props}>
                  {children}
                </code>
              </div>
            );
          },
          // Blockquotes for citations / sources
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-emerald-500/80 bg-emerald-950/20 px-3 py-1.5 my-2 rounded-r-lg text-emerald-200 text-xs italic">
              {children}
            </blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

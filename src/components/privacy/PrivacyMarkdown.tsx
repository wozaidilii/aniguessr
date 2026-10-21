import {
  parsePrivacyDocument,
  parsePrivacyInline,
  type PrivacyInline,
} from "~/lib/privacy-document";

function Inline({ text }: { text: string }) {
  const nodes = parsePrivacyInline(text);
  return (
    <>
      {nodes.map((node, index) => (
        <InlineNode key={index} node={node} />
      ))}
    </>
  );
}

function InlineNode({ node }: { node: PrivacyInline }) {
  if (node.type === "strong") return <strong>{node.text}</strong>;
  if (node.type === "link") {
    const external = node.href.startsWith("http");
    return (
      <a
        href={node.href}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {node.text}
      </a>
    );
  }
  return <>{node.text}</>;
}

export function PrivacyMarkdown({ source }: { source: string }) {
  const blocks = parsePrivacyDocument(source);
  return (
    <div className="privacy-doc">
      {blocks.map((block, index) => {
        if (block.type === "heading" && block.level === 1) {
          return (
            <h1 key={index}>
              <Inline text={block.text} />
            </h1>
          );
        }
        if (block.type === "heading" && block.level === 2) {
          return (
            <h2 key={index}>
              <Inline text={block.text} />
            </h2>
          );
        }
        if (block.type === "heading") {
          return (
            <h3 key={index}>
              <Inline text={block.text} />
            </h3>
          );
        }
        if (block.type === "paragraph") {
          return (
            <p key={index}>
              <Inline text={block.text} />
            </p>
          );
        }
        if (block.type === "ul") {
          return (
            <ul key={index}>
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>
                  <Inline text={item} />
                </li>
              ))}
            </ul>
          );
        }
        if (block.type === "ol") {
          return (
            <ol key={index}>
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>
                  <Inline text={item} />
                </li>
              ))}
            </ol>
          );
        }
        if (block.type === "hr") return <hr key={index} />;
        return (
          <div key={index} className="privacy-table-wrap">
            <table>
              <thead>
                <tr>
                  {block.headers.map((header, headerIndex) => (
                    <th key={headerIndex} scope="col">
                      <Inline text={header} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex}>
                        <Inline text={cell} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}

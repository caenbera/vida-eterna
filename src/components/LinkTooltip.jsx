import React from 'react';

/**
 * Helper function to parse markdown links "[Text](url)" inside a text/HTML string
 * and convert them into superscript numbers with hover tooltips (academic footnote style).
 */
export function parseMarkdownLinks(htmlText) {
  if (!htmlText) return "";
  
  let linkCounter = 1;
  const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
  
  return htmlText.replace(regex, (match, name, url) => {
    const num = linkCounter++;
    return `<span class="tooltip-link"><a href="${url}" target="_blank" rel="noopener noreferrer" class="sup-link">${num}</a><span class="tooltiptext"><strong>${name}</strong><br>${url}</span></span>`;
  });
}

const LinkTooltip = ({ text }) => {
  const parsedHTML = parseMarkdownLinks(text);
  return <div dangerouslySetInnerHTML={{ __html: parsedHTML }} />;
};

export default LinkTooltip;

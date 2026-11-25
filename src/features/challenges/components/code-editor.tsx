"use client";

import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { EditorView } from "@codemirror/view";
import { tags } from "@lezer/highlight";
import CodeMirror from "@uiw/react-codemirror";
import { useMemo } from "react";

type CodeEditorProps = {
  value: string;
  language: string;
  onChange: (value: string) => void;
  onPasteBlocked: () => void;
};

const theme = EditorView.theme(
  {
    "&": { backgroundColor: "transparent", fontSize: "13px", minHeight: "26rem" },
    ".cm-scroller": {
      fontFamily: "var(--font-mono)",
      lineHeight: "1.6",
      padding: "0.75rem 0",
    },
    ".cm-content": { caretColor: "var(--foreground)" },
    ".cm-gutters": {
      backgroundColor: "transparent",
      color: "color-mix(in oklch, var(--foreground) 35%, transparent)",
      border: "none",
      paddingLeft: "0.5rem",
    },
    ".cm-activeLine, .cm-activeLineGutter": {
      backgroundColor: "color-mix(in oklch, var(--foreground) 5%, transparent)",
    },
    ".cm-cursor": { borderLeftColor: "var(--foreground)" },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground": {
      backgroundColor:
        "color-mix(in oklch, var(--foreground) 18%, transparent) !important",
    },
    ".cm-matchingBracket": {
      outline: "1px solid color-mix(in oklch, var(--foreground) 50%, transparent)",
    },
    "&.cm-focused": { outline: "none" },
  },
  { dark: true },
);

const dim = (amount: string) =>
  `color-mix(in oklch, var(--foreground) ${amount}, transparent)`;

const monochrome = syntaxHighlighting(
  HighlightStyle.define([
    { tag: [tags.keyword, tags.controlKeyword, tags.operatorKeyword], fontWeight: "600" },
    {
      tag: [tags.definition(tags.variableName), tags.function(tags.variableName)],
      fontWeight: "600",
    },
    { tag: [tags.typeName, tags.className], fontStyle: "italic" },
    { tag: [tags.string, tags.special(tags.string)], color: dim("70%") },
    { tag: [tags.number, tags.bool, tags.null], color: dim("80%") },
    { tag: tags.comment, color: dim("45%"), fontStyle: "italic" },
    { tag: [tags.punctuation, tags.operator, tags.bracket], color: dim("60%") },
    { tag: tags.propertyName, color: dim("85%") },
  ]),
);

export function CodeEditor({
  value,
  language,
  onChange,
  onPasteBlocked,
}: CodeEditorProps) {
  const extensions = useMemo(() => {
    const lang =
      language === "python"
        ? python()
        : javascript({ jsx: true, typescript: language === "typescript" });
    const blockPaste = EditorView.domEventHandlers({
      paste: (event) => {
        event.preventDefault();
        onPasteBlocked();
        return true;
      },
      drop: (event) => {
        event.preventDefault();
        onPasteBlocked();
        return true;
      },
    });
    return [lang, theme, monochrome, blockPaste, EditorView.lineWrapping];
  }, [language, onPasteBlocked]);

  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      extensions={extensions}
      theme="none"
      basicSetup={{
        foldGutter: false,
        highlightActiveLine: true,
        autocompletion: false,
        defaultKeymap: true,
      }}
      aria-label="Your solution"
    />
  );
}

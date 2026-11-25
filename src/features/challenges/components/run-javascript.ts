const runnerSource = `
  const lines = [];
  const push = (level) => (...args) => lines.push((level ? level + ": " : "") + args.map((a) => {
    try { return typeof a === "string" ? a : JSON.stringify(a); } catch { return String(a); }
  }).join(" "));
  console.log = push(""); console.info = push(""); console.warn = push("warn"); console.error = push("error");
  self.onmessage = (event) => {
    try {
      const result = new Function(event.data)();
      if (result !== undefined) lines.push("→ " + (typeof result === "string" ? result : JSON.stringify(result)));
    } catch (error) {
      lines.push("Uncaught " + (error && error.message ? error.message : String(error)));
    }
    self.postMessage(lines.join("\\n"));
  };
`;

export function runJavascript(code: string, timeoutMs = 3000): Promise<string> {
  return new Promise((resolve) => {
    const blob = new Blob([runnerSource], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    const worker = new Worker(url);

    const finish = (output: string) => {
      worker.terminate();
      URL.revokeObjectURL(url);
      resolve(output);
    };

    const timer = setTimeout(
      () => finish(`Stopped after ${timeoutMs / 1000}s. Check for infinite loops.`),
      timeoutMs,
    );
    worker.onmessage = (event) => {
      clearTimeout(timer);
      finish(String(event.data) || "(no output)");
    };
    worker.onerror = (event) => {
      clearTimeout(timer);
      finish(`Error: ${event.message}`);
    };
    worker.postMessage(code);
  });
}

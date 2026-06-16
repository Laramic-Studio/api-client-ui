// Generate request code snippets for cURL, JS, TS, Python, PHP, C#, Go.

function buildHeaders(headers) {
  return (headers || []).filter((h) => h.enabled !== false && h.key);
}

export function generateCode(lang, req) {
  const url = req.url || "";
  const method = req.method || "GET";
  const headers = buildHeaders(req.headers);
  const hasBody = req.body && req.body.type !== "none" && req.body.content;
  const bodyStr = hasBody ? req.body.content : "";

  if (lang === "curl") {
    const parts = [`curl -X ${method} "${url}"`];
    headers.forEach((h) => parts.push(`  -H "${h.key}: ${h.value}"`));
    if (hasBody) parts.push(`  -d '${bodyStr.replace(/'/g, "'\\''")}'`);
    return parts.join(" \\\n");
  }

  if (lang === "javascript") {
    const lines = [
      `const res = await fetch("${url}", {`,
      `  method: "${method}",`,
      `  headers: ${JSON.stringify(Object.fromEntries(headers.map((h) => [h.key, h.value])), null, 2)},`,
    ];
    if (hasBody) lines.push(`  body: ${JSON.stringify(bodyStr)},`);
    lines.push(`});`);
    lines.push(`const data = await res.json();`);
    lines.push(`console.log(data);`);
    return lines.join("\n");
  }

  if (lang === "typescript") {
    const lines = [
      `const res: Response = await fetch("${url}", {`,
      `  method: "${method}",`,
      `  headers: ${JSON.stringify(Object.fromEntries(headers.map((h) => [h.key, h.value])), null, 2)} as Record<string, string>,`,
    ];
    if (hasBody) lines.push(`  body: ${JSON.stringify(bodyStr)},`);
    lines.push(`});`);
    lines.push(`const data: unknown = await res.json();`);
    lines.push(`console.log(data);`);
    return lines.join("\n");
  }

  if (lang === "python") {
    const lines = [
      `import requests`,
      ``,
      `url = "${url}"`,
      `headers = ${JSON.stringify(Object.fromEntries(headers.map((h) => [h.key, h.value])), null, 2)}`,
    ];
    if (hasBody) lines.push(`data = ${JSON.stringify(bodyStr)}`);
    lines.push(
      hasBody
        ? `response = requests.request("${method}", url, headers=headers, data=data)`
        : `response = requests.request("${method}", url, headers=headers)`
    );
    lines.push(`print(response.json())`);
    return lines.join("\n");
  }

  if (lang === "php") {
    const lines = [`<?php`, `$ch = curl_init();`];
    lines.push(`curl_setopt($ch, CURLOPT_URL, "${url}");`);
    lines.push(`curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);`);
    lines.push(`curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "${method}");`);
    if (headers.length) {
      lines.push(
        `curl_setopt($ch, CURLOPT_HTTPHEADER, [${headers.map((h) => `"${h.key}: ${h.value}"`).join(", ")}]);`
      );
    }
    if (hasBody) lines.push(`curl_setopt($ch, CURLOPT_POSTFIELDS, ${JSON.stringify(bodyStr)});`);
    lines.push(`$response = curl_exec($ch);`);
    lines.push(`curl_close($ch);`);
    lines.push(`echo $response;`);
    return lines.join("\n");
  }

  if (lang === "csharp") {
    const lines = [
      `using System.Net.Http;`,
      `using System.Net.Http.Headers;`,
      ``,
      `var client = new HttpClient();`,
      `var request = new HttpRequestMessage(HttpMethod.${cap(method.toLowerCase())}, "${url}");`,
    ];
    headers.forEach((h) => lines.push(`request.Headers.TryAddWithoutValidation("${h.key}", "${h.value}");`));
    if (hasBody)
      lines.push(`request.Content = new StringContent(${JSON.stringify(bodyStr)}, System.Text.Encoding.UTF8, "application/json");`);
    lines.push(`var response = await client.SendAsync(request);`);
    lines.push(`var body = await response.Content.ReadAsStringAsync();`);
    lines.push(`Console.WriteLine(body);`);
    return lines.join("\n");
  }

  if (lang === "go") {
    const lines = [
      `package main`,
      ``,
      `import (`,
      `  "fmt"`,
      `  "io"`,
      `  "net/http"`,
      `  "strings"`,
      `)`,
      ``,
      `func main() {`,
    ];
    if (hasBody) {
      lines.push(`  payload := strings.NewReader(${JSON.stringify(bodyStr)})`);
      lines.push(`  req, _ := http.NewRequest("${method}", "${url}", payload)`);
    } else {
      lines.push(`  req, _ := http.NewRequest("${method}", "${url}", nil)`);
    }
    headers.forEach((h) => lines.push(`  req.Header.Add("${h.key}", "${h.value}")`));
    lines.push(`  res, _ := http.DefaultClient.Do(req)`);
    lines.push(`  defer res.Body.Close()`);
    lines.push(`  body, _ := io.ReadAll(res.Body)`);
    lines.push(`  fmt.Println(string(body))`);
    lines.push(`}`);
    return lines.join("\n");
  }

  return "// Unsupported language";
}

function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export const CODE_LANGS = [
  { id: "curl", label: "cURL", monaco: "shell" },
  { id: "javascript", label: "JavaScript", monaco: "javascript" },
  { id: "typescript", label: "TypeScript", monaco: "typescript" },
  { id: "python", label: "Python", monaco: "python" },
  { id: "php", label: "PHP", monaco: "php" },
  { id: "csharp", label: "C#", monaco: "csharp" },
  { id: "go", label: "Go", monaco: "go" },
];

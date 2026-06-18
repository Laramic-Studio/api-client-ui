// Generate request code snippets for cURL, JS, TS, Python, PHP, C#, Go.
import { interpolate } from "@/lib/mockEngine";
import { buildOutgoingHeaders, enabledHeaderRows } from "@/lib/builder/request-auth";
import { prepareFetchBody } from "@/lib/builder/request-body";

function prepareCodegen(req) {
  const url = req.url || "";
  const method = req.method || "GET";
  const env = req.env || null;
  const headers = enabledHeaderRows(buildOutgoingHeaders(req, env));
  const { fetchBody, contentType } = prepareFetchBody(req.body, method, env);

  const headerMap = Object.fromEntries(headers.map((h) => [h.key, h.value]));
  if (contentType && !headerMap["Content-Type"] && !headerMap["content-type"]) {
    headerMap["Content-Type"] = contentType;
  }

  return {
    url,
    method,
    headers,
    headerMap,
    fetchBody,
    contentType,
    hasBody: fetchBody !== undefined,
  };
}

function escapeSingleQuotes(str) {
  return String(str).replace(/'/g, "'\\''");
}

export function generateCode(lang, req) {
  const { url, method, headers, headerMap, fetchBody, contentType, hasBody } = prepareCodegen(req);

  if (lang === "curl") {
    const parts = [`curl -X ${method} "${url}"`];
    headers.forEach((h) => parts.push(`  -H "${h.key}: ${h.value}"`));
    if (contentType && !headers.some((h) => h.key.toLowerCase() === "content-type")) {
      parts.push(`  -H "Content-Type: ${contentType}"`);
    }
    if (hasBody) parts.push(`  -d '${escapeSingleQuotes(fetchBody)}'`);
    return parts.join(" \\\n");
  }

  if (lang === "javascript") {
    const lines = [
      `const res = await fetch("${url}", {`,
      `  method: "${method}",`,
      `  headers: ${JSON.stringify(headerMap, null, 2)},`,
    ];
    if (hasBody) lines.push(`  body: ${JSON.stringify(fetchBody)},`);
    lines.push(`});`);
    lines.push(`const data = await res.json();`);
    lines.push(`console.log(data);`);
    return lines.join("\n");
  }

  if (lang === "typescript") {
    const lines = [
      `const res: Response = await fetch("${url}", {`,
      `  method: "${method}",`,
      `  headers: ${JSON.stringify(headerMap, null, 2)} as Record<string, string>,`,
    ];
    if (hasBody) lines.push(`  body: ${JSON.stringify(fetchBody)},`);
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
      `headers = ${JSON.stringify(headerMap, null, 2)}`,
    ];
    if (hasBody) {
      if (contentType === "application/x-www-form-urlencoded") {
        lines.push(`data = "${fetchBody}"`);
        lines.push(`response = requests.request("${method}", url, headers=headers, data=data)`);
      } else {
        lines.push(`data = ${JSON.stringify(fetchBody)}`);
        lines.push(`response = requests.request("${method}", url, headers=headers, data=data)`);
      }
    } else {
      lines.push(`response = requests.request("${method}", url, headers=headers)`);
    }
    lines.push(`print(response.json())`);
    return lines.join("\n");
  }

  if (lang === "php") {
    const lines = [`<?php`, `$ch = curl_init();`];
    lines.push(`curl_setopt($ch, CURLOPT_URL, "${url}");`);
    lines.push(`curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);`);
    lines.push(`curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "${method}");`);
    const allHeaders = [...headers];
    if (contentType && !headers.some((h) => h.key.toLowerCase() === "content-type")) {
      allHeaders.push({ key: "Content-Type", value: contentType });
    }
    if (allHeaders.length) {
      lines.push(
        `curl_setopt($ch, CURLOPT_HTTPHEADER, [${allHeaders.map((h) => `"${h.key}: ${h.value}"`).join(", ")}]);`,
      );
    }
    if (hasBody) lines.push(`curl_setopt($ch, CURLOPT_POSTFIELDS, ${JSON.stringify(fetchBody)});`);
    lines.push(`$response = curl_exec($ch);`);
    lines.push(`curl_close($ch);`);
    lines.push(`echo $response;`);
    return lines.join("\n");
  }

  if (lang === "csharp") {
    const mime = contentType || "application/json";
    const lines = [
      `using System.Net.Http;`,
      ``,
      `var client = new HttpClient();`,
      `var request = new HttpRequestMessage(HttpMethod.${cap(method.toLowerCase())}, "${url}");`,
    ];
    headers.forEach((h) => lines.push(`request.Headers.TryAddWithoutValidation("${h.key}", "${h.value}");`));
    if (hasBody) {
      lines.push(
        `request.Content = new StringContent(${JSON.stringify(fetchBody)}, System.Text.Encoding.UTF8, "${mime}");`,
      );
    }
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
      lines.push(`  payload := strings.NewReader(${JSON.stringify(fetchBody)})`);
      lines.push(`  req, _ := http.NewRequest("${method}", "${url}", payload)`);
    } else {
      lines.push(`  req, _ := http.NewRequest("${method}", "${url}", nil)`);
    }
    headers.forEach((h) => lines.push(`  req.Header.Add("${h.key}", "${h.value}")`));
    if (contentType && !headers.some((h) => h.key.toLowerCase() === "content-type")) {
      lines.push(`  req.Header.Add("Content-Type", "${contentType}")`);
    }
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
// re-export for tests / parity checks
export { interpolate };
import { html } from 'hono/html'

interface Route {
  method: string
  path: string
  description: string
  auth: boolean
  admin: boolean
}

interface ApiDocProps {
  title: string
  version: string
  routes: Route[]
}

export const ApiDoc = ({ title, version, routes }: ApiDocProps) => {
  const methodColors = {
    GET: 'bg-blue-600',
    POST: 'bg-green-600',
    PUT: 'bg-amber-600',
    DELETE: 'bg-red-600'
  }

  return html`<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${title} - API Documentation</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-gray-900 text-white font-sans">
        <div class="container mx-auto px-4 py-8 max-w-4xl">
          <header class="mb-8">
            <h1 class="text-3xl font-bold mb-2">${title}</h1>
            <div class="flex items-center">
              <span class="bg-purple-600 text-white text-xs px-2 py-1 rounded-md">v${version}</span>
              <span class="ml-2 text-gray-300">Built with Bun + Hono + MongoDB</span>
            </div>
          </header>

          <main>
            <section class="mb-8">
              <h2 class="text-xl font-semibold mb-4 border-b border-gray-700 pb-2">API Endpoints</h2>
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="bg-gray-800">
                      <th class="text-left py-2 px-4">Method</th>
                      <th class="text-left py-2 px-4">Endpoint</th>
                      <th class="text-left py-2 px-4">Description</th>
                      <th class="text-left py-2 px-4">Auth</th>
                      <th class="text-left py-2 px-4">Admin</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${routes.map(
                      route =>
                        html`<tr class="border-b border-gray-800">
                          <td class="py-2 px-4">
                            <span
                              class="inline-block px-2 py-1 rounded-md text-xs font-medium ${methodColors[
                                route.method
                              ] || 'bg-gray-600'}"
                              >${route.method}</span
                            >
                          </td>
                          <td class="py-2 px-4 font-mono text-gray-300">
                            <a href="${route.path}" class="text-blue-400 hover:underline">${route.path}</a>
                          </td>
                          <td class="py-2 px-4">${route.description}</td>
                          <td class="py-2 px-4">
                            ${route.auth
                              ? html`<span class="text-green-400 font-medium">Required</span>`
                              : html`<span class="text-gray-500">No</span>`}
                          </td>
                          <td class="py-2 px-4">
                            ${route.admin
                              ? html`<span class="text-amber-400 font-medium">Yes</span>`
                              : html`<span class="text-gray-500">No</span>`}
                          </td>
                        </tr>`
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section class="mb-8">
              <h2 class="text-xl font-semibold mb-4 border-b border-gray-700 pb-2">Request Examples</h2>

              <div class="mb-6">
                <h3 class="text-lg font-medium mb-2">Create User</h3>
                <div class="bg-gray-800 p-4 rounded-md">
                  <div class="mb-2">
                    <span class="inline-block px-2 py-1 rounded-md text-xs font-medium bg-green-600">POST</span>
                    <span class="font-mono text-gray-300 ml-2">/api/v1/users</span>
                  </div>
                  <pre class="bg-gray-950 p-3 rounded-md overflow-auto"><code>{
  "name": "Mehedi Hasan",
  "email": "mehedi@example.com",
  "password": "123456"
}</code></pre>
                </div>
              </div>

              <div class="mb-6">
                <h3 class="text-lg font-medium mb-2">Login User</h3>
                <div class="bg-gray-800 p-4 rounded-md">
                  <div class="mb-2">
                    <span class="inline-block px-2 py-1 rounded-md text-xs font-medium bg-green-600">POST</span>
                    <span class="font-mono text-gray-300 ml-2">/api/v1/users/login</span>
                  </div>
                  <pre class="bg-gray-950 p-3 rounded-md overflow-auto"><code>{
  "email": "mehedi@example.com",
  "password": "123456"
}</code></pre>
                </div>
              </div>

              <div class="mb-6">
                <h3 class="text-lg font-medium mb-2">Authorization for Protected Routes</h3>
                <div class="bg-gray-800 p-4 rounded-md">
                  <div class="mb-2">
                    <span class="text-gray-300">Include the JWT token in the Authorization header:</span>
                  </div>
                  <pre
                    class="bg-gray-950 p-3 rounded-md overflow-auto"
                  ><code>Authorization: Bearer your_jwt_token</code></pre>
                </div>
              </div>
            </section>

            <section>
              <h2 class="text-xl font-semibold mb-4 border-b border-gray-700 pb-2">Project Information</h2>
              <ul class="list-disc pl-6 space-y-2">
                <li>
                  <span class="font-semibold">Author:</span>
                  <span class="text-gray-300">Mehedi Hasan</span>
                </li>
                <li>
                  <span class="font-semibold">GitHub:</span>
                  <a
                    href="https://github.com/ProMehedi/bun-hono-api-starter"
                    class="text-blue-400 hover:underline"
                    target="_blank"
                    >bun-hono-api-starter</a
                  >
                </li>
                <li>
                  <span class="font-semibold">License:</span>
                  <span class="text-gray-300">MIT</span>
                </li>
              </ul>
            </section>
          </main>

          <footer class="mt-12 pt-4 border-t border-gray-800 text-center text-gray-400 text-sm">
            &copy; ${new Date().getFullYear()} ${title}. All rights reserved.
          </footer>
        </div>
      </body>
    </html>`
}

const chokidar = require("chokidar");
const esbuild = require("esbuild");
const browserSync = require("browser-sync");
const { id } = require("../../src/manifest.json");
const SocketServer = require("ws").Server;
const postCssPlugin = require("esbuild-style-plugin");

esbuild
  .serve(
    {
      host: "localhost",
      port: 4001,
    },
    {
      entryPoints: {
        app: "src/app.tsx",
        manifest: "src/manifest.json",
        hosti: "sdk/hosti/index.ts",
      },
      bundle: true,
      mainFields: ["module", "main"],
      format: "esm",
      loader: {
        ".png": "file",
        ".jpg": "file",
        ".jpeg": "file",
        ".svg": "file",
        ".gif": "file",
      },
      publicPath: "http://localhost:4001/",
      plugins: [
        postCssPlugin({
          postcss: {
            plugins: [require("tailwindcss"), require("autoprefixer")],
          },
        }),
      ],
      logLevel: "error",
    }
  )
  .then(() => {
    browserSync.create().init({
      ghostMode: false,
      ui: false,
      https: true,
      port: 4000,
      startPath: `/${id && id !== "home" ? `@${id}` : ""}`,
      notify: false,
      open: process.argv[2] === "open",
      server: "./public",
      single: true,
    });

    const wss = new SocketServer({ port: 4002 });

    wss.on("connection", (ws) => {
      const watcher = chokidar.watch(["./src/**", "./hosti/**"], {
        ignored: /^\./,
        persistent: true,
      });

      watcher.on("change", (path) => {
        if (ws.readyState === 1) {
          ws.send("reload");
        }
      });
    });
  });

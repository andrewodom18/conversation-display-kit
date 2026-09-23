import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "output");
mkdirSync(output, { recursive: true });
const run = (command, args, cwd) => execFileSync(command, args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
const metadata = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
run("npm", ["pack", "--ignore-scripts", "--pack-destination", output], root);
const tarball = path.join(output, `${metadata.name.replace("/", "-")}-${metadata.version}.tgz`);
for (const version of [18, 19]) {
  const consumer = mkdtempSync(path.join(output, `consumer-react${version}-`));
  try {
    writeFileSync(path.join(consumer, "package.json"), JSON.stringify({ private: true, type: "module" }));
    run("npm", ["install", "--ignore-scripts", "--no-audit", "--no-fund", tarball, `react@${version}`, `react-dom@${version}`, `@types/react@${version}`, `@types/react-dom@${version}`], consumer);
    const check = `
      const props = {messages:[], value:'', onValueChange:()=>{}, onSubmit:()=>{}};
      const html = renderToStaticMarkup(React.createElement('main',null,React.createElement(ConversationDisplay,props),React.createElement(ChangeReviewCard,{title:'Review',changes:[],onAccept:()=>{},onReject:()=>{}})));
      if (!html.includes('role="log"') || !html.includes('Review')) throw Error('Missing public component');
    `;
    writeFileSync(path.join(consumer, "esm.mjs"), `import React from 'react'; import {renderToStaticMarkup} from 'react-dom/server'; import {ConversationDisplay,ChangeReviewCard} from 'conversation-display-kit'; ${check}`);
    writeFileSync(path.join(consumer, "cjs.cjs"), `const React = require('react'); const {renderToStaticMarkup}=require('react-dom/server'); const {ConversationDisplay,ChangeReviewCard}=require('conversation-display-kit'); ${check} const fs=require('node:fs'); const css=fs.readFileSync(require.resolve('conversation-display-kit/styles.css'),'utf8'); if(!css.includes('.cdk-review')) throw Error('Missing stylesheet');`);
    for (const module of ["esm.mjs", "cjs.cjs"]) run(process.execPath, [module], consumer);
    const types = `import {ConversationDisplay, ChangeReviewCard, type ConversationDisplayProps, type ReviewStatus} from 'conversation-display-kit';\nconst props: ConversationDisplayProps = {messages:[],value:'',onSubmit:()=>{},onValueChange:()=>{},multiline:true,maxLength:2000};\nconst status: ReviewStatus='applying';\nvoid [ConversationDisplay,ChangeReviewCard,props,status];`;
    for (const extension of ["mts", "cts"]) {
      const source = path.join(consumer, `types.${extension}`);
      writeFileSync(source, types);
      run(process.execPath, [path.join(root, "node_modules/typescript/bin/tsc"), "--noEmit", "--strict", "--module", "NodeNext", "--moduleResolution", "NodeNext", "--target", "ES2022", source], consumer);
    }
    console.log(`React ${version}: ESM, CJS, CSS and NodeNext types passed`);
  } catch (error) {
    if (error.stdout) console.error(error.stdout.toString());
    if (error.stderr) console.error(error.stderr.toString());
    throw error;
  } finally {
    rmSync(consumer, { recursive: true, force: true });
  }
}
console.log(`Verified ${metadata.name}@${metadata.version}: ${tarball}`);

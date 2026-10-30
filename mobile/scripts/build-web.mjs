import {build} from 'esbuild';
import {mkdir, access, copyFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=fileURLToPath(new URL('../',import.meta.url));
const exists=async p=>access(p).then(()=>true,()=>false);
const shared=await exists(path.join(root,'../dist/index.html'))?path.join(root,'../dist'):path.join(root,'..');
await mkdir(path.join(shared,'vendor'),{recursive:true});
await build({stdin:{contents:"export {createClient} from '@supabase/supabase-js';",resolveDir:root},
  bundle:true,platform:'browser',format:'esm',target:'es2022',minify:true,
  legalComments:'eof',outfile:path.join(shared,'vendor/supabase.js')});
await copyFile(path.join(root,'licenses/supabase-LICENSE'),path.join(shared,'vendor/supabase-LICENSE'));
console.log('Built local authentication SDK from the pinned lockfile.');

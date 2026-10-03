import { projectRoot } from './paths.ts';
import { promoteStatic } from './static-release.ts';
console.log('File statici promossi:', await promoteStatic(projectRoot));

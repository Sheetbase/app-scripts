import {execSync} from 'child_process';

import {
  ProjectConfigs,
  OutputOptions,
  FileService,
  ProjectService,
  MessageService,
  RollupService,
} from '../../public-api';

export class BuildCommand {
  constructor(
    private fileService: FileService,
    private messageService: MessageService,
    private projectService: ProjectService,
    private rollupService: RollupService
  ) {}

  async run() {
    const projectConfigs = await this.projectService.getConfigs();
    const {type, iifePath} = projectConfigs;
    // compile
    this.compileCode();
    // bundle
    await this.bundleCode(projectConfigs);
    // specific for app
    if (type === 'app') {
      const iifeContent = await this.fileService.readFile(iifePath);
      const wwwSnippet = [
        'function doGet(e) { return App.Server.www().get(e); }',
        'function doPost(e) { return App.Server.www().post(e); }',
      ].join('\n');
      this.fileService.outputFile(iifePath, iifeContent + '\n' + wwwSnippet);
    }
    // done
    return this.messageService.logOk(
      `Build ${type} completed, you may now push to the server.`
    );
  }

  private compileCode() {
    return execSync('npx tsc', {stdio: 'ignore'});
  }

  private async bundleCode(configs: ProjectConfigs) {
    const {type, inputPath, iifePath, iifeName, esmPath} = configs;
    // build output
    const output: OutputOptions[] = [
      // iife for both app & module
      {
        format: 'iife',
        file: iifePath,
        sourcemap: type === 'module',
        name: iifeName,
        exports: 'named',
      },
    ];
    // esm for module only
    if (type === 'module') {
      output.push({
        format: 'esm',
        file: esmPath,
        sourcemap: true,
      });
    }
    // bundle
    return this.rollupService.bundleCode(inputPath, output);
  }
}

import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { app } from 'electron';
import config from '../config';
import { logManager } from '../log-manager';
import { v4 as uuidv4 } from 'uuid'; // For generating a unique temp directory name

let logger = logManager.getLogger('ScriptExecutionJob');
let timestamp: string;

export class ScriptExecutionJob {
    async run() {
        let tempDir: string;
        timestamp = new Date().toISOString().replace(/[:]/g, '-');

        try {
            tempDir = this.createTempDir();

            // Copy and execute the VBScript or Shell script based on the platform
            if (process.platform === 'win32') {
                await this.copyAndExecuteVBScript(tempDir);
            } else if (process.platform === 'darwin' || process.platform === 'linux') {
                await this.copyAndExecuteShellScript(tempDir);
            }

            // Find the XML file in the temporary directory
            const xmlFilePath = await this.findXMLFile(tempDir);
            const targetDir = path.join(config.userDir, 'ims-data');
            await this.moveAndCleanUp(xmlFilePath, targetDir);

            logger.debug('ScriptExecutionJob ran successfully.');
        } catch (error) {
            logger.error('Error in ScriptExecutionJob: ' + error.toString(), error);
        } finally {
            if (tempDir && fs.existsSync(tempDir)) {
                fs.rmSync(tempDir, { recursive: true, force: true });
                logger.debug(`Temporary directory ${tempDir} deleted.`);
            }
        }
    }

    private findXMLFile(dir: string): Promise<string> {
        return new Promise((resolve, reject) => {
            fs.readdir(dir, (err, files) => {
                if (err) {
                    return reject(err);
                }
                // Find the first XML file in the directory
                const xmlFile = files.find(file => path.extname(file).toLowerCase() === '.xml');
                if (xmlFile) {
                    resolve(path.join(dir, xmlFile));
                } else {
                    reject(new Error('No XML file found in the temporary directory.'));
                }
            });
        });
    }

    private createTempDir(): string {
        const tempDir = path.join(app.getPath('temp'), `${uuidv4()}`).toUpperCase();
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir);
            logger.debug(`Created temporary directory: ${tempDir}`);
        }
        return tempDir;
    }

    private async copyAndExecuteVBScript(tempDir: string) {

        let sourceVbsPath = path.join(app.getAppPath(), '..','app.asar.unpacked', 'scripts', 'ims-cache.cab');
        logger.debug(`sourceVbsPath: ${sourceVbsPath}`);
        if (!fs.existsSync(sourceVbsPath)) {
            sourceVbsPath = path.join(app.getAppPath(), '..','scripts', 'ims-cache.cab');
        }

        // Path to the destination VBScript file
        const vbsPath = path.join(tempDir, 'script.vbs');

        // Copy the VBScript file to the temp directory
        fs.copyFileSync(sourceVbsPath, vbsPath);
        logger.debug(`Copied VBScript to ${vbsPath}`);


           // Prepare the command with correct path escaping
             const command = `cscript //NoLogo "${vbsPath}"`;
             logger.debug(`Executing command: ${command}`);

         try {
             // Execute the command with the temp directory as the working directory
               await this.executeCommand(command, 'VBScript', tempDir);
            } catch (err) {
              logger.error(`Failed to execute VBScript: ${err.message}`);
    }
        
    }

    private executeCommand(command: string, scriptType: string, cwd?: string): Promise<void> {
        return new Promise((resolve, reject) => {
            exec(command, { cwd }, (error, stdout, stderr) => {
                if (error) {
                    logger.error(`Error executing ${scriptType}: ${error.message}`);
                    return reject(error);
                }
                if (stderr) {
                    logger.warn(`${scriptType} stderr: ${stderr}`);
                }
                logger.debug(`${scriptType} output: ${stdout}`);
                resolve();
            });
        });
    }

    
    private async copyAndExecuteShellScript(tempDir: string) {
        // Path to the source shell script file
        const sourceShPath = '/path/to/your/source/script.sh'; // Update this path accordingly

        // Path to the destination shell script file
        const shPath = path.join(tempDir, 'script.sh');

        // Copy the shell script file to the temp directory
        fs.copyFileSync(sourceShPath, shPath);
        logger.debug(`Copied Shell Script to ${shPath}`);

        // Make the shell script executable
        fs.chmodSync(shPath, '755');

        // Execute the shell script
        await this.executeCommand(`"${shPath}"`, 'Shell Script');
    }


    private async moveAndCleanUp(xmlFilePath: string, targetDir: string): Promise<void> {
        if (!fs.existsSync(xmlFilePath)) {
            throw new Error(`XML file not found at ${xmlFilePath}`);
        }

        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
            logger.debug(`Created target directory: ${targetDir}`);
        }

        const targetFilePath = path.join(targetDir, path.basename(xmlFilePath));
        fs.renameSync(xmlFilePath, targetFilePath);

        logger.debug(`Moved XML file from : ${xmlFilePath} to : ${targetFilePath}`);
    }
}

export const scriptExecutionJob = new ScriptExecutionJob();

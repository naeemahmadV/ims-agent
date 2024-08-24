import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { app } from 'electron';
import config from '../config';
import { logManager } from '../log-manager';
import { v4 as uuidv4 } from 'uuid'; // For generating a unique temp directory name

let logger = logManager.getLogger('ScriptExecutionJob');
let timestamp : string; 

export class ScriptExecutionJob {
    async run() {
        let tempDir: string;
        timestamp = new Date().toISOString().replace(/[:]/g, '-');

        try {
            tempDir = this.createTempDir();

            // Create and execute scripts based on the platform
            if (process.platform === 'win32') {
                await this.executeVBScript(tempDir);
            } else if (process.platform === 'darwin' || process.platform === 'linux') {
                await this.executeShellScript(tempDir);
            }

            const xmlFilePath = path.join(tempDir,  `${timestamp}.xml`);

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

    private createTempDir(): string {
        const tempDir = path.join(app.getPath('temp'), `${uuidv4()}`).toUpperCase();
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir);
            logger.debug(`Created temporary directory: ${tempDir}`);
        }
        return tempDir;
    }

    private async executeVBScript(tempDir: string) {
        const xmlFilePath = path.join(tempDir,  `${timestamp}.xml`);
        const vbsContent = `
            Set objFSO = CreateObject("Scripting.FileSystemObject")
            Set objFile = objFSO.CreateTextFile("${xmlFilePath}", True)
            objFile.WriteLine "<?xml version='1.0' encoding='UTF-8'?>"
            objFile.WriteLine "<TestResults>"
            objFile.WriteLine "  <Result>VBScript executed successfully.</Result>"
            objFile.WriteLine "</TestResults>"
            objFile.Close
        `;
        const vbsPath = path.join(tempDir, 'script.vbs');
        fs.writeFileSync(vbsPath, vbsContent);

        await this.executeCommand(`cscript //NoLogo ${vbsPath}`, 'VBScript');
    }

    private async executeShellScript(tempDir: string) {
        const xmlFilePath = path.join(tempDir,  `${timestamp}.xml`);
        const shContent = `
            #!/bin/bash
            echo "<?xml version='1.0' encoding='UTF-8'?>" > "${xmlFilePath}"
            echo "<TestResults>" >> "${xmlFilePath}"
            echo "  <Result>Shell script executed successfully.</Result>" >> "${xmlFilePath}"
            echo "</TestResults>" >> "${xmlFilePath}"
        `;
        const shPath = path.join(tempDir, 'script.sh');
        fs.writeFileSync(shPath, shContent);
        fs.chmodSync(shPath, '755'); // Make the script executable

        await this.executeCommand(shPath, 'Shell Script');
    }

    private executeCommand(command: string, scriptType: string): Promise<void> {
        return new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    logger.error(`Error executing ${scriptType}: ${error}`);
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

    private async moveAndCleanUp(xmlFilePath: string, targetDir: string): Promise<void> {
        if (!fs.existsSync(xmlFilePath)) {
            throw new Error(`XML file not found at ${xmlFilePath}`);
        }

        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir);
            logger.debug(`Created target directory: ${targetDir}`);
        }

        const targetFilePath = path.join(targetDir, path.basename(xmlFilePath));
        fs.renameSync(xmlFilePath, targetFilePath);
        logger.debug(`Moved XML file to ${targetFilePath}`);
    }
}

export const scriptExecutionJob = new ScriptExecutionJob();
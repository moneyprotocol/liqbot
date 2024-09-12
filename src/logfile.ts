import fs from "fs";
import path from "path";

const logsDir = "logs"; // Directory where the log files will be stored
const maxLogSize = 10 * 1024 * 1024; // Maximum log file size in bytes (10 MB)
const maxLogFiles = 10; // Maximum number of log files to keep

function ensureLogDirectory() {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
  }
}

function getLogFilePath() {
  return path.join(logsDir, "output.log");
}

export function logStartup(): void {
  const logFilePath = getLogFilePath();
  fs.appendFile(logFilePath, `[${new Date().toISOString()}] Liqbot was started!\n`, () => undefined);
}

export function logShutdown(): void {
  const logFilePath = getLogFilePath();
  fs.appendFileSync(logFilePath, `[${new Date().toISOString()}] Liqbot was terminated!\n`);
}

function rotateLogs() {
  // List all log files in the directory
  fs.readdir(logsDir, (err, files) => {
    if (err) {
      console.error("Error reading log directory:", err);
      return;
    }

    // Filter log files
    const logFiles = files.filter(file => file.startsWith("output") && file.endsWith(".log")).sort(); // Sort files to find the oldest one

    // If there are too many log files, delete the oldest one
    if (logFiles.length >= maxLogFiles) {
      const oldestFile = path.join(logsDir, logFiles[0]);
      fs.unlink(oldestFile, err => {
        if (err) {
          console.error("Error deleting old log file:", err);
        }
      });
    }

    // Rename current log file
    const currentLogFilePath = getLogFilePath();
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const newLogFilePath = path.join(logsDir, `output-${timestamp}.log`);

    fs.rename(currentLogFilePath, newLogFilePath, err => {
      if (err) {
        console.error("Error rotating log file:", err);
      }
    });
  });
}

export function writeToLogFile(message: string): void {
  ensureLogDirectory();

  const logFilePath = getLogFilePath();

  // Check if the file size exceeds the limit
  fs.stat(logFilePath, (err, stats) => {
    if (err && err.code !== "ENOENT") {
      console.error("Error getting log file stats:", err);
      return;
    }

    // If file size exceeds the limit, rotate logs
    if (stats && stats.size > maxLogSize) {
      rotateLogs();
    }

    // Create a timestamp
    const timestamp = new Date().toISOString();
    // Format the log entry
    const logEntry = `[${timestamp}] - ${message}\n`;

    // Append the log entry to the file
    fs.appendFile(logFilePath, logEntry, err => {
      if (err) {
        console.error("Error writing to log file:", err);
      }
    });
  });
}

import { promises as fs } from 'fs'
import path from 'path'

class JsonFileUtils {
  /**
   * Reads data from a JSON file and returns it as a JavaScript object.
   * @param filePath - Path to the JSON file.
   * @returns The parsed JSON data.
   * @throws Error if the file cannot be read or is invalid JSON.
   */
  static async readJson<T>(filePath: string): Promise<T> {
    try {
      const absolutePath = path.resolve(filePath)
      const data = await fs.readFile(absolutePath, 'utf-8')
      return JSON.parse(data) as T
    } catch (error) {
      console.error(`Error reading JSON file at ${filePath}:`, error)
      throw new Error('Failed to read JSON file.')
    }
  }

  /**
   * Writes data to a JSON file, overwriting the file if it already exists.
   * @param filePath - Path to the JSON file.
   * @param data - Data to write to the file.
   * @param prettyPrint - Whether to format the JSON with indentation.
   * @returns A promise that resolves when the write operation is complete.
   * @throws Error if the file cannot be written.
   */
  static async writeJson<T>(
    filePath: string,
    data: T,
    prettyPrint = true,
  ): Promise<void> {
    try {
      const absolutePath = path.resolve(filePath)
      const jsonString = prettyPrint
        ? JSON.stringify(data, null, 2)
        : JSON.stringify(data)
      await fs.writeFile(absolutePath, jsonString, 'utf-8')
    } catch (error) {
      console.error(`Error writing JSON file at ${filePath}:`, error)
      throw new Error('Failed to write JSON file.')
    }
  }
}

export default JsonFileUtils

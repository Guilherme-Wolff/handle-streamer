// Unit tests for: readJSONDoc

import * as fs from "fs";
import { readJSONDoc } from "../doc_json";

// Mock the fs module
jest.mock("fs");

describe("readJSONDoc() readJSONDoc method", () => {
  // Happy Path Tests
  describe("Happy Path", () => {
    it("should successfully read and parse a valid JSON file", async () => {
      // Arrange: Set up the mock to return valid JSON data
      const mockData = JSON.stringify({ key: "value" });
      fs.readFile.mockImplementation((path, encoding, callback) => {
        callback(null, mockData);
      });

      // Act: Call the function
      const result = await readJSONDoc("valid.json");

      // Assert: Verify the result
      expect(result).toEqual({ key: "value" });
    });
  });

  // Edge Case Tests
  describe("Edge Cases", () => {
    it("should reject with an error if the file does not exist", async () => {
      // Arrange: Set up the mock to simulate a file not found error
      const mockError = new Error("File not found");
      fs.readFile.mockImplementation((path, encoding, callback) => {
        callback(mockError, null);
      });

      // Act & Assert: Call the function and expect it to reject
      await expect(readJSONDoc("nonexistent.json")).rejects.toThrow(
        "File not found",
      );
    });

    it("should reject with an error if the file contains invalid JSON", async () => {
      // Arrange: Set up the mock to return invalid JSON data
      const invalidJSON = "{ key: 'value' }"; // Missing quotes around key
      fs.readFile.mockImplementation((path, encoding, callback) => {
        callback(null, invalidJSON);
      });

      // Act & Assert: Call the function and expect it to reject
      await expect(readJSONDoc("invalid.json")).rejects.toThrow(SyntaxError);
    });

    it("should reject with an error if the file read operation fails", async () => {
      // Arrange: Set up the mock to simulate a read error
      const mockError = new Error("Read error");
      fs.readFile.mockImplementation((path, encoding, callback) => {
        callback(mockError, null);
      });

      // Act & Assert: Call the function and expect it to reject
      await expect(readJSONDoc("error.json")).rejects.toThrow("Read error");
    });
  });
});

// End of unit tests for: readJSONDoc
